import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import logger from '../lib/logger';

// Global error handler — must be registered AFTER all routes
export function globalErrorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
    }

    logger.error({
        err,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    }, 'Unhandled error');

    // Don't leak internal details in production
    const message =
        process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message;

    res.status(500).json({ error: message });
}

// Catch unhandled promise rejections at the process level
export function registerProcessHandlers(): void {
    process.on('unhandledRejection', (reason) => {
        logger.fatal({ reason }, 'Unhandled Promise Rejection — shutting down');
        process.exit(1);
    });

    process.on('uncaughtException', (err) => {
        logger.fatal({ err }, 'Uncaught Exception — shutting down');
        process.exit(1);
    });
}
