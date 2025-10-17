import { Router, Response } from 'express';
import { z } from 'zod';
import { InventoryTransaction, Material } from '../models';
import { requirePolicy, authenticateToken } from '../middleware/authEnhanced';
import { validate, ValidatedRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import { eventBus, createEvent } from '../events/eventBus';

const router = Router();

const querySchema = z.object({
  materialId: z.coerce.number().optional(),
  type: z.enum(['adjustment','receipt','consumption','return','correction']).optional(),
  direction: z.enum(['in','out']).optional(),
  referenceType: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const createSchema = z.object({
  materialId: z.number(),
  type: z.enum(['adjustment','receipt','consumption','return','correction']).default('adjustment'),
  direction: z.enum(['in','out']),
  quantity: z.number().positive(),
  referenceType: z.string().optional(),
  referenceId: z.number().optional(),
  notes: z.string().optional()
});

// GET /api/inventory/transactions
router.get('/', validate({ query: querySchema }), async (req: ValidatedRequest<any, z.infer<typeof querySchema>>, res: Response) => {
  try {
    const { page=1, limit=20, materialId, type, direction, referenceType } = req.validatedQuery!;
    const where: any = {};
    if (materialId) where.materialId = materialId;
    if (type) where.type = type;
    if (direction) where.direction = direction;
    if (referenceType) where.referenceType = referenceType;
    const offset = (page - 1) * limit;

    const { count, rows } = await InventoryTransaction.findAndCountAll({ where, limit, offset, order: [['createdAt','DESC']] });
    res.json({ data: rows, meta: { total: count, page, limit, pages: Math.ceil(count / limit) } });
  } catch (err) {
    logger.error('Failed to list inventory transactions', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch inventory transactions' });
  }
});

// POST /api/inventory/transactions
// Use unified security policy engine going forward
router.post('/', authenticateToken, requirePolicy('inventory.transaction.create'), validate({ body: createSchema }), async (req: ValidatedRequest<z.infer<typeof createSchema>>, res: Response) => {
  try {
    const body = req.validatedBody!;
    const material = await Material.findByPk(body.materialId);
    if (!material) {
      return res.status(404).json({ error: 'Not Found', message: 'Material not found' });
    }
    // Calculate resulting stock
    const delta = body.quantity * (body.direction === 'in' ? 1 : -1);
    const resultingStock = Number(material.currentStock) + delta;
    if (resultingStock < 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Resulting stock would be negative' });
    }

    // Update material stock immediately
    await material.update({ currentStock: resultingStock });

    const trx = await InventoryTransaction.create({
      ...body,
      resultingStock
    });

    // Emit events
    eventBus.emitEvent(createEvent('inventory.transaction.recorded', {
      materialId: body.materialId,
      direction: body.direction,
      quantity: body.quantity,
      resultingStock,
      type: body.type,
      referenceType: body.referenceType,
      referenceId: body.referenceId
    }));
    eventBus.emitEvent(createEvent('material.stock.changed', { id: material.id, previousStock: Number(material.currentStock) - delta, newStock: resultingStock }));

    res.status(201).json({ data: trx, message: 'Inventory transaction recorded' });
  } catch (err) {
    logger.error('Failed to create inventory transaction', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to record inventory transaction' });
  }
});

export default router;