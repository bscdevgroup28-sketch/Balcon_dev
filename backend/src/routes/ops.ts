import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authEnhanced';
import { metrics } from '../monitoring/metrics';
import { jobQueue } from '../jobs/jobQueue';
import { invalidateTag } from '../utils/cache';
import { retryDelivery } from '../services/webhooks';
import runRetentionCleanup from '../jobs/handlers/retentionJob';

const router = Router();

router.get('/summary', authenticateToken as any, requireRole(['owner','admin']) as any, async (_req, res) => {
  const m = metrics.snapshot();
  const jobs = jobQueue.getStats();
  res.json({ success: true, metrics: { counters: m.counters, gauges: m.gauges }, jobs });
});

router.post('/cache/invalidate', authenticateToken as any, requireRole(['owner','admin']) as any, async (req: any, res) => {
  const { tags } = req.body || {};
  if (!Array.isArray(tags) || !tags.length) return res.status(400).json({ success:false, message: 'tags_required' });
  for (const t of tags) { try { invalidateTag(String(t)); } catch { /* ignore */ } }
  res.json({ success:true, invalidated: tags.length });
});

router.post('/webhooks/redeliver', authenticateToken as any, requireRole(['owner','admin']) as any, async (req: any, res) => {
  const { deliveryId } = req.body || {};
  if (!deliveryId) return res.status(400).json({ success:false, message:'deliveryId_required' });
  await retryDelivery(Number(deliveryId));
  res.json({ success:true });
});

router.post('/jobs/pause', authenticateToken as any, requireRole(['owner','admin']) as any, async (_req, res) => {
  jobQueue.pause();
  res.json({ success:true, paused: true });
});

router.post('/jobs/resume', authenticateToken as any, requireRole(['owner','admin']) as any, async (_req, res) => {
  jobQueue.resume();
  res.json({ success:true, paused: false });
});

router.get('/jobs/status', authenticateToken as any, requireRole(['owner','admin']) as any, async (_req, res) => {
  res.json({ success:true, ...jobQueue.getStats() });
});

// Manual trigger for data retention sweep
router.post('/retention/run', authenticateToken as any, requireRole(['owner','admin']) as any, async (_req, res) => {
  try {
    await runRetentionCleanup();
    res.json({ success: true });
  } catch (e:any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;