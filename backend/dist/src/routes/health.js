"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const models_1 = require("../models");
const jobQueue_1 = require("../jobs/jobQueue");
const metrics_1 = require("../monitoring/metrics");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const started = Date.now();
    try {
        await database_1.sequelize.query('SELECT 1');
        const duration = Date.now() - started;
        return res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTime: duration,
            version: process.env.npm_package_version || 'unknown',
            environment: process.env.NODE_ENV || 'unknown',
            checks: { database: 'healthy' }
        });
    }
    catch (error) {
        const duration = Date.now() - started;
        const err = error;
        logger_1.logger.error('[health] FAILED', { message: err.message, name: err.name, durationMs: duration });
        // eslint-disable-next-line no-console
        console.error('[health] database check failed', { message: err.message, name: err.name, durationMs: duration });
        // If explicitly allowed, report degraded health with HTTP 200 to avoid platform restarts during DB outages
        const allowDegraded = (process.env.HEALTH_DEGRADED_OK || '').toLowerCase() === '1' || (process.env.HEALTH_DEGRADED_OK || '').toLowerCase() === 'true';
        if (allowDegraded) {
            return res.status(200).json({
                status: 'degraded',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                responseTime: duration,
                version: process.env.npm_package_version || 'unknown',
                environment: process.env.NODE_ENV || 'unknown',
                error: err.message,
                checks: { database: 'unhealthy' }
            });
        }
        return res.status(503).json(buildErrorEnvelope('HEALTH_CHECK_FAILED', err.message, 503, {
            component: 'database',
            durationMs: duration,
            name: err.name
        }));
    }
});
// Lightweight readiness (no DB) – returns 200 once process is up
router.get('/ready', (_req, res) => {
    res.status(200).json({ status: 'ready', pid: process.pid, uptime: process.uptime() });
});
// Deep health endpoint with additional subsystem insight
router.get('/deep', async (_req, res) => {
    const started = Date.now();
    const payload = {
        ok: true,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || 'unknown',
        env: process.env.NODE_ENV,
    };
    try {
        await database_1.sequelize.query('SELECT 1');
        // Migrations status (best-effort)
        try {
            const { migrationStatus } = await Promise.resolve().then(() => __importStar(require('../scripts/migrationLoader')));
            const ms = await migrationStatus();
            payload.migrations = { pending: ms.pending.length, executed: ms.executed.length };
        }
        catch { /* ignore */ }
        // Queue stats (lightweight - internal shape may evolve)
        payload.queue = {
            handlers: Object.keys(jobQueue_1.jobQueue.handlers || {}).length,
            concurrency: jobQueue_1.jobQueue.concurrency,
        };
        // Export stats (small counts)
        try {
            const running = await models_1.ExportJob.count({ where: { status: 'processing' } });
            const failed = await models_1.ExportJob.count({ where: { status: 'failed' } });
            payload.exports = { running, failed };
        }
        catch { /* ignore */ }
        // Webhook delivery stats
        try {
            const pendingW = await models_1.WebhookDelivery.count({ where: { status: 'pending' } });
            const failedW = await models_1.WebhookDelivery.count({ where: { status: 'failed' } });
            payload.webhooks = { pending: pendingW, failed: failedW };
        }
        catch { /* ignore */ }
    }
    catch (err) {
        payload.ok = false;
        payload.error = err.message;
    }
    finally {
        payload.latencyMs = Date.now() - started;
        metrics_1.metrics.observe('health.deep.latency.ms', payload.latencyMs);
        res.status(payload.ok ? 200 : 500).json(payload);
    }
});
exports.default = router;
// --- Shared error envelope helper (local to health route to avoid circular import) ---
function buildErrorEnvelope(code, message, statusCode, meta) {
    return {
        success: false,
        error: {
            code,
            message,
            ...(meta ? { meta } : {})
        },
        statusCode,
        timestamp: new Date().toISOString()
    };
}
