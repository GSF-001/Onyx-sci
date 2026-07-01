/**
 * Sleep / delay utilities for async control flow.
 */

/**
 * Resolves after `ms` milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sleeps for a random duration between `minMs` and `maxMs` (inclusive).
 * Useful for jittered retry/backoff delays.
 */
export function sleepJitter(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return sleep(ms);
}

/**
 * Sleeps that can be aborted early via an AbortSignal.
 * Rejects with the signal's reason (or a generic AbortError) if aborted.
 */
export function sleepAbortable(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };

    function cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Yields control back to the event loop (macrotask boundary).
 * Equivalent to sleep(0) but expresses intent more clearly.
 */
export function nextTick(): Promise<void> {
  return sleep(0);
}

/**
 * Races a promise against a timeout, rejecting with a TimeoutError-like
 * error if the timeout elapses first.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message = "Operation timed out"): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}
