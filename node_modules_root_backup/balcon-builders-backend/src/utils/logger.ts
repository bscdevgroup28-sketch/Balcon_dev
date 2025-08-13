import winston from 'winston';
import { config } from '../config/environment';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'balcon-builders-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Add Google Cloud Logging in production
if (config.server.nodeEnv === 'production') {
  // In production, Cloud Run automatically captures console logs
  logger.add(new winston.transports.Console({
    format: winston.format.json()
  }));
}
