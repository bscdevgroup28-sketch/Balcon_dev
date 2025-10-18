import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authEnhanced';
import { z } from 'zod';
import { metrics } from '../monitoring/metrics';
import { logger } from '../utils/logger';

const router = Router();

const slackBody = z.object({ text: z.string().min(1).max(4000).optional(), channel: z.string().optional(), blocks: z.any().optional() });

router.post('/slack/test', authenticateToken as any, requireRole(['owner','admin','office_manager']) as any, async (req: Request, res: Response) => {
  try {
    const parsed = slackBody.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'validation_failed', details: parsed.error.issues });
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) return res.status(400).json({ error: 'config_missing', message: 'SLACK_WEBHOOK_URL not configured' });
    const payload: any = {
      text: parsed.data.text || 'Bal-Con Builders Slack integration test message',
      blocks: parsed.data.blocks,
    };
    if (parsed.data.channel) payload.channel = parsed.data.channel;
    const meta = { env: process.env.NODE_ENV || 'development', time: new Date().toISOString() };
    const body = JSON.stringify({ ...payload, meta });
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const ok = resp.ok;
    if (!ok) {
      const t = await resp.text().catch(()=> '');
      metrics.increment('integrations.slack.failed');
      return res.status(502).json({ error: 'slack_failed', message: t.slice(0, 200) });
    }
    metrics.increment('integrations.slack.sent');
    res.json({ ok: true });
  } catch (e:any) {
    logger.error('slack test failed', { error: e.message });
    metrics.increment('integrations.slack.failed');
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
