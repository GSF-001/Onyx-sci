import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from './error-middlewares';

/**
 * Catches any request that didn't match a defined route and forwards a
 * NotFoundError to errorMiddleware. Register this AFTER all routes and
 * BEFORE errorMiddleware.
 */
export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

export default notFoundMiddleware;
