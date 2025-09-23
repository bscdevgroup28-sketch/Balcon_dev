import winston from 'winston';
import { config } from '../config/environment';
import crypto from 'crypto';

// Fields to redact from logged objects / messages
const SENSITIVE_KEYS = ['password', 'passwordHash', 'newPassword', 'currentPassword', 'token', 'accessToken', 'refreshToken', 'authorization', 'auth', 'secret'];

// Recursively clone & redact sensitive fields
function redact(value: any, depth = 0): any {
  if (depth > 4) return '[DepthLimit]';
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) {
      if (SENSITIVE_KEYS.some(sk => sk.toLowerCase() === k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(value[k], depth + 1);
      }
    }
    return out;
  }
  if (typeof value === 'string') {
    // Simple heuristic: mask long strings that look like tokens
    if (value.length > 40 && /[A-Za-z0-9_-]{20,}/.test(value)) {
      return value.slice(0, 6) + '…[REDACTED]';
    }
  }
  return value;
}

// Custom format to inject requestId and redact metadata
const redactFormat = winston.format((info) => {
  if (info.meta && typeof info.meta === 'object') {
    info.meta = redact(info.meta);
  }
  // Support pattern where requestId may have been attached directly
  if (info.requestId) {
    info.requestId = String(info.requestId);
  }
  return info;
});

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  redactFormat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'balcon-builders-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => {
          const { level, message, requestId } = info;
            const idPart = requestId ? `[req:${requestId}] ` : '';
          return `${level}: ${idPart}${message}`;
        })
      )
    })
  ],
});

// Add Google Cloud Logging in production
if (config.server.nodeEnv === 'production') {
  logger.level = 'info';
}

// Middleware helper: attach requestId & structured logging helper
export function requestLoggingMiddleware(req: any, res: any, next: any) {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = requestId;

  const start = process.hrtime.bigint();
  logger.info(`➡️  ${req.method} ${req.originalUrl}`, { requestId });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userId: req.user?.id,
    };
    logger.info(`✅ ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`, { requestId, meta });
  });

  next();
}

export function logErrorWithRequest(error: any, req?: any) {
  if (req && req.requestId) {
    logger.error(error, { requestId: req.requestId });
  } else {
    logger.error(error);
  }
}
