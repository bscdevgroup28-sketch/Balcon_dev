import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { Quote, User, Project } from '../models';
import { validate, ValidatedRequest } from '../middleware/validation';
import {
  createQuoteSchema,
  updateQuoteSchema,
  quoteQuerySchema,
  idParamSchema,
  CreateQuoteInput,
  UpdateQuoteInput,
  QuoteQueryInput,
  IdParamInput,
} from '../utils/validation';
import { logger } from '../utils/logger';

const router = Router();

// Generate quote number
const generateQuoteNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `Q${year}${month}${random}`;
};

// Calculate quote totals
const calculateQuoteTotals = (items: any[], taxRate: number = 0.0825) => {
  const subtotal = items.reduce((total, item) => {
    return total + (item.quantity * item.unitPrice);
  }, 0);
  
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;
  
  return { subtotal, taxAmount, totalAmount };
};

// GET /api/quotes - Get all quotes with filtering and pagination
router.get(
  '/',
  validate({ query: quoteQuerySchema }),
  async (req: ValidatedRequest<any, QuoteQueryInput>, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        projectId,
        userId,
      } = req.validatedQuery!;

      const offset = (page - 1) * limit;
      const where: any = {};

      // Apply filters
      if (status) where.status = status;
      if (projectId) where.projectId = projectId;
      if (userId) where.userId = userId;

      const { count, rows: quotes } = await Quote.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
          },
          {
            model: Project,
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
    } catch (error) {
      logger.error('Error fetching quotes:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch quotes',
      });
    }
  }
);

// GET /api/quotes/:id - Get a specific quote
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
          },
          {
            model: Project,
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
    } catch (error) {
      logger.error('Error fetching quote:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch quote',
      });
    }
  }
);

// POST /api/quotes - Create a new quote
router.post(
  '/',
  validate({ body: createQuoteSchema }),
  async (req: ValidatedRequest<CreateQuoteInput>, res: Response) => {
    try {
      const { projectId, items, validUntil, terms, notes, taxRate = 0.0825 } = req.validatedBody!;

      // Verify project exists
      const project = await Project.findByPk(projectId);
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

      const quote = await Quote.create({
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

      const createdQuote = await Quote.findByPk(quote.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description', 'projectType', 'status'],
          },
        ],
      });

      logger.info('Quote created', { quoteId: quote.id, projectId });

      res.status(201).json({
        data: createdQuote,
        message: 'Quote created successfully',
      });
    } catch (error) {
      logger.error('Error creating quote:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create quote',
      });
    }
  }
);

// PUT /api/quotes/:id - Update a quote
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateQuoteSchema }),
  async (req: ValidatedRequest<UpdateQuoteInput, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const updateData = req.validatedBody!;

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote not found',
        });
      }

      // Prepare update data
      const processedUpdateData: any = { ...updateData };

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

      const updatedQuote = await Quote.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description', 'projectType', 'status'],
          },
        ],
      });

      logger.info('Quote updated', { quoteId: id });

      res.json({
        data: updatedQuote,
        message: 'Quote updated successfully',
      });
    } catch (error) {
      logger.error('Error updating quote:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update quote',
      });
    }
  }
);

// DELETE /api/quotes/:id - Delete a quote
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote not found',
        });
      }

      await quote.destroy();

      logger.info('Quote deleted', { quoteId: id });

      res.json({
        message: 'Quote deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting quote:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete quote',
      });
    }
  }
);

export default router;
