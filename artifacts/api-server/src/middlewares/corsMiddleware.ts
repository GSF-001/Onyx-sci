import cors, { CorsOptions } from 'cors';
import { UnauthorizedError } from './errorMiddleware';

// Comma separated list of allowed origins, e.g:
// CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isDevelopment = process.env.NODE_ENV !== 'production';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // No Origin header: same-origin requests, curl, server-to-server, mobile apps
    if (!origin) {
      callback(null, true);
      return;
    }

    if (isDevelopment && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new UnauthorizedError(`Origin ${origin} is not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400, // cache preflight response for 24h
};

export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
