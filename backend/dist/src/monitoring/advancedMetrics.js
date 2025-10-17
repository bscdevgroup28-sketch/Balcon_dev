"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedRegistry = exports.domainEventPersistDuration = exports.domainEventsTotal = exports.appErrorsTotal = exports.dbQueryDuration = exports.httpResponseSize = exports.httpRequestSize = exports.httpRequestsTotal = exports.httpRequestDuration = void 0;
exports.advancedHttpMetricsMiddleware = advancedHttpMetricsMiddleware;
const prom_client_1 = __importDefault(require("prom-client"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
// Feature toggle: allow disabling all advanced metrics (used for certain tests or minimal deployments)
const ADV_ENABLED = process.env.ADV_METRICS_ENABLED !== 'false';
// Disable default metrics unless desired (could enable here)
if (process.env.PROM_DEFAULT_METRICS === 'true') {
    prom_client_1.default.collectDefaultMetrics();
}
exports.httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});
exports.httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status']
});
exports.httpRequestSize = new prom_client_1.default.Histogram({
    name: 'http_request_size_bytes',
    help: 'Approximate request payload size',
    labelNames: ['method', 'route'],
    buckets: [100, 500, 1000, 5000, 20000, 50000, 200000]
});
exports.httpResponseSize = new prom_client_1.default.Histogram({
    name: 'http_response_size_bytes',
    help: 'Approximate response payload size',
    labelNames: ['method', 'route', 'status'],
    buckets: [100, 500, 1000, 5000, 20000, 50000, 200000]
});
exports.dbQueryDuration = new prom_client_1.default.Histogram({
    name: 'db_query_duration_seconds',
    help: 'DB query duration in seconds',
    labelNames: ['model', 'operation'],
    buckets: [0.001, 0.003, 0.007, 0.015, 0.03, 0.06, 0.12, 0.25, 0.5, 1]
});
exports.appErrorsTotal = new prom_client_1.default.Counter({
    name: 'app_errors_total',
    help: 'Application errors by type',
    labelNames: ['type']
});
exports.domainEventsTotal = new prom_client_1.default.Counter({
    name: 'domain_events_total',
    help: 'Count of domain events emitted',
    labelNames: ['event']
});
exports.domainEventPersistDuration = new prom_client_1.default.Histogram({
    name: 'domain_event_persist_duration_seconds',
    help: 'Duration to persist domain events (fire-and-forget path)',
    labelNames: ['event', 'outcome'],
    buckets: [0.001, 0.003, 0.007, 0.015, 0.03, 0.06, 0.12, 0.25, 0.5, 1]
});
exports.advancedRegistry = prom_client_1.default.register;
// Express middleware
function advancedHttpMetricsMiddleware(req, res, next) {
    if (!ADV_ENABLED) {
        return next();
    }
    const start = process.hrtime.bigint();
    const routePlaceholder = () => (req.route && req.route.path) || req.path || 'unknown';
    const method = req.method;
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    if (!isNaN(contentLength) && contentLength > 0) {
        exports.httpRequestSize.observe({ method, route: routePlaceholder() }, contentLength);
    }
    res.on('finish', () => {
        const diffNs = process.hrtime.bigint() - start;
        const seconds = Number(diffNs) / 1000000000;
        const status = res.statusCode.toString();
        const route = routePlaceholder();
        exports.httpRequestDuration.observe({ method, route, status }, seconds);
        exports.httpRequestsTotal.inc({ method, route, status });
        const respSize = Buffer.isBuffer(res.__body) ? res.__body.length : (typeof res.__body === 'string' ? Buffer.byteLength(res.__body) : 0);
        if (respSize > 0) {
            exports.httpResponseSize.observe({ method, route, status }, respSize);
        }
    });
    // Monkey patch res.send to capture body size
    const origSend = res.send;
    res.send = function (body) {
        try {
            res.__body = body;
        }
        catch { /* ignore */ }
        return origSend.call(this, body);
    };
    next();
}
// Sequelize query timing via before/after hooks
// We rely on dialect-level logging events; simpler instrumentation using CLS isn't configured
if (process.env.NODE_ENV !== 'test' && ADV_ENABLED) {
    const origQuery = database_1.sequelize.query.bind(database_1.sequelize);
    database_1.sequelize.query = async function (sql, options) {
        const start = process.hrtime.bigint();
        try {
            const result = await origQuery(sql, options);
            const diff = process.hrtime.bigint() - start;
            const seconds = Number(diff) / 1000000000;
            let model = 'raw';
            let operation = 'query';
            if (options && options.model) {
                model = options.model.name || 'model';
            }
            if (typeof sql === 'string') {
                const lowered = sql.trim().toLowerCase();
                if (lowered.startsWith('select'))
                    operation = 'select';
                else if (lowered.startsWith('insert'))
                    operation = 'insert';
                else if (lowered.startsWith('update'))
                    operation = 'update';
                else if (lowered.startsWith('delete'))
                    operation = 'delete';
            }
            exports.dbQueryDuration.observe({ model, operation }, seconds);
            return result;
        }
        catch (e) {
            const diff = process.hrtime.bigint() - start;
            const seconds = Number(diff) / 1000000000;
            exports.dbQueryDuration.observe({ model: 'error', operation: 'error' }, seconds);
            throw e;
        }
    };
}
if (ADV_ENABLED) {
    logger_1.logger.info('[metrics] Advanced metrics initialized');
}
else {
    logger_1.logger.info('[metrics] Advanced metrics disabled via ADV_METRICS_ENABLED flag');
}
