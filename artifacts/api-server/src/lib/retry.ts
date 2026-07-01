/**
 * Retry utilities with configurable backoff strategies.
 */
import { sleep } from "./sleep.js";

export interface RetryOptions {
  /** Maximum number of attempts, including the first. Defaults to 3. */
  attempts?: number;
  /** Base delay in ms between attempts. Defaults to 300. */
  baseDelayMs?: number;
  /** Maximum delay cap in ms. Defaults to 10000. */
  maxDelayMs?: number;
  /** Backoff strategy. Defaults to "exponential". */
  backoff?: "fixed" | "linear" | "exponential";
  /** Add randomized jitter to each delay to avoid thundering herd. Defaults to true. */
  jitter?: boolean;
  /** Predicate to decide whether an error should trigger a retry. Defaults to always retry. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Called before each retry delay, useful for logging. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  /** Abort signal to cancel retrying early. */
  signal?: AbortSignal;
}

export class RetryError extends Error {
  readonly attempts: number;
  readonly lastError: unknown;

  constructor(attempts: number, lastError: unknown) {
    const reason = lastError instanceof Error ? lastError.message : String(lastError);
    super(`Failed after ${attempts} attempt(s): ${reason}`);
    this.name = "RetryError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

function computeDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  backoff: NonNullable<RetryOptions["backoff"]>,
  jitter: boolean
): number {
  let delay: number;
  switch (backoff) {
    case "fixed":
      delay = baseDelayMs;
      break;
    case "linear":
      delay = baseDelayMs * attempt;
      break;
    case "exponential":
    default:
      delay = baseDelayMs * Math.pow(2, attempt - 1);
      break;
  }

  delay = Math.min(delay, maxDelayMs);

  if (jitter) {
    // Full jitter: random value between 0 and computed delay.
    delay = Math.random() * delay;
  }

  return Math.round(delay);
}

/**
 * Retries an async function with configurable backoff.
 * Throws a RetryError wrapping the last error if all attempts fail.
 *
 * @example
 * const data = await retry(() => fetchFromApi(), { attempts: 5, backoff: "exponential" });
 */
export async function retry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    attempts = 3,
    baseDelayMs = 300,
    maxDelayMs = 10000,
    backoff = "exponential",
    jitter = true,
    shouldRetry = () => true,
    onRetry,
    signal,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (signal?.aborted) {
      throw signal.reason ?? new Error("Retry aborted");
    }

    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === attempts;
      if (isLastAttempt || !shouldRetry(error, attempt)) {
        break;
      }

      const delayMs = computeDelay(attempt, baseDelayMs, maxDelayMs, backoff, jitter);
      onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw new RetryError(attempts, lastError);
}

/**
 * Wraps a function so every call is automatically retried according to the
 * given options.
 *
 * @example
 * const fetchWithRetry = withRetry(fetchFromApi, { attempts: 4 });
 * const data = await fetchWithRetry(url);
 */
export function withRetry<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  options: RetryOptions = {}
): (...args: Args) => Promise<R> {
  return (...args: Args) => retry(() => fn(...args), options);
}

/**
 * Determines whether an HTTP-style status code represents a typically
 * retryable condition (429 or 5xx), useful as a `shouldRetry` predicate
 * when the thrown error carries a `status` or `statusCode` property.
 */
export function isRetryableStatus(status: number | undefined): boolean {
  if (status === undefined) return false;
  return status === 429 || (status >= 500 && status < 600);
}
