import { Router, Response, Request } from 'express';
import { ChangeOrder, Project, Quote } from '../models';
import { Op } from 'sequelize';
import { authenticateToken, requirePolicy } from '../middleware/authEnhanced';
import { validate, ValidatedRequest } from '../middleware/validation';
import { 
  createChangeOrderSchema, updateChangeOrderSchema, changeOrderQuerySchema,
  idParamSchema, ChangeOrderQueryInput, CreateChangeOrderInput, UpdateChangeOrderInput, IdParamInput 
} from '../utils/validation';
import { Actions } from '../security/actions';
import { metrics } from '../monitoring/metrics';
import { logger } from '../utils/logger';
import { getNextSequence } from '../models/Sequence';
import { invalidateTag, cacheTags } from '../utils/cache';

const router = Router();

// List
router.get('/', authenticateToken as any, validate({ query: changeOrderQuerySchema }) as any,
  async (req: ValidatedRequest<any, ChangeOrderQueryInput>, res: Response) => {
    const start = Date.now();
    try {
      const { page=1, limit=10, sortBy='createdAt', sortOrder='desc', projectId, status, search } = req.validatedQuery!;
      const offset = (page - 1) * limit;
      const where:any = {};
      if (projectId) where.projectId = projectId;
      if (status) where.status = status;
  if (search) where.title = { [Op.iLike]: `%${search}%` } as any;
      const { count, rows } = await ChangeOrder.findAndCountAll({
        where,
        include: [
          { model: Project, as: 'project', attributes: ['id','title','status'] },
          { model: Quote, as: 'quote', attributes: ['id','quoteNumber'], required: false }
        ],
        limit,
        offset,
        order: [[sortBy, (sortOrder || 'desc').toUpperCase() as any]],
      });
      metrics.observe('change_orders.list.latency.ms', Date.now() - start);
      res.json({ success: true, data: { changeOrders: rows, pagination: { page, limit, total: count, pages: Math.ceil(count/limit) } } });
    } catch (e:any) {
      metrics.increment('change_orders.list.error');
      res.status(500).json({ success: false, message: 'Failed to fetch change orders', error: process.env.NODE_ENV==='development'? e.message: undefined });
    }
  }
);

// Get one
router.get('/:id', authenticateToken as any, validate({ params: idParamSchema }) as any,
  async (req: ValidatedRequest<IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const co = await ChangeOrder.findByPk(id, { include: [{ model: Project, as: 'project' }, { model: Quote, as: 'quote' }] });
      if (!co) return res.status(404).json({ success: false, message: 'Change order not found' });
      res.json({ success: true, data: co });
    } catch (e:any) {
      res.status(500).json({ success: false, message: 'Failed to fetch change order', error: process.env.NODE_ENV==='development'? e.message: undefined });
    }
  }
);

// Create
router.post('/', authenticateToken as any, requirePolicy(Actions.CHANGE_ORDER_CREATE) as any, validate({ body: createChangeOrderSchema }) as any,
  async (req: ValidatedRequest<CreateChangeOrderInput>, res: Response) => {
    try {
      const body = req.validatedBody!;
      const project = await Project.findByPk(body.projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      let code: string;
      try { const seq = await getNextSequence('change_order_code'); code = `CO-${seq.toString().padStart(6,'0')}`; }
      catch { code = `CO-${Date.now()}`; }
      const co = await ChangeOrder.create({
        projectId: body.projectId,
        quoteId: body.quoteId,
        code,
        title: body.title,
        description: body.description,
        status: 'draft',
        amount: body.amount,
        createdByUserId: (req as any).user.id
      });
  try { invalidateTag(cacheTags.analytics); } catch (e) { logger.warn('cache invalidate failed', e as any); }
      metrics.increment('change_orders.created');
      res.status(201).json({ success: true, data: co });
    } catch (e:any) {
      logger.error('Error creating change order', e);
      res.status(500).json({ success: false, message: 'Failed to create change order', error: process.env.NODE_ENV==='development'? e.message: undefined });
    }
  }
);

// Update
router.put('/:id', authenticateToken as any, validate({ params: idParamSchema, body: updateChangeOrderSchema }) as any,
  async (req: ValidatedRequest<UpdateChangeOrderInput, any, IdParamInput> & Request, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const body = req.validatedBody!;
      const co = await ChangeOrder.findByPk(id);
      if (!co) return res.status(404).json({ success: false, message: 'Change order not found' });
      if (co.status !== 'draft' && (body.title || body.description || body.amount)) {
        return res.status(400).json({ success: false, message: 'Only draft change orders can modify core fields' });
      }
      // After business preconditions pass, enforce policy
      const policyMw = requirePolicy(Actions.CHANGE_ORDER_UPDATE) as any;
      await new Promise<void>((resolve, reject) => (policyMw as any)(req, res, (err?: any) => err ? reject(err) : resolve()));
      await co.update({ ...body });
  try { invalidateTag(cacheTags.analytics); } catch (e) { logger.warn('cache invalidate failed', e as any); }
      metrics.increment('change_orders.updated');
      res.json({ success: true, data: co });
    } catch (e:any) {
      res.status(500).json({ success: false, message: 'Failed to update change order', error: process.env.NODE_ENV==='development'? e.message: undefined });
    }
  }
);

