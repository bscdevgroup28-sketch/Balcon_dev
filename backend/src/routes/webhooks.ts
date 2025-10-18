import { Router, Request, Response } from 'express';
import { WebhookSubscription, WebhookDelivery } from '../models';
import { authenticateToken, requireRole } from '../middleware/authEnhanced';
import { retryDelivery } from '../services/webhooks';
import crypto from 'crypto';

const router = Router();

// Note: admin-only access to webhook management endpoints
const adminOnly = [authenticateToken as any, requireRole(['admin', 'owner']) as any];

// List subscriptions (optionally filter by eventType)
router.get('/', adminOnly, async (req: Request, res: Response) => {
  const where: any = {};
  if (req.query.eventType) where.eventType = req.query.eventType;
  const subs = await WebhookSubscription.findAll({ where, order: [['id','ASC']] });
  res.json(subs.map(s => ({ id: s.id, eventType: s.eventType, targetUrl: s.targetUrl, isActive: s.isActive, failureCount: s.failureCount, lastSuccessAt: s.lastSuccessAt, lastFailureAt: s.lastFailureAt })));
});

// Create subscription (secret auto-generated if omitted)
router.post('/', adminOnly, async (req: Request, res: Response) => {
  const { eventType, targetUrl, secret } = req.body || {};
  if (!eventType || !targetUrl) return res.status(400).json({ error: 'BadRequest', message: 'eventType and targetUrl required' });
  const sec = secret || crypto.randomBytes(16).toString('hex');
  const sub = await WebhookSubscription.create({ eventType, targetUrl, secret: sec });
  res.status(201).json({ id: sub.id, eventType: sub.eventType, targetUrl: sub.targetUrl, secret: sub.secret, isActive: sub.isActive });
});

// Delete
// Place non-parameterized deliveries routes BEFORE parameterized ':id' routes to avoid conflicts
// List deliveries (filter by subscriptionId, status, eventType)
router.get('/deliveries', adminOnly, async (req: Request, res: Response) => {
  const where: any = {};
  if (req.query.subscriptionId) where.subscriptionId = req.query.subscriptionId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.eventType) where.eventType = req.query.eventType;
  const deliveries = await WebhookDelivery.findAll({ where, order: [['id', 'DESC']], limit: 100 });
  res.json(deliveries);
});

// Retry a failed delivery
router.post('/deliveries/:id/retry', adminOnly, async (req: Request, res: Response) => {
  const success = await retryDelivery(parseInt(req.params.id));
  if (!success) return res.status(400).json({ error: 'BadRequest', message: 'Cannot retry delivery' });
  res.json({ message: 'Retry enqueued' });
});

// Get subscription
router.get('/:id', adminOnly, async (req: Request, res: Response) => {
  const sub = await WebhookSubscription.findByPk(req.params.id);
  if (!sub) return res.status(404).json({ error: 'NotFound', message: 'Subscription not found' });
  res.json({ id: sub.id, eventType: sub.eventType, targetUrl: sub.targetUrl, isActive: sub.isActive, failureCount: sub.failureCount, lastSuccessAt: sub.lastSuccessAt, lastFailureAt: sub.lastFailureAt });
});

// Rotate secret
router.post('/:id/rotate-secret', adminOnly, async (req: Request, res: Response) => {
  const sub = await WebhookSubscription.findByPk(req.params.id);
  if (!sub) return res.status(404).json({ error: 'NotFound', message: 'Subscription not found' });
  const newSecret = crypto.randomBytes(16).toString('hex');
  await sub.update({ secret: newSecret });
  res.json({ id: sub.id, secret: newSecret });
});

// Enable / Disable
router.patch('/:id', adminOnly, async (req: Request, res: Response) => {
  const sub = await WebhookSubscription.findByPk(req.params.id);
  if (!sub) return res.status(404).json({ error: 'NotFound', message: 'Subscription not found' });
  const { isActive, targetUrl } = req.body || {};
  const update: any = {};
  if (typeof isActive === 'boolean') update.isActive = isActive;
  if (targetUrl) update.targetUrl = targetUrl;
  if (!Object.keys(update).length) return res.status(400).json({ error: 'BadRequest', message: 'No valid fields provided' });
  await sub.update(update);
  res.json({ id: sub.id, eventType: sub.eventType, targetUrl: sub.targetUrl, isActive: sub.isActive });
});

// Delete
router.delete('/:id', adminOnly, async (req: Request, res: Response) => {
  const sub = await WebhookSubscription.findByPk(req.params.id);
  if (!sub) return res.status(404).json({ error: 'NotFound', message: 'Subscription not found' });
  await sub.destroy();
  res.status(204).end();
});

export default router;