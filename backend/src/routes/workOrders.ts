import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/authEnhanced';
import { requirePolicy } from '../middleware/authEnhanced';
import { Actions } from '../security/actions';
import { WorkOrder } from '../models/WorkOrder';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { eventBus, createEvent } from '../events/eventBus';

const router = Router();

const createSchema = z.object({
  projectId: z.number().positive(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  priority: z.enum(['low','medium','high','urgent']).default('medium'),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional()
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(['pending','assigned','in_progress','blocked','completed','cancelled']).optional(),
  assignedUserId: z.number().positive().nullable().optional(),
  actualHours: z.number().nonnegative().optional(),
  startDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(v => parseInt(v,10)) });

router.get('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const { projectId, status, assignedUserId } = req.query;
    const where: any = {};
    if (projectId) where.projectId = Number(projectId);
    if (status) where.status = status;
    if (assignedUserId) where.assignedUserId = Number(assignedUserId);
    const items = await WorkOrder.findAll({ where, order: [['createdAt','DESC']] });
    res.json({ data: items });
  } catch (e) {
    logger.error('Failed to list work orders', e);
    res.status(500).json({ error: 'Failed to list work orders' });
  }
});

router.post('/', authenticateToken, requirePolicy(Actions.WORK_ORDER_CREATE), async (req: any, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_failed', details: parsed.error.issues });
  }
  try {
  const { dueDate, ...rest } = parsed.data;
  const wo = await WorkOrder.create({ ...rest, dueDate: dueDate ? new Date(dueDate) : undefined });
    eventBus.emitEvent(createEvent('work_order.created', { id: wo.id, projectId: wo.projectId }));
    res.status(201).json({ data: wo });
  } catch (e) {
    logger.error('Failed to create work order', e);
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

router.get('/:id', authenticateToken, async (req, res: Response) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_id' });
  const wo = await WorkOrder.findByPk(parsed.data.id);
  if (!wo) return res.status(404).json({ error: 'not_found' });
  res.json({ data: wo });
});

router.put('/:id', authenticateToken, requirePolicy(Actions.WORK_ORDER_UPDATE), async (req, res: Response) => {
  const idp = idParam.safeParse(req.params);
  if (!idp.success) return res.status(400).json({ error: 'invalid_id' });
  const body = updateSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'validation_failed', details: body.error.issues });
  const wo = await WorkOrder.findByPk(idp.data.id);
  if (!wo) return res.status(404).json({ error: 'not_found' });
  try {
  const upd = { ...body.data } as any;
  if (upd.dueDate) upd.dueDate = new Date(upd.dueDate);
  if (upd.startDate) upd.startDate = new Date(upd.startDate);
  if (upd.completedAt) upd.completedAt = new Date(upd.completedAt);
  await wo.update(upd);
    eventBus.emitEvent(createEvent('work_order.updated', { id: wo.id, status: wo.status }));
    res.json({ data: wo });
  } catch (e) {
    logger.error('Failed to update work order', e);
    res.status(500).json({ error: 'Failed to update work order' });
  }
});

router.delete('/:id', authenticateToken, async (req, res: Response) => {
  const idp = idParam.safeParse(req.params);
  if (!idp.success) return res.status(400).json({ error: 'invalid_id' });
  const wo = await WorkOrder.findByPk(idp.data.id);
  if (!wo) return res.status(404).json({ error: 'not_found' });
  try {
    await wo.destroy();
    eventBus.emitEvent(createEvent('work_order.deleted', { id: wo.id }));
    res.json({ success: true });
  } catch (e) {
    logger.error('Failed to delete work order', e);
    res.status(500).json({ error: 'Failed to delete work order' });
  }
});

export default router;
