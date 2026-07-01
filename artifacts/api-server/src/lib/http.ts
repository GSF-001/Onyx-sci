/**
 * Thin, dependency-free HTTP client wrapper around fetch: JSON handling,
 * timeouts, retries, and typed errors for both request setup failures and
 * non-2xx responses.
 */
import { ExternalServiceError, TimeoutError } from "./errors.js";
import { isRetryableStatus, retry, type RetryOptions } from "./retry.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface HttpRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  retry?: RetryOptions | false;
  signal?: AbortSignal;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export class HttpError extends ExternalServiceError {
  readonly status: number;
  readonly url: string;
  readonly body: unknown;

  constructor(url: string, status: number, body: unknown, message?: string) {
    super("http", message ?? `HTTP ${status} for ${url}`, { status, url });
    this.name = "HttpError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

function buildUrlWithQuery(url: string, query?: HttpRequestOptions["query"]): string {
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  if (!qs) return url;
  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  if (contentType.includes("text/")) {
    return response.text();
  }
  return response.arrayBuffer();
}

async function executeRequest<T>(url: string, options: HttpRequestOptions): Promise<HttpResponse<T>> {
  const { method = "GET", headers = {}, body, timeoutMs = 30000, signal } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`)), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  const isJsonBody = body !== undefined && typeof body === "object" && !(body instanceof FormData) && !(body instanceof ArrayBuffer);

  const finalHeaders: Record<string, string> = { ...headers };
  if (isJsonBody && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
      signal: controller.signal,
    });

    const parsedBody = await parseBody(response);

    if (!response.ok) {
      throw new HttpError(url, response.status, parsedBody);
    }

    return { data: parsedBody as T, status: response.status, headers: response.headers };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (controller.signal.aborted && controller.signal.reason instanceof TimeoutError) {
      throw controller.signal.reason;
    }
    throw new ExternalServiceError("http", error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Performs an HTTP request with JSON handling, timeout, and optional retry.
 * Non-2xx responses throw HttpError; network/timeout failures throw
 * ExternalServiceError/TimeoutError.
 */
export async function request<T>(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
  const fullUrl = buildUrlWithQuery(url, options.query);
  const retryOptions = options.retry;

  if (retryOptions === false) {
    return executeRequest<T>(fullUrl, options);
  }

  return retry(() => executeRequest<T>(fullUrl, options), {
    attempts: 3,
    baseDelayMs: 300,
    shouldRetry: (error) => error instanceof HttpError && isRetryableStatus(error.status),
    ...retryOptions,
  });
}

export const http = {
  get: <T>(url: string, options: Omit<HttpRequestOptions, "method" | "body"> = {}) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, body?: unknown, options: Omit<HttpRequestOptions, "method" | "body"> = {}) =>
    request<T>(url, { ...options, method: "POST", body }),

  put: <T>(url: string, body?: unknown, options: Omit<HttpRequestOptions, "method" | "body"> = {}) =>
    request<T>(url, { ...options, method: "PUT", body }),

  patch: <T>(url: string, body?: unknown, options: Omit<HttpRequestOptions, "method" | "body"> = {}) =>
    request<T>(url, { ...options, method: "PATCH", body }),

  delete: <T>(url: string, options: Omit<HttpRequestOptions, "method" | "body"> = {}) =>
    request<T>(url, { ...options, method: "DELETE" }),
};

/**
 * Creates an HTTP client bound to a base URL and default headers/options,
 * useful for building typed SDKs for a specific API.
 */
export function createHttpClient(baseUrl: string, defaultOptions: HttpRequestOptions = {}) {
  const trimmedBase = baseUrl.replace(/\/+$/, "");

  const merge = (path: string, options: HttpRequestOptions): [string, HttpRequestOptions] => {
    const url = `${trimmedBase}/${path.replace(/^\/+/, "")}`;
    return [
      url,
      {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers },
      },
    ];
  };

  return {
    get: <T>(path: string, options: Omit<HttpRequestOptions, "method" | "body"> = {}) => {
      const [url, merged] = merge(path, options);
      return request<T>(url, { ...merged, method: "GET" });
    },
    post: <T>(path: string, body?: unknown, options: Omit<HttpRequestOptions, "method" | "body"> = {}) => {
      const [url, merged] = merge(path, options);
      return request<T>(url, { ...merged, method: "POST", body });
    },
    put: <T>(path: string, body?: unknown, options: Omit<HttpRequestOptions, "method" | "body"> = {}) => {
      const [url, merged] = merge(path, options);
      return request<T>(url, { ...merged, method: "PUT", body });
    },
    patch: <T>(path: string, body?: unknown, options: Omit<HttpRequestOptions, "method" | "body"> = {}) => {
      const [url, merged] = merge(path, options);
      return request<T>(url, { ...merged, method: "PATCH", body });
    },
    delete: <T>(path: string, options: Omit<HttpRequestOptions, "method" | "body"> = {}) => {
      const [url, merged] = merge(path, options);
      return request<T>(url, { ...merged, method: "DELETE" });
    },
  };
}
