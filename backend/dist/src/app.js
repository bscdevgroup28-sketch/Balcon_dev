"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// Removed morgan in favor of custom requestLoggingMiddleware
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_1 = require("./config/environment");
const logger_1 = require("./utils/logger");
const metrics_1 = require("./monitoring/metrics");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
// Import routes
const health_1 = __importDefault(require("./routes/health"));
const projects_1 = __importDefault(require("./routes/projects"));
const files_1 = __importDefault(require("./routes/files"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const test_1 = __importDefault(require("./routes/test"));
const demo_1 = __importDefault(require("./routes/demo"));
const quotes_1 = __importDefault(require("./routes/quotes"));
const orders_1 = __importDefault(require("./routes/orders"));
const materials_1 = __importDefault(require("./routes/materials"));
const featureFlags_1 = __importDefault(require("./routes/featureFlags"));
// Added for auth/security integration tests without enhanced app
const authEnhanced_1 = __importDefault(require("./routes/authEnhanced"));
const security_1 = __importDefault(require("./routes/security"));
const workOrders_1 = __importDefault(require("./routes/workOrders"));
// Missing in basic app previously (caused 404s in integration tests)
const users_1 = __importDefault(require("./routes/users"));
const inventoryTransactions_1 = __importDefault(require("./routes/inventoryTransactions"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const jobQueue_1 = require("./jobs/jobQueue");
const models_1 = require("./models");
const storage_1 = require("./services/storage");
const sequelize_1 = require("sequelize");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const zlib_1 = __importDefault(require("zlib"));
const metrics_2 = require("./monitoring/metrics");
const webhooks_1 = require("./services/webhooks");
const exports_1 = __importDefault(require("./routes/exports"));
const webhooks_2 = __importDefault(require("./routes/webhooks"));
const app = (0, express_1.default)();
exports.app = app;
// Trust proxy for Cloud Run
app.set('trust proxy', true);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.balconbuilders.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: environment_1.config.server.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Metrics middleware early
app.use(metrics_1.metricsMiddleware);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Compression with threshold & brotli hint support
app.use((0, compression_1.default)({
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compress'])
            return false;
        return compression_1.default.filter(req, res);
    }
}));
// Static / API caching strategy (lightweight)
app.use((req, res, next) => {
    // Cache static asset requests (heuristic: /static/ or file extension)
    if (/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/i.test(req.path) || req.path.startsWith('/static/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    else if (req.path.startsWith('/api/')) {
        // Short lived caching for GET API that are idempotent; skip for authenticated modifying methods
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', 'private, max-age=30');
        }
        else {
            res.setHeader('Cache-Control', 'no-store');
        }
    }
    next();
});
// Structured logging with request IDs
app.use(logger_1.requestLoggingMiddleware);
// Health & Metrics (before auth)
app.use('/api/metrics', require('./routes/metrics').default);
// Health check (before authentication)
app.use('/health', health_1.default);
// Test routes (no database required)
app.use('/api/test', test_1.default);
// API routes
app.use('/api/demo', demo_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/files', files_1.default);
app.use('/api/uploads', uploads_1.default);
app.use('/api/quotes', quotes_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/materials', materials_1.default);
app.use('/api/flags', featureFlags_1.default);
app.use('/api/feature-flags', featureFlags_1.default); // alias for tests expecting old path
app.use('/api/work-orders', workOrders_1.default);
// Newly added routes for parity with enhanced app & to satisfy tests
app.use('/api/users', users_1.default);
app.use('/api/inventory/transactions', inventoryTransactions_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/exports', exports_1.default);
app.use('/api/webhooks', webhooks_2.default);
// Minimal job handler registration for export jobs when using basic app
try {
    // Attempt recovery of persisted jobs early
    jobQueue_1.jobQueue.recoverPersisted?.();
    jobQueue_1.jobQueue.register('export.generate', async (job) => {
        const start = Date.now();
        const { exportJobId } = job.payload;
        const ej = await models_1.ExportJob.findByPk(exportJobId);
        if (!ej)
            return;
        await ej.update({ status: 'processing', attempts: ej.attempts + 1, startedAt: new Date() });
        try {
            const batchLimit = parseInt(process.env.EXPORT_BATCH_LIMIT || '5000');
            const params = (ej.params || {});
            const since = params.since ? new Date(params.since) : null;
            const cursor = params.cursor || null; // { lastUpdatedAt, lastId }
            let where = {};
            if (cursor) {
                // Deterministic pagination: (updatedAt > lastUpdatedAt) OR (updatedAt = lastUpdatedAt AND id > lastId)
                const lastUpdatedAt = new Date(cursor.lastUpdatedAt);
                const lastId = cursor.lastId;
                where = {
                    [sequelize_1.Op.or]: [
                        { updatedAt: { [sequelize_1.Op.gt]: lastUpdatedAt } },
                        { updatedAt: lastUpdatedAt, id: { [sequelize_1.Op.gt]: lastId } }
                    ]
                };
                if (since) {
                    // ensure rows still respect since cutoff
                    where = { [sequelize_1.Op.and]: [{ updatedAt: { [sequelize_1.Op.gt]: since } }, where] };
                }
            }
            else if (since) {
                where.updatedAt = { [sequelize_1.Op.gt]: since };
            }
            let rows = [];
            if (ej.type === 'materials_csv')
                rows = await models_1.Material.findAll({ where, limit: batchLimit, order: [['updatedAt', 'ASC'], ['id', 'ASC']] });
            else if (ej.type === 'orders_csv')
                rows = await models_1.Order.findAll({ where, limit: batchLimit, order: [['updatedAt', 'ASC'], ['id', 'ASC']] });
            else if (ej.type === 'projects_csv')
                rows = await models_1.Project.findAll({ where, limit: batchLimit, order: [['updatedAt', 'ASC'], ['id', 'ASC']] });
            const plain = rows.map(r => r.get ? r.get({ plain: true }) : r);
            const format = (params.format || 'csv');
            const compression = (params.compression || 'none');
            const fields = Object.keys(plain[0] || { id: 1 });
            const baseTmp = path_1.default.join(os_1.default.tmpdir(), `export-${ej.id}-${Date.now()}`);
            const tmp = baseTmp + (format === 'csv' ? '.csv' : '.jsonl') + (compression === 'gzip' ? '.gz' : '');
            const fileStream = fs_1.default.createWriteStream(tmp, { encoding: 'utf8' });
            let sink = fileStream;
            if (compression === 'gzip') {
                const gzip = zlib_1.default.createGzip();
                gzip.pipe(fileStream);
                sink = gzip;
            }
            if (format === 'csv') {
                if (!cursor)
                    sink.write(fields.join(',') + '\n');
                for (const p of plain)
                    sink.write(fields.map(f => JSON.stringify(p[f] ?? '')).join(',') + '\n');
            }
            else { // jsonl
                for (const p of plain)
                    sink.write(JSON.stringify(p) + '\n');
            }
            await new Promise(resolve => sink.end(resolve));
            const storage = (0, storage_1.getStorage)();
            const keyBase = `${ej.type}/${ej.id}`;
            const ext = format === 'csv' ? '.csv' : '.jsonl';
            const key = `${keyBase}-${Date.now()}${cursor ? '-part' : ''}${ext}${compression === 'gzip' ? '.gz' : ''}`;
            const contentType = format === 'csv' ? 'text/csv' : 'application/x-ndjson';
            await storage.putObject(key, tmp, contentType);
            const downloadUrl = await storage.getDownloadUrl(key);
            const isFinal = rows.length < batchLimit;
            const lastRow = rows.length ? rows[rows.length - 1] : null;
            const newCursor = isFinal || !lastRow ? null : { lastUpdatedAt: lastRow.updatedAt, lastId: lastRow.id };
            const parts = Array.isArray(params.parts) ? params.parts.slice() : [];
            parts.push({ fileKey: key, rows: rows.length, createdAt: new Date().toISOString() });
            const newParams = { ...params, cursor: newCursor, parts };
            if (isFinal) {
                await ej.update({ status: 'completed', resultUrl: downloadUrl, fileKey: key, completedAt: new Date(), params: newParams });
                (0, webhooks_1.publishEvent)('export.completed', { id: ej.id, type: ej.type, fileKey: key, url: downloadUrl, parts });
                metrics_2.metrics.increment('exports.completed');
            }
            else {
                await ej.update({ status: 'partial', resultUrl: downloadUrl, fileKey: key, params: newParams });
                jobQueue_1.jobQueue.enqueue('export.generate', { exportJobId: ej.id }, 3, 100);
            }
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
}
catch { /* ignore duplicate registration */ }
// Basic auth & security routes (subset of enhanced app) for legacy tests
app.use('/api/auth', authEnhanced_1.default);
app.use('/api/security', security_1.default);
// Error handling
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
