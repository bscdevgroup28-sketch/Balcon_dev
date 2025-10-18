import crypto from 'crypto';
import { CustomerApprovalToken } from '../models/CustomerApprovalToken';
import { logger } from '../utils/logger';

function getSecret(): string {
  const s = process.env.JWT_SECRET || '';
  if (!s || s.length < 16) {
    logger.warn('[approvals] Weak or missing JWT_SECRET; using ephemeral dev secret');
    return 'dev-secret-please-set-JWT_SECRET';
  }
  return s;
}

export function generateTokenString(payload: string): string {
  const secret = getSecret();
  const h = crypto.createHmac('sha256', secret).update(payload + ':' + Date.now()).digest('hex');
  // include short random salt to avoid predictability
  const salt = crypto.randomBytes(6).toString('hex');
  return `${salt}.${h}`;
}

export async function createApprovalToken(params: { projectId: number; quoteId?: number; orderId?: number; createdByUserId: number; ttlDays?: number }) {
  const ttlDays = params.ttlDays ?? 7;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  const base = `${params.projectId}:${params.quoteId || ''}:${params.orderId || ''}`;
  const token = generateTokenString(base);
  const rec = await CustomerApprovalToken.create({
    projectId: params.projectId,
    quoteId: params.quoteId,
    orderId: params.orderId,
    token,
    expiresAt,
    createdByUserId: params.createdByUserId
  });
  return rec;
}

export async function verifyToken(token: string) {
  const rec = await CustomerApprovalToken.findOne({ where: { token } });
  if (!rec) return { ok: false as const, reason: 'not_found' };
  if (rec.consumedAt) return { ok: false as const, reason: 'consumed' };
  if (rec.expiresAt && new Date(rec.expiresAt).getTime() < Date.now()) return { ok: false as const, reason: 'expired' };
  return { ok: true as const, record: rec };
}

export async function consumeToken(token: string, action: { decision: 'approve'|'reject'; note?: string; actorIp?: string; userAgent?: string }) {
  const ver = await verifyToken(token);
  if (!ver.ok) return ver;
  const rec = ver.record!;
  await rec.update({ consumedAt: new Date() });
  // TODO: write to audit table when available; for now just log
  logger.info('[approvals] token consumed', { id: rec.id, decision: action.decision, note: action.note, actorIp: action.actorIp });
  return { ok: true as const, record: rec };
}

export function approvalUrlFor(token: string) {
  const base = process.env.PUBLIC_PORTAL_BASE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/portal/approval/${encodeURIComponent(token)}`;
}
