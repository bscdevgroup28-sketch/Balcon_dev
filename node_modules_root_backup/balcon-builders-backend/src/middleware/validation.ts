import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface ValidatedRequest<T = any, U = any, V = any> extends Request {
  validatedBody?: T;
  validatedQuery?: U;
  validatedParams?: V;
}

export const validate = (schema: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) => {
  return async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.validatedBody = await schema.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.validatedQuery = await schema.query.parseAsync(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.validatedParams = await schema.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Validation error', {
          path: req.path,
          method: req.method,
          errors: validationErrors,
          body: req.body,
          query: req.query,
          params: req.params,
        });

        return res.status(400).json({
          error: 'Validation Error',
          message: 'The request data is invalid',
          details: validationErrors,
        });
      }

      logger.error('Unexpected validation error', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
};

export default validate;
