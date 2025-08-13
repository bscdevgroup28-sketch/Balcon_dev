import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

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

  const errorResponse = {
    success: false,
    error: {
      code: statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'CLIENT_ERROR',
      message: statusCode >= 500 ? 'Internal server error' : message,
    },
    timestamp: new Date().toISOString(),
    requestId: (req as any).id || 'unknown',
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      ...errorResponse.error,
      stack: stack,
    } as any;
  }

  res.status(statusCode).json(errorResponse);
};
