"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.requestLoggingMiddleware = requestLoggingMiddleware;
exports.logErrorWithRequest = logErrorWithRequest;
const winston_1 = __importDefault(require("winston"));
const environment_1 = require("../config/environment");
const crypto_1 = __importDefault(require("crypto"));
// Fields to redact from logged objects / messages
const SENSITIVE_KEYS = ['password', 'passwordHash', 'newPassword', 'currentPassword', 'token', 'accessToken', 'refreshToken', 'authorization', 'auth', 'secret'];
// Recursively clone & redact sensitive fields
function redact(value, depth = 0) {
    if (depth > 4)
        return '[DepthLimit]';
    if (Array.isArray(value))
        return value.map(v => redact(v, depth + 1));
    if (value && typeof value === 'object') {
        const out = {};
        for (const k of Object.keys(value)) {
            if (SENSITIVE_KEYS.some(sk => sk.toLowerCase() === k.toLowerCase())) {
                out[k] = '[REDACTED]';
            }
            else {
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
const redactFormat = winston_1.default.format((info) => {
    if (info.meta && typeof info.meta === 'object') {
        info.meta = redact(info.meta);
    }
    // Support pattern where requestId may have been attached directly
    if (info.requestId) {
        info.requestId = String(info.requestId);
    }
    return info;
});
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), redactFormat(), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: environment_1.config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'balcon-builders-api' },
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(info => {
                const { level, message, requestId } = info;
                const idPart = requestId ? `[req:${requestId}] ` : '';
                return `${level}: ${idPart}${message}`;
            }))
        })
    ],
});
// Add Google Cloud Logging in production
if (environment_1.config.server.nodeEnv === 'production') {
    exports.logger.level = 'info';
}
// Middleware helper: attach requestId & structured logging helper
function requestLoggingMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || crypto_1.default.randomUUID();
    req.requestId = requestId;
    const start = process.hrtime.bigint();
    exports.logger.info(`➡️  ${req.method} ${req.originalUrl}`, { requestId });
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1000000;
        const meta = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            ip: req.ip,
            userId: req.user?.id,
        };
        exports.logger.info(`✅ ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`, { requestId, meta });
    });
    next();
}
function logErrorWithRequest(error, req) {
    if (req && req.requestId) {
        exports.logger.error(error, { requestId: req.requestId });
    }
    else {
        exports.logger.error(error);
    }
}
