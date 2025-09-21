"use strict";
// Security Configuration
// Centralizes all security-related settings
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECURITY_CONFIG = void 0;
exports.SECURITY_CONFIG = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        algorithm: 'HS256'
    },
    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
        optionsSuccessStatus: 200
    },
    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
    },
    // File Upload Security
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
        maxFiles: parseInt(process.env.MAX_FILES || '10'),
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'application/x-autocad',
            'application/dwg'
        ],
        sanitizeFileName: true,
        preserveExtension: true
    },
    // Password Requirements
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
    },
    // Session Configuration
    session: {
        name: 'balcon.sid',
        secret: process.env.SESSION_SECRET || 'fallback-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    },
    // Content Security Policy
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "http://localhost:8082"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    // API Security Headers
    headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
};
exports.default = exports.SECURITY_CONFIG;
