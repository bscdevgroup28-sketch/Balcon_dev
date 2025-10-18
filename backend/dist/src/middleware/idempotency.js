"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = idempotencyMiddleware;
const crypto_1 = __importDefault(require("crypto"));
const IdempotencyRecord_1 = require("../models/IdempotencyRecord");
const logger_1 = require("../utils/logger");
const ENABLED = (process.env.IDEMPOTENCY_ENABLED || 'true').toLowerCase() !== 'false';
const TTL_MS = parseInt(process.env.IDEMPOTENCY_TTL_MS || '86400000'); // 24h
function shouldApply(req) {
    const m = (req.method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(m))
        return false;
    const p = req.path || '';
    // Apply to high-value endpoints
    return (p.startsWith('/api/orders') ||
        p.startsWith('/api/invoices') ||
        p.startsWith('/api/purchase-orders') ||
        p.startsWith('/api/approvals'));
}
function computeHash(req) {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const basis = [req.method, req.path, body].join('\n');
    return crypto_1.default.createHash('sha256').update(basis).digest('hex');
}
async function idempotencyMiddleware(req, res, next) {
    if (!ENABLED || !shouldApply(req))
        return next();
    const key = (req.headers['idempotency-key'] || req.headers['Idempotency-Key'] || '');
    if (!key || key.length < 16)
        return next();
    const reqHash = computeHash(req);
    try {
        const existing = await IdempotencyRecord_1.IdempotencyRecord.findOne({ where: { key } });
        if (existing) {
            if (existing.requestHash === reqHash) {
                // Replay stored response
                res.status(existing.statusCode).json(existing.response);
                return;
            }
            else {
                return res.status(409).json({ error: 'IdempotencyConflict', message: 'Same Idempotency-Key used with different request body.' });
            }
        }
    }
    catch (e) {
        logger_1.logger.warn('[idempotency] lookup failed', { error: e.message });
    }
    // Capture response to persist after success
    const origJson = res.json.bind(res);
    const origStatus = res.status.bind(res);
    let statusCode = 200;
    let payload;
    res.status = (code) => { statusCode = code; return origStatus(code); };
    res.json = (body) => { payload = body; return origJson(body); };
    res.on('finish', async () => {
        try {
            // Only persist success or standard client errors; skip 5xx
            if (statusCode >= 500)
                return;
            const exp = new Date(Date.now() + TTL_MS);
            const userId = req.user?.id || null;
            await IdempotencyRecord_1.IdempotencyRecord.create({ key, requestHash: reqHash, method: req.method, path: req.path, statusCode, response: payload || {}, userId, expiresAt: exp });
        }
        catch (e) {
            logger_1.logger.warn('[idempotency] persist failed', { error: e.message });
        }
    });
    next();
}
exports.default = idempotencyMiddleware;
