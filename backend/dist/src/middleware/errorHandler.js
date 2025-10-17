"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
const advancedMetrics_1 = require("../monitoring/advancedMetrics");
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    const { statusCode = 500, message, stack } = error;
    logger_1.logger.error('Error occurred:', {
        error: message,
        statusCode,
        stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    try {
        advancedMetrics_1.appErrorsTotal.inc({ type: statusCode >= 500 ? 'server' : 'client' });
    }
    catch { /* ignore */ }
    const baseCode = statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'CLIENT_ERROR';
    const errorResponse = {
        success: false,
        error: {
            code: error.code || baseCode,
            message: statusCode >= 500 ? 'Internal server error' : message,
        },
        statusCode,
        timestamp: new Date().toISOString(),
        requestId: req.requestId || req.id || 'unknown',
    };
    // Optional meta passthrough (standard shape)
    if (error.meta && typeof error.meta === 'object') {
        errorResponse.error.meta = error.meta;
    }
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error = {
            ...errorResponse.error,
            stack: stack,
        };
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
