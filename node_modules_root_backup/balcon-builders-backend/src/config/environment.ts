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
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
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
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    if (process.env.NODE_ENV === 'test') {
      throw error; // let tests fail naturally
    }
    process.exit(1);
  }
};

const env = parseEnv();

export const config = {
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
