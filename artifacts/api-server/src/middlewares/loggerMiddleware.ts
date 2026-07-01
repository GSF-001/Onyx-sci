import pino from 'pino';
import pinoHttp from 'pino-http';
import { Request, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Shared application logger. Import { logger } anywhere you need structured
 * logging (services, error handlers, workers, etc).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.secret',
    ],
    censor: '[REDACTED]',
  },
});

/**
 * HTTP request/response logger. Must run AFTER requestIdMiddleware so that
 * req.id is already populated when genReqId reads it.
 */
export const loggerMiddleware = pinoHttp({
  logger,
  genReqId: (req: Request) => req.id,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req: Request, res: Response) => {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage: (req: Request, res: Response, err: Error) => {
    return `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`;
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export default loggerMiddleware;
