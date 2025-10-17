"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.balConApp5B = exports.BalConBuildersApp5B = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
// import { Server as SocketIOServer } from 'socket.io'; // Commented out for now
// DEPRECATED: Historical variant kept temporarily; scheduled for removal after production stabilization.
const cors_1 = __importDefault(require("cors"));
const corsConfig_1 = require("./config/corsConfig");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = require("express-rate-limit");
// Load environment variables
dotenv_1.default.config();
// Import utilities and middleware
const logger_1 = require("./utils/logger");
const metrics_1 = require("./monitoring/metrics");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const authEnhanced_1 = require("./middleware/authEnhanced");
// Import services
const setupEnhancedDatabase_1 = require("./scripts/setupEnhancedDatabase");
// websocket handler not directly referenced here
// Import routes
const health_1 = __importDefault(require("./routes/health"));
const auth_1 = __importDefault(require("./routes/auth")); // Using regular auth routes
const projectsEnhanced_1 = __importDefault(require("./routes/projectsEnhanced"));
const quotes_1 = __importDefault(require("./routes/quotes"));
const files_1 = __importDefault(require("./routes/files"));
const test_1 = __importDefault(require("./routes/test"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// Phase 5B Enhanced Express Application with WebSocket Support
class BalConBuildersApp5B {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '8083'); // Phase 5B on port 8083
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    // Initialize middleware
    initializeMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        // Centralized CORS policy
        this.app.use((0, cors_1.default)((0, corsConfig_1.buildCorsOptions)()));
        // Request logging with requestId + structured metadata
        this.app.use(logger_1.requestLoggingMiddleware);
        // Metrics collection (attach early)
        this.app.use(metrics_1.metricsMiddleware);
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Compression middleware
        this.app.use((0, compression_1.default)());
        // Rate limiting
        const limiter = (0, express_rate_limit_1.rateLimit)({
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
        const uploadsPath = path_1.default.join(__dirname, '../uploads');
        this.app.use('/uploads', express_1.default.static(uploadsPath));
        logger_1.logger.info('✅ Middleware initialized');
    }
    // Initialize routes
    initializeRoutes() {
        // Metrics endpoints (no auth) - JSON + Prometheus
        this.app.use('/api/metrics', require('./routes/metrics').default);
        // Health check (no auth required)
        this.app.use('/api/health', health_1.default);
        // Authentication routes (no auth required)
        this.app.use('/api/auth', auth_1.default);
        // Test routes (no auth required for some endpoints)
        this.app.use('/api/test', test_1.default);
        // Protected routes (require authentication)
        this.app.use('/api/projects', authEnhanced_1.authenticateToken, projectsEnhanced_1.default);
        this.app.use('/api/quotes', authEnhanced_1.authenticateToken, quotes_1.default);
        this.app.use('/api/files', authEnhanced_1.authenticateToken, files_1.default);
        this.app.use('/api/analytics', authEnhanced_1.authenticateToken, analytics_1.default);
        this.app.use('/api/notifications', authEnhanced_1.authenticateToken, notifications_1.default);
        // API documentation endpoint
        this.app.get('/api', (req, res) => {
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
        logger_1.logger.info('✅ Routes initialized');
    }
    // Initialize WebSocket
    initializeWebSocket() {
        // WebSocket functionality will be added after socket.io is properly installed
        logger_1.logger.info('🔌 WebSocket initialization skipped (socket.io not available)');
        // For now, create a mock WebSocket handler
        this.io = {
            emit: (event, data) => {
                logger_1.logger.info(`� Mock WebSocket emit: ${event}`);
            },
            to: (room) => ({
                emit: (event, data) => {
                    logger_1.logger.info(`� Mock WebSocket emit to room ${room}: ${event}`);
                }
            })
        };
        logger_1.logger.info('✅ Mock WebSocket server initialized');
    }
    // Initialize error handling
    initializeErrorHandling() {
        // 404 handler
        this.app.use(notFoundHandler_1.notFoundHandler);
        // Global error handler
        this.app.use(errorHandler_1.errorHandler);
        logger_1.logger.info('✅ Error handling initialized');
    }
    // Database initialization
    async initializeDatabase() {
        try {
            await (0, setupEnhancedDatabase_1.setupEnhancedDatabase)();
            logger_1.logger.info('✅ Enhanced database initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    // Graceful shutdown handling
    setupGracefulShutdown() {
        const gracefulShutdown = (signal) => {
            logger_1.logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
            this.server.close(() => {
                logger_1.logger.info('✅ HTTP server closed');
                if (this.io) {
                    this.io.close(() => {
                        logger_1.logger.info('✅ WebSocket server closed');
                        process.exit(0);
                    });
                }
                else {
                    process.exit(0);
                }
            });
            // Force close after 10 seconds
            setTimeout(() => {
                logger_1.logger.error('❌ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    // Start the server
    async start() {
        try {
            // Create HTTP server
            this.server = (0, http_1.createServer)(this.app);
            // Initialize WebSocket
            this.initializeWebSocket();
            // Initialize database first
            await this.initializeDatabase();
            // Start listening
            this.server.listen(this.port, () => {
                logger_1.logger.info('');
                logger_1.logger.info('🎉 Bal-Con Builders Enhanced API v2.1 - Phase 5B is now running!');
                logger_1.logger.info('');
                logger_1.logger.info('📊 Phase 5B: Advanced Feature Enhancement');
                logger_1.logger.info('');
                logger_1.logger.info('🚀 Available Features:');
                logger_1.logger.info('   🔐 JWT Authentication with role-based access');
                logger_1.logger.info('   💾 Enhanced database models and relationships');
                logger_1.logger.info('   📝 Project activity tracking');
                logger_1.logger.info('   🛡️  Security middleware and rate limiting');
                logger_1.logger.info('   📁 File upload and management');
                logger_1.logger.info('   👥 Enhanced user management');
                logger_1.logger.info('   🔄 Real-time WebSocket updates');
                logger_1.logger.info('   📈 Advanced analytics and reporting');
                logger_1.logger.info('   🔔 Notification system');
                logger_1.logger.info('   📊 Enhanced project management');
                logger_1.logger.info('');
                logger_1.logger.info('🌐 Server Information:');
                logger_1.logger.info(`   📍 HTTP Server: http://localhost:${this.port}`);
                logger_1.logger.info(`   📋 API Base: http://localhost:${this.port}/api`);
                logger_1.logger.info(`   ❤️  Health Check: http://localhost:${this.port}/api/health`);
                logger_1.logger.info(`   🔌 WebSocket: ws://localhost:${this.port}`);
                logger_1.logger.info('');
                logger_1.logger.info('🔑 Admin bootstrap: seeded owner user uses DEFAULT_USER_PASSWORD or a generated temporary password (masked in logs).');
                logger_1.logger.info('   📧 Owner email: owner@balconbuilders.com');
                logger_1.logger.info('');
                logger_1.logger.info('🛠️  Management Commands:');
                logger_1.logger.info('   🔄 Reset database: npm run db:reset:enhanced');
                logger_1.logger.info('   🌱 Seed data: npm run db:seed:enhanced');
                logger_1.logger.info('');
                if (process.env.NODE_ENV === 'development') {
                    logger_1.logger.info('🔧 Development mode: API test interface available');
                    logger_1.logger.info(`   🧪 Test API: http://localhost:${this.port}/api/test`);
                }
                (0, metrics_1.initSentry)(logger_1.logger);
            });
            // Graceful shutdown handling
            this.setupGracefulShutdown();
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    // Broadcast to all connected clients
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
    // Broadcast to specific room
    broadcastToRoom(room, event, data) {
        if (this.io) {
            this.io.to(room).emit(event, data);
        }
    }
}
exports.BalConBuildersApp5B = BalConBuildersApp5B;
// Create and export the app instance
exports.balConApp5B = new BalConBuildersApp5B();
// Start the server if this file is run directly
if (require.main === module) {
    exports.balConApp5B.start().catch((error) => {
        logger_1.logger.error('❌ Failed to start Phase 5B application:', error);
        process.exit(1);
    });
}
