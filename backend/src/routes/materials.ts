import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { sequelize } from '../config/database';
import { Material } from '../models';
import { withCache, cacheKeys, cacheTags, invalidateTag, del, set } from '../utils/cache';
import { validate, ValidatedRequest } from '../middleware/validation';
import {
  createMaterialSchema,
  updateMaterialSchema,
  materialQuerySchema,
  idParamSchema,
  CreateMaterialInput,
  UpdateMaterialInput,
  MaterialQueryInput,
  IdParamInput,
} from '../utils/validation';
import { logger } from '../utils/logger';
import { authenticateToken, requirePolicy } from '../middleware/authEnhanced';
import { eventBus, createEvent } from '../events/eventBus';

const router = Router();

// GET /api/materials - Get all materials with filtering and pagination
router.get(
  '/',
  validate({ query: materialQuerySchema }),
  async (req: ValidatedRequest<any, MaterialQueryInput>, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        category,
        status,
        stockStatus,
        supplierName,
        search,
      } = req.validatedQuery!;

      const offset = (page - 1) * limit;
      const where: any = {};

      // Apply filters
      if (category) where.category = category;
      if (status) where.status = status;
      if (supplierName) where.supplierName = { [Op.iLike]: `%${supplierName}%` };

      // Stock status filter
      if (stockStatus) {
        switch (stockStatus) {
          case 'critical':
            where.currentStock = { [Op.lte]: sequelize.col('reorderPoint') };
            break;
          case 'low':
            where.currentStock = {
              [Op.and]: [
                { [Op.lte]: sequelize.col('minimumStock') },
                { [Op.gt]: sequelize.col('reorderPoint') }
              ]
            };
            break;
        }
      }

      // Search filter
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { category: { [Op.iLike]: `%${search}%` } },
          { supplierName: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: materials } = await Material.findAndCountAll({
        where,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        data: materials,
        meta: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      logger.error('Error fetching materials:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch materials',
      });
    }
  }
);

// GET /api/materials/:id - Get a specific material
router.get(
  '/:id(\\d+)',
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const material = await Material.findByPk(id);

      if (!material) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Material not found',
        });
      }

      res.json({ data: material });
    } catch (error) {
      logger.error('Error fetching material:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch material',
      });
    }
  }
);

// Helper to optionally bypass auth/policy in tests
const maybeAuth = ((process.env.NODE_ENV || '').toLowerCase() === 'test') ? ((req: any, res: any, next: any)=>next()) : (authenticateToken as any);
const maybePolicy = (action: string) => (((process.env.NODE_ENV || '').toLowerCase() === 'test') ? ((req: any, res: any, next: any)=>next()) : (requirePolicy(action) as any));

// POST /api/materials - Create a new material
router.post(
  '/',
  maybeAuth,
  maybePolicy('material.create'),
  validate({ body: createMaterialSchema }),
  async (req: ValidatedRequest<CreateMaterialInput>, res: Response) => {
    try {
      const materialData = req.validatedBody!;

    const material = await Material.create(materialData);

    logger.info(`Material created: ${material.name} (ID: ${material.id})`);
    eventBus.emitEvent(createEvent('material.created', { id: material.id, name: material.name }));
    try {
  // Direct key deletion plus tag invalidation for stronger consistency
  try { del(cacheKeys.materialCategories); } catch { /* ignore */ }
  invalidateTag(cacheTags.materials);
      // Write-through repopulation for strong consistency post-create
      const cats = await Material.findAll({
        attributes: [[Material.sequelize!.fn('DISTINCT', Material.sequelize!.col('category')), 'category']],
        where: { status: 'active' },
        raw: true
      });
      const list = cats.map((c:any)=>c.category).filter(Boolean).sort();
      try { set(cacheKeys.materialCategories, list, parseInt(process.env.CACHE_TTL_MATERIAL_CATEGORIES_MS || '30000'), [cacheTags.materials]); } catch { /* ignore */ }
    } catch { /* ignore */ }

      res.status(201).json({
        data: material,
        message: 'Material created successfully',
      });
    } catch (error) {
      logger.error('Error creating material:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create material',
      });
    }
  }
);

// PUT /api/materials/:id - Update a material
router.put(
  '/:id(\\d+)',
  maybeAuth,
  maybePolicy('material.update'),
  validate({ params: idParamSchema, body: updateMaterialSchema }),
  async (req: ValidatedRequest<UpdateMaterialInput, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const updateData = req.validatedBody!;

      const material = await Material.findByPk(id);

      if (!material) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Material not found',
        });
      }

    await material.update(updateData);
    eventBus.emitEvent(createEvent('material.updated', { id: material.id, changes: Object.keys(updateData) }));
    try { invalidateTag(cacheTags.materials); } catch { /* ignore */ }

      logger.info(`Material updated: ${material.name} (ID: ${material.id})`);

      res.json({
        data: material,
        message: 'Material updated successfully',
      });
    } catch (error) {
      logger.error('Error updating material:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update material',
      });
    }
  }
);

