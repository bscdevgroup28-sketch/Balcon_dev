"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signPayload = signPayload;
exports.publishEvent = publishEvent;
exports.retryDelivery = retryDelivery;
exports.registerWebhookJob = registerWebhookJob;
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const circuitBreaker_1 = require("../utils/circuitBreaker");
const jobQueue_1 = require("../jobs/jobQueue");
const metrics_1 = require("../monitoring/metrics");
// Configuration constants (could be externalized)
const MAX_PAYLOAD_BYTES = 50000; // store at most 50KB in delivery record
const SIGNATURE_SCHEME = 'sha256';
const SIGNATURE_HEADER = 'X-Webhook-Signature';
const EVENT_HEADER = 'X-Webhook-Event';
const IDEMPOTENCY_HEADER = 'X-Webhook-Idempotency-Key';
const DELIVERY_TIMEOUT_MS = 15000;
const RETRY_BACKOFF_MS = [30000, 120000, 600000, 1800000, 7200000]; // 30s,2m,10m,30m,2h
const AUTO_DISABLE_FAILURE_THRESHOLD = parseInt(process.env.WEBHOOK_AUTO_DISABLE_THRESHOLD || '10');
const DISABLE_EVENT = 'webhook.subscription.disabled';
function signPayload(secret, body) {
    // Prefix with scheme for future rotation support
    const sig = crypto_1.default.createHmac(SIGNATURE_SCHEME, secret).update(body).digest('hex');
    return `${SIGNATURE_SCHEME}=${sig}`;
}
async function publishEvent(event, data) {
    const subs = await models_1.WebhookSubscription.findAll({ where: { eventType: event, isActive: true } });
    if (!subs.length)
        return;
    const payload = { event, data, timestamp: new Date().toISOString(), idempotencyKey: crypto_1.default.randomUUID() };
    const raw = JSON.stringify(payload);
    // Size guard: store truncated payload if too large (original is sent live later).
    const storedPayload = raw.length > MAX_PAYLOAD_BYTES ? { truncated: true, preview: raw.slice(0, MAX_PAYLOAD_BYTES) } : payload;
    for (const sub of subs) {
        const delivery = await models_1.WebhookDelivery.create({ subscriptionId: sub.id, eventType: event, payload: storedPayload });
        jobQueue_1.jobQueue.enqueue('webhook.deliver', { deliveryId: delivery.id }, 5, 0);
        metrics_1.metrics.increment('webhooks.enqueued');
    }
}
async function retryDelivery(deliveryId) {
    const delivery = await models_1.WebhookDelivery.findByPk(deliveryId);
    if (!delivery || delivery.status === 'delivered')
        return false;
    const sub = await models_1.WebhookSubscription.findByPk(delivery.subscriptionId);
    if (!sub || !sub.isActive)
        return false;
    jobQueue_1.jobQueue.enqueue('webhook.deliver', { deliveryId: delivery.id }, 5, 0);
    metrics_1.metrics.increment('webhooks.manual_retry');
}
function registerWebhookJob() {
    // Single circuit for outbound webhook delivery (avoids stampeding failing endpoints)
    const deliveryCircuit = (0, circuitBreaker_1.createCircuit)('webhook_delivery', { failureThreshold: 8, halfOpenAfterMs: 60000 });
    jobQueue_1.jobQueue.register('webhook.deliver', async (job) => {
        const { deliveryId } = job.payload;
        const delivery = await models_1.WebhookDelivery.findByPk(deliveryId);
        if (!delivery)
            return;
        const sub = await models_1.WebhookSubscription.findByPk(delivery.subscriptionId);
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
            const resp = await deliveryCircuit.exec(() => fetch(sub.targetUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', [SIGNATURE_HEADER]: signature, [EVENT_HEADER]: delivery.eventType, [IDEMPOTENCY_HEADER]: delivery.payload?.idempotencyKey || '' }, body, signal: controller.signal }));
            clearTimeout(to);
            const latency = Date.now() - started;
            metrics_1.metrics.observe('webhook.delivery.latency.ms', latency);
            const textSnippet = await resp.text().catch(() => '');
            if (!resp.ok)
                throw new Error(`HTTP ${resp.status} ${textSnippet.slice(0, 120)}`);
            await delivery.update({ status: 'delivered', responseCode: resp.status, attemptCount: delivery.attemptCount + 1, errorMessage: undefined });
            await sub.update({ lastSuccessAt: new Date(), failureCount: 0 });
            metrics_1.metrics.increment('webhooks.delivered');
        }
        catch (err) {
            const attempts = delivery.attemptCount + 1;
            const failed = { status: 'failed', errorMessage: err.name === 'AbortError' ? 'Timeout' : err.message, attemptCount: attempts, responseCode: delivery.responseCode };
            if (attempts < RETRY_BACKOFF_MS.length) {
                // jitter +/-20%
                const base = RETRY_BACKOFF_MS[attempts - 1];
                const jitter = base * (0.8 + Math.random() * 0.4);
                const nextDelay = Math.round(jitter);
                const nextRetry = new Date(Date.now() + nextDelay);
                await delivery.update({ ...failed, nextRetryAt: nextRetry });
                jobQueue_1.jobQueue.enqueue('webhook.deliver', { deliveryId: delivery.id }, 5, nextDelay);
                metrics_1.metrics.increment('webhooks.retried');
            }
            else {
                await delivery.update(failed);
                const newFailureCount = sub.failureCount + 1;
                await sub.update({ failureCount: newFailureCount, lastFailureAt: new Date() });
                metrics_1.metrics.increment('webhooks.failed');
                if (newFailureCount >= AUTO_DISABLE_FAILURE_THRESHOLD && sub.isActive) {
                    await sub.update({ isActive: false });
                    metrics_1.metrics.increment('webhooks.auto_disabled');
                    // Fire disabled event for internal observability (best-effort, no loop since eventType differs from delivery.eventType)
                    publishEvent(DISABLE_EVENT, { subscriptionId: sub.id, failureCount: newFailureCount });
                }
            }
        }
    });
}
