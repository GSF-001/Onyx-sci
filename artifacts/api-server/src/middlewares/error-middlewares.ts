import { Request, Response, NextFunction } from 'express';
import { logger } from './loggerMiddleware';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, isOperational = true, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, true);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, true);
  }
}

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps async route handlers so rejected promises are forwarded to
 * errorMiddleware instead of crashing the process or hanging the request.
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Centralized error handler. Must be registered LAST, after all routes and
 * after notFoundMiddleware.
 */
export function errorMiddleware(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;

  const logPayload = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack,
  };

  if (statusCode >= 500 || !isOperational) {
    logger.error(logPayload, 'Unhandled error');
  } else {
    logger.warn(logPayload, 'Handled operational error');
  }

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: isOperational || !isProduction ? err.message : 'Internal server error',
      ...(isAppError && err.details ? { details: err.details } : {}),
      requestId: req.id,
      ...(!isProduction && !isOperational ? { stack: err.stack } : {}),
    },
  });
}

export default errorMiddleware;
