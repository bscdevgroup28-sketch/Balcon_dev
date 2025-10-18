import { metrics } from '../monitoring/metrics';
import { logger } from './logger';

export async function postSlack(message: string, opts?: { channel?: string; blocks?: any }) {
  try {
    const enabled = (process.env.SLACK_NOTIFICATIONS_ENABLED || 'true').toLowerCase() !== 'false';
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!enabled || !url) return false;
    const payload: any = { text: message };
    if (opts?.channel) payload.channel = opts.channel;
    if (opts?.blocks) payload.blocks = opts.blocks;
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) {
      const t = await resp.text().catch(()=> '');
      metrics.increment('integrations.slack.failed');
      logger.warn('[slack] post failed', { status: resp.status, body: t.slice(0,200) });
      return false;
    }
    metrics.increment('integrations.slack.sent');
    return true;
  } catch (e:any) {
    logger.warn('[slack] post error', { error: e.message });
    try { metrics.increment('integrations.slack.failed'); } catch {/* ignore */}
    return false;
  }
}
