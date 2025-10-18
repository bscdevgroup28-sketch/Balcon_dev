import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authEnhanced';
import { z } from 'zod';
import { EventLog } from '../models/EventLog';
import { Op } from 'sequelize';

const router = Router();

const querySchema = z.object({
  entityType: z.enum(['project','quote','order','invoice','purchase_order','work_order']),
  entityId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional()
});

function getEventPrefixAndKeys(entityType: string): { prefix: string, keys: string[] } {
  switch (entityType) {
    case 'project': return { prefix: 'project.', keys: ['projectId','id'] };
    case 'quote': return { prefix: 'quote.', keys: ['quoteId','id'] };
    case 'order': return { prefix: 'order.', keys: ['orderId','id'] };
    case 'invoice': return { prefix: 'invoice.', keys: ['invoiceId','id'] };
    case 'purchase_order': return { prefix: 'purchase_order.', keys: ['purchaseOrderId','id'] };
    case 'work_order': return { prefix: 'work_order.', keys: ['workOrderId','id'] };
    default: return { prefix: '', keys: ['id'] };
  }
}

router.get('/', authenticateToken as any, requireRole(['owner','admin','project_manager','office_manager','shop_manager']) as any, async (req: any, res: any) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ success:false, message: 'validation_failed', details: parsed.error.issues });
  const { entityType, entityId } = parsed.data;
  const page = parsed.data.page || 1; const limit = parsed.data.limit || 20; const offset = (page-1) * limit;
  const { prefix, keys } = getEventPrefixAndKeys(entityType);
  try {
    const where:any = prefix ? { name: { [Op.like]: `${prefix}%` } } : {};
    // Pull a larger window then filter by payload keys to support SQLite without JSON operators
    const windowSize = Math.max(limit * 3, 100);
    const rows = await EventLog.findAll({ where, order: [['timestamp','DESC']], limit: windowSize });
    const filtered = rows.filter(r => {
      const payload: any = (r as any).payload || {};
      return keys.some(k => Number(payload?.[k]) === Number(entityId));
    });
    const total = filtered.length;
    const slice = filtered.slice(offset, offset + limit);
    res.json({ success:true, data: slice.map(r => ({ id: r.id, name: r.name, timestamp: r.timestamp, payload: (r as any).payload, correlationId: r.correlationId })), pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (e:any) {
    res.status(500).json({ success:false, message:'failed_to_load_audit', error: e.message });
  }
});

export default router;