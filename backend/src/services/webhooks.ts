import crypto from 'crypto';
import { WebhookSubscription, WebhookDelivery } from '../models';
import { createCircuit } from '../utils/circuitBreaker';
import { jobQueue } from '../jobs/jobQueue';
import { metrics } from '../monitoring/metrics';

// Configuration constants (could be externalized)
const MAX_PAYLOAD_BYTES = 50_000; // store at most 50KB in delivery record
const SIGNATURE_SCHEME = 'sha256';
const SIGNATURE_HEADER = 'X-Webhook-Signature';
const EVENT_HEADER = 'X-Webhook-Event';
const IDEMPOTENCY_HEADER = 'X-Webhook-Idempotency-Key';
const DELIVERY_TIMEOUT_MS = 15_000;
const RETRY_BACKOFF_MS = [30_000, 120_000, 600_000, 1_800_000, 7_200_000]; // 30s,2m,10m,30m,2h
const AUTO_DISABLE_FAILURE_THRESHOLD = parseInt(process.env.WEBHOOK_AUTO_DISABLE_THRESHOLD || '10');
const DISABLE_EVENT = 'webhook.subscription.disabled';

export interface WebhookEventPayload {
  event: string;
  data: any;
  timestamp: string;
  idempotencyKey: string;
}

export function signPayload(secret: string, body: string) {
  // Prefix with scheme for future rotation support
  const sig = crypto.createHmac(SIGNATURE_SCHEME, secret).update(body).digest('hex');
  return `${SIGNATURE_SCHEME}=${sig}`;
}

export async function publishEvent(event: string, data: any) {
  const subs = await WebhookSubscription.findAll({ where: { eventType: event, isActive: true } });
  if (!subs.length) return;
  const payload: WebhookEventPayload = { event, data, timestamp: new Date().toISOString(), idempotencyKey: crypto.randomUUID() };
  const raw = JSON.stringify(payload);
  // Size guard: store truncated payload if too large (original is sent live later).
  const storedPayload = raw.length > MAX_PAYLOAD_BYTES ? { truncated: true, preview: raw.slice(0, MAX_PAYLOAD_BYTES) } : payload;
  for (const sub of subs) {
    const delivery = await WebhookDelivery.create({ subscriptionId: sub.id, eventType: event, payload: storedPayload });
    jobQueue.enqueue('webhook.deliver', { deliveryId: delivery.id }, 5, 0);
    metrics.increment('webhooks.enqueued');
  }
}

export async function retryDelivery(deliveryId: number) {
  const delivery = await WebhookDelivery.findByPk(deliveryId);
  if (!delivery || delivery.status === 'delivered') return false;
  const sub = await WebhookSubscription.findByPk(delivery.subscriptionId);
  if (!sub || !sub.isActive) return false;
  jobQueue.enqueue('webhook.deliver', { deliveryId: delivery.id }, 5, 0);
  metrics.increment('webhooks.manual_retry');
}

export function registerWebhookJob() {
  // Single circuit for outbound webhook delivery (avoids stampeding failing endpoints)
  const deliveryCircuit = createCircuit('webhook_delivery', { failureThreshold: 8, halfOpenAfterMs: 60000 });
  jobQueue.register('webhook.deliver', async (job) => {
    const { deliveryId } = job.payload as any;
    const delivery = await WebhookDelivery.findByPk(deliveryId);
    if (!delivery) return;
    const sub = await WebhookSubscription.findByPk(delivery.subscriptionId);
    if (!sub || !sub.isActive) {
      await delivery.update({ status: 'failed', errorMessage: 'Subscription inactive' });
      return;
    }
    try {
      // Reconstruct full payload; if truncated we only stored preview so rebuild minimal valid object
      const body = JSON.stringify(delivery.payload?.truncated ? { truncated: true, event: delivery.eventType } : delivery.payload);
      const signature = signPayload(sub.secret, body);
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
      const started = Date.now();
      const resp = await deliveryCircuit.exec(() => fetch(sub.targetUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', [SIGNATURE_HEADER]: signature, [EVENT_HEADER]: delivery.eventType, [IDEMPOTENCY_HEADER]: (delivery.payload as any)?.idempotencyKey || '' }, body, signal: controller.signal as any }));
      clearTimeout(to);
      const latency = Date.now() - started;
      metrics.observe('webhook.delivery.latency.ms', latency);
      const textSnippet = await resp.text().catch(() => '');
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${textSnippet.slice(0,120)}`);
      await delivery.update({ status: 'delivered', responseCode: resp.status, attemptCount: delivery.attemptCount + 1, errorMessage: undefined });
      await sub.update({ lastSuccessAt: new Date(), failureCount: 0 });
      metrics.increment('webhooks.delivered');
    } catch (err: any) {
      const attempts = delivery.attemptCount + 1;
      const failed = { status: 'failed' as const, errorMessage: err.name === 'AbortError' ? 'Timeout' : err.message, attemptCount: attempts, responseCode: delivery.responseCode };
      if (attempts < RETRY_BACKOFF_MS.length) {
        // jitter +/-20%
        const base = RETRY_BACKOFF_MS[attempts - 1];
        const jitter = base * (0.8 + Math.random() * 0.4);
        const nextDelay = Math.round(jitter);
        const nextRetry = new Date(Date.now() + nextDelay);
        await delivery.update({ ...failed, nextRetryAt: nextRetry });
        jobQueue.enqueue('webhook.deliver', { deliveryId: delivery.id }, 5, nextDelay);
        metrics.increment('webhooks.retried');
      } else {
        await delivery.update(failed);
        const newFailureCount = sub.failureCount + 1;
        await sub.update({ failureCount: newFailureCount, lastFailureAt: new Date() });
        metrics.increment('webhooks.failed');
        if (newFailureCount >= AUTO_DISABLE_FAILURE_THRESHOLD && sub.isActive) {
          await sub.update({ isActive: false });
          metrics.increment('webhooks.auto_disabled');
          // Fire disabled event for internal observability (best-effort, no loop since eventType differs from delivery.eventType)
          publishEvent(DISABLE_EVENT, { subscriptionId: sub.id, failureCount: newFailureCount });
        }
      }
    }
  });
}
