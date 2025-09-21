import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { sequelize } from '../config/database';
import { Material } from '../models';
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
          case 'normal':
            where.currentStock = { [Op.gt]: sequelize.col('minimumStock') };
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
  '/:id',
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

// POST /api/materials - Create a new material
router.post(
  '/',
  validate({ body: createMaterialSchema }),
  async (req: ValidatedRequest<CreateMaterialInput>, res: Response) => {
    try {
      const materialData = req.validatedBody!;

      const material = await Material.create(materialData);

      logger.info(`Material created: ${material.name} (ID: ${material.id})`);

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
  '/:id',
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
  '/:id',
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
    const categories = await Material.findAll({
      attributes: [
        [Material.sequelize!.fn('DISTINCT', Material.sequelize!.col('category')), 'category']
      ],
      where: {
        status: 'active',
      },
      raw: true,
    });

    const categoryList = categories
      .map((cat: any) => cat.category)
      .filter(Boolean)
      .sort();

    res.json({
      data: categoryList,
    });
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
    const materials = await Material.findAll({
      where: {
        status: 'active',
        currentStock: {
          [Op.lte]: sequelize.col('minimumStock'),
        },
      },
      order: [['currentStock', 'ASC']],
    });

    res.json({
      data: materials,
      meta: {
        total: materials.length,
      },
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
  '/:id/stock',
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

      await material.update({
        currentStock: newStock,
        notes: notes ? `${material.notes || ''}\nStock updated: ${new Date().toISOString()} - ${notes}`.trim() : material.notes,
      });

      logger.info(`Material stock updated: ${material.name} (ID: ${material.id}) - New stock: ${newStock}`);

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