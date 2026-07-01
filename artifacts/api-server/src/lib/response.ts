/**
 * Standardized API response envelope helpers.
 * Ensures every endpoint returns a consistent success/error shape.
 */
import { AppError, normalizeError } from "./errors.js";

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface HttpEnvelope {
  status: number;
  body: ApiResponse<unknown>;
}

/**
 * Builds a successful response envelope.
 */
export function success<T>(data: T, meta?: ResponseMeta): SuccessResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

/**
 * Builds an error response envelope from an AppError or arbitrary thrown value.
 */
export function failure(error: unknown): ErrorResponse {
  const appError = normalizeError(error);
  return {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      ...(appError.details ? { details: appError.details } : {}),
    },
  };
}

/**
 * Builds a complete HTTP envelope (status code + body) from any thrown value
 * or data, suitable for handing directly to a framework's response object.
 */
export function toHttpEnvelope<T>(result: { data: T } | { error: unknown }): HttpEnvelope {
  if ("error" in result) {
    const appError = normalizeError(result.error);
    return { status: appError.statusCode, body: failure(appError) };
  }
  return { status: 200, body: success(result.data) };
}

/**
 * Builds a paginated success response with computed meta fields.
 */
export function paginated<T>(
  items: T[],
  options: { page: number; pageSize: number; total: number }
): SuccessResponse<T[]> {
  const { page, pageSize, total } = options;
  return success(items, {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

/**
 * Type guard for narrowing an ApiResponse to its success variant.
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard for narrowing an ApiResponse to its error variant.
 */
export function isErrorResponse<T>(response: ApiResponse<T>): response is ErrorResponse {
  return response.success === false;
}

/**
 * Unwraps an ApiResponse, returning `data` on success or throwing an
 * AppError reconstructed from the error envelope on failure.
 * Useful on the client side when consuming your own API.
 */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) return response.data;
  throw new AppError(response.error.message, 500, response.error.code, response.error.details);
}
