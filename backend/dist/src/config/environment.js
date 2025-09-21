"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv = __importStar(require("dotenv"));
// Load environment variables from .env file
dotenv.config();
// Provide required test defaults before validation when running under Jest
if (process.env.NODE_ENV === 'test') {
    // Use proper SQLite in-memory URL format
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite::memory:';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    process.env.PORT = process.env.PORT || '8082';
}
const envSchema = zod_1.z.object({
    // Include 'test' to support Jest environment without failing validation
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('8082'),
    // Make DATABASE_URL optional; we'll apply a fallback after parse
    DATABASE_URL: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string(),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    // Email configuration
    SENDGRID_API_KEY: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().default('noreply@balconbuilders.com'),
    ADMIN_EMAIL: zod_1.z.string().default('admin@balconbuilders.com'),
    // SMTP fallback configuration
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_SECURE: zod_1.z.string().optional(),
    // File upload configuration
    UPLOAD_PATH: zod_1.z.string().default('uploads/'),
    MAX_FILE_SIZE: zod_1.z.string().default('10485760'), // 10MB
    MAX_FILES: zod_1.z.string().default('10'),
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    GOOGLE_CLOUD_PROJECT: zod_1.z.string().optional(),
    GOOGLE_CLOUD_STORAGE_BUCKET: zod_1.z.string().optional(),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
const parseEnv = () => {
    try {
        const parsed = envSchema.parse(process.env);
        // Apply fallback for missing DATABASE_URL
        if (!parsed.DATABASE_URL) {
            const fallback = 'sqlite:./enhanced_database.sqlite';
            console.warn(`⚠️  DATABASE_URL not set. Falling back to ${fallback}`);
            parsed.DATABASE_URL = fallback;
        }
        return parsed;
    }
    catch (error) {
        console.error('❌ Invalid environment variables:', error);
        if (process.env.NODE_ENV === 'test') {
            throw error; // let tests fail naturally
        }
        process.exit(1);
    }
};
const env = parseEnv();
exports.config = {
    server: {
        port: parseInt(env.PORT),
        nodeEnv: env.NODE_ENV,
        corsOrigin: env.CORS_ORIGIN,
        baseUrl: env.NODE_ENV === 'production'
            ? 'https://api.balconbuilders.com'
            : `http://localhost:${parseInt(env.PORT)}`,
    },
    database: {
        url: env.DATABASE_URL,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000,
        },
    },
    redis: {
        url: env.REDIS_URL,
    },
    auth: {
        jwtSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
    },
    email: {
        sendgridApiKey: env.SENDGRID_API_KEY,
        fromEmail: env.EMAIL_FROM,
        adminEmail: env.ADMIN_EMAIL,
        smtp: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : 587,
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
            secure: env.SMTP_SECURE === 'true',
        },
    },
    upload: {
        path: env.UPLOAD_PATH,
        maxFileSize: parseInt(env.MAX_FILE_SIZE),
        maxFiles: parseInt(env.MAX_FILES),
    },
    sms: {
        twilioAccountSid: env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: env.TWILIO_AUTH_TOKEN,
    },
    storage: {
        projectId: env.GOOGLE_CLOUD_PROJECT,
        bucketName: env.GOOGLE_CLOUD_STORAGE_BUCKET,
    },
    logging: {
        level: env.LOG_LEVEL,
    },
};
