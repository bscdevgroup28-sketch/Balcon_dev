import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { IdempotencyRecord } from '../models/IdempotencyRecord';
import { logger } from '../utils/logger';

const ENABLED = (process.env.IDEMPOTENCY_ENABLED || 'true').toLowerCase() !== 'false';
const TTL_MS = parseInt(process.env.IDEMPOTENCY_TTL_MS || '86400000'); // 24h

function shouldApply(req: Request): boolean {
  const m = (req.method || 'GET').toUpperCase();
  if (!['POST','PUT','PATCH','DELETE'].includes(m)) return false;
  const p = req.path || '';
  // Apply to high-value endpoints
  return (
    p.startsWith('/api/orders') ||
    p.startsWith('/api/invoices') ||
    p.startsWith('/api/purchase-orders') ||
    p.startsWith('/api/approvals')
  );
}

function computeHash(req: Request): string {
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const basis = [req.method, req.path, body].join('\n');
  return crypto.createHash('sha256').update(basis).digest('hex');
}

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!ENABLED || !shouldApply(req)) return next();
  const key = (req.headers['idempotency-key'] || req.headers['Idempotency-Key'] || '') as string;
  if (!key || key.length < 16) return next();
  const reqHash = computeHash(req);
  try {
    const existing = await IdempotencyRecord.findOne({ where: { key } });
    if (existing) {
      if (existing.requestHash === reqHash) {
        // Replay stored response
        res.status(existing.statusCode).json(existing.response);
        return;
      } else {
        return res.status(409).json({ error: 'IdempotencyConflict', message: 'Same Idempotency-Key used with different request body.' });
      }
    }
  } catch (e:any) {
    logger.warn('[idempotency] lookup failed', { error: e.message });
  }

  // Capture response to persist after success
  const origJson = res.json.bind(res);
  const origStatus = res.status.bind(res);
  let statusCode = 200; let payload: any;
  (res as any).status = (code: number) => { statusCode = code; return origStatus(code); };
  (res as any).json = (body: any) => { payload = body; return origJson(body); };

  res.on('finish', async () => {
    try {
      // Only persist success or standard client errors; skip 5xx
      if (statusCode >= 500) return;
      const exp = new Date(Date.now() + TTL_MS);
      const userId = (req as any).user?.id || null;
      await IdempotencyRecord.create({ key, requestHash: reqHash, method: req.method, path: req.path, statusCode, response: payload || {}, userId, expiresAt: exp });
    } catch (e:any) {
      logger.warn('[idempotency] persist failed', { error: e.message });
    }
  });

  next();
}

export default idempotencyMiddleware;
