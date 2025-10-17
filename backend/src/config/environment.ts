import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Provide required test defaults before validation when running under Jest
if (process.env.NODE_ENV === 'test') {
  // Use proper SQLite in-memory URL format
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite::memory:';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  process.env.PORT = process.env.PORT || '8082';
}

const envSchema = z.object({
  // Include 'test' to support Jest environment without failing validation
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default('8082'),
  // Make DATABASE_URL optional; we'll apply a fallback after parse
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().optional(),
  FRONTEND_ORIGINS: z.string().optional(),
  
  // Email configuration
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@balconbuilders.com'),
  ADMIN_EMAIL: z.string().default('admin@balconbuilders.com'),
  
  // SMTP fallback configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  
  // File upload configuration
  UPLOAD_PATH: z.string().default('uploads/'),
  MAX_FILE_SIZE: z.string().default('10485760'), // 10MB
  MAX_FILES: z.string().default('10'),
  
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_CLOUD_STORAGE_BUCKET: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  // Health behavior: allow degraded 200 responses when DB is down (to avoid platform restarts)
  HEALTH_DEGRADED_OK: z.string().optional(),
  // Observability toggles
  ADV_METRICS_ENABLED: z.string().optional(),
  PROM_DEFAULT_METRICS: z.string().optional(),
  // Rate limiting / brute force controls
  AUTH_MAX_ATTEMPTS_WINDOW: z.string().optional(),
  AUTH_ATTEMPT_WINDOW_MS: z.string().optional(),
  AUTH_BASE_LOCK_MS: z.string().optional(),
  AUTH_MAX_LOCK_MS: z.string().optional(),
  GLOBAL_RATE_LIMIT_WINDOW_MS: z.string().optional(),
  GLOBAL_RATE_LIMIT_MAX: z.string().optional(),
  REFRESH_TOKEN_RETENTION_DAYS: z.string().optional(),
  REFRESH_TOKEN_CLEANUP_INTERVAL_MS: z.string().optional(),
});

const parseEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);
    // Apply fallback for missing DATABASE_URL
    if (!parsed.DATABASE_URL) {
      const fallback = 'sqlite:./enhanced_database.sqlite';
      console.warn(`⚠️  DATABASE_URL not set. Falling back to ${fallback}`);
      (parsed as any).DATABASE_URL = fallback;
    }
    return parsed;
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    if (process.env.NODE_ENV === 'test') {
      throw error; // let tests fail naturally
    }
    process.exit(1);
  }
};

const env = parseEnv();

// Production safety guard: disallow SQLite in production unless explicitly overridden for demos
const allowSqliteInProd = (process.env.ALLOW_SQLITE_IN_PROD || '').toLowerCase() === '1' || (process.env.ALLOW_SQLITE_IN_PROD || '').toLowerCase() === 'true';
if (env.NODE_ENV === 'production' && env.DATABASE_URL && env.DATABASE_URL.startsWith('sqlite') && !allowSqliteInProd) {
  console.error('❌ Refusing to start: DATABASE_URL is using sqlite in production. Set a Postgres DATABASE_URL or set ALLOW_SQLITE_IN_PROD=1 for demo.');
  process.exit(1);
}

// Derive frontend origins list (comma separated) prioritizing FRONTEND_ORIGINS > FRONTEND_URL > defaults
const derivedFrontendOrigins = (() => {
  const list: string[] = [];
  if (env.FRONTEND_ORIGINS) {
    env.FRONTEND_ORIGINS.split(',').map(v => v.trim()).filter(Boolean).forEach(v => list.push(v));
  } else if (env.FRONTEND_URL) {
    list.push(env.FRONTEND_URL.trim());
  }
  // Development defaults
  if (!list.length && env.NODE_ENV !== 'production') {
    list.push('http://localhost:3000', 'http://localhost:3001');
  }
  return Array.from(new Set(list));
})();

