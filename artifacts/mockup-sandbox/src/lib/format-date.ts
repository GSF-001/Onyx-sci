/**
 * Date formatting utilities. No external dependencies.
 */

export type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date input: ${String(input)}`);
  }
  return date;
}

/**
 * Formats a date using Intl.DateTimeFormat.
 * @example formatDate(new Date(), { dateStyle: "medium" })
 */
export function formatDate(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale = "en-US"
): string {
  return new Intl.DateTimeFormat(locale, options).format(toDate(input));
}

/**
 * Formats a date as ISO 8601 (YYYY-MM-DD).
 */
export function formatISODate(input: DateInput): string {
  const date = toDate(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date + time as ISO 8601 (YYYY-MM-DDTHH:mm:ss).
 */
export function formatISODateTime(input: DateInput): string {
  const date = toDate(input);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${formatISODate(date)}T${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a time (e.g. "3:45 PM").
 */
export function formatTime(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" },
  locale = "en-US"
): string {
  return new Intl.DateTimeFormat(locale, options).format(toDate(input));
}

/**
 * Formats a relative time string (e.g. "3 days ago", "in 2 hours").
 */
export function formatRelativeTime(
  input: DateInput,
  baseDate: DateInput = new Date(),
  locale = "en-US"
): string {
  const date = toDate(input);
  const base = toDate(baseDate);
  const diffMs = date.getTime() - base.getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, secondsInUnit] of units) {
    const value = diffSeconds / secondsInUnit;
    if (Math.abs(value) >= 1 || unit === "second") {
      return rtf.format(Math.round(value), unit);
    }
  }

  return rtf.format(0, "second");
}

/**
 * Returns a human "time ago" / "time until" string with automatic granularity,
 * e.g. "just now", "5m ago", "3h ago", "2d ago", falling back to a date.
 */
export function formatTimeAgo(input: DateInput, baseDate: DateInput = new Date()): string {
  const date = toDate(input);
  const base = toDate(baseDate);
  const diffMs = base.getTime() - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  if (diffSeconds < 5 && diffSeconds > -5) return "just now";
  if (diffSeconds > 0) {
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return formatDate(date, { dateStyle: "medium" });
  }

  const future = Math.abs(diffSeconds);
  if (future < 60) return `in ${future}s`;
  if (future < 3600) return `in ${Math.floor(future / 60)}m`;
  if (future < 86400) return `in ${Math.floor(future / 3600)}h`;
  if (future < 2592000) return `in ${Math.floor(future / 86400)}d`;
  return formatDate(date, { dateStyle: "medium" });
}

/**
 * Returns true if the given date falls on the same calendar day as `compareTo`.
 */
export function isSameDay(input: DateInput, compareTo: DateInput = new Date()): boolean {
  const a = toDate(input);
  const b = toDate(compareTo);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Returns true if the given date is today.
 */
export function isToday(input: DateInput): boolean {
  return isSameDay(input, new Date());
}

/**
 * Returns true if the given date is yesterday.
 */
export function isYesterday(input: DateInput): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(input, yesterday);
}

/**
 * Adds a number of days to a date, returning a new Date.
 */
export function addDays(input: DateInput, days: number): Date {
  const date = toDate(input);
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds a number of months to a date, returning a new Date.
 */
export function addMonths(input: DateInput, months: number): Date {
  const date = toDate(input);
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Returns the number of whole days between two dates (b - a).
 */
export function diffInDays(a: DateInput, b: DateInput): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const dateA = toDate(a);
  const dateB = toDate(b);
  const utcA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const utcB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

/**
 * Formats the duration between two dates as "Xh Ym" / "Xd Yh" style string.
 */
export function formatDuration(startMs: number, endMs: number): string {
  let totalSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));

  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
