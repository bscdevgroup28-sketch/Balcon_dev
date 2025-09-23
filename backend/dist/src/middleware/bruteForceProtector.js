"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bruteForceProtector = bruteForceProtector;
exports.bruteForceSnapshot = bruteForceSnapshot;
// Using require to avoid needing type declarations if @types not installed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LRUCache = require('lru-cache');
const logger_1 = require("../utils/logger");
const securityAudit_1 = require("../utils/securityAudit");
// Configurable thresholds
const MAX_ATTEMPTS_WINDOW = parseInt(process.env.AUTH_MAX_ATTEMPTS_WINDOW || '5');
const WINDOW_MS = parseInt(process.env.AUTH_ATTEMPT_WINDOW_MS || `${15 * 60 * 1000}`); // 15 min
const BASE_LOCK_MS = parseInt(process.env.AUTH_BASE_LOCK_MS || '300000'); // 5 min
const MAX_LOCK_MS = parseInt(process.env.AUTH_MAX_LOCK_MS || `${60 * 60 * 1000}`); // 1 hour
// LRU to avoid unbounded memory (keyed by ip+identifier)
const attempts = new LRUCache({
    max: 5000,
    ttl: WINDOW_MS * 4, // keep some historical context
});
function keyFor(ip, identifier) {
    return `${ip}:${identifier || 'anon'}`;
}
function bruteForceProtector(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const identifier = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : undefined;
    const cacheKey = keyFor(ip, identifier);
    const now = Date.now();
    let info = attempts.get(cacheKey);
    if (info && info.lockUntil && info.lockUntil > now) {
        const retryMs = info.lockUntil - now;
        res.setHeader('Retry-After', Math.ceil(retryMs / 1000));
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'auth.login.locked',
            outcome: 'locked',
            meta: {
                identifier,
                remainingMs: retryMs,
                count: info.count
            }
        });
        return res.status(429).json({
            success: false,
            message: 'Too many failed attempts. Try again later.',
            retryAfterSeconds: Math.ceil(retryMs / 1000)
        });
    }
    // Attach helper to request so auth route can record failures
    req.recordAuthFailure = () => {
        info = attempts.get(cacheKey) || {
            count: 0,
            firstAttempt: now,
            lastAttempt: now,
        };
        info.count += 1;
        info.lastAttempt = now;
        // Reset window if outside
        if (now - info.firstAttempt > WINDOW_MS) {
            info.firstAttempt = now;
            info.count = 1;
        }
        if (info.count >= MAX_ATTEMPTS_WINDOW) {
            // Exponential backoff: attempts over window => lock doubling each overflow tier
            const overflow = info.count - MAX_ATTEMPTS_WINDOW + 1;
            const lockMs = Math.min(BASE_LOCK_MS * Math.pow(2, overflow - 1), MAX_LOCK_MS);
            info.lockUntil = now + lockMs;
            logger_1.logger.warn('[auth/bruteforce] Locking credentials', { ip, identifier, count: info.count, lockMs });
            (0, securityAudit_1.logSecurityEvent)(req, {
                action: 'auth.login.bruteforce.lock',
                outcome: 'locked',
                meta: { identifier, count: info.count, lockMs }
            });
        }
        attempts.set(cacheKey, info);
    };
    req.clearAuthFailures = () => {
        attempts.delete(cacheKey);
    };
    next();
}
// Utility to expose current brute force state (for metrics if needed)
function bruteForceSnapshot() {
    const data = [];
    attempts.forEach((value, key) => {
        data.push({ key, ...value });
    });
    return data;
}
