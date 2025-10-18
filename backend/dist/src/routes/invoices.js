"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const models_1 = require("../models");
const Sequence_1 = require("../models/Sequence");
const metrics_1 = require("../monitoring/metrics");
const logger_1 = require("../utils/logger");
const actions_1 = require("../security/actions");
const database_1 = require("../config/database");
const eventBus_1 = require("../events/eventBus");
const router = (0, express_1.Router)();
// List invoices (with basic AR filters)
router.get('/', authEnhanced_1.authenticateToken, (0, validation_1.validate)({ query: validation_2.invoiceQuerySchema }), async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, projectId } = req.validatedQuery;
    const offset = (page - 1) * limit;
    const where = {};
    if (status)
        where.status = status;
    if (projectId)
        where.projectId = projectId;
    const { count, rows } = await models_1.Invoice.findAndCountAll({ where, limit, offset, order: [[sortBy, (sortOrder || 'desc').toUpperCase()]] });
    res.json({ success: true, data: { invoices: rows, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } } });
});
// Get one
router.get('/:id', authEnhanced_1.authenticateToken, (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    const inv = await models_1.Invoice.findByPk(req.validatedParams.id);
    if (!inv)
        return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: inv });
});
// Create
router.post('/', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.INVOICE_CREATE), (0, validation_1.validate)({ body: validation_2.createInvoiceSchema }), async (req, res) => {
    try {
        const { projectId, date, dueDate, lineItems, taxRate, notes } = req.validatedBody;
        const proj = await models_1.Project.findByPk(projectId);
        if (!proj)
            return res.status(404).json({ success: false, message: 'Project not found' });
        const seq = await (0, Sequence_1.getNextSequence)('invoice_number');
        const number = `INV-${seq.toString().padStart(6, '0')}`;
        const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
        const tax = subtotal * (taxRate ?? 0);
        const total = subtotal + tax;
        const inv = await models_1.Invoice.create({ projectId, number, date: new Date(date), dueDate: new Date(dueDate), lineItems, subtotal, tax, total, status: 'draft', notes });
        metrics_1.metrics.increment('invoice.created');
        try {
            eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('invoice.created', { id: inv.id, number: inv.number, projectId: inv.projectId, total: inv.total }));
        }
        catch (e) { /* ignore event bus error */ }
        res.status(201).json({ success: true, data: inv });
    }
    catch (e) {
        logger_1.logger.error('Invoice create failed', e);
        res.status(500).json({ success: false, message: 'Failed to create invoice' });
    }
});
// Update
router.put('/:id', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.INVOICE_UPDATE), (0, validation_1.validate)({ params: validation_2.idParamSchema, body: validation_2.updateInvoiceSchema }), async (req, res) => {
    const inv = await models_1.Invoice.findByPk(req.validatedParams.id);
    if (!inv)
        return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (inv.status !== 'draft' && (req.validatedBody.lineItems || req.validatedBody.date || req.validatedBody.dueDate)) {
        return res.status(400).json({ success: false, message: 'Only draft invoices can modify core fields' });
    }
    const patch = { ...req.validatedBody };
    if (patch.date)
        patch.date = new Date(patch.date);
    if (patch.dueDate)
        patch.dueDate = new Date(patch.dueDate);
    // Recompute totals if line items or taxRate provided
    if (patch.lineItems || typeof req.validatedBody.taxRate !== 'undefined') {
        const items = patch.lineItems || inv.lineItems;
        const subtotal = items.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
        const taxRate = req.validatedBody.taxRate ?? Number(inv.tax) / Number(inv.subtotal || 1);
        const tax = subtotal * (isFinite(taxRate) ? taxRate : 0);
        const total = subtotal + tax;
        patch.subtotal = subtotal;
        patch.tax = tax;
        patch.total = total;
    }
    await inv.update(patch);
    metrics_1.metrics.increment('invoice.updated');
    try {
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('invoice.updated', { id: inv.id, number: inv.number, projectId: inv.projectId }));
    }
    catch (e) { /* ignore event bus error */ }
    res.json({ success: true, data: inv });
});
// Send (email placeholder via outbox)
router.post('/:id/send', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.INVOICE_SEND), (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    const inv = await models_1.Invoice.findByPk(req.validatedParams.id);
    if (!inv)
        return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (inv.status !== 'draft')
        return res.status(400).json({ success: false, message: 'Only draft invoices can be sent' });
    // Insert into outbox (no mail provider required)
    await database_1.sequelize.query('INSERT INTO email_outbox("to", subject, body, relatedType, relatedId, status) VALUES (?,?,?,?,?,?)', {
        replacements: ['customer@example.com', `Invoice ${inv.number}`, 'See attached invoice (HTML variant).', 'invoice', inv.id, 'pending']
    });
    await inv.update({ status: 'sent', sentAt: new Date() });
    metrics_1.metrics.increment('invoice.sent');
    try {
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('invoice.sent', { id: inv.id, number: inv.number, projectId: inv.projectId }));
    }
    catch { /* ignore event errors */ }
    res.json({ success: true, data: inv });
});
// Mark paid
router.post('/:id/mark-paid', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.INVOICE_MARK_PAID), (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    const inv = await models_1.Invoice.findByPk(req.validatedParams.id);
    if (!inv)
        return res.status(404).json({ success: false, message: 'Invoice not found' });
    await inv.update({ status: 'paid', paidAt: new Date() });
    metrics_1.metrics.increment('invoice.paid');
    try {
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('invoice.paid', { id: inv.id, number: inv.number, projectId: inv.projectId }));
    }
    catch { /* ignore event errors */ }
    res.json({ success: true, data: inv });
});
// Simple HTML invoice (placeholder for PDF)
router.get('/:id/pdf', authEnhanced_1.authenticateToken, (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    const inv = await models_1.Invoice.findByPk(req.validatedParams.id);
    if (!inv)
        return res.status(404).send('Not found');
    const html = `<!doctype html><html><body><h1>Invoice ${inv.number}</h1><p>Project: ${inv.projectId}</p><ul>${inv.lineItems.map((li) => `<li>${li.description}: ${li.quantity} x $${li.unitPrice.toFixed(2)}</li>`).join('')}</ul><p>Total: $${Number(inv.total).toFixed(2)}</p></body></html>`;
    res.set('Content-Type', 'text/html');
    res.send(html);
});
exports.default = router;
// Accounts Receivable simple endpoint (overdue or sent and dueDate < now)
router.get('/ar/list', authEnhanced_1.authenticateToken, async (_req, res) => {
    const now = new Date();
    const [rows] = await database_1.sequelize.query(`
    SELECT * FROM invoices WHERE (status = 'overdue') OR (status = 'sent' AND dueDate < ?)
    ORDER BY dueDate ASC
    LIMIT 500
  `, { replacements: [now] });
    res.json({ success: true, data: rows });
});
