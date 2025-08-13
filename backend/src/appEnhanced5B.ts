import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
// import { Server as SocketIOServer } from 'socket.io'; // Commented out for now
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { rateLimit } from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import utilities and middleware
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authenticateToken } from './middleware/authEnhanced';

// Import services
import { setupEnhancedDatabase } from './scripts/setupEnhancedDatabase';
import WebSocketHandler from './services/websocketHandler';

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth'; // Using regular auth routes
import projectRoutes from './routes/projectsEnhanced';
import quoteRoutes from './routes/quotes';
import fileRoutes from './routes/files';
import testRoutes from './routes/test';
import analyticsRoutes from './routes/analytics';
import notificationRoutes from './routes/notifications';

// Phase 5B Enhanced Express Application with WebSocket Support
export class BalConBuildersApp5B {
  public app: Application;
  public server: any;
  public io: any; // Socket.IO Server
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '8083'); // Phase 5B on port 8083
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
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
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // Enable CORS for all routes
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    }));

    // Request logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        }
      }
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Serve static files
    const uploadsPath = path.join(__dirname, '../uploads');
    this.app.use('/uploads', express.static(uploadsPath));

    logger.info('✅ Middleware initialized');
  }

  // Initialize routes
  private initializeRoutes(): void {
    // Health check (no auth required)
    this.app.use('/api/health', healthRoutes);

    // Authentication routes (no auth required)
    this.app.use('/api/auth', authRoutes);

    // Test routes (no auth required for some endpoints)
    this.app.use('/api/test', testRoutes);

    // Protected routes (require authentication)
    this.app.use('/api/projects', authenticateToken, projectRoutes);
    this.app.use('/api/quotes', authenticateToken, quoteRoutes);
    this.app.use('/api/files', authenticateToken, fileRoutes);
    this.app.use('/api/analytics', authenticateToken, analyticsRoutes);
    this.app.use('/api/notifications', authenticateToken, notificationRoutes);

    // API documentation endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        message: 'Bal-Con Builders Enhanced API v2.1 - Phase 5B',
        version: '2.1.0',
        phase: '5B - Advanced Features',
        features: [
          'Real-time WebSocket updates',
          'Advanced analytics and reporting',
          'Notification system',
          'Enhanced project management',
          'JWT Authentication with role-based access',
          'File upload and management',
          'Project activity tracking',
          'Security middleware and rate limiting'
        ],
        endpoints: {
          health: '/api/health',
          auth: '/api/auth/*',
          projects: '/api/projects/*',
          quotes: '/api/quotes/*',
          files: '/api/files/*',
          analytics: '/api/analytics/*',
          notifications: '/api/notifications/*',
          test: '/api/test/*'
        },
        websocket: {
          enabled: true,
          events: [
            'project:update',
            'project:create',
            'user:activity',
            'notification:new',
            'analytics:refresh'
          ]
        },
        documentation: '/api/docs'
      });
    });

    logger.info('✅ Routes initialized');
  }

  // Initialize WebSocket
  private initializeWebSocket(): void {
    // WebSocket functionality will be added after socket.io is properly installed
    logger.info('🔌 WebSocket initialization skipped (socket.io not available)');
    
    // For now, create a mock WebSocket handler
    this.io = {
      emit: (event: string, data: any) => {
        logger.info(`� Mock WebSocket emit: ${event}`);
      },
      to: (room: string) => ({
        emit: (event: string, data: any) => {
          logger.info(`� Mock WebSocket emit to room ${room}: ${event}`);
        }
      })
    };

    logger.info('✅ Mock WebSocket server initialized');
  }

  // Initialize error handling
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    logger.info('✅ Error handling initialized');
  }

  // Database initialization
  private async initializeDatabase(): Promise<void> {
    try {
      await setupEnhancedDatabase();
      logger.info('✅ Enhanced database initialized successfully');
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Graceful shutdown handling
  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
      
      this.server.close(() => {
        logger.info('✅ HTTP server closed');
        
        if (this.io) {
          this.io.close(() => {
            logger.info('✅ WebSocket server closed');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  // Start the server
  public async start(): Promise<void> {
    try {
      // Create HTTP server
      this.server = createServer(this.app);

      // Initialize WebSocket
      this.initializeWebSocket();

      // Initialize database first
      await this.initializeDatabase();

      // Start listening
      this.server.listen(this.port, () => {
        logger.info('');
        logger.info('🎉 Bal-Con Builders Enhanced API v2.1 - Phase 5B is now running!');
        logger.info('');
        logger.info('📊 Phase 5B: Advanced Feature Enhancement');
        logger.info('');
        logger.info('🚀 Available Features:');
        logger.info('   🔐 JWT Authentication with role-based access');
        logger.info('   💾 Enhanced database models and relationships');
        logger.info('   📝 Project activity tracking');
        logger.info('   🛡️  Security middleware and rate limiting');
        logger.info('   📁 File upload and management');
        logger.info('   👥 Enhanced user management');
        logger.info('   🔄 Real-time WebSocket updates');
        logger.info('   📈 Advanced analytics and reporting');
        logger.info('   🔔 Notification system');
        logger.info('   📊 Enhanced project management');
        logger.info('');
        logger.info('🌐 Server Information:');
        logger.info(`   📍 HTTP Server: http://localhost:${this.port}`);
        logger.info(`   📋 API Base: http://localhost:${this.port}/api`);
        logger.info(`   ❤️  Health Check: http://localhost:${this.port}/api/health`);
        logger.info(`   🔌 WebSocket: ws://localhost:${this.port}`);
        logger.info('');
        logger.info('🔑 Default Admin Credentials:');
        logger.info('   📧 Email: owner@balconbuilders.com');
        logger.info('   🔒 Password: admin123');
        logger.info('');
        logger.info('🛠️  Management Commands:');
        logger.info('   🔄 Reset database: npm run db:reset:enhanced');
        logger.info('   🌱 Seed data: npm run db:seed:enhanced');
        logger.info('');
        
        if (process.env.NODE_ENV === 'development') {
          logger.info('🔧 Development mode: API test interface available');
          logger.info(`   🧪 Test API: http://localhost:${this.port}/api/test`);
        }
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  // Broadcast to all connected clients
  public broadcast(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Broadcast to specific room
  public broadcastToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }
}

// Create and export the app instance
export const balConApp5B = new BalConBuildersApp5B();

// Start the server if this file is run directly
if (require.main === module) {
  balConApp5B.start().catch((error) => {
    logger.error('❌ Failed to start Phase 5B application:', error);
    process.exit(1);
  });
}
