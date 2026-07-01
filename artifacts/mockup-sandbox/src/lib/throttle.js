/**
 * Throttle utilities.
 */

export interface ThrottleOptions {
  /** Invoke on the leading edge of the interval. Defaults to true. */
  leading?: boolean;
  /** Invoke on the trailing edge of the interval. Defaults to true. */
  trailing?: boolean;
}

export interface ThrottledFunction<Args extends unknown[], R> {
  (...args: Args): R | undefined;
  cancel: () => void;
  flush: () => R | undefined;
}

/**
 * Creates a throttled function that only invokes `func` at most once
 * per `wait` milliseconds.
 */
export function throttle<Args extends unknown[], R>(
  func: (...args: Args) => R,
  wait = 0,
  options: ThrottleOptions = {}
): ThrottledFunction<Args, R> {
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;

  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Args | undefined;
  let lastThis: unknown;
  let lastCallTime = 0;
  let result: R | undefined;

  function invoke(): void {
    lastCallTime = leading ? Date.now() : 0;
    timerId = undefined;
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = undefined;
      lastThis = undefined;
    }
  }

  function throttled(this: unknown, ...args: Args): R | undefined {
    const now = Date.now();

    if (!lastCallTime && !leading) {
      lastCallTime = now;
    }

    const remaining = wait - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timerId !== undefined) {
        clearTimeout(timerId);
        timerId = undefined;
      }
      lastCallTime = now;
      result = func.apply(lastThis, lastArgs);
      lastArgs = undefined;
      lastThis = undefined;
    } else if (timerId === undefined && trailing) {
      timerId = setTimeout(invoke, remaining);
    }

    return result;
  }

  throttled.cancel = function cancel(): void {
    if (timerId !== undefined) clearTimeout(timerId);
    timerId = undefined;
    lastCallTime = 0;
    lastArgs = undefined;
    lastThis = undefined;
  };

  throttled.flush = function flush(): R | undefined {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      invoke();
    }
    return result;
  };

  return throttled;
}

/**
 * Requests-animation-frame-based throttle: ensures `func` runs at most once
 * per animation frame. Ideal for scroll/resize/mousemove handlers that
 * update visuals.
 */
export function rafThrottle<Args extends unknown[]>(
  func: (...args: Args) => void
): ((...args: Args) => void) & { cancel: () => void } {
  let rafId: number | null = null;
  let lastArgs: Args | undefined;

  const throttled = (...args: Args): void => {
    lastArgs = args;
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (lastArgs) func(...lastArgs);
      lastArgs = undefined;
    });
  };

  throttled.cancel = (): void => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = undefined;
  };

  return throttled;
}
