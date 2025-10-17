"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const models_1 = require("../models");
const cache_1 = require("../utils/cache");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const eventBus_1 = require("../events/eventBus");
const router = (0, express_1.Router)();
// GET /api/materials - Get all materials with filtering and pagination
router.get('/', (0, validation_1.validate)({ query: validation_2.materialQuerySchema }), async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', category, status, stockStatus, supplierName, search, } = req.validatedQuery;
        const offset = (page - 1) * limit;
        const where = {};
        // Apply filters
        if (category)
            where.category = category;
        if (status)
            where.status = status;
        if (supplierName)
            where.supplierName = { [sequelize_1.Op.iLike]: `%${supplierName}%` };
        // Stock status filter
        if (stockStatus) {
            switch (stockStatus) {
                case 'critical':
                    where.currentStock = { [sequelize_1.Op.lte]: database_1.sequelize.col('reorderPoint') };
                    break;
                case 'low':
                    where.currentStock = {
                        [sequelize_1.Op.and]: [
                            { [sequelize_1.Op.lte]: database_1.sequelize.col('minimumStock') },
                            { [sequelize_1.Op.gt]: database_1.sequelize.col('reorderPoint') }
                        ]
                    };
                    break;
            }
        }
        // Search filter
        if (search) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { description: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { category: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { supplierName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        const { count, rows: materials } = await models_1.Material.findAndCountAll({
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching materials:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch materials',
        });
    }
});
// GET /api/materials/:id - Get a specific material
router.get('/:id(\\d+)', (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const material = await models_1.Material.findByPk(id);
        if (!material) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Material not found',
            });
        }
        res.json({ data: material });
    }
    catch (error) {
        logger_1.logger.error('Error fetching material:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch material',
        });
    }
});
// POST /api/materials - Create a new material
router.post('/', (0, validation_1.validate)({ body: validation_2.createMaterialSchema }), async (req, res) => {
    try {
        const materialData = req.validatedBody;
        const material = await models_1.Material.create(materialData);
        logger_1.logger.info(`Material created: ${material.name} (ID: ${material.id})`);
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('material.created', { id: material.id, name: material.name }));
        try {
            // Direct key deletion plus tag invalidation for stronger consistency
            try {
                (0, cache_1.del)(cache_1.cacheKeys.materialCategories);
            }
            catch { /* ignore */ }
            (0, cache_1.invalidateTag)(cache_1.cacheTags.materials);
            // Write-through repopulation for strong consistency post-create
            const cats = await models_1.Material.findAll({
                attributes: [[models_1.Material.sequelize.fn('DISTINCT', models_1.Material.sequelize.col('category')), 'category']],
                where: { status: 'active' },
                raw: true
            });
            const list = cats.map((c) => c.category).filter(Boolean).sort();
            try {
                (0, cache_1.set)(cache_1.cacheKeys.materialCategories, list, parseInt(process.env.CACHE_TTL_MATERIAL_CATEGORIES_MS || '30000'), [cache_1.cacheTags.materials]);
            }
            catch { /* ignore */ }
        }
        catch { /* ignore */ }
        res.status(201).json({
            data: material,
            message: 'Material created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating material:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create material',
        });
    }
});
// PUT /api/materials/:id - Update a material
router.put('/:id(\\d+)', (0, validation_1.validate)({ params: validation_2.idParamSchema, body: validation_2.updateMaterialSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const updateData = req.validatedBody;
        const material = await models_1.Material.findByPk(id);
        if (!material) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Material not found',
            });
        }
        await material.update(updateData);
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('material.updated', { id: material.id, changes: Object.keys(updateData) }));
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.materials);
        }
        catch { /* ignore */ }
        logger_1.logger.info(`Material updated: ${material.name} (ID: ${material.id})`);
        res.json({
            data: material,
            message: 'Material updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating material:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update material',
        });
    }
});
// DELETE /api/materials/:id - Delete a material
router.delete('/:id(\\d+)', (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const material = await models_1.Material.findByPk(id);
        if (!material) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Material not found',
            });
        }
        await material.destroy();
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('material.deleted', { id: material.id }));
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.materials);
        }
        catch { /* ignore */ }
        logger_1.logger.info(`Material deleted: ${material.name} (ID: ${material.id})`);
        res.json({
            message: 'Material deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting material:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete material',
        });
    }
});
// GET /api/materials/categories - Get unique material categories
router.get('/categories', async (req, res) => {
    try {
        const ttlMs = parseInt(process.env.CACHE_TTL_MATERIAL_CATEGORIES_MS || '30000');
        const bypass = req.query?.bypassCache === 'true';
        const loader = async () => {
            const categories = await models_1.Material.findAll({
                attributes: [
                    [models_1.Material.sequelize.fn('DISTINCT', models_1.Material.sequelize.col('category')), 'category']
                ],
                where: { status: 'active' },
                raw: true,
            });
            return categories
                .map((cat) => cat.category)
                .filter(Boolean)
                .sort();
        };
        const categoryList = bypass
            ? await loader()
            : await (0, cache_1.withCache)(cache_1.cacheKeys.materialCategories, ttlMs, loader, [cache_1.cacheTags.materials]);
        res.setHeader('Cache-Control', 'public, max-age=30');
        res.json({ data: categoryList, cached: !bypass });
    }
    catch (error) {
        logger_1.logger.error('Error fetching material categories:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch material categories',
        });
    }
});
// GET /api/materials/low-stock - Get materials with low stock
router.get('/low-stock', async (req, res) => {
    try {
        const ttlMs = parseInt(process.env.CACHE_TTL_MATERIALS_LOW_STOCK_MS || '15000');
        const materials = await (0, cache_1.withCache)(cache_1.cacheKeys.materialLowStock, ttlMs, async () => {
            const rows = await models_1.Material.findAll({
                where: {
                    status: 'active',
                    currentStock: { [sequelize_1.Op.lte]: database_1.sequelize.col('minimumStock') },
                },
                order: [['currentStock', 'ASC']],
            });
            return rows.map(r => r.toJSON());
        }, [cache_1.cacheTags.materials]);
        res.json({
            data: materials,
            meta: { total: materials.length },
            cached: true
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching low stock materials:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch low stock materials',
        });
    }
});
// PUT /api/materials/:id/stock - Update material stock
router.put('/:id(\\d+)/stock', (0, validation_1.validate)({
    params: validation_2.idParamSchema,
    body: zod_1.z.object({
        currentStock: zod_1.z.number().min(0, 'Stock cannot be negative'),
        adjustment: zod_1.z.number().optional(), // Positive for addition, negative for subtraction
        notes: zod_1.z.string().optional(),
    }),
}), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const { currentStock, adjustment, notes } = req.validatedBody;
        const material = await models_1.Material.findByPk(id);
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
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.materials);
        }
        catch { /* ignore */ }
        logger_1.logger.info(`Material stock updated: ${material.name} (ID: ${material.id}) - New stock: ${newStock}`);
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('material.stock.changed', { id: material.id, previousStock, newStock }));
        // Emit inventory transaction event (logical; persistence to dedicated table can be added in service layer later)
        const direction = newStock > previousStock ? 'in' : 'out';
        const delta = Math.abs(newStock - previousStock);
        if (delta !== 0) {
            eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('inventory.transaction.recorded', {
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
    }
    catch (error) {
        logger_1.logger.error('Error updating material stock:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update material stock',
        });
    }
});
exports.default = router;
