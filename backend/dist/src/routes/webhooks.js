"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const authEnhanced_1 = require("../middleware/authEnhanced");
const webhooks_1 = require("../services/webhooks");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
// List subscriptions (optionally filter by eventType)
router.get('/', authEnhanced_1.authenticateToken, async (req, res) => {
    const where = {};
    if (req.query.eventType)
        where.eventType = req.query.eventType;
    const subs = await models_1.WebhookSubscription.findAll({ where, order: [['id', 'ASC']] });
    res.json(subs.map(s => ({ id: s.id, eventType: s.eventType, targetUrl: s.targetUrl, isActive: s.isActive, failureCount: s.failureCount, lastSuccessAt: s.lastSuccessAt, lastFailureAt: s.lastFailureAt })));
});
// Create subscription (secret auto-generated if omitted)
router.post('/', authEnhanced_1.authenticateToken, async (req, res) => {
    const { eventType, targetUrl, secret } = req.body || {};
    if (!eventType || !targetUrl)
        return res.status(400).json({ error: 'BadRequest', message: 'eventType and targetUrl required' });
    const sec = secret || crypto_1.default.randomBytes(16).toString('hex');
    const sub = await models_1.WebhookSubscription.create({ eventType, targetUrl, secret: sec });
    res.status(201).json({ id: sub.id, eventType: sub.eventType, targetUrl: sub.targetUrl, secret: sub.secret, isActive: sub.isActive });
});
// Get subscription
router.get('/:id', authEnhanced_1.authenticateToken, async (req, res) => {
    const sub = await models_1.WebhookSubscription.findByPk(req.params.id);
    if (!sub)
        return res.status(404).json({ error: 'NotFound', message: 'Subscription not found' });
    res.json({ id: sub.id, eventType: sub.eventType, targetUrl: sub.targetUrl, isActive: sub.isActive, failureCount: sub.failureCount, lastSuccessAt: sub.lastSuccessAt, lastFailureAt: sub.lastFailureAt });
});
// Rotate secret
router.post('/:id/rotate-secret', authEnhanced_1.authenticateToken, async (req, res) => {
    const sub = await models_1.WebhookSubscription.findByPk(req.params.id);
    if (!sub)
        return res.status(404).json({ error: 'NotFound', message: 'Subscription not found' });
    const newSecret = crypto_1.default.randomBytes(16).toString('hex');
    await sub.update({ secret: newSecret });
    res.json({ id: sub.id, secret: newSecret });
});
// Enable / Disable
router.patch('/:id', authEnhanced_1.authenticateToken, async (req, res) => {
    const sub = await models_1.WebhookSubscription.findByPk(req.params.id);
    if (!sub)
        return res.status(404).json({ error: 'NotFound', message: 'Subscription not found' });
    const { isActive, targetUrl } = req.body || {};
    const update = {};
    if (typeof isActive === 'boolean')
        update.isActive = isActive;
    if (targetUrl)
        update.targetUrl = targetUrl;
    if (!Object.keys(update).length)
        return res.status(400).json({ error: 'BadRequest', message: 'No valid fields provided' });
    await sub.update(update);
    res.json({ id: sub.id, eventType: sub.eventType, targetUrl: sub.targetUrl, isActive: sub.isActive });
});
// Delete
router.delete('/:id', authEnhanced_1.authenticateToken, async (req, res) => {
    const sub = await models_1.WebhookSubscription.findByPk(req.params.id);
    if (!sub)
        return res.status(404).json({ error: 'NotFound', message: 'Subscription not found' });
    await sub.destroy();
    res.status(204).end();
});
// List deliveries (filter by subscriptionId, status, eventType)
router.get('/deliveries', authEnhanced_1.authenticateToken, async (req, res) => {
    const where = {};
    if (req.query.subscriptionId)
        where.subscriptionId = req.query.subscriptionId;
    if (req.query.status)
        where.status = req.query.status;
    if (req.query.eventType)
        where.eventType = req.query.eventType;
    const deliveries = await models_1.WebhookDelivery.findAll({ where, order: [['id', 'DESC']], limit: 100 });
    res.json(deliveries);
});
// Retry a failed delivery
router.post('/deliveries/:id/retry', authEnhanced_1.authenticateToken, async (req, res) => {
    const success = await (0, webhooks_1.retryDelivery)(parseInt(req.params.id));
    if (!success)
        return res.status(400).json({ error: 'BadRequest', message: 'Cannot retry delivery' });
    res.json({ message: 'Retry enqueued' });
});
exports.default = router;
