/**
 * Application error hierarchy. Provides typed, HTTP-status-aware errors
 * that can be thrown throughout the app and translated consistently
 * into API responses by the response/http layers.
 */

export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Base class for all application errors. Carries an HTTP status code,
 * a machine-readable error code, and optional structured details.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ErrorDetails;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details?: ErrorDetails,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): { error: { message: string; code: string; details?: ErrorDetails } } {
    return {
      error: {
        message: this.message,
        code: this.code,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: ErrorDetails) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: ErrorDetails) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: ErrorDetails) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: ErrorDetails) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", details?: ErrorDetails) {
    super(`${resource} not found`, 404, "NOT_FOUND", details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: ErrorDetails) {
    super(message, 409, "CONFLICT", details);
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds?: number;

  constructor(message = "Too many requests", retryAfterSeconds?: number, details?: ErrorDetails) {
    super(message, 429, "RATE_LIMITED", details);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class TimeoutError extends AppError {
  constructor(message = "Request timed out", details?: ErrorDetails) {
    super(message, 408, "TIMEOUT", details);
  }
}

export class ExternalServiceError extends AppError {
  readonly service: string;

  constructor(service: string, message?: string, details?: ErrorDetails) {
    super(message ?? `Upstream service "${service}" failed`, 502, "EXTERNAL_SERVICE_ERROR", details);
    this.service = service;
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error", details?: ErrorDetails) {
    super(message, 500, "INTERNAL_ERROR", details, false);
  }
}

/**
 * Type guard for AppError and its subclasses.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard distinguishing expected/operational errors (safe to expose to
 * clients) from unexpected programmer errors (should be logged + masked).
 */
export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

/**
 * Normalizes any thrown value into an AppError, wrapping unknown errors
 * as an opaque InternalError so internals are never leaked to clients.
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof Error) {
    const wrapped = new InternalError(error.message);
    wrapped.stack = error.stack;
    return wrapped;
  }

  return new InternalError(typeof error === "string" ? error : "An unknown error occurred");
}

/**
 * Duck-typed shape of a Zod issue, avoided importing "zod" directly here
 * since this package doesn't declare it as a direct dependency (validation
 * schemas live in @workspace/api-zod). Works with any ZodError-shaped object.
 */
interface ZodLikeIssue {
  path: Array<string | number>;
  message: string;
  code?: string;
}

interface ZodLikeError {
  issues: ZodLikeIssue[];
}

function isZodLikeError(error: unknown): error is ZodLikeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown }).issues)
  );
}

/**
 * Converts a ZodError (or any error shaped like one, e.g. from
 * `schema.parse()` in @workspace/api-zod) into a ValidationError with
 * field-level details, ready to be handed to response.ts's `failure()`.
 *
 * @example
 * try {
 *   const body = loginSchema.parse(req.body);
 * } catch (err) {
 *   throw fromZodError(err);
 * }
 */
export function fromZodError(error: unknown, message = "Validation failed"): ValidationError {
  if (!isZodLikeError(error)) {
    return new ValidationError(message);
  }

  const fieldErrors = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return new ValidationError(message, { fieldErrors });
}

/**
 * Type guard + rethrow helper: if `error` looks like a ZodError, throws it
 * as a ValidationError; otherwise rethrows the original error unchanged.
 * Handy in a single catch block that mixes Zod and other error sources.
 *
 * @example
 * catch (err) {
 *   rethrowIfZodError(err);
 *   throw normalizeError(err);
 * }
 */
export function rethrowIfZodError(error: unknown, message?: string): void {
  if (isZodLikeError(error)) {
    throw fromZodError(error, message);
  }
}

/**
 * Extracts a human-readable message from any thrown value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
