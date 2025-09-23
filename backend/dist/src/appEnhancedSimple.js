"use strict";
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
const metrics_1 = require("./monitoring/metrics");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
// Import services
const setupEnhancedDatabase_1 = require("./scripts/setupEnhancedDatabase");
// Import routes
const health_1 = __importDefault(require("./routes/health"));
const authEnhanced_1 = __importDefault(require("./routes/authEnhanced"));
const projects_1 = __importDefault(require("./routes/projects"));
const quotes_1 = __importDefault(require("./routes/quotes"));
const files_1 = __importDefault(require("./routes/files"));
const test_1 = __importDefault(require("./routes/test"));
// Simplified Enhanced Express Application (without WebSocket for now)
class BalConBuildersApp {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '8082');
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
                    connectSrc: ["'self'", "ws:", "wss:"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        // CORS configuration
        this.app.use((0, cors_1.default)({
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
        const limiter = (0, express_rate_limit_1.rateLimit)({
            windowMs: 15 * 60 * 1000,
            max: 1000,
            message: { error: 'Too many requests from this IP, please try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);
        // Stricter auth limiter
        const authLimiter = (0, express_rate_limit_1.rateLimit)({
            windowMs: 15 * 60 * 1000,
            max: 5,
            message: { error: 'Too many authentication attempts, please try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/auth', authLimiter);
        // Metrics middleware early
        this.app.use(metrics_1.metricsMiddleware);
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Structured request logging
        this.app.use(logger_1.requestLoggingMiddleware);
        // Static file serving
        this.app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
        // Trust proxy for accurate IP addresses (important for rate limiting)
        this.app.set('trust proxy', 1);
        logger_1.logger.info('✅ Middleware initialized');
    }
    // Initialize routes
    initializeRoutes() {
        // API routes
        this.app.use('/api/metrics', require('./routes/metrics').default);
        this.app.use('/api/health', health_1.default);
        this.app.use('/api/auth', authEnhanced_1.default);
        this.app.use('/api/projects', projects_1.default);
        this.app.use('/api/quotes', quotes_1.default);
        this.app.use('/api/files', files_1.default);
        this.app.use('/api/test', test_1.default);
        // API status endpoint
        this.app.get('/api', (req, res) => {
            res.json({
                success: true,
                message: 'Bal-Con Builders API v2.0 - Enhanced Edition (No WebSocket)',
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                features: [
                    'Enhanced Authentication',
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
    // Start the server
    async start() {
        try {
            // Create HTTP server
            this.server = (0, http_1.createServer)(this.app);
            // Initialize database first
            await this.initializeDatabase();
            // Start listening
            this.server.listen(this.port, () => {
                logger_1.logger.info(`🚀 Bal-Con Builders Enhanced API Server started successfully!`);
                logger_1.logger.info(`📍 Server running on port ${this.port}`);
                logger_1.logger.info(`🌐 API available at: http://localhost:${this.port}/api`);
                logger_1.logger.info(`📋 Health check: http://localhost:${this.port}/api/health`);
                logger_1.logger.info(`🔐 Authentication: enhanced with JWT`);
                logger_1.logger.info(`📊 Enhanced features: enabled`);
                logger_1.logger.info(`⚠️  WebSocket: disabled (socket.io not available)`);
                if (process.env.NODE_ENV === 'development') {
                    logger_1.logger.info(`🔧 Development mode: API test interface available`);
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
