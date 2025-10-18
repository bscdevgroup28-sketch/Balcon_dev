import { metrics } from '../../monitoring/metrics';
// Import models via central index to ensure consistent typings/static methods
import { CustomerApprovalToken } from '../../models/CustomerApprovalToken';
import { IdempotencyRecord } from '../../models/IdempotencyRecord';
import { RefreshToken } from '../../models/RefreshToken';
import { WebhookDelivery } from '../../models/WebhookDelivery';
import { EventLog } from '../../models/EventLog';

// Basic data retention/cleanup job
// - Removes expired customer approval tokens (>30d past expiry)
// - Removes idempotency records past expiresAt or older than 30d
// - Removes revoked/expired refresh tokens older than 60d
// - Removes webhook deliveries failed > 60d ago with no nextRetryAt
// - Trims event logs older than 90d

export async function runRetentionCleanup(): Promise<void> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  let removed = 0;
  const timed = async (name: string, fn: () => Promise<number>) => {
    const start = Date.now();
    try {
      const n = await fn();
      removed += n;
      return n;
    } finally {
      try { (metrics as any).observe('retention.sweep.duration.ms', Date.now() - start); } catch (e) { /* ignore metrics observe errors */ }
    }
  };

  // CustomerApprovalToken: expired > 30d and consumed or not
  await timed('approval_tokens', async () => {
    const all = await (CustomerApprovalToken as any).findAll?.({}) || [];
    let n = 0;
    for (const tok of all) {
      if (tok.expiresAt && new Date(tok.expiresAt) < d30) {
        await tok.destroy();
        n++;
      }
    }
    if (n) metrics.increment('retention.tokens.removed', n);
    return n;
  });

  // IdempotencyRecord: expired or older than 30d
  await timed('idempotency_records', async () => {
    const all = await (IdempotencyRecord as any).findAll?.({}) || [];
    let n = 0;
    for (const rec of all) {
      const createdAt = rec.createdAt ? new Date(rec.createdAt) : undefined;
      const expiresAt = rec.expiresAt ? new Date(rec.expiresAt) : undefined;
      if ((expiresAt && expiresAt < now) || (createdAt && createdAt < d30)) {
        await rec.destroy();
        n++;
      }
    }
    if (n) metrics.increment('retention.idempotency.removed', n);
    return n;
  });

  // RefreshToken: revoked or expired older than 60d
  await timed('refresh_tokens', async () => {
    const all = await (RefreshToken as any).findAll?.({}) || [];
    let n = 0;
    for (const t of all) {
      const revokedAt = t.revokedAt ? new Date(t.revokedAt) : undefined;
      const expiresAt = t.expiresAt ? new Date(t.expiresAt) : undefined;
      if ((revokedAt && revokedAt < d60) || (expiresAt && expiresAt < d60)) {
        await t.destroy();
        n++;
      }
    }
    if (n) metrics.increment('retention.refresh.removed', n);
    return n;
  });

  // WebhookDelivery: failed older than 60d and no nextRetryAt scheduled
  await timed('webhook_deliveries', async () => {
    const all = await (WebhookDelivery as any).findAll?.({}) || [];
    let n = 0;
    for (const d of all) {
      const updatedAt = d.updatedAt ? new Date(d.updatedAt) : undefined;
      if (d.status === 'failed' && updatedAt && updatedAt < d60 && (!d.nextRetryAt)) {
        await d.destroy();
        n++;
      }
    }
    if (n) metrics.increment('retention.webhooks.removed', n);
    return n;
  });

  // EventLog: older than 90d
  await timed('event_logs', async () => {
    const all = await (EventLog as any).findAll?.({}) || [];
    let n = 0;
    for (const ev of all) {
      const ts = ev.timestamp ? new Date(ev.timestamp) : undefined;
      if (ts && ts < d90) {
        await ev.destroy();
        n++;
      }
    }
    if (n) metrics.increment('retention.events.removed', n);
    return n;
  });

  metrics.increment('retention.sweep.completed');
  (metrics as any).observe?.('retention.records.removed', removed);
}

export default runRetentionCleanup;
