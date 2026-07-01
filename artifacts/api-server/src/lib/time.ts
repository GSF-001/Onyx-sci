/**
 * Time utilities: duration parsing/formatting, timers, and timestamp helpers.
 * Complements format-date.ts, which focuses on human display of calendar dates.
 */

export const MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Returns the current Unix timestamp in seconds.
 */
export function unixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Converts a Date (or epoch ms) to a Unix timestamp in seconds.
 */
export function toUnixTimestamp(date: Date | number = new Date()): number {
  const ms = date instanceof Date ? date.getTime() : date;
  return Math.floor(ms / 1000);
}

/**
 * Converts a Unix timestamp in seconds to a Date.
 */
export function fromUnixTimestamp(seconds: number): Date {
  return new Date(seconds * 1000);
}

/**
 * Parses a human-friendly duration string ("1s", "5m", "2h", "3d", "1w")
 * into milliseconds. Supports combined units like "1h30m".
 */
export function parseDuration(input: string): number {
  const regex = /(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)/g;
  const unitMs: Record<string, number> = {
    ms: 1,
    s: MS.SECOND,
    m: MS.MINUTE,
    h: MS.HOUR,
    d: MS.DAY,
    w: MS.WEEK,
  };

  let total = 0;
  let matched = false;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    matched = true;
    const [, value, unit] = match;
    total += parseFloat(value) * unitMs[unit];
  }

  if (!matched) {
    throw new Error(`Invalid duration string: "${input}"`);
  }

  return total;
}

/**
 * Formats a millisecond duration into a compact human-readable string,
 * e.g. formatMsDuration(90061000) -> "1d 1h 1m 1s"
 */
export function formatMsDuration(ms: number, maxUnits = 2): string {
  if (ms < 0) return `-${formatMsDuration(-ms, maxUnits)}`;
  if (ms === 0) return "0ms";

  const units: Array<[string, number]> = [
    ["d", MS.DAY],
    ["h", MS.HOUR],
    ["m", MS.MINUTE],
    ["s", MS.SECOND],
    ["ms", 1],
  ];

  const parts: string[] = [];
  let remaining = ms;

  for (const [label, unitMs] of units) {
    const value = Math.floor(remaining / unitMs);
    if (value > 0) {
      parts.push(`${value}${label}`);
      remaining -= value * unitMs;
    }
    if (parts.length >= maxUnits) break;
  }

  return parts.length > 0 ? parts.join(" ") : "0ms";
}

/**
 * Simple stopwatch for measuring elapsed time, e.g. for request timing/logging.
 */
export class Stopwatch {
  private startTime: number;
  private endTime: number | null = null;

  constructor() {
    this.startTime = performance.now();
  }

  /** Stops the stopwatch and returns elapsed milliseconds. */
  stop(): number {
    this.endTime = performance.now();
    return this.elapsedMs();
  }

  /** Returns elapsed milliseconds, whether running or stopped. */
  elapsedMs(): number {
    const end = this.endTime ?? performance.now();
    return end - this.startTime;
  }

  /** Returns elapsed time as a formatted string, e.g. "1.23s". */
  elapsedFormatted(): string {
    return formatMsDuration(Math.round(this.elapsedMs()));
  }

  /** Resets the stopwatch to start timing from now. */
  reset(): void {
    this.startTime = performance.now();
    this.endTime = null;
  }
}

/**
 * Measures the execution time of an async function, returning both the
 * result and elapsed milliseconds.
 */
export async function timeIt<T>(fn: () => Promise<T> | T): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}

/**
 * Returns true if `date` falls within [start, end] inclusive.
 */
export function isBetween(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/**
 * Returns the start of day (00:00:00.000) for the given date, in local time.
 */
export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Returns the end of day (23:59:59.999) for the given date, in local time.
 */
export function endOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Returns a Date shifted by the given number of milliseconds.
 */
export function shiftDate(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

/**
 * Converts a duration in milliseconds to a fractional number of the given unit.
 */
export function msTo(ms: number, unit: keyof typeof MS): number {
  return ms / MS[unit];
}
