import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Attaches a unique request ID to every incoming request.
 * If the client already sent an X-Request-Id header (e.g. from an upstream
 * proxy or gateway), that value is reused for traceability. Otherwise a new
 * UUID is generated. The ID is echoed back on the response so clients can
 * correlate logs/support tickets.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers[REQUEST_ID_HEADER];

  const requestId =
    typeof incomingId === 'string' && incomingId.trim().length > 0
      ? incomingId.trim()
      : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}

export default requestIdMiddleware;
