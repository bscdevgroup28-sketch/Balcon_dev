"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Generate quote number
const generateQuoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `Q${year}${month}${random}`;
};
// Calculate quote totals
const calculateQuoteTotals = (items, taxRate = 0.0825) => {
    const subtotal = items.reduce((total, item) => {
        return total + (item.quantity * item.unitPrice);
    }, 0);
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};
// GET /api/quotes - Get all quotes with filtering and pagination
router.get('/', (0, validation_1.validate)({ query: validation_2.quoteQuerySchema }), async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, projectId, userId, } = req.validatedQuery;
        const offset = (page - 1) * limit;
        const where = {};
        // Apply filters
        if (status)
            where.status = status;
        if (projectId)
            where.projectId = projectId;
        if (userId)
            where.userId = userId;
        const { count, rows: quotes } = await models_1.Quote.findAndCountAll({
            where,
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
                },
                {
                    model: models_1.Project,
                    as: 'project',
                    attributes: ['id', 'title', 'projectType', 'status'],
                },
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit,
            offset,
        });
        const totalPages = Math.ceil(count / limit);
        res.json({
            data: quotes,
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
        logger_1.logger.error('Error fetching quotes:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch quotes',
        });
    }
});
// GET /api/quotes/:id - Get a specific quote
router.get('/:id', (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const quote = await models_1.Quote.findByPk(id, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
                },
                {
                    model: models_1.Project,
                    as: 'project',
                    attributes: ['id', 'title', 'description', 'projectType', 'status'],
                },
            ],
        });
        if (!quote) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Quote not found',
            });
        }
        res.json({ data: quote });
    }
    catch (error) {
        logger_1.logger.error('Error fetching quote:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch quote',
        });
    }
});
// POST /api/quotes - Create a new quote
router.post('/', (0, validation_1.validate)({ body: validation_2.createQuoteSchema }), async (req, res) => {
    try {
        const { projectId, items, validUntil, terms, notes, taxRate = 0.0825 } = req.validatedBody;
        // Verify project exists
        const project = await models_1.Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Project not found',
            });
        }
        // Calculate totals
        const { subtotal, taxAmount, totalAmount } = calculateQuoteTotals(items, taxRate);
        // Generate quote number
        const quoteNumber = generateQuoteNumber();
        const quote = await models_1.Quote.create({
            projectId,
            userId: project.userId,
            quoteNumber,
            status: 'draft',
            subtotal,
            taxAmount,
            totalAmount,
            validUntil: new Date(validUntil),
            items,
            terms,
            notes,
        });
        const createdQuote = await models_1.Quote.findByPk(quote.id, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
                },
                {
                    model: models_1.Project,
                    as: 'project',
                    attributes: ['id', 'title', 'description', 'projectType', 'status'],
                },
            ],
        });
        logger_1.logger.info('Quote created', { quoteId: quote.id, projectId });
        res.status(201).json({
            data: createdQuote,
            message: 'Quote created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating quote:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create quote',
        });
    }
});
// PUT /api/quotes/:id - Update a quote
router.put('/:id', (0, validation_1.validate)({ params: validation_2.idParamSchema, body: validation_2.updateQuoteSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const updateData = req.validatedBody;
        const quote = await models_1.Quote.findByPk(id);
        if (!quote) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Quote not found',
            });
        }
        // Prepare update data
        const processedUpdateData = { ...updateData };
        // Recalculate totals if items changed
        if (updateData.items) {
            const taxRate = updateData.taxRate || 0.0825;
            const { subtotal, taxAmount, totalAmount } = calculateQuoteTotals(updateData.items, taxRate);
            processedUpdateData.subtotal = subtotal;
            processedUpdateData.taxAmount = taxAmount;
            processedUpdateData.totalAmount = totalAmount;
        }
        // Convert date strings to Date objects
        if (updateData.validUntil) {
            processedUpdateData.validUntil = new Date(updateData.validUntil);
        }
        // Remove taxRate from update data as it's not a database field
        delete processedUpdateData.taxRate;
        await quote.update(processedUpdateData);
        const updatedQuote = await models_1.Quote.findByPk(id, {
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
                },
                {
                    model: models_1.Project,
                    as: 'project',
                    attributes: ['id', 'title', 'description', 'projectType', 'status'],
                },
            ],
        });
        logger_1.logger.info('Quote updated', { quoteId: id });
        res.json({
            data: updatedQuote,
            message: 'Quote updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating quote:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update quote',
        });
    }
});
// DELETE /api/quotes/:id - Delete a quote
router.delete('/:id', (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const quote = await models_1.Quote.findByPk(id);
        if (!quote) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Quote not found',
            });
        }
        await quote.destroy();
        logger_1.logger.info('Quote deleted', { quoteId: id });
        res.json({
            message: 'Quote deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting quote:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete quote',
        });
    }
});
exports.default = router;
