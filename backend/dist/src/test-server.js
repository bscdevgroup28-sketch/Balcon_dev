"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = require("./utils/logger");
const demo_1 = __importDefault(require("./routes/demo"));
const app = (0, express_1.default)();
exports.app = app;
// Trust proxy for Cloud Run
app.set('trust proxy', true);
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
}));
// Logging
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim())
    }
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Simple test routes without database
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        message: 'Bal-Con Builders API is running'
    });
});
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Bal-Con Builders API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: [
            '/health',
            '/api/test',
            '/api/test/data'
        ]
    });
});
app.get('/api/test/data', (req, res) => {
    res.json({
        users: [
            { id: 1, name: 'John Smith', email: 'john@example.com', role: 'admin' },
            { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'user' }
        ],
        projects: [
            { id: 1, title: 'Metal Warehouse Structure', type: 'commercial', status: 'in_progress' },
            { id: 2, title: 'Residential Garage', type: 'residential', status: 'quoted' }
        ],
        quotes: [
            { id: 1, projectId: 1, amount: 25000, status: 'accepted' },
            { id: 2, projectId: 2, amount: 8500, status: 'sent' }
        ]
    });
});
// Add demo routes
app.use('/api/demo', demo_1.default);
// Basic 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});
// Error handler
app.use((error, req, res, next) => {
    logger_1.logger.error('Error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});
const PORT = Number(process.env.PORT) || 3030;
const server = app.listen(PORT, '0.0.0.0', () => {
    logger_1.logger.info(`🚀 Server running on port ${PORT}`);
    logger_1.logger.info(`📝 Health check: http://localhost:${PORT}/health`);
    logger_1.logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    logger_1.logger.info(`📊 Test data: http://localhost:${PORT}/api/test/data`);
});
exports.server = server;
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('Received SIGTERM, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('Received SIGINT, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});
