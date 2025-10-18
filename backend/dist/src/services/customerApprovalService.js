"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenString = generateTokenString;
exports.createApprovalToken = createApprovalToken;
exports.verifyToken = verifyToken;
exports.consumeToken = consumeToken;
exports.approvalUrlFor = approvalUrlFor;
const crypto_1 = __importDefault(require("crypto"));
const CustomerApprovalToken_1 = require("../models/CustomerApprovalToken");
const logger_1 = require("../utils/logger");
function getSecret() {
    const s = process.env.JWT_SECRET || '';
    if (!s || s.length < 16) {
        logger_1.logger.warn('[approvals] Weak or missing JWT_SECRET; using ephemeral dev secret');
        return 'dev-secret-please-set-JWT_SECRET';
    }
    return s;
}
function generateTokenString(payload) {
    const secret = getSecret();
    const h = crypto_1.default.createHmac('sha256', secret).update(payload + ':' + Date.now()).digest('hex');
    // include short random salt to avoid predictability
    const salt = crypto_1.default.randomBytes(6).toString('hex');
    return `${salt}.${h}`;
}
async function createApprovalToken(params) {
    const ttlDays = params.ttlDays ?? 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    const base = `${params.projectId}:${params.quoteId || ''}:${params.orderId || ''}`;
    const token = generateTokenString(base);
    const rec = await CustomerApprovalToken_1.CustomerApprovalToken.create({
        projectId: params.projectId,
        quoteId: params.quoteId,
        orderId: params.orderId,
        token,
        expiresAt,
        createdByUserId: params.createdByUserId
    });
    return rec;
}
async function verifyToken(token) {
    const rec = await CustomerApprovalToken_1.CustomerApprovalToken.findOne({ where: { token } });
    if (!rec)
        return { ok: false, reason: 'not_found' };
    if (rec.consumedAt)
        return { ok: false, reason: 'consumed' };
    if (rec.expiresAt && new Date(rec.expiresAt).getTime() < Date.now())
        return { ok: false, reason: 'expired' };
    return { ok: true, record: rec };
}
async function consumeToken(token, action) {
    const ver = await verifyToken(token);
    if (!ver.ok)
        return ver;
    const rec = ver.record;
    await rec.update({ consumedAt: new Date() });
    // TODO: write to audit table when available; for now just log
    logger_1.logger.info('[approvals] token consumed', { id: rec.id, decision: action.decision, note: action.note, actorIp: action.actorIp });
    return { ok: true, record: rec };
}
function approvalUrlFor(token) {
    const base = process.env.PUBLIC_PORTAL_BASE_URL || 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/portal/approval/${encodeURIComponent(token)}`;
}
