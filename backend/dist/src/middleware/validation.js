"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const validate = (schema) => {
    return async (req, res, next) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                logger_1.logger.warn('Validation error', {
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
            logger_1.logger.error('Unexpected validation error', error);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'An unexpected error occurred during validation',
            });
        }
    };
};
exports.validate = validate;
exports.default = exports.validate;
