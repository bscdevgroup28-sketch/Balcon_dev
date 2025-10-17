import { Router, Request, Response } from 'express';
import { getSecurityMetrics, securityMetricsToPrometheus } from '../utils/securityMetrics';
import { getRecentSecurityEvents } from '../utils/securityAudit';
import { SecurityAuditEvent } from '../models/SecurityAuditEvent';
import { authenticateToken } from '../middleware/authEnhanced';

const router = Router();

// GET /api/security/metrics
router.get('/metrics', authenticateToken, (req: Request, res: Response) => {
  res.json({ success: true, data: getSecurityMetrics() });
});

// GET /api/security/audit?limit=100&action=auth.login&outcome=success&since=ISO
router.get('/audit', authenticateToken, (req: Request, res: Response) => {
  const { action, outcome, since, limit } = req.query as any;
  const events = getRecentSecurityEvents({ action, outcome, since });
  const lim = Math.min(parseInt(limit || '100', 10), 250);
  res.json({ success: true, count: events.slice(-lim).length, data: events.slice(-lim) });
});

// GET /api/security/audit/persistent?page=1&pageSize=50&action=auth.login&outcome=success
router.get('/audit/persistent', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '50', action, outcome, actorUserId, targetUserId, q, from, to } = req.query as any;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 50, 1), 250);
    const where: any = {};
    if (action) where.action = action;
    if (outcome) where.outcome = outcome;
    if (actorUserId) where.actor_user_id = actorUserId;
    if (targetUserId) where.target_user_id = targetUserId;
    if (from || to) where.created_at = {};
    if (from) where.created_at['$gte'] = new Date(from);
    if (to) where.created_at['$lte'] = new Date(to);
    if (q) {
      // Basic meta text search (SQLite/Postgres compatibility) – serialize meta and LIKE
      where.meta = { $like: `%${q}%` } as any; // Will be adapted by dialect; lightweight debug search
    }
    const offset = (p - 1) * ps;
    const { rows, count } = await SecurityAuditEvent.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: ps, offset });
    res.json({ success: true, page: p, pageSize: ps, total: count, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to query persistent audit log' });
  }
});

export default router;

// Prometheus style metrics (mounted separately by app if desired)
router.get('/metrics/prometheus', authenticateToken, (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.send(securityMetricsToPrometheus());
});