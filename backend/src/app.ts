import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// Removed morgan in favor of custom requestLoggingMiddleware
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config/environment';
import { requestLoggingMiddleware } from './utils/logger';
import { metricsMiddleware } from './monitoring/metrics';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import healthRoutes from './routes/health';
import projectRoutes from './routes/projects';
import filesRoutes from './routes/files';
import uploadsRoutes from './routes/uploads';
import testRoutes from './routes/test';
import demoRoutes from './routes/demo';
import quotesRoutes from './routes/quotes';
import ordersRoutes from './routes/orders';
import materialsRoutes from './routes/materials';
import featureFlagRoutes from './routes/featureFlags';
// Added for auth/security integration tests without enhanced app
import authRoutes from './routes/authEnhanced';
import securityRoutes from './routes/security';
import workOrderRoutes from './routes/workOrders';
// Missing in basic app previously (caused 404s in integration tests)
import usersRoutes from './routes/users';
import inventoryTransactionRoutes from './routes/inventoryTransactions';
import analyticsRoutes from './routes/analytics';
import { jobQueue } from './jobs/jobQueue';
import { ExportJob, Material, Order, Project } from './models';
import { getStorage } from './services/storage';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import { metrics } from './monitoring/metrics';
import { registerWebhookJob, publishEvent } from './services/webhooks';
import exportRoutes from './routes/exports';
import webhookRoutes from './routes/webhooks';

const app = express();

// Trust proxy for Cloud Run
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
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
app.use(metricsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression with threshold & brotli hint support
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compress']) return false;
    return compression.filter(req, res);
  }
}));

// Static / API caching strategy (lightweight)
app.use((req, res, next) => {
  // Cache static asset requests (heuristic: /static/ or file extension)
  if (/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/i.test(req.path) || req.path.startsWith('/static/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/api/')) {
    // Short lived caching for GET API that are idempotent; skip for authenticated modifying methods
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'private, max-age=30');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
  next();
});

// Structured logging with request IDs
app.use(requestLoggingMiddleware);

// Health & Metrics (before auth)
app.use('/api/metrics', require('./routes/metrics').default);
// Health check (before authentication)
app.use('/health', healthRoutes);

// Test routes (no database required)
app.use('/api/test', testRoutes);

// API routes
app.use('/api/demo', demoRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/flags', featureFlagRoutes);
app.use('/api/feature-flags', featureFlagRoutes); // alias for tests expecting old path
app.use('/api/work-orders', workOrderRoutes);
// Newly added routes for parity with enhanced app & to satisfy tests
app.use('/api/users', usersRoutes);
app.use('/api/inventory/transactions', inventoryTransactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/webhooks', webhookRoutes);

// Minimal job handler registration for export jobs when using basic app
try {
  // Attempt recovery of persisted jobs early
  jobQueue.recoverPersisted?.();
  jobQueue.register('export.generate', async (job) => {
    const start = Date.now();
    const { exportJobId } = job.payload as any;
    const ej = await ExportJob.findByPk(exportJobId);
    if (!ej) return;
    await ej.update({ status: 'processing', attempts: ej.attempts + 1, startedAt: new Date() });
    try {
      const batchLimit = parseInt(process.env.EXPORT_BATCH_LIMIT || '5000');
      const params = (ej.params || {}) as any;
      const since = params.since ? new Date(params.since) : null;
      const cursor = params.cursor || null; // { lastUpdatedAt, lastId }
      let where: any = {};
      if (cursor) {
        // Deterministic pagination: (updatedAt > lastUpdatedAt) OR (updatedAt = lastUpdatedAt AND id > lastId)
        const lastUpdatedAt = new Date(cursor.lastUpdatedAt);
        const lastId = cursor.lastId;
        where = {
          [Op.or]: [
            { updatedAt: { [Op.gt]: lastUpdatedAt } },
            { updatedAt: lastUpdatedAt, id: { [Op.gt]: lastId } }
          ]
        };
        if (since) {
          // ensure rows still respect since cutoff
          where = { [Op.and]: [ { updatedAt: { [Op.gt]: since } }, where ] };
        }
      } else if (since) {
        where.updatedAt = { [Op.gt]: since };
      }
      let rows: any[] = [];
      if (ej.type === 'materials_csv') rows = await Material.findAll({ where, limit: batchLimit, order: [['updatedAt','ASC'], ['id','ASC']] });
      else if (ej.type === 'orders_csv') rows = await Order.findAll({ where, limit: batchLimit, order: [['updatedAt','ASC'], ['id','ASC']] });
      else if (ej.type === 'projects_csv') rows = await Project.findAll({ where, limit: batchLimit, order: [['updatedAt','ASC'], ['id','ASC']] });
      const plain = rows.map(r => (r as any).get ? (r as any).get({ plain: true }) : r);
      const format = (params.format || 'csv');
      const compression = (params.compression || 'none');
      const fields = Object.keys(plain[0] || { id: 1 });
      const baseTmp = path.join(os.tmpdir(), `export-${ej.id}-${Date.now()}`);
      const tmp = baseTmp + (format === 'csv' ? '.csv' : '.jsonl') + (compression === 'gzip' ? '.gz' : '');
      const fileStream = fs.createWriteStream(tmp, { encoding: 'utf8' });
      let sink: NodeJS.WritableStream = fileStream;
      if (compression === 'gzip') {
        const gzip = zlib.createGzip();
        gzip.pipe(fileStream);
        sink = gzip;
      }
      if (format === 'csv') {
        if (!cursor) (sink as any).write(fields.join(',') + '\n');
        for (const p of plain) (sink as any).write(fields.map(f => JSON.stringify((p as any)[f] ?? '')).join(',') + '\n');
      } else { // jsonl
        for (const p of plain) (sink as any).write(JSON.stringify(p) + '\n');
      }
      await new Promise(resolve => (sink as any).end(resolve));
      const storage = getStorage();
      const keyBase = `${ej.type}/${ej.id}`;
      const ext = format === 'csv' ? '.csv' : '.jsonl';
      const key = `${keyBase}-${Date.now()}${cursor ? '-part' : ''}${ext}${compression === 'gzip' ? '.gz' : ''}`;
  const contentType = format === 'csv' ? 'text/csv' : 'application/x-ndjson';
  await storage.putObject(key, tmp, contentType);
      const downloadUrl = await storage.getDownloadUrl(key);
      const isFinal = rows.length < batchLimit;
      const lastRow: any = rows.length ? rows[rows.length - 1] : null;
      const newCursor = isFinal || !lastRow ? null : { lastUpdatedAt: lastRow.updatedAt, lastId: lastRow.id };
      const parts = Array.isArray(params.parts) ? params.parts.slice() : [];
      parts.push({ fileKey: key, rows: rows.length, createdAt: new Date().toISOString() });
      const newParams = { ...params, cursor: newCursor, parts };
      if (isFinal) {
        await ej.update({ status: 'completed', resultUrl: downloadUrl, fileKey: key, completedAt: new Date(), params: newParams });
  publishEvent('export.completed', { id: ej.id, type: ej.type, fileKey: key, url: downloadUrl, parts });
        metrics.increment('exports.completed');
      } else {
        await ej.update({ status: 'partial', resultUrl: downloadUrl, fileKey: key, params: newParams });
        jobQueue.enqueue('export.generate', { exportJobId: ej.id }, 3, 100);
      }
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
} catch { /* ignore duplicate registration */ }
// Basic auth & security routes (subset of enhanced app) for legacy tests
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
