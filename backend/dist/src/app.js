"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_1 = require("./config/environment");
const logger_1 = require("./utils/logger");
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
const materials_1 = __importDefault(require("./routes/materials"));
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
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Compression
app.use((0, compression_1.default)());
// Logging
if (environment_1.config.server.nodeEnv !== 'production') {
    app.use((0, morgan_1.default)('combined', {
        stream: {
            write: (message) => logger_1.logger.info(message.trim())
        }
    }));
}
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
app.use('/api/materials', materials_1.default);
// Error handling
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
