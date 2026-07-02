import rateLimit, { Options, Store } from 'express-rate-limit';
import { Request, Response } from 'express';
import { TooManyRequestsError } from './error-middlewares';
import { logger } from './loggerMiddleware';

function rateLimitHandler(req: Request, res: Response): void {
  const error = new TooManyRequestsError('Too many requests, please try again later');
  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      requestId: req.id,
    },
  });
}

/**
 * Optional distributed store. If REDIS_URL is configured, rate limit
 * counters are shared across all instances of the app via Redis. Without
 * it, each process falls back to express-rate-limit's built-in in-memory
 * store, which is fine for a single instance / local dev.
 */
function buildStore(): Store | undefined {
  if (!process.env.REDIS_URL) return undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RedisStore } = require('rate-limit-redis');

    const redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on('error', (err: Error) => {
      logger.error({ err }, 'Redis rate-limit store connection error');
    });

    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
      prefix: 'rl:',
    });
  } catch (err) {
    logger.warn(
      { err },
      'REDIS_URL is set but ioredis/rate-limit-redis is not installed, falling back to in-memory store'
    );
    return undefined;
  }
}

const sharedStore = buildStore();

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req: Request) => req.ip ?? 'unknown',
  store: sharedStore,
};

/** General purpose limiter for most API routes. */
export const generalRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

/** Stricter limiter for auth endpoints (login, signup, password reset). */
export const authRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

/** Very strict limiter for sensitive/expensive operations. */
export const strictRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  limit: 5,
});

export default generalRateLimiter;