// Delete
router.delete('/:id', authenticateToken as any, requirePolicy(Actions.CHANGE_ORDER_DELETE) as any, validate({ params: idParamSchema }) as any,
  async (req: ValidatedRequest<IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const co = await ChangeOrder.findByPk(id);
      if (!co) return res.status(404).json({ success: false, message: 'Change order not found' });
      if (co.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft change orders can be deleted' });
      await co.destroy();
  try { invalidateTag(cacheTags.analytics); } catch (e) { logger.warn('cache invalidate failed', e as any); }
      metrics.increment('change_orders.deleted');
      res.json({ success: true });
    } catch (e:any) {
      res.status(500).json({ success: false, message: 'Failed to delete change order', error: process.env.NODE_ENV==='development'? e.message: undefined });
    }
  }
);

// Status transitions: send, approve, reject
router.post('/:id/send', authenticateToken as any, requirePolicy(Actions.CHANGE_ORDER_UPDATE) as any, validate({ params: idParamSchema }) as any,
  async (req: ValidatedRequest<IdParamInput>, res: Response) => {
    try {
      const co = await ChangeOrder.findByPk(req.validatedParams!.id);
      if (!co) return res.status(404).json({ success: false, message: 'Change order not found' });
      if (co.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft change orders can be sent' });
      await co.update({ status: 'sent' });
      metrics.increment('change_orders.sent');
      res.json({ success: true, data: co });
    } catch (e:any) {
      res.status(500).json({ success: false, message: 'Failed to send change order' });
    }
  }
);

router.post('/:id/approve', authenticateToken as any, requirePolicy(Actions.CHANGE_ORDER_APPROVE) as any, validate({ params: idParamSchema }) as any,
  async (req: ValidatedRequest<IdParamInput>, res: Response) => {
    try {
      const co = await ChangeOrder.findByPk(req.validatedParams!.id);
      if (!co) return res.status(404).json({ success: false, message: 'Change order not found' });
      if (!['sent','draft'].includes(co.status)) return res.status(400).json({ success: false, message: 'Only sent/draft change orders can be approved' });
      await co.update({ status: 'approved', approvedAt: new Date(), approvedByUserId: (req as any).user.id });
      metrics.increment('change_orders.approved');
  try { invalidateTag(cacheTags.analytics); } catch (e) { logger.warn('cache invalidate failed', e as any); }
      res.json({ success: true, data: co });
    } catch (e:any) {
      res.status(500).json({ success: false, message: 'Failed to approve change order' });
    }
  }
);

router.post('/:id/reject', authenticateToken as any, requirePolicy(Actions.CHANGE_ORDER_APPROVE) as any, validate({ params: idParamSchema }) as any,
  async (req: ValidatedRequest<IdParamInput>, res: Response) => {
    try {
      const co = await ChangeOrder.findByPk(req.validatedParams!.id);
      if (!co) return res.status(404).json({ success: false, message: 'Change order not found' });
      if (!['sent','draft'].includes(co.status)) return res.status(400).json({ success: false, message: 'Only sent/draft change orders can be rejected' });
      await co.update({ status: 'rejected', approvedAt: null, approvedByUserId: null });
      metrics.increment('change_orders.rejected');
  try { invalidateTag(cacheTags.analytics); } catch (e) { logger.warn('cache invalidate failed', e as any); }
      res.json({ success: true, data: co });
    } catch (e:any) {
      res.status(500).json({ success: false, message: 'Failed to reject change order' });
    }
  }
);

export default router;
