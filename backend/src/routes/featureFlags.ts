import { Router } from 'express';
import { getAllFlags, upsertFlag, isFeatureEnabled } from '../services/featureFlagService';
import { authenticateToken, requirePermission } from '../middleware/authEnhanced';
import { logSecurityEvent } from '../utils/securityAudit';

// NOTE: In a production system, add authentication & role-based guard middleware here.

const router = Router();

router.get('/', authenticateToken, requirePermission('canManageProjects'), async (req, res) => {
  const flags = await getAllFlags();
  res.json(flags.map(f => ({
    key: f.key,
    enabled: f.enabled,
    rolloutStrategy: f.rolloutStrategy,
    percentage: f.percentage,
    audienceRoles: f.audienceRoles,
    description: f.description,
    updatedAt: f.updatedAt
  })));
});

router.get('/check/:key', async (req, res) => {
  const { key } = req.params;
  const userRole = (req as any).user?.role;
  const userId = (req as any).user?.id;
  const enabled = await isFeatureEnabled(key, { userRole, userId });
  res.json({ key, enabled });
});

router.post('/', authenticateToken, requirePermission('canManageProjects'), async (req, res) => {
  try {
    const flag = await upsertFlag(req.body);
    logSecurityEvent(req, {
      action: 'feature.flag.upsert',
      outcome: 'success',
      meta: { key: flag.key, enabled: flag.enabled, strategy: flag.rolloutStrategy }
    });
    res.status(200).json(flag);
  } catch (e: any) {
    logSecurityEvent(req, {
      action: 'feature.flag.upsert',
      outcome: 'failure',
      meta: { error: e.message, bodyKeys: Object.keys(req.body || {}) }
    });
    res.status(400).json({ error: e.message });
  }
});

export default router;