// Enforce no wildcard origin in production
if (env.NODE_ENV === 'production') {
  if (derivedFrontendOrigins.some(o => o === '*' || o === 'http://localhost:3000')) {
    console.error('❌ Refusing to start: In production you must configure FRONTEND_ORIGINS (no * or localhost).');
    process.exit(1);
  }
  if (!derivedFrontendOrigins.length) {
    console.error('❌ Refusing to start: No FRONTEND_URL / FRONTEND_ORIGINS specified for CORS in production.');
    process.exit(1);
  }
}

export const config = {
  server: {
    port: parseInt(env.PORT),
    nodeEnv: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
    baseUrl: env.NODE_ENV === 'production' 
      ? 'https://api.balconbuilders.com' 
      : `http://localhost:${parseInt(env.PORT)}`,
    frontendOrigins: derivedFrontendOrigins,
  },
  database: {
    url: env.DATABASE_URL,
    pool: (() => {
      const base = {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      };
      // Allow overrides via env for scaling without code deploy
      const envMax = process.env.DB_POOL_MAX && !isNaN(Number(process.env.DB_POOL_MAX)) ? Number(process.env.DB_POOL_MAX) : undefined;
      const envMin = process.env.DB_POOL_MIN && !isNaN(Number(process.env.DB_POOL_MIN)) ? Number(process.env.DB_POOL_MIN) : undefined;
      const envIdle = process.env.DB_POOL_IDLE && !isNaN(Number(process.env.DB_POOL_IDLE)) ? Number(process.env.DB_POOL_IDLE) : undefined;
      const envAcquire = process.env.DB_POOL_ACQUIRE && !isNaN(Number(process.env.DB_POOL_ACQUIRE)) ? Number(process.env.DB_POOL_ACQUIRE) : undefined;

      const nodeEnv = env.NODE_ENV;
      if (nodeEnv === 'production') {
        base.max = 5; // keep within managed Postgres connection limits
        base.min = 0;
        base.acquire = 120000; // allow cold starts / resumed databases extra time
        base.idle = 15000;
      } else if (nodeEnv === 'test') {
        base.max = 2; base.min = 0; base.idle = 2000; base.acquire = 5000; // keep test lightweight
      } else if (nodeEnv === 'development') {
        base.max = 10; base.min = 2; // avoid exhausting local DB
      }

      return {
        max: envMax ?? base.max,
        min: envMin ?? base.min,
        idle: envIdle ?? base.idle,
        acquire: envAcquire ?? base.acquire,
      };
    })(),
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
  features: {
    advancedMetrics: env.ADV_METRICS_ENABLED !== 'false',
    promDefault: env.PROM_DEFAULT_METRICS === 'true'
  },
  limits: {
    auth: {
      maxAttempts: parseInt(process.env.AUTH_MAX_ATTEMPTS_WINDOW || '5'),
      windowMs: parseInt(process.env.AUTH_ATTEMPT_WINDOW_MS || `${15 * 60 * 1000}`),
      baseLockMs: parseInt(process.env.AUTH_BASE_LOCK_MS || '300000'),
      maxLockMs: parseInt(process.env.AUTH_MAX_LOCK_MS || `${60 * 60 * 1000}`)
    },
    global: {
      windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS || '60000'),
      max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || '900')
    }
  }
  ,tokens: {
    refreshRetentionDays: parseInt(process.env.REFRESH_TOKEN_RETENTION_DAYS || '30'),
    refreshCleanupIntervalMs: parseInt(process.env.REFRESH_TOKEN_CLEANUP_INTERVAL_MS || `${6 * 60 * 60 * 1000}`) // 6h default
  }
};

// Simple runtime self-check (can be expanded later)
export function validateRuntime(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  // Re-read critical secrets directly from process.env so tests can simulate removal
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') errors.push('JWT secret missing');
  if (!config.database.url) errors.push('Database URL missing');
  if (config.limits.auth.maxAttempts < 3) errors.push('Auth max attempts too low (<3)');
  return { ok: errors.length === 0, errors };
}
