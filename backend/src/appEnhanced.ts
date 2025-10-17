import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
// Removed morgan in favor of custom requestLoggingMiddleware
import dotenv from 'dotenv';
import path from 'path';
import { rateLimit } from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import utilities and middleware
import { logger, requestLoggingMiddleware } from './utils/logger';
import { requestContextMiddleware } from './utils/requestContext';
import { metricsMiddleware, initSentry } from './monitoring/metrics';
import { advancedHttpMetricsMiddleware } from './monitoring/advancedMetrics';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import services
import { initializeWebSocket } from './services/webSocketService';
import { setupEnhancedDatabase } from './scripts/setupEnhancedDatabase';
import { config } from './config/environment';
import { validateRuntime } from './config/environment';
import { globalRateLimit } from './middleware/globalRateLimit';
// removed unused sequelize import

// Import routes
import healthRoutes from './routes/health';
import readinessRoutes from './routes/readiness';
import authRoutes from './routes/authEnhanced';
import projectRoutes from './routes/projects';
import quoteRoutes from './routes/quotes';
import fileRoutes from './routes/files';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import materialsRoutes from './routes/materials';
import testRoutes from './routes/test';
import workOrderRoutes from './routes/workOrders';
import inventoryTransactionRoutes from './routes/inventoryTransactions';
import analyticsRoutes from './routes/analytics';
import exportRoutes from './routes/exports';
import securityRoutes from './routes/security';
import jobsRoutes from './routes/jobs';
import { metrics } from './monitoring/metrics';
import { securityMetricsToPrometheus } from './utils/securityMetrics';
import { advancedRegistry } from './monitoring/advancedMetrics';
import { jobQueue } from './jobs/jobQueue';
import { kpiSnapshotHandler } from './jobs/handlers/kpiSnapshotJob';
import { scheduler } from './jobs/scheduler';
import { withCache, cacheKeys, cacheTags } from './utils/cache';
import { KpiDailySnapshot, ExportJob, Material, Order, Project } from './models';
import { registerWebhookJob, publishEvent } from './services/webhooks';
import { getStorage } from './services/storage';
import fs from 'fs';
import os from 'os';
// path & metrics already imported above

