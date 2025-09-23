"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCorsOptions = buildCorsOptions;
const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001'
];
function buildCorsOptions() {
    const extra = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
    const origins = [...new Set([...defaultOrigins, ...extra])];
    return {
        origin: function (origin, callback) {
            if (!origin || origins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        maxAge: 600
    };
}
