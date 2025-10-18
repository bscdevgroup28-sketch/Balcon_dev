import { Router, Response, Request } from 'express';
import { authenticateToken, requirePolicy } from '../middleware/authEnhanced';
import { z } from 'zod';
import { InventoryTransaction, Material } from '../models';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { logger } from '../utils/logger';
import { metrics } from '../monitoring/metrics';
import { Actions } from '../security/actions';
import { invalidateTag, cacheTags } from '../utils/cache';
import { eventBus, createEvent } from '../events/eventBus';

const router = Router();

// Shortage computation: naive approach sums materials with stock below reorderPoint
router.get('/shortages', authenticateToken as any, async (_req: Request, res: Response) => {
  try {
    const low = await Material.findAll({ where: { }, order: [['currentStock','ASC']], limit: 500 });
    const shortages = low.filter(m => m.needsReorder).map(m => ({ materialId: m.id, name: m.name, currentStock: Number(m.currentStock), reorderPoint: Number(m.reorderPoint), suggestedQty: Math.max(0, Number(m.reorderPoint) - Number(m.currentStock)) }));
    res.json({ success: true, data: shortages });
  } catch (e) {
    logger.error('shortage list failed', e);
    res.status(500).json({ success: false, message: 'Failed to compute shortages' });
  }
});

const createPOSchema = z.object({ vendor: z.string().min(2), items: z.array(z.object({ materialId: z.number().positive(), quantity: z.number().positive(), unitCost: z.number().min(0) })).min(1), notes: z.string().optional() });

router.post('/', authenticateToken as any, requirePolicy(Actions.PURCHASE_ORDER_CREATE) as any, async (req: Request, res: Response) => {
  const parsed = createPOSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success:false, message: 'validation_failed', details: parsed.error.issues });
  const { vendor, items, notes } = parsed.data;
  // Compute total
  const totalCost = items.reduce((s, it) => s + it.quantity * it.unitCost, 0);
  const po = await PurchaseOrder.create({ vendor, items, totalCost, status: 'draft', notes });
  metrics.increment('po.created');
  try { eventBus.emitEvent(createEvent('purchase_order.created', { id: po.id, vendor })); } catch (e) { /* ignore event bus error */ }
  try { invalidateTag(cacheTags.materials); } catch { /* ignore */ }
  res.status(201).json({ success: true, data: po });
});

// Receive PO: update inventory for each item and mark received
router.post('/:id/receive', authenticateToken as any, requirePolicy(Actions.PURCHASE_ORDER_RECEIVE) as any, async (req: Request, res: Response) => {
  const id = Number((req.params as any).id);
  const po = await PurchaseOrder.findByPk(id);
  if (!po) return res.status(404).json({ success:false, message:'not_found' });
  if (po.status === 'received') return res.status(400).json({ success:false, message:'already received' });
  try {
    for (const it of po.items as any[]) {
      const mat = await Material.findByPk(it.materialId);
      if (!mat) continue;
      const resultingStock = Number(mat.currentStock) + Number(it.quantity);
      await mat.update({ currentStock: resultingStock });
      await InventoryTransaction.create({ materialId: mat.id, type: 'receipt', direction: 'in', quantity: it.quantity, referenceType: 'purchase_order', referenceId: po.id, resultingStock });
    }
    await po.update({ status: 'received', receivedAt: new Date() });
  metrics.increment('po.received');
  try { eventBus.emitEvent(createEvent('purchase_order.received', { id: po.id, receivedAt: po.receivedAt })); } catch (e) { /* ignore event bus error */ }
  try { invalidateTag(cacheTags.materials); } catch { /* ignore */ }
    res.json({ success:true, data: po });
  } catch (e) {
    logger.error('receive po failed', e);
    res.status(500).json({ success:false, message:'failed to receive purchase order' });
  }
});

// Simple list/get
router.get('/', authenticateToken as any, async (_req: Request, res: Response) => {
  const rows = await PurchaseOrder.findAll({ order: [['createdAt','DESC']] });
  res.json({ success: true, data: rows });
});
router.get('/:id', authenticateToken as any, async (req: Request, res: Response) => {
  const id = Number((req.params as any).id);
  const po = await PurchaseOrder.findByPk(id);
  if (!po) return res.status(404).json({ success:false, message:'not_found' });
  res.json({ success:true, data: po });
});

export default router;
