import { Router, Response, Request } from 'express';
import { authenticateToken, requirePolicy } from '../middleware/authEnhanced';
import { validate, ValidatedRequest } from '../middleware/validation';
import { CreateInvoiceInput, UpdateInvoiceInput, InvoiceQueryInput, createInvoiceSchema, updateInvoiceSchema, invoiceQuerySchema, idParamSchema, IdParamInput } from '../utils/validation';
import { Invoice, Project } from '../models';
import { getNextSequence } from '../models/Sequence';
import { metrics } from '../monitoring/metrics';
import { logger } from '../utils/logger';
import { Actions } from '../security/actions';
import { sequelize } from '../config/database';
import { eventBus, createEvent } from '../events/eventBus';

const router = Router();

// List invoices (with basic AR filters)
router.get('/', authenticateToken as any, validate({ query: invoiceQuerySchema }) as any, async (req: ValidatedRequest<any, InvoiceQueryInput>, res: Response) => {
  const { page=1, limit=10, sortBy='createdAt', sortOrder='desc', status, projectId } = req.validatedQuery!;
  const offset = (page - 1) * limit;
  const where:any = {};
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  const { count, rows } = await Invoice.findAndCountAll({ where, limit, offset, order: [[sortBy, (sortOrder||'desc').toUpperCase() as any]] });
  res.json({ success: true, data: { invoices: rows, pagination: { page, limit, total: count, pages: Math.ceil(count/limit) } } });
});

// Get one
router.get('/:id', authenticateToken as any, validate({ params: idParamSchema }) as any, async (req: ValidatedRequest<IdParamInput>, res: Response) => {
  const inv = await Invoice.findByPk(req.validatedParams!.id);
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.json({ success: true, data: inv });
});

// Create
router.post('/', authenticateToken as any, requirePolicy(Actions.INVOICE_CREATE) as any, validate({ body: createInvoiceSchema }) as any, async (req: ValidatedRequest<CreateInvoiceInput>, res: Response) => {
  try {
    const { projectId, date, dueDate, lineItems, taxRate, notes } = req.validatedBody!;
    const proj = await Project.findByPk(projectId);
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
    const seq = await getNextSequence('invoice_number');
    const number = `INV-${seq.toString().padStart(6,'0')}`;
    const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
    const tax = subtotal * (taxRate ?? 0);
    const total = subtotal + tax;
  const inv = await Invoice.create({ projectId, number, date: new Date(date), dueDate: new Date(dueDate), lineItems, subtotal, tax, total, status: 'draft', notes });
    metrics.increment('invoice.created');
  try { eventBus.emitEvent(createEvent('invoice.created', { id: inv.id, number: inv.number, projectId: inv.projectId, total: inv.total })); } catch (e) { /* ignore event bus error */ }
    res.status(201).json({ success: true, data: inv });
  } catch (e:any) {
    logger.error('Invoice create failed', e);
    res.status(500).json({ success: false, message: 'Failed to create invoice' });
  }
});

// Update
router.put('/:id', authenticateToken as any, requirePolicy(Actions.INVOICE_UPDATE) as any, validate({ params: idParamSchema, body: updateInvoiceSchema }) as any, async (req: ValidatedRequest<UpdateInvoiceInput, any, IdParamInput>, res: Response) => {
  const inv = await Invoice.findByPk(req.validatedParams!.id);
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  if (inv.status !== 'draft' && (req.validatedBody!.lineItems || req.validatedBody!.date || req.validatedBody!.dueDate)) {
    return res.status(400).json({ success: false, message: 'Only draft invoices can modify core fields' });
  }
  const patch: any = { ...req.validatedBody };
  if (patch.date) patch.date = new Date(patch.date as any);
  if (patch.dueDate) patch.dueDate = new Date(patch.dueDate as any);
  // Recompute totals if line items or taxRate provided
  if (patch.lineItems || typeof (req.validatedBody as any).taxRate !== 'undefined') {
    const items = patch.lineItems || inv.lineItems;
    const subtotal = items.reduce((s:number, li:any) => s + li.quantity * li.unitPrice, 0);
    const taxRate = (req.validatedBody as any).taxRate ?? Number(inv.tax) / Number(inv.subtotal || 1);
    const tax = subtotal * (isFinite(taxRate) ? taxRate : 0);
    const total = subtotal + tax;
    patch.subtotal = subtotal;
    patch.tax = tax;
    patch.total = total;
  }
  await inv.update(patch);
  metrics.increment('invoice.updated');
  try { eventBus.emitEvent(createEvent('invoice.updated', { id: inv.id, number: inv.number, projectId: inv.projectId })); } catch (e) { /* ignore event bus error */ }
  res.json({ success: true, data: inv });
});

