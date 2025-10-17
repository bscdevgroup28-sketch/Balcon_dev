"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const models_1 = require("../models");
const authEnhanced_1 = require("../middleware/authEnhanced");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const eventBus_1 = require("../events/eventBus");
const router = (0, express_1.Router)();
const querySchema = zod_1.z.object({
    materialId: zod_1.z.coerce.number().optional(),
    type: zod_1.z.enum(['adjustment', 'receipt', 'consumption', 'return', 'correction']).optional(),
    direction: zod_1.z.enum(['in', 'out']).optional(),
    referenceType: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20)
});
const createSchema = zod_1.z.object({
    materialId: zod_1.z.number(),
    type: zod_1.z.enum(['adjustment', 'receipt', 'consumption', 'return', 'correction']).default('adjustment'),
    direction: zod_1.z.enum(['in', 'out']),
    quantity: zod_1.z.number().positive(),
    referenceType: zod_1.z.string().optional(),
    referenceId: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional()
});
// GET /api/inventory/transactions
router.get('/', (0, validation_1.validate)({ query: querySchema }), async (req, res) => {
    try {
        const { page = 1, limit = 20, materialId, type, direction, referenceType } = req.validatedQuery;
        const where = {};
        if (materialId)
            where.materialId = materialId;
        if (type)
            where.type = type;
        if (direction)
            where.direction = direction;
        if (referenceType)
            where.referenceType = referenceType;
        const offset = (page - 1) * limit;
        const { count, rows } = await models_1.InventoryTransaction.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
        res.json({ data: rows, meta: { total: count, page, limit, pages: Math.ceil(count / limit) } });
    }
    catch (err) {
        logger_1.logger.error('Failed to list inventory transactions', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch inventory transactions' });
    }
});
// POST /api/inventory/transactions
// Use unified security policy engine going forward
router.post('/', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)('inventory.transaction.create'), (0, validation_1.validate)({ body: createSchema }), async (req, res) => {
    try {
        const body = req.validatedBody;
        const material = await models_1.Material.findByPk(body.materialId);
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
        const trx = await models_1.InventoryTransaction.create({
            ...body,
            resultingStock
        });
        // Emit events
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('inventory.transaction.recorded', {
            materialId: body.materialId,
            direction: body.direction,
            quantity: body.quantity,
            resultingStock,
            type: body.type,
            referenceType: body.referenceType,
            referenceId: body.referenceId
        }));
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('material.stock.changed', { id: material.id, previousStock: Number(material.currentStock) - delta, newStock: resultingStock }));
        res.status(201).json({ data: trx, message: 'Inventory transaction recorded' });
    }
    catch (err) {
        logger_1.logger.error('Failed to create inventory transaction', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to record inventory transaction' });
    }
});
exports.default = router;
