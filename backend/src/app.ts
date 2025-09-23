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
import materialsRoutes from './routes/materials';
import featureFlagRoutes from './routes/featureFlags';

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
app.use('/api/materials', materialsRoutes);
app.use('/api/flags', featureFlagRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
