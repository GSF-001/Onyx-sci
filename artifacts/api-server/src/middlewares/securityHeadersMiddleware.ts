import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sets hardened HTTP security headers (CSP, HSTS, X-Frame-Options, etc).
 * CSP and HSTS are relaxed in non-production environments so local dev
 * tooling (hot reload, http localhost) keeps working.
 */
export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: isProduction
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: isProduction
    ? {
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
      }
    : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
});

export default securityHeadersMiddleware;
