/**
 * Debounce utilities.
 */

export interface DebounceOptions {
  /** Invoke on the leading edge of the timeout instead of the trailing edge. */
  leading?: boolean;
  /** Invoke on the trailing edge of the timeout. Defaults to true. */
  trailing?: boolean;
  /** The maximum time `func` is allowed to be delayed before it's invoked. */
  maxWait?: number;
}

export interface DebouncedFunction<Args extends unknown[], R> {
  (...args: Args): R | undefined;
  cancel: () => void;
  flush: () => R | undefined;
  pending: () => boolean;
}

/**
 * Creates a debounced function that delays invoking `func` until after
 * `wait` milliseconds have elapsed since the last time it was invoked.
 */
export function debounce<Args extends unknown[], R>(
  func: (...args: Args) => R,
  wait = 0,
  options: DebounceOptions = {}
): DebouncedFunction<Args, R> {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Args | undefined;
  let lastThis: unknown;
  let result: R | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const leading = options.leading ?? false;
  const trailing = options.trailing ?? true;
  const maxWait = options.maxWait;
  const hasMaxWait = maxWait !== undefined;

  function invokeFunc(time: number): R | undefined {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args as Args);
    return result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    return hasMaxWait
      ? Math.min(timeWaiting, (maxWait as number) - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    if (lastCallTime === undefined) return true;
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return (
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (hasMaxWait && timeSinceLastInvoke >= (maxWait as number))
    );
  }

  function timerExpired(): void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number): void {
    timerId = undefined;
    if (trailing && lastArgs) {
      invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
  }

  function cancel(): void {
    if (timerId !== undefined) clearTimeout(timerId);
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
    timerId = undefined;
  }

  function flush(): R | undefined {
    return timerId === undefined ? result : trailingEdgeFlush();
  }

  function trailingEdgeFlush(): R | undefined {
    const time = Date.now();
    const invoke = shouldInvoke(time);
    if (timerId !== undefined) clearTimeout(timerId);
    timerId = undefined;
    if (invoke && lastArgs) {
      return invokeFunc(time);
    }
    return result;
  }

  function pending(): boolean {
    return timerId !== undefined;
  }

  function debounced(this: unknown, ...args: Args): R | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        lastInvokeTime = time;
        timerId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
      }
      if (hasMaxWait) {
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(time);
      }
    }

    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

/**
 * Returns a promise-based debounced function. Every call returns a promise
 * that resolves with the result of the trailing invocation.
 */
export function debouncePromise<Args extends unknown[], R>(
  func: (...args: Args) => R | Promise<R>,
  wait = 0
): (...args: Args) => Promise<R> {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let pendingResolvers: Array<(value: R) => void> = [];
  let pendingRejecters: Array<(reason: unknown) => void> = [];

  return (...args: Args): Promise<R> => {
    if (timerId !== undefined) clearTimeout(timerId);

    return new Promise<R>((resolve, reject) => {
      pendingResolvers.push(resolve);
      pendingRejecters.push(reject);

      timerId = setTimeout(async () => {
        const resolvers = pendingResolvers;
        const rejecters = pendingRejecters;
        pendingResolvers = [];
        pendingRejecters = [];
        try {
          const result = await func(...args);
          resolvers.forEach((res) => res(result));
        } catch (err) {
          rejecters.forEach((rej) => rej(err));
        }
      }, wait);
    });
  };
}
