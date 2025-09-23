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
import { metricsMiddleware, initSentry } from './monitoring/metrics';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import services
import { initializeWebSocket } from './services/webSocketService';
import { setupEnhancedDatabase } from './scripts/setupEnhancedDatabase';
import { config } from './config/environment';
// removed unused sequelize import

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/authEnhanced';
import projectRoutes from './routes/projects';
import quoteRoutes from './routes/quotes';
import fileRoutes from './routes/files';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import materialsRoutes from './routes/materials';
import testRoutes from './routes/test';

// Enhanced Express Application with WebSocket support
export class BalConBuildersApp {
  public app: Application;
  public server: any;
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '8080');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    // Startup diagnostics
    const maskedDb = (config.database.url || '').replace(/:[^:@/]+@/, ':****@');
    logger.info(`[startup] NODE_ENV=${config.server.nodeEnv} PORT=${this.port}`);
    logger.info(`[startup] Database URL (masked): ${maskedDb}`);
  const dbUrl = config.database.url || 'sqlite:./enhanced_database.sqlite';
  logger.info(`[startup] Using dialect: ${dbUrl.startsWith('sqlite') ? 'sqlite' : 'postgres'}`);
  }

  // Initialize middleware
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "ws:", "wss:"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL || 'http://localhost:3001'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting (general)
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: { error: 'Too many requests from this IP, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Stricter auth limiter
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { error: 'Too many authentication attempts, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/auth', authLimiter);

  // Metrics middleware early
  this.app.use(metricsMiddleware);

  // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Structured request logging with request IDs
    this.app.use(requestLoggingMiddleware);

  // Static file serving
    this.app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
    
    // Trust proxy for accurate IP addresses (important for rate limiting)
    this.app.set('trust proxy', 1);

    logger.info('✅ Middleware initialized');
  }

  // Initialize routes
  private initializeRoutes(): void {
    // API routes
    this.app.get('/api/health/simple', (req: Request, res: Response) => {
      res.json({ status: 'ok', time: new Date().toISOString() });
    });
  this.app.use('/api/metrics', require('./routes/metrics').default);
  this.app.use('/api/health', healthRoutes);
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/quotes', quoteRoutes);
    this.app.use('/api/orders', orderRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/materials', materialsRoutes);
    this.app.use('/api/files', fileRoutes);
    this.app.use('/api/test', testRoutes);

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