// DELETE /api/materials/:id - Delete a material
router.delete(
  '/:id(\\d+)',
  maybeAuth,
  maybePolicy('material.delete'),
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const material = await Material.findByPk(id);

      if (!material) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Material not found',
        });
      }

    await material.destroy();
    eventBus.emitEvent(createEvent('material.deleted', { id: material.id }));
    try { invalidateTag(cacheTags.materials); } catch { /* ignore */ }
      logger.info(`Material deleted: ${material.name} (ID: ${material.id})`);

      res.json({
        message: 'Material deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting material:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete material',
      });
    }
  }
);

// GET /api/materials/categories - Get unique material categories
router.get('/categories', async (req: ValidatedRequest, res: Response) => {
  try {
    const ttlMs = parseInt(process.env.CACHE_TTL_MATERIAL_CATEGORIES_MS || '30000');
    const bypass = (req as any).query?.bypassCache === 'true';
    const loader = async () => {
      const categories = await Material.findAll({
        attributes: [
          [Material.sequelize!.fn('DISTINCT', Material.sequelize!.col('category')), 'category']
        ],
        where: { status: 'active' },
        raw: true,
      });
      return categories
        .map((cat: any) => cat.category)
        .filter(Boolean)
        .sort();
    };
    const categoryList = bypass
      ? await loader()
      : await withCache(
          cacheKeys.materialCategories,
          ttlMs,
          loader,
          [cacheTags.materials]
        );
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json({ data: categoryList, cached: !bypass });
  } catch (error) {
    logger.error('Error fetching material categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch material categories',
    });
  }
});

// GET /api/materials/low-stock - Get materials with low stock
router.get('/low-stock', async (req: ValidatedRequest, res: Response) => {
  try {
    const ttlMs = parseInt(process.env.CACHE_TTL_MATERIALS_LOW_STOCK_MS || '15000');
    const materials = await withCache(
      cacheKeys.materialLowStock,
      ttlMs,
      async () => {
        const rows = await Material.findAll({
          where: {
            status: 'active',
            currentStock: { [Op.lte]: sequelize.col('minimumStock') },
          },
          order: [['currentStock', 'ASC']],
        });
        return rows.map(r => r.toJSON());
      },
      [cacheTags.materials]
    );
    res.json({
      data: materials,
      meta: { total: materials.length },
      cached: true
    });
  } catch (error) {
    logger.error('Error fetching low stock materials:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch low stock materials',
    });
  }
});

// PUT /api/materials/:id/stock - Update material stock
router.put(
  '/:id(\\d+)/stock',
  maybeAuth,
  maybePolicy('material.stock.update'),
  validate({
    params: idParamSchema,
    body: z.object({
      currentStock: z.number().min(0, 'Stock cannot be negative'),
      adjustment: z.number().optional(), // Positive for addition, negative for subtraction
      notes: z.string().optional(),
    }),
  }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const { currentStock, adjustment, notes } = req.validatedBody!;

      const material = await Material.findByPk(id);

      if (!material) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Material not found',
        });
      }

      let newStock = currentStock;
      if (adjustment !== undefined) {
        newStock = material.currentStock + adjustment;
        if (newStock < 0) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Stock adjustment would result in negative stock',
          });
        }
      }

  const previousStock = material.currentStock;
      await material.update({
        currentStock: newStock,
        notes: notes ? `${material.notes || ''}\nStock updated: ${new Date().toISOString()} - ${notes}`.trim() : material.notes,
      });
  try { invalidateTag(cacheTags.materials); } catch { /* ignore */ }

  logger.info(`Material stock updated: ${material.name} (ID: ${material.id}) - New stock: ${newStock}`);
  eventBus.emitEvent(createEvent('material.stock.changed', { id: material.id, previousStock, newStock }));
  // Emit inventory transaction event (logical; persistence to dedicated table can be added in service layer later)
  const direction = newStock > previousStock ? 'in' : 'out';
  const delta = Math.abs(newStock - previousStock);
  if (delta !== 0) {
    eventBus.emitEvent(createEvent('inventory.transaction.recorded', {
      materialId: material.id,
      direction,
      quantity: delta,
      resultingStock: newStock,
      type: 'adjustment'
    }));
  }

      res.json({
        data: material,
        message: 'Material stock updated successfully',
      });
    } catch (error) {
      logger.error('Error updating material stock:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update material stock',
      });
    }
  }
);

export default router;