// Send (email placeholder via outbox)
router.post('/:id/send', authenticateToken as any, requirePolicy(Actions.INVOICE_SEND) as any, validate({ params: idParamSchema }) as any, async (req: ValidatedRequest<IdParamInput>, res: Response) => {
  const inv = await Invoice.findByPk(req.validatedParams!.id);
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  if (inv.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft invoices can be sent' });
  // Insert into outbox (no mail provider required); tolerate missing table in test schema
  try {
    await sequelize.query('INSERT INTO email_outbox("to", subject, body, relatedType, relatedId, status) VALUES (?,?,?,?,?,?)', {
      replacements: ['customer@example.com', `Invoice ${inv.number}`, 'See attached invoice (HTML variant).', 'invoice', inv.id, 'pending']
    });
  } catch { /* ignore if table not present */ }
  await inv.update({ status: 'sent', sentAt: new Date() });
  metrics.increment('invoice.sent');
  try {
    eventBus.emitEvent(createEvent('invoice.sent', { id: inv.id, number: inv.number, projectId: inv.projectId }));
  } catch { /* ignore event errors */ }
  res.json({ success: true, data: inv });
});

// Mark paid
router.post('/:id/mark-paid', authenticateToken as any, requirePolicy(Actions.INVOICE_MARK_PAID) as any, validate({ params: idParamSchema }) as any, async (req: ValidatedRequest<IdParamInput>, res: Response) => {
  const inv = await Invoice.findByPk(req.validatedParams!.id);
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  await inv.update({ status: 'paid', paidAt: new Date() });
  metrics.increment('invoice.paid');
  try {
    eventBus.emitEvent(createEvent('invoice.paid', { id: inv.id, number: inv.number, projectId: inv.projectId }));
  } catch { /* ignore event errors */ }
  res.json({ success: true, data: inv });
});

// Simple HTML invoice (placeholder for PDF)
router.get('/:id/pdf', authenticateToken as any, validate({ params: idParamSchema }) as any, async (req: ValidatedRequest<IdParamInput>, res: Response) => {
  const inv = await Invoice.findByPk(req.validatedParams!.id);
  if (!inv) return res.status(404).send('Not found');
  const html = `<!doctype html><html><body><h1>Invoice ${inv.number}</h1><p>Project: ${inv.projectId}</p><ul>${inv.lineItems.map((li:any)=>`<li>${li.description}: ${li.quantity} x $${li.unitPrice.toFixed(2)}</li>`).join('')}</ul><p>Total: $${Number(inv.total).toFixed(2)}</p></body></html>`;
  res.set('Content-Type', 'text/html');
  res.send(html);
});

export default router;

// Accounts Receivable simple endpoint (overdue or sent and dueDate < now)
router.get('/ar/list', authenticateToken as any, async (_req: Request, res: Response) => {
  const now = new Date();
  const [rows] = await sequelize.query(`
    SELECT * FROM invoices WHERE (status = 'overdue') OR (status = 'sent' AND dueDate < ?)
    ORDER BY dueDate ASC
    LIMIT 500
  `, { replacements: [now] });
  res.json({ success: true, data: rows });
});
