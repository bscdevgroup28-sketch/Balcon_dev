import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authEnhanced';
import { createApprovalToken, verifyToken, consumeToken, approvalUrlFor } from '../services/customerApprovalService';
import { metrics } from '../monitoring/metrics';
import { publishEvent } from '../services/webhooks';
import { eventBus, createEvent } from '../events/eventBus';

const router = Router();

// Issue a token for a project (and optionally quote/order)
router.post('/projects/:id/approvals/token', authenticateToken as any, requireRole(['owner','admin','project_manager']) as any, async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const projectId = parseInt(req.params.id, 10);
    const { quoteId, orderId, ttlDays } = req.body || {};
    const rec = await createApprovalToken({ projectId, quoteId, orderId, createdByUserId: (req as any).user.id, ttlDays });
    const url = approvalUrlFor(rec.token);
    metrics.increment('approvals.token.issued');
    metrics.observe('approvals.route.latency.ms', Date.now() - start);
    res.json({ ok: true, token: rec.token, url, expiresAt: rec.expiresAt });
  } catch (e: any) {
    metrics.increment('approvals.token.issue_failed');
    res.status(500).json({ ok: false, error: 'Failed to issue approval token' });
  }
});

// Public: read-only token info (no auth required)
router.get('/approvals/:token', async (req: Request, res: Response) => {
  const v = await verifyToken(req.params.token);
  if (!v.ok) return res.status(400).json({ ok: false, reason: v.reason });
  const rec = v.record!;
  // In the future, include read-only payload for rendering: project/quote/order summary
  res.json({ ok: true, token: rec.token, projectId: rec.projectId, quoteId: rec.quoteId, orderId: rec.orderId, expiresAt: rec.expiresAt });
});

// Public: approve/reject
router.post('/approvals/:token/decision', async (req: Request, res: Response) => {
  const { decision, note } = req.body || {};
  if (!['approve','reject'].includes(decision)) return res.status(400).json({ ok: false, error: 'Invalid decision' });
  const result = await consumeToken(req.params.token, { decision, note, actorIp: req.ip, userAgent: req.headers['user-agent'] as string });
  if (!result.ok) return res.status(400).json({ ok: false, reason: result.reason });
  metrics.increment(`approvals.${decision}`);
  try {
    publishEvent('approval.completed', {
      projectId: result.record!.projectId,
      quoteId: result.record!.quoteId,
      orderId: result.record!.orderId,
      decision
    });
    // Also emit on internal event bus for in-process listeners (e.g., Slack notifications)
    try {
      eventBus.emitEvent(createEvent('approval.completed', {
        projectId: result.record!.projectId,
        quoteId: result.record!.quoteId,
        orderId: result.record!.orderId,
        decision
      }));
    } catch { /* ignore bus errors */ }
  } catch { /* ignore event errors */ }
  res.json({ ok: true, decision });
});

export default router;