// Enhanced Express Application with WebSocket support
export class BalConBuildersApp {
  public app: Application;
  public server: any;
  public port: number;
  private started = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '8080');
    
  this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  this.initializeJobs();
    // Startup diagnostics
    const maskedDb = (config.database.url || '').replace(/:[^:@/]+@/, ':****@');
    logger.info(`[startup] NODE_ENV=${config.server.nodeEnv} PORT=${this.port}`);
    logger.info(`[startup] Database URL (masked): ${maskedDb}`);
  const dbUrl = config.database.url || 'sqlite:./enhanced_database.sqlite';
  logger.info(`[startup] Using dialect: ${dbUrl.startsWith('sqlite') ? 'sqlite' : 'postgres'}`);
  }

  private initializeJobs(): void {
    try {
      jobQueue.recoverPersisted?.();
      jobQueue.register('kpi.snapshot', kpiSnapshotHandler);
      // Export job processor: generate CSV (in-memory for now) and store data URL placeholder
  jobQueue.register('export.generate', async (job) => {
        const start = Date.now();
        const { exportJobId } = job.payload as any;
        const ej = await ExportJob.findByPk(exportJobId);
        if (!ej) return;
  await ej.update({ status: 'processing', attempts: ej.attempts + 1, startedAt: new Date() });
        try {
          let rows: any[] = [];
          if (ej.type === 'materials_csv') {
            rows = await Material.findAll({ limit: 5000 });
          } else if (ej.type === 'orders_csv') {
            rows = await Order.findAll({ limit: 5000 });
          } else if (ej.type === 'projects_csv') {
            rows = await Project.findAll({ limit: 5000 });
          }
          const plain = rows.map(r => r.get({ plain: true }));
          const fields = Object.keys(plain[0] || { id: 1 });
          const tmp = path.join(os.tmpdir(), `export-${ej.id}.csv`);
          const stream = fs.createWriteStream(tmp, { encoding: 'utf8' });
          stream.write(fields.join(',') + '\n');
          for (const p of plain) stream.write(fields.map(f => JSON.stringify(p[f] ?? '')).join(',') + '\n');
          await new Promise(resolve => stream.end(resolve));
          const storage = getStorage();
          const key = `${ej.type}/${ej.id}-${Date.now()}.csv`;
          await storage.putObject(key, tmp, 'text/csv');
          const downloadUrl = await storage.getDownloadUrl(key);
          await ej.update({ status: 'completed', resultUrl: downloadUrl, fileKey: key, completedAt: new Date() });
          publishEvent('export.completed', { id: ej.id, type: ej.type, fileKey: key, url: downloadUrl });
          metrics.increment('exports.completed');
          metrics.observe('export.duration.ms', Date.now() - start);
        } catch (err: any) {
          metrics.increment('exports.failed');
          await ej.update({ status: 'failed', errorMessage: err.message, completedAt: new Date() });
          publishEvent('export.failed', { id: ej.id, type: ej.type, error: err.message });
          metrics.observe('export.duration.ms', Date.now() - start);
          throw err;
        }
  });
  registerWebhookJob();
      // Optionally enqueue daily job on startup if flag set
      if (process.env.ENQUEUE_KPI_ON_START === 'true') {
        jobQueue.enqueue('kpi.snapshot', {});
      }
      // Schedule KPI snapshot recurring if interval env provided
      const snapInterval = process.env.KPI_SNAPSHOT_INTERVAL_MS && parseInt(process.env.KPI_SNAPSHOT_INTERVAL_MS);
      if (snapInterval && snapInterval > 0) {
        scheduler.schedule('kpi.snapshot', snapInterval);
      }
      // Cache warming for analytics summary (Phase 7 prep) if enabled
      const warmInterval = process.env.ANALYTICS_SUMMARY_WARM_INTERVAL_MS && parseInt(process.env.ANALYTICS_SUMMARY_WARM_INTERVAL_MS);
      if (warmInterval && warmInterval > 0) {
        scheduler.schedule('analytics.summary.warm', warmInterval);
        jobQueue.register('analytics.summary.warm', async () => {
          try {
            const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_SUMMARY_MS || '60000');
            await withCache(cacheKeys.analyticsSummary, ttlMs, async () => {
              // Lightweight aggregate (placeholder) to ensure model touch; actual logic lives in route
              const latest = await KpiDailySnapshot.findOne({ order: [['date', 'DESC']] });
              return { warmedAt: new Date().toISOString(), latestDate: latest?.get('date') };
            }, [cacheTags.analytics]);
          } catch { /* ignore warming errors */ }
        });
      }
      logger.info('✅ Job queue initialized');
      // Token count cache refresher (avoid counting every metrics scrape)
      try {
        const interval = parseInt(process.env.TOKENS_METRICS_REFRESH_INTERVAL_MS || '60000');
        if (interval > 0) {
          const h = setInterval(async () => {
            try {
              const { RefreshToken } = await import('./models/RefreshToken');
              const total = await (RefreshToken as any).count();
              const active = await (RefreshToken as any).count({ where: { revokedAt: null } });
              (RefreshToken as any)._cacheTotal = total;
              (RefreshToken as any)._cacheActive = active;
            } catch (e:any) {
              logger.warn('[tokens] metrics refresh failed', { error: e.message });
            }
          }, interval);
          h.unref();
          this.intervals.push(h);
          logger.info(`[tokens] Metrics refresh interval active (${interval}ms)`);
        }
      } catch (e) { logger.warn('[tokens] metrics cache init failed', e); }
      // Schedule refresh token cleanup (soft retention enforcement) outside jobQueue for simplicity
      try {
        const interval = config.tokens.refreshCleanupIntervalMs;
        if (interval > 0) {
          const h = setInterval(async () => {
            try {
              const cutoff = new Date(Date.now() - config.tokens.refreshRetentionDays * 24 * 60 * 60 * 1000);
              const { sequelize } = await import('./config/database');
              const [beforeTotal] = await sequelize.query('SELECT COUNT(*)::int as c FROM refresh_tokens');
              const [beforeActive] = await sequelize.query("SELECT COUNT(*)::int as c FROM refresh_tokens WHERE revoked_at IS NULL");
              const beforeTotalCount = (beforeTotal as any)[0]?.c || 0;
              const beforeActiveCount = (beforeActive as any)[0]?.c || 0;
              const [result] = await sequelize.query('DELETE FROM refresh_tokens WHERE (revoked_at IS NOT NULL OR expires_at < ?) AND created_at < ?', { replacements: [new Date(), cutoff] });
              // SQLite vs Postgres differences; try to derive rows deleted
              let deleted = 0;
              try {
                const rAny: any = result;
                if (Array.isArray(rAny) && rAny[1] && typeof (rAny[1] as any).rowCount === 'number') deleted = (rAny[1] as any).rowCount;
                else if (rAny && typeof rAny.rowCount === 'number') deleted = rAny.rowCount;
              } catch { /* ignore */ }
              const [afterTotal] = await sequelize.query('SELECT COUNT(*)::int as c FROM refresh_tokens');
              const [afterActive] = await sequelize.query("SELECT COUNT(*)::int as c FROM refresh_tokens WHERE revoked_at IS NULL");
              const afterTotalCount = (afterTotal as any)[0]?.c || 0;
              const afterActiveCount = (afterActive as any)[0]?.c || 0;
              const removed = beforeTotalCount - afterTotalCount;
              const activeDelta = afterActiveCount - beforeActiveCount; // usually 0
              (global as any).__tokenCleanup = {
                lastRun: Date.now(),
                removed,
                deletedReported: deleted,
                activeDelta,
              };
              const { metrics } = await import('./monitoring/metrics');
              metrics.increment('tokens.cleanup.runs');
              if (removed > 0) metrics.increment('tokens.cleanup.removed', removed);
              logger.info('[tokens] cleanup executed', { cutoff: cutoff.toISOString(), removed, activeDelta });
            } catch (e:any) {
              logger.warn('[tokens] cleanup failed', { error: e.message });
            }
          }, interval);
          h.unref();
          this.intervals.push(h);
          logger.info(`[tokens] Cleanup scheduler active every ${interval}ms (retention=${config.tokens.refreshRetentionDays}d)`);
        }
      } catch (e) { logger.warn('[tokens] cleanup scheduler init failed', e); }
    } catch (e) {
      logger.warn('Job queue init failed', e);
    }
  }

  // Initialize middleware
  private initializeMiddleware(): void {
    // Security middleware
    const cspDirectives: any = {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    };
    if (process.env.CSP_EXTRA_CONNECT) {
      cspDirectives.connectSrc.push(...process.env.CSP_EXTRA_CONNECT.split(',').map(s=>s.trim()).filter(Boolean));
    }
    this.app.use(helmet({
      contentSecurityPolicy: { directives: cspDirectives },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginEmbedderPolicy: false,
    }));
    // Optional HSTS (only if behind HTTPS proxy)
    if (config.server.nodeEnv === 'production') {
      this.app.use((req, res, next) => {
        res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
        next();
      });
    }
    // Optional HTTPS redirect (respect proxy headers)
    if (process.env.ENFORCE_HTTPS === 'true') {
      this.app.use((req, res, next) => {
        const xfProto = (req.headers['x-forwarded-proto'] || '') as string;
        if (xfProto && xfProto !== 'https') {
          return res.redirect(301, 'https://' + req.headers.host + req.originalUrl);
        }
        next();
      });
    }

    // CORS configuration (strict in production)
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow non-browser clients
        const allowed = config.server.frontendOrigins || [];
        if (allowed.includes(origin)) return callback(null, true);
        if (config.server.nodeEnv !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        logger.warn(`[cors] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    if (config.server.nodeEnv === 'test') {
      // Lightweight test rate limiter to avoid hanging Jest due to background interval in express-rate-limit MemoryStore.
      // Implements simple fixed window counting without setInterval; window resets lazily when first seen after expiry.
      const WINDOW_MS = 15 * 60 * 1000;
      interface Counter { count: number; windowStart: number }
      const generalCounts = new Map<string, Counter>();
      const authCounts = new Map<string, Counter>();
      const incr = (map: Map<string, Counter>, key: string) => {
        const now = Date.now();
        let c = map.get(key);
        if (!c || (now - c.windowStart) > WINDOW_MS) { c = { count: 0, windowStart: now }; map.set(key, c); }
        c.count += 1; return c;
      };
      this.app.use((req: any, res: any, next: any) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const c = incr(generalCounts, ip);
        if (c.count > 1000) return res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
        next();
      });
      this.app.use('/api/auth', (req: any, res: any, next: any) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const key = ip + '::auth';
        const c = incr(authCounts, key);
        if (c.count > 5) return res.status(429).json({ error: 'Too many authentication attempts, please try again later.' });
        next();
      });
      // Skip adaptive globalRateLimit (already tested elsewhere) to reduce moving parts in integration tests.
    } else {
      // Rate limiting (general)
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: { error: 'Too many requests from this IP, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use(limiter);

      // Adaptive global rate limiter (per IP+user) using LRU (Phase 4 hardening)
      this.app.use(globalRateLimit);

      // Stricter auth limiter
      const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { error: 'Too many authentication attempts, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use('/api/auth', authLimiter);
    }

  // Metrics middleware early
  this.app.use(metricsMiddleware);

  // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

  // Structured request logging with request IDs
  this.app.use(requestLoggingMiddleware);
  // AsyncLocalStorage request context (must come after requestLoggingMiddleware sets req.requestId)
  this.app.use(requestContextMiddleware);
  // Phase 17: latency attribution (must come after requestContext so requestId is set)
  try {
    const { latencyAttributionMiddleware } = require('./middleware/latencyAttribution');
    this.app.use(latencyAttributionMiddleware);
  } catch (e) {
    logger.warn('[startup] failed to load latencyAttributionMiddleware', { error: (e as any)?.message });
  }
    
  // Advanced timing/size metrics (after logging, before routes)
  this.app.use(advancedHttpMetricsMiddleware);

  // Static file serving
    this.app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
    
    // Trust proxy for accurate IP addresses (important for rate limiting)
    this.app.set('trust proxy', 1);

    logger.info('✅ Middleware initialized');

    // Runtime config self-check
    const runtimeStatus = validateRuntime();
    if (!runtimeStatus.ok) {
      logger.error('[startup] Runtime validation failed', { errors: runtimeStatus.errors });
    } else {
      logger.info('[startup] Runtime configuration validated');
    }
  }

  // Initialize routes
  private initializeRoutes(): void {
    // Phase 17: route handler timing wrapper (captures time spent in routing/handlers excluding earlier middleware)
    this.app.use((req: any, res: any, next: any) => {
      const start = process.hrtime.bigint();
      const DB_TIME_SYMBOL = Symbol.for('latency.db.ms');
      res.once('finish', () => {
        try {
          const routeElapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
          const dbMs = (req as any)[DB_TIME_SYMBOL] || 0;
          const handlerExclusive = Math.max(0, routeElapsedMs - dbMs);
          try {
            const { recordHandlerTime } = require('./middleware/latencyAttribution');
            recordHandlerTime(req, handlerExclusive);
          } catch { /* ignore */ }
        } catch { /* ignore top-level */ }
      });
      next();
    });
    // API routes
    this.app.get('/api/live', (_req: Request, res: Response) => {
      res.json({ status: 'live', time: new Date().toISOString() });
    });
    this.app.get('/api/health/simple', (_req: Request, res: Response) => {
      res.json({ status: 'ok', time: new Date().toISOString() });
    });
  this.app.use('/api/metrics', require('./routes/metrics').default);
  this.app.use('/api/health', healthRoutes);
  this.app.use('/api/ready', readinessRoutes);
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/quotes', quoteRoutes);
    this.app.use('/api/orders', orderRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/materials', materialsRoutes);
    this.app.use('/api/files', fileRoutes);
    if ((process.env.ENABLE_TEST_ROUTES || '').toLowerCase() === 'true') {
      this.app.use('/api/test', testRoutes);
    }
    this.app.use('/api/work-orders', workOrderRoutes);
  this.app.use('/api/inventory/transactions', inventoryTransactionRoutes);
  this.app.use('/api/analytics', analyticsRoutes);
  this.app.use('/api/exports', exportRoutes);
  this.app.use('/api/security', securityRoutes);
    if (process.env.ENABLE_DELAYED_JOBS === 'true') {
      this.app.use('/api/jobs', jobsRoutes);
    }

    // Prometheus exposition
    this.app.get('/api/metrics/prometheus', async (req: Request, res: Response) => {
      res.set('Content-Type', 'text/plain');
      let body = metrics.toPrometheus() + '\n' + securityMetricsToPrometheus();
      try {
        // Append prom-client metrics if advanced metrics are active
        const advanced = await advancedRegistry.metrics();
        body += '\n' + advanced;
      } catch { /* ignore */ }
      res.send(body);
    });

    // API status endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Bal-Con Builders API v2.0 - Enhanced Edition',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        features: [
          'Enhanced Authentication',
          'Real-time WebSocket Support',
          'Advanced Project Management',
          'Role-based Access Control',
          'Activity Tracking',
          'File Upload Support',
          'Rate Limiting',
          'Security Headers'
        ],
        documentation: '/api/docs',
        status: 'operational'
      });
    });

    // Lightweight (optional) job enqueue endpoint (guard via env)
    if (process.env.ENABLE_JOB_ENQUEUE === 'true') {
      this.app.post('/api/jobs/kpi-snapshot', async (req: Request, res: Response) => {
        const job = jobQueue.enqueue('kpi.snapshot', {});
        res.json({ enqueued: true, jobId: job.id });
      });
    }

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Welcome to Bal-Con Builders Enhanced API',
        version: '2.0.0',
        documentation: '/api',
        health: '/api/health'
      });
    });

    logger.info('✅ Routes initialized');
  }

  // Initialize error handling
  private initializeErrorHandling(): void {
    // 404 handler (must come before error handler)
    this.app.use(notFoundHandler);

    // Global error handler (must come last)
    this.app.use(errorHandler);

    logger.info('✅ Error handling initialized');
  }

  // Initialize database
  private async initializeDatabase(): Promise<void> {
    try {
      logger.info('🔄 Initializing enhanced database...');
      await setupEnhancedDatabase();
      logger.info('✅ Enhanced database initialized successfully');
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Initialize WebSocket server
  private initializeWebSocket(): void {
    try {
      logger.info('🔄 Initializing WebSocket server...');
      initializeWebSocket(this.server);
      logger.info('✅ WebSocket server initialized successfully');
    } catch (error) {
      logger.error('❌ WebSocket initialization failed:', error);
      throw error;
    }
  }

  // Start the server
  public async start(): Promise<void> {
    try {
      // Create HTTP server
      this.server = createServer(this.app);

      // Initialize database first
      await this.initializeDatabase();

      // Initialize WebSocket
      this.initializeWebSocket();

      // Start listening
      this.server.listen(this.port, () => {
        logger.info(`🚀 Bal-Con Builders Enhanced API Server started successfully!`);
        logger.info(`📍 Server running on port ${this.port}`);
        logger.info(`🌐 API available at: http://localhost:${this.port}/api`);
        logger.info(`📋 Health check: http://localhost:${this.port}/api/health`);
        logger.info(`🔌 WebSocket support: enabled`);
        logger.info(`🔐 Authentication: enhanced with JWT`);
        logger.info(`📊 Real-time features: enabled`);
        
        if (process.env.NODE_ENV === 'development') {
          logger.info(`🔧 Development mode: API test interface available`);
        }
        initSentry(logger);
        this.started = true;
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  // Setup graceful shutdown
  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`🔄 Received ${signal}. Starting graceful shutdown...`);
      
      this.server.close(() => {
        logger.info('✅ HTTP server closed');
        
        // Close database connections
        // sequelize.close() would go here if needed
        
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown after 10 seconds');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  // Get the Express app instance
  public getApp(): Application {
    return this.app;
  }

  // Get the HTTP server instance
  public getServer(): any {
    return this.server;
  }

  public isStarted(): boolean { return this.started; }

  public async stop(): Promise<void> {
    for (const h of this.intervals) {
      try { clearInterval(h); } catch { /* ignore */ }
    }
    this.intervals = [];
    if (this.server) {
      await new Promise<void>(resolve => this.server.close(()=>resolve()));
      this.server = null;
    }
    this.started = false;
  }
}

// Create and export app instance
const balConApp = new BalConBuildersApp();

// Start server if this file is run directly
if (require.main === module) {
  balConApp.start().catch((error) => {
    logger.error('❌ Application startup failed:', error);
    process.exit(1);
  });
}

export default balConApp;
export { balConApp };
