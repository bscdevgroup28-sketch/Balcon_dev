import { Router, Request, Response } from 'express';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';
import { ExportJob, WebhookDelivery } from '../models';
import { jobQueue } from '../jobs/jobQueue';
import { metrics } from '../monitoring/metrics';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const started = Date.now();
  try {
    await sequelize.query('SELECT 1');
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
  } catch (error) {
    const duration = Date.now() - started;
    const err = error as Error & { name?: string };
    logger.error('[health] FAILED', { message: err.message, name: err.name, durationMs: duration });
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
router.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ready', pid: process.pid, uptime: process.uptime() });
});

// Deep health endpoint with additional subsystem insight
router.get('/deep', async (_req: Request, res: Response) => {
  const started = Date.now();
  const payload: any = {
    ok: true,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    env: process.env.NODE_ENV,
  };
  try {
    await sequelize.query('SELECT 1');
    // Migrations status (best-effort)
    try {
      const { migrationStatus } = await import('../scripts/migrationLoader');
      const ms = await migrationStatus();
      payload.migrations = { pending: ms.pending.length, executed: ms.executed.length };
    } catch { /* ignore */ }
    // Queue stats (lightweight - internal shape may evolve)
    payload.queue = {
      handlers: Object.keys((jobQueue as any).handlers || {}).length,
      concurrency: (jobQueue as any).concurrency,
    };
    // Export stats (small counts)
    try {
      const running = await ExportJob.count({ where: { status: 'processing' } });
      const failed = await ExportJob.count({ where: { status: 'failed' } });
      payload.exports = { running, failed };
    } catch { /* ignore */ }
    // Webhook delivery stats
    try {
      const pendingW = await WebhookDelivery.count({ where: { status: 'pending' } });
      const failedW = await WebhookDelivery.count({ where: { status: 'failed' } });
      payload.webhooks = { pending: pendingW, failed: failedW };
    } catch { /* ignore */ }
  } catch (err: any) {
    payload.ok = false;
    payload.error = err.message;
  } finally {
    payload.latencyMs = Date.now() - started;
    metrics.observe('health.deep.latency.ms', payload.latencyMs);
    res.status(payload.ok ? 200 : 500).json(payload);
  }
});

export default router;

// --- Shared error envelope helper (local to health route to avoid circular import) ---
function buildErrorEnvelope(code: string, message: string, statusCode: number, meta?: Record<string, any>) {
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
