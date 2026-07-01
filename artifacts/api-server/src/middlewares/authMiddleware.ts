import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { UnauthorizedError, asyncHandler } from './errorMiddleware';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        orgId?: string;
        orgRole?: string;
      };
    }
  }
}

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

/**
 * Requires a valid Clerk session token in the Authorization header.
 * Rejects the request with 401 if missing/invalid/expired.
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }

  const token = extractBearerToken(req);
  if (!token) {
    throw new UnauthorizedError('Missing bearer token');
  }

  try {
    const verified = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
    });

    req.auth = {
      userId: verified.sub,
      sessionId: typeof verified.sid === 'string' ? verified.sid : '',
      orgId: typeof verified.org_id === 'string' ? verified.org_id : undefined,
      orgRole: typeof verified.org_role === 'string' ? verified.org_role : undefined,
    };

    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired session token');
  }
});

/**
 * Same as requireAuth, but never rejects the request. If a valid token is
 * present req.auth is populated; otherwise the request continues
 * unauthenticated. Useful for routes with public + personalized views.
 */
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);

  if (!token || !CLERK_SECRET_KEY) {
    next();
    return;
  }

  try {
    const verified = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    req.auth = {
      userId: verified.sub,
      sessionId: typeof verified.sid === 'string' ? verified.sid : '',
      orgId: typeof verified.org_id === 'string' ? verified.org_id : undefined,
      orgRole: typeof verified.org_role === 'string' ? verified.org_role : undefined,
    };
  } catch {
    // Optional auth: silently ignore invalid tokens and continue unauthenticated
  }

  next();
});

/** Restricts access to users whose Clerk org role is in allowedRoles. */
export function requireOrgRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!req.auth.orgRole || !allowedRoles.includes(req.auth.orgRole)) {
      next(new UnauthorizedError('Insufficient organization role'));
      return;
    }

    next();
  };
}

export default requireAuth;
