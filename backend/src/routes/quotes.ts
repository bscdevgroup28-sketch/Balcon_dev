import { Router, Response } from 'express';
// removed unused Op import
import { z } from 'zod';
import { Quote, User, Project } from '../models';
import { eventBus, createEvent } from '../events/eventBus';
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
import { getNextSequence } from '../models/Sequence';

const router = Router();

// Generate quote number (deterministic sequence). Fallback retains legacy pattern if sequence fails.
async function generateQuoteNumber(): Promise<string> {
  try {
    const seq = await getNextSequence('quote_number');
    return `QUO-${seq.toString().padStart(6,'0')}`;
  } catch (e) {
    logger.error('Quote sequence generation failed, using legacy pattern', e);
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `Q${year}${month}${random}`;
  }
}

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
            attributes: ['id', 'firstName', 'lastName', 'email'],
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
            attributes: ['id', 'firstName', 'lastName', 'email'],
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

  // Generate quote number (await sequence)
  const quoteNumber = await generateQuoteNumber();

      const quote = await Quote.create({
        projectId,
        userId: project.userId ?? 0,
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
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description', 'projectType', 'status'],
          },
        ],
      });

      logger.info('Quote created', { quoteId: quote.id, projectId });

      // Emit domain event
      eventBus.emitEvent(
        createEvent('quote.created', {
          id: quote.id,
          projectId,
          totalAmount: quote.totalAmount,
        })
      );

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

  const statusBefore = quote.get('status');
  await quote.update(processedUpdateData);

      const updatedQuote = await Quote.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description', 'projectType', 'status'],
          },
        ],
      });

      logger.info('Quote updated', { quoteId: id });

      // Emit domain event (after re-fetch for latest state)
      const changes = Object.keys(updateData);
      eventBus.emitEvent(
        createEvent('quote.updated', {
          id,
            changes,
            statusBefore,
            statusAfter: updatedQuote?.get('status'),
        })
      );

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

  // Emit domain event
  eventBus.emitEvent(createEvent('quote.deleted', { id }));

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

// POST /api/quotes/:id/send - Send quote to customer
router.post(
  '/:id/send',
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description'],
          },
        ],
      });

      if (!quote) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote not found',
        });
      }

      if (quote.status !== 'draft') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Quote must be in draft status to send',
        });
      }

      // Update quote status and timestamps
      await quote.update({
        status: 'sent',
        sentAt: new Date(),
      });

      // Emit domain event
      eventBus.emitEvent(
        createEvent('quote.sent', { id: quote.id, projectId: quote.projectId })
      );

      logger.info('Quote sent to customer', { quoteId: id });

      res.json({
        data: quote,
        message: 'Quote sent to customer successfully',
      });
    } catch (error) {
      logger.error('Error sending quote:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send quote',
      });
    }
  }
);

// POST /api/quotes/:id/view - Mark quote as viewed by customer
router.post(
  '/:id/view',
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

      if (quote.status === 'draft') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Quote must be sent before it can be viewed',
        });
      }

      // Update quote status and timestamps
      const updateData: any = {
        status: 'viewed',
        viewedAt: new Date(),
      };

  await quote.update(updateData);

      logger.info('Quote viewed by customer', { quoteId: id });

      // Emit domain event
      eventBus.emitEvent(
        createEvent('quote.viewed', { id: quote.id, projectId: quote.projectId })
      );

      res.json({
        data: quote,
        message: 'Quote marked as viewed',
      });
    } catch (error) {
      logger.error('Error marking quote as viewed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to mark quote as viewed',
      });
    }
  }
);

// POST /api/quotes/:id/respond - Customer response to quote (accept/reject)
router.post(
  '/:id/respond',
  validate({
    params: idParamSchema,
    body: z.object({
      response: z.enum(['accepted', 'rejected']),
      notes: z.string().optional(),
    }),
  }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const { response, notes } = req.body;

      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'status'],
          },
        ],
      });

      if (!quote) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote not found',
        });
      }

      if (!['sent', 'viewed'].includes(quote.status)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Quote must be sent or viewed before responding',
        });
      }

      // Update quote status and response
      const updateData: any = {
        status: response,
        respondedAt: new Date(),
      };

      if (notes) {
        updateData.notes = (quote.notes ? quote.notes + '\n\n' : '') +
                          `Customer Response (${response}): ${notes}`;
      }

  await quote.update(updateData);

      // If quote is accepted, update project status
      if (response === 'accepted' && quote.project) {
        await quote.project.update({ status: 'approved' });
      }

      logger.info('Quote response recorded', { quoteId: id, response });

      // Emit domain events
      eventBus.emitEvent(
        createEvent('quote.responded', { id: quote.id, response })
      );
      eventBus.emitEvent(
        createEvent(`quote.${response}`, { id: quote.id, projectId: quote.projectId })
      );

      res.json({
        data: quote,
        message: `Quote ${response} successfully`,
      });
    } catch (error) {
      logger.error('Error recording quote response:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to record quote response',
      });
    }
  }
);

// GET /api/quotes/:id/public - Public endpoint for customers to view quotes (no auth required)
router.get(
  '/:id/public',
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description', 'projectType'],
          },
        ],
      });

      if (!quote) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote not found',
        });
      }

      // Only allow viewing if quote has been sent
      if (quote.status === 'draft') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Quote is not available for viewing',
        });
      }

      // Auto-mark as viewed if not already viewed
      if (quote.status === 'sent') {
        const statusBefore = quote.get('status');
        await quote.update({
          status: 'viewed',
          viewedAt: new Date(),
        });
        eventBus.emitEvent(
          createEvent('quote.viewed', { id: quote.id, projectId: quote.projectId, source: 'public', previousStatus: statusBefore })
        );
      }

      res.json({
        data: {
          ...quote.toJSON(),
          // Add computed fields
          isExpired: quote.isExpired,
          daysUntilExpiry: quote.daysUntilExpiry,
          responseTime: quote.responseTime,
        },
      });
    } catch (error) {
      logger.error('Error fetching public quote:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch quote',
      });
    }
  }
);

export default router;
