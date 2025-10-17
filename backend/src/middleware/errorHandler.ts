import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { appErrorsTotal } from '../monitoring/advancedMetrics';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message, stack } = error;

  logger.error('Error occurred:', {
    error: message,
    statusCode,
    stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  try { appErrorsTotal.inc({ type: statusCode >= 500 ? 'server' : 'client' }); } catch { /* ignore */ }

  const baseCode = statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'CLIENT_ERROR';
  const errorResponse: any = {
    success: false,
    error: {
      code: (error as any).code || baseCode,
      message: statusCode >= 500 ? 'Internal server error' : message,
    },
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId || (req as any).id || 'unknown',
  };

  // Optional meta passthrough (standard shape)
  if ((error as any).meta && typeof (error as any).meta === 'object') {
    errorResponse.error.meta = (error as any).meta;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      ...errorResponse.error,
      stack: stack,
    } as any;
  }

  res.status(statusCode).json(errorResponse);
};
