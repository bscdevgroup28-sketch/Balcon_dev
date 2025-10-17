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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.balConApp = exports.BalConBuildersApp = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
// Removed morgan in favor of custom requestLoggingMiddleware
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = require("express-rate-limit");
// Load environment variables
dotenv_1.default.config();
// Import utilities and middleware
const logger_1 = require("./utils/logger");
const requestContext_1 = require("./utils/requestContext");
const metrics_1 = require("./monitoring/metrics");
const advancedMetrics_1 = require("./monitoring/advancedMetrics");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
// Import services
const webSocketService_1 = require("./services/webSocketService");
const setupEnhancedDatabase_1 = require("./scripts/setupEnhancedDatabase");
const environment_1 = require("./config/environment");
const environment_2 = require("./config/environment");
const globalRateLimit_1 = require("./middleware/globalRateLimit");
// removed unused sequelize import
// Import routes
const health_1 = __importDefault(require("./routes/health"));
const readiness_1 = __importDefault(require("./routes/readiness"));
const authEnhanced_1 = __importDefault(require("./routes/authEnhanced"));
const projects_1 = __importDefault(require("./routes/projects"));
const quotes_1 = __importDefault(require("./routes/quotes"));
const files_1 = __importDefault(require("./routes/files"));
const orders_1 = __importDefault(require("./routes/orders"));
const users_1 = __importDefault(require("./routes/users"));
const materials_1 = __importDefault(require("./routes/materials"));
const test_1 = __importDefault(require("./routes/test"));
const workOrders_1 = __importDefault(require("./routes/workOrders"));
const inventoryTransactions_1 = __importDefault(require("./routes/inventoryTransactions"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const exports_1 = __importDefault(require("./routes/exports"));
const security_1 = __importDefault(require("./routes/security"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const metrics_2 = require("./monitoring/metrics");
const securityMetrics_1 = require("./utils/securityMetrics");
const advancedMetrics_2 = require("./monitoring/advancedMetrics");
const jobQueue_1 = require("./jobs/jobQueue");
const kpiSnapshotJob_1 = require("./jobs/handlers/kpiSnapshotJob");
const scheduler_1 = require("./jobs/scheduler");
const cache_1 = require("./utils/cache");
const models_1 = require("./models");
const webhooks_1 = require("./services/webhooks");
const storage_1 = require("./services/storage");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
// path & metrics already imported above
// Enhanced Express Application with WebSocket support
class BalConBuildersApp {
    constructor() {
        this.started = false;
        this.intervals = [];
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '8080');
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeJobs();
        // Startup diagnostics
        const maskedDb = (environment_1.config.database.url || '').replace(/:[^:@/]+@/, ':****@');
        logger_1.logger.info(`[startup] NODE_ENV=${environment_1.config.server.nodeEnv} PORT=${this.port}`);
        logger_1.logger.info(`[startup] Database URL (masked): ${maskedDb}`);
        const dbUrl = environment_1.config.database.url || 'sqlite:./enhanced_database.sqlite';
        logger_1.logger.info(`[startup] Using dialect: ${dbUrl.startsWith('sqlite') ? 'sqlite' : 'postgres'}`);
    }
    initializeJobs() {
        try {
            jobQueue_1.jobQueue.recoverPersisted?.();
            jobQueue_1.jobQueue.register('kpi.snapshot', kpiSnapshotJob_1.kpiSnapshotHandler);
            // Export job processor: generate CSV (in-memory for now) and store data URL placeholder
            jobQueue_1.jobQueue.register('export.generate', async (job) => {
                const start = Date.now();
                const { exportJobId } = job.payload;
                const ej = await models_1.ExportJob.findByPk(exportJobId);
                if (!ej)
                    return;
                await ej.update({ status: 'processing', attempts: ej.attempts + 1, startedAt: new Date() });
                try {
                    let rows = [];
                    if (ej.type === 'materials_csv') {
                        rows = await models_1.Material.findAll({ limit: 5000 });
                    }
                    else if (ej.type === 'orders_csv') {
                        rows = await models_1.Order.findAll({ limit: 5000 });
                    }
                    else if (ej.type === 'projects_csv') {
                        rows = await models_1.Project.findAll({ limit: 5000 });
                    }
                    const plain = rows.map(r => r.get({ plain: true }));
                    const fields = Object.keys(plain[0] || { id: 1 });
                    const tmp = path_1.default.join(os_1.default.tmpdir(), `export-${ej.id}.csv`);
                    const stream = fs_1.default.createWriteStream(tmp, { encoding: 'utf8' });
                    stream.write(fields.join(',') + '\n');
                    for (const p of plain)
                        stream.write(fields.map(f => JSON.stringify(p[f] ?? '')).join(',') + '\n');
                    await new Promise(resolve => stream.end(resolve));
                    const storage = (0, storage_1.getStorage)();
                    const key = `${ej.type}/${ej.id}-${Date.now()}.csv`;
                    await storage.putObject(key, tmp, 'text/csv');
                    const downloadUrl = await storage.getDownloadUrl(key);
                    await ej.update({ status: 'completed', resultUrl: downloadUrl, fileKey: key, completedAt: new Date() });
                    (0, webhooks_1.publishEvent)('export.completed', { id: ej.id, type: ej.type, fileKey: key, url: downloadUrl });
                    metrics_2.metrics.increment('exports.completed');
                    metrics_2.metrics.observe('export.duration.ms', Date.now() - start);
                }
                catch (err) {
                    metrics_2.metrics.increment('exports.failed');
                    await ej.update({ status: 'failed', errorMessage: err.message, completedAt: new Date() });
                    (0, webhooks_1.publishEvent)('export.failed', { id: ej.id, type: ej.type, error: err.message });
                    metrics_2.metrics.observe('export.duration.ms', Date.now() - start);
                    throw err;
                }
            });
            (0, webhooks_1.registerWebhookJob)();
            // Optionally enqueue daily job on startup if flag set
            if (process.env.ENQUEUE_KPI_ON_START === 'true') {
                jobQueue_1.jobQueue.enqueue('kpi.snapshot', {});
            }
            // Schedule KPI snapshot recurring if interval env provided
            const snapInterval = process.env.KPI_SNAPSHOT_INTERVAL_MS && parseInt(process.env.KPI_SNAPSHOT_INTERVAL_MS);
            if (snapInterval && snapInterval > 0) {
                scheduler_1.scheduler.schedule('kpi.snapshot', snapInterval);
            }
            // Cache warming for analytics summary (Phase 7 prep) if enabled
            const warmInterval = process.env.ANALYTICS_SUMMARY_WARM_INTERVAL_MS && parseInt(process.env.ANALYTICS_SUMMARY_WARM_INTERVAL_MS);
            if (warmInterval && warmInterval > 0) {
                scheduler_1.scheduler.schedule('analytics.summary.warm', warmInterval);
                jobQueue_1.jobQueue.register('analytics.summary.warm', async () => {
                    try {
                        const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_SUMMARY_MS || '60000');
                        await (0, cache_1.withCache)(cache_1.cacheKeys.analyticsSummary, ttlMs, async () => {
                            // Lightweight aggregate (placeholder) to ensure model touch; actual logic lives in route
                            const latest = await models_1.KpiDailySnapshot.findOne({ order: [['date', 'DESC']] });
                            return { warmedAt: new Date().toISOString(), latestDate: latest?.get('date') };
                        }, [cache_1.cacheTags.analytics]);
                    }
                    catch { /* ignore warming errors */ }
                });
            }
            logger_1.logger.info('✅ Job queue initialized');
            // Token count cache refresher (avoid counting every metrics scrape)
            try {
                const interval = parseInt(process.env.TOKENS_METRICS_REFRESH_INTERVAL_MS || '60000');
                if (interval > 0) {
                    const h = setInterval(async () => {
                        try {
                            const { RefreshToken } = await Promise.resolve().then(() => __importStar(require('./models/RefreshToken')));
                            const total = await RefreshToken.count();
                            const active = await RefreshToken.count({ where: { revokedAt: null } });
                            RefreshToken._cacheTotal = total;
                            RefreshToken._cacheActive = active;
                        }
                        catch (e) {
                            logger_1.logger.warn('[tokens] metrics refresh failed', { error: e.message });
                        }
                    }, interval);
                    h.unref();
                    this.intervals.push(h);
                    logger_1.logger.info(`[tokens] Metrics refresh interval active (${interval}ms)`);
                }
            }
            catch (e) {
                logger_1.logger.warn('[tokens] metrics cache init failed', e);
            }
            // Schedule refresh token cleanup (soft retention enforcement) outside jobQueue for simplicity
            try {
                const interval = environment_1.config.tokens.refreshCleanupIntervalMs;
                if (interval > 0) {
                    const h = setInterval(async () => {
                        try {
                            const cutoff = new Date(Date.now() - environment_1.config.tokens.refreshRetentionDays * 24 * 60 * 60 * 1000);
                            const { sequelize } = await Promise.resolve().then(() => __importStar(require('./config/database')));
                            const [beforeTotal] = await sequelize.query('SELECT COUNT(*)::int as c FROM refresh_tokens');
                            const [beforeActive] = await sequelize.query("SELECT COUNT(*)::int as c FROM refresh_tokens WHERE revoked_at IS NULL");
                            const beforeTotalCount = beforeTotal[0]?.c || 0;
                            const beforeActiveCount = beforeActive[0]?.c || 0;
                            const [result] = await sequelize.query('DELETE FROM refresh_tokens WHERE (revoked_at IS NOT NULL OR expires_at < ?) AND created_at < ?', { replacements: [new Date(), cutoff] });
                            // SQLite vs Postgres differences; try to derive rows deleted
                            let deleted = 0;
                            try {
                                const rAny = result;
                                if (Array.isArray(rAny) && rAny[1] && typeof rAny[1].rowCount === 'number')
                                    deleted = rAny[1].rowCount;
                                else if (rAny && typeof rAny.rowCount === 'number')
                                    deleted = rAny.rowCount;
                            }
                            catch { /* ignore */ }
                            const [afterTotal] = await sequelize.query('SELECT COUNT(*)::int as c FROM refresh_tokens');
                            const [afterActive] = await sequelize.query("SELECT COUNT(*)::int as c FROM refresh_tokens WHERE revoked_at IS NULL");
                            const afterTotalCount = afterTotal[0]?.c || 0;
                            const afterActiveCount = afterActive[0]?.c || 0;
                            const removed = beforeTotalCount - afterTotalCount;
                            const activeDelta = afterActiveCount - beforeActiveCount; // usually 0
                            global.__tokenCleanup = {
                                lastRun: Date.now(),
                                removed,
                                deletedReported: deleted,
                                activeDelta,
                            };
                            const { metrics } = await Promise.resolve().then(() => __importStar(require('./monitoring/metrics')));
                            metrics.increment('tokens.cleanup.runs');
                            if (removed > 0)
                                metrics.increment('tokens.cleanup.removed', removed);
                            logger_1.logger.info('[tokens] cleanup executed', { cutoff: cutoff.toISOString(), removed, activeDelta });
                        }
                        catch (e) {
                            logger_1.logger.warn('[tokens] cleanup failed', { error: e.message });
                        }
                    }, interval);
                    h.unref();
                    this.intervals.push(h);
                    logger_1.logger.info(`[tokens] Cleanup scheduler active every ${interval}ms (retention=${environment_1.config.tokens.refreshRetentionDays}d)`);
                }
            }
            catch (e) {
                logger_1.logger.warn('[tokens] cleanup scheduler init failed', e);
            }
        }
        catch (e) {
            logger_1.logger.warn('Job queue init failed', e);
        }
    }
    // Initialize middleware
    initializeMiddleware() {
        // Security middleware
        const cspDirectives = {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", 'ws:', 'wss:'],
            imgSrc: ["'self'", 'data:', 'https:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
        };
        if (process.env.CSP_EXTRA_CONNECT) {
            cspDirectives.connectSrc.push(...process.env.CSP_EXTRA_CONNECT.split(',').map(s => s.trim()).filter(Boolean));
        }
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: { directives: cspDirectives },
            referrerPolicy: { policy: 'no-referrer' },
            crossOriginEmbedderPolicy: false,
        }));
        // Optional HSTS (only if behind HTTPS proxy)
        if (environment_1.config.server.nodeEnv === 'production') {
            this.app.use((req, res, next) => {
                res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
                next();
            });
        }
        // Optional HTTPS redirect (respect proxy headers)
        if (process.env.ENFORCE_HTTPS === 'true') {
            this.app.use((req, res, next) => {
                const xfProto = (req.headers['x-forwarded-proto'] || '');
                if (xfProto && xfProto !== 'https') {
                    return res.redirect(301, 'https://' + req.headers.host + req.originalUrl);
                }
                next();
            });
        }
        // CORS configuration (strict in production)
        this.app.use((0, cors_1.default)({
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true); // allow non-browser clients
                const allowed = environment_1.config.server.frontendOrigins || [];
                if (allowed.includes(origin))
                    return callback(null, true);
                if (environment_1.config.server.nodeEnv !== 'production' && /^http:\/\/localhost:\d+$/.test(origin))
                    return callback(null, true);
                logger_1.logger.warn(`[cors] Blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));
        if (environment_1.config.server.nodeEnv === 'test') {
            // Lightweight test rate limiter to avoid hanging Jest due to background interval in express-rate-limit MemoryStore.
            // Implements simple fixed window counting without setInterval; window resets lazily when first seen after expiry.
            const WINDOW_MS = 15 * 60 * 1000;
            const generalCounts = new Map();
            const authCounts = new Map();
            const incr = (map, key) => {
                const now = Date.now();
                let c = map.get(key);
                if (!c || (now - c.windowStart) > WINDOW_MS) {
                    c = { count: 0, windowStart: now };
                    map.set(key, c);
                }
                c.count += 1;
                return c;
            };
            this.app.use((req, res, next) => {
                const ip = req.ip || req.connection?.remoteAddress || 'unknown';
                const c = incr(generalCounts, ip);
                if (c.count > 1000)
                    return res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
                next();
            });
            this.app.use('/api/auth', (req, res, next) => {
                const ip = req.ip || req.connection?.remoteAddress || 'unknown';
                const key = ip + '::auth';
                const c = incr(authCounts, key);
                if (c.count > 5)
                    return res.status(429).json({ error: 'Too many authentication attempts, please try again later.' });
                next();
            });
            // Skip adaptive globalRateLimit (already tested elsewhere) to reduce moving parts in integration tests.
        }
        else {
            // Rate limiting (general)
            const limiter = (0, express_rate_limit_1.rateLimit)({
                windowMs: 15 * 60 * 1000,
                max: 1000,
                message: { error: 'Too many requests from this IP, please try again later.' },
                standardHeaders: true,
                legacyHeaders: false,
            });
            this.app.use(limiter);
            // Adaptive global rate limiter (per IP+user) using LRU (Phase 4 hardening)
            this.app.use(globalRateLimit_1.globalRateLimit);
            // Stricter auth limiter
            const authLimiter = (0, express_rate_limit_1.rateLimit)({
                windowMs: 15 * 60 * 1000,
                max: 5,
                message: { error: 'Too many authentication attempts, please try again later.' },
                standardHeaders: true,
                legacyHeaders: false,
            });
            this.app.use('/api/auth', authLimiter);
        }
        // Metrics middleware early
        this.app.use(metrics_1.metricsMiddleware);
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Structured request logging with request IDs
        this.app.use(logger_1.requestLoggingMiddleware);
        // AsyncLocalStorage request context (must come after requestLoggingMiddleware sets req.requestId)
        this.app.use(requestContext_1.requestContextMiddleware);
        // Phase 17: latency attribution (must come after requestContext so requestId is set)
        try {
            const { latencyAttributionMiddleware } = require('./middleware/latencyAttribution');
            this.app.use(latencyAttributionMiddleware);
        }
        catch (e) {
            logger_1.logger.warn('[startup] failed to load latencyAttributionMiddleware', { error: e?.message });
        }
        // Advanced timing/size metrics (after logging, before routes)
        this.app.use(advancedMetrics_1.advancedHttpMetricsMiddleware);
        // Static file serving
        this.app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
        // Trust proxy for accurate IP addresses (important for rate limiting)
        this.app.set('trust proxy', 1);
        logger_1.logger.info('✅ Middleware initialized');
        // Runtime config self-check
        const runtimeStatus = (0, environment_2.validateRuntime)();
        if (!runtimeStatus.ok) {
            logger_1.logger.error('[startup] Runtime validation failed', { errors: runtimeStatus.errors });
        }
        else {
            logger_1.logger.info('[startup] Runtime configuration validated');
        }
    }
    // Initialize routes
    initializeRoutes() {
        // Phase 17: route handler timing wrapper (captures time spent in routing/handlers excluding earlier middleware)
        this.app.use((req, res, next) => {
            const start = process.hrtime.bigint();
            const DB_TIME_SYMBOL = Symbol.for('latency.db.ms');
            res.once('finish', () => {
                try {
                    const routeElapsedMs = Number(process.hrtime.bigint() - start) / 1000000;
                    const dbMs = req[DB_TIME_SYMBOL] || 0;
                    const handlerExclusive = Math.max(0, routeElapsedMs - dbMs);
                    try {
                        const { recordHandlerTime } = require('./middleware/latencyAttribution');
                        recordHandlerTime(req, handlerExclusive);
                    }
                    catch { /* ignore */ }
                }
                catch { /* ignore top-level */ }
            });
            next();
        });
        // API routes
        this.app.get('/api/live', (_req, res) => {
            res.json({ status: 'live', time: new Date().toISOString() });
        });
        this.app.get('/api/health/simple', (_req, res) => {
            res.json({ status: 'ok', time: new Date().toISOString() });
        });
        this.app.use('/api/metrics', require('./routes/metrics').default);
        this.app.use('/api/health', health_1.default);
        this.app.use('/api/ready', readiness_1.default);
        this.app.use('/api/auth', authEnhanced_1.default);
        this.app.use('/api/projects', projects_1.default);
        this.app.use('/api/quotes', quotes_1.default);
        this.app.use('/api/orders', orders_1.default);
        this.app.use('/api/users', users_1.default);
        this.app.use('/api/materials', materials_1.default);
        this.app.use('/api/files', files_1.default);
        if ((process.env.ENABLE_TEST_ROUTES || '').toLowerCase() === 'true') {
            this.app.use('/api/test', test_1.default);
        }
        this.app.use('/api/work-orders', workOrders_1.default);
        this.app.use('/api/inventory/transactions', inventoryTransactions_1.default);
        this.app.use('/api/analytics', analytics_1.default);
        this.app.use('/api/exports', exports_1.default);
        this.app.use('/api/security', security_1.default);
        if (process.env.ENABLE_DELAYED_JOBS === 'true') {
            this.app.use('/api/jobs', jobs_1.default);
        }
        // Prometheus exposition
        this.app.get('/api/metrics/prometheus', async (req, res) => {
            res.set('Content-Type', 'text/plain');
            let body = metrics_2.metrics.toPrometheus() + '\n' + (0, securityMetrics_1.securityMetricsToPrometheus)();
            try {
                // Append prom-client metrics if advanced metrics are active
                const advanced = await advancedMetrics_2.advancedRegistry.metrics();
                body += '\n' + advanced;
            }
            catch { /* ignore */ }
            res.send(body);
        });
        // API status endpoint
        this.app.get('/api', (req, res) => {
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
            this.app.post('/api/jobs/kpi-snapshot', async (req, res) => {
                const job = jobQueue_1.jobQueue.enqueue('kpi.snapshot', {});
                res.json({ enqueued: true, jobId: job.id });
            });
        }
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Welcome to Bal-Con Builders Enhanced API',
                version: '2.0.0',
                documentation: '/api',
                health: '/api/health'
            });
        });
        logger_1.logger.info('✅ Routes initialized');
    }
    // Initialize error handling
    initializeErrorHandling() {
        // 404 handler (must come before error handler)
        this.app.use(notFoundHandler_1.notFoundHandler);
        // Global error handler (must come last)
        this.app.use(errorHandler_1.errorHandler);
        logger_1.logger.info('✅ Error handling initialized');
    }
    // Initialize database
    async initializeDatabase() {
        try {
            logger_1.logger.info('🔄 Initializing enhanced database...');
            await (0, setupEnhancedDatabase_1.setupEnhancedDatabase)();
            logger_1.logger.info('✅ Enhanced database initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    // Initialize WebSocket server
    initializeWebSocket() {
        try {
            logger_1.logger.info('🔄 Initializing WebSocket server...');
            (0, webSocketService_1.initializeWebSocket)(this.server);
            logger_1.logger.info('✅ WebSocket server initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ WebSocket initialization failed:', error);
            throw error;
        }
    }
    // Start the server
    async start() {
        try {
            // Create HTTP server
            this.server = (0, http_1.createServer)(this.app);
            // Initialize database first
            await this.initializeDatabase();
            // Initialize WebSocket
            this.initializeWebSocket();
            // Start listening
            this.server.listen(this.port, () => {
                logger_1.logger.info(`🚀 Bal-Con Builders Enhanced API Server started successfully!`);
                logger_1.logger.info(`📍 Server running on port ${this.port}`);
                logger_1.logger.info(`🌐 API available at: http://localhost:${this.port}/api`);
                logger_1.logger.info(`📋 Health check: http://localhost:${this.port}/api/health`);
                logger_1.logger.info(`🔌 WebSocket support: enabled`);
                logger_1.logger.info(`🔐 Authentication: enhanced with JWT`);
                logger_1.logger.info(`📊 Real-time features: enabled`);
                if (process.env.NODE_ENV === 'development') {
                    logger_1.logger.info(`🔧 Development mode: API test interface available`);
                }
                (0, metrics_1.initSentry)(logger_1.logger);
                this.started = true;
            });
            // Graceful shutdown handling
            this.setupGracefulShutdown();
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    // Setup graceful shutdown
    setupGracefulShutdown() {
        const gracefulShutdown = (signal) => {
            logger_1.logger.info(`🔄 Received ${signal}. Starting graceful shutdown...`);
            this.server.close(() => {
                logger_1.logger.info('✅ HTTP server closed');
                // Close database connections
                // sequelize.close() would go here if needed
                logger_1.logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger_1.logger.error('❌ Forced shutdown after 10 seconds');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    // Get the Express app instance
    getApp() {
        return this.app;
    }
    // Get the HTTP server instance
    getServer() {
        return this.server;
    }
    isStarted() { return this.started; }
    async stop() {
        for (const h of this.intervals) {
            try {
                clearInterval(h);
            }
            catch { /* ignore */ }
        }
        this.intervals = [];
        if (this.server) {
            await new Promise(resolve => this.server.close(() => resolve()));
            this.server = null;
        }
        this.started = false;
    }
}
exports.BalConBuildersApp = BalConBuildersApp;
// Create and export app instance
const balConApp = new BalConBuildersApp();
exports.balConApp = balConApp;
// Start server if this file is run directly
if (require.main === module) {
    balConApp.start().catch((error) => {
        logger_1.logger.error('❌ Application startup failed:', error);
        process.exit(1);
    });
}
exports.default = balConApp;
