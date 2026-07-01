/**
 * Common validation utilities. No external dependencies.
 */

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;

// E.164-ish: optional +, 8-15 digits total.
const PHONE_E164_REGEX = /^\+?[1-9]\d{7,14}$/;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidEmail(value: string): boolean {
  if (typeof value !== "string" || value.length > 254) return false;
  return EMAIL_REGEX.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  if (typeof value !== "string") return false;
  try {
    // Use URL constructor for robust parsing; require http/https protocol.
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return /^https?:$/.test(url.protocol) && URL_REGEX.test(value);
  } catch {
    return false;
  }
}

/**
 * Validates a phone number in loose E.164 format (optional leading +, 8-15 digits).
 */
export function isValidPhone(value: string): boolean {
  if (typeof value !== "string") return false;
  const cleaned = value.replace(/[\s().-]/g, "");
  return PHONE_E164_REGEX.test(cleaned);
}

export function isValidUUID(value: string): boolean {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function isValidHexColor(value: string): boolean {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

export function isValidSlug(value: string): boolean {
  return typeof value === "string" && SLUG_REGEX.test(value);
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "very weak" | "weak" | "fair" | "strong" | "very strong";
  issues: string[];
}

/**
 * Evaluates password strength heuristically (length + character variety).
 * Not a substitute for server-side validation, but useful for UI feedback.
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const issues: string[] = [];

  if (password.length < 8) issues.push("Use at least 8 characters");
  if (!/[a-z]/.test(password)) issues.push("Add a lowercase letter");
  if (!/[A-Z]/.test(password)) issues.push("Add an uppercase letter");
  if (!/[0-9]/.test(password)) issues.push("Add a number");
  if (!/[^a-zA-Z0-9]/.test(password)) issues.push("Add a special character");

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels: PasswordStrengthResult["label"][] = [
    "very weak",
    "weak",
    "fair",
    "strong",
    "very strong",
  ];

  return { score: clamped, label: labels[clamped], issues };
}

export function isValidCreditCardNumber(value: string): boolean {
  const digits = value.replace(/[\s-]/g, "");
  if (!/^\d{12,19}$/.test(digits)) return false;

  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function isValidPostalCode(value: string, country: "US" | "CA" | "UK" | "generic" = "US"): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    generic: /^[A-Z0-9]{3,10}$/i,
  };
  return patterns[country].test(value.trim());
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function hasMinLength(value: string, min: number): boolean {
  return typeof value === "string" && value.length >= min;
}

export function hasMaxLength(value: string, max: number): boolean {
  return typeof value === "string" && value.length <= max;
}

export function isAlpha(value: string): boolean {
  return /^[a-zA-Z]+$/.test(value);
}

export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

export function isNumeric(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

/**
 * A single validation rule: a predicate paired with an error message.
 */
export interface ValidationRule<T> {
  test: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Runs a value through a list of validation rules, collecting all failures.
 *
 * @example
 * validate(password, [
 *   { test: (v) => v.length >= 8, message: "Must be at least 8 characters" },
 *   { test: (v) => /[0-9]/.test(v), message: "Must contain a number" },
 * ]);
 */
export function validate<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors = rules.filter((rule) => !rule.test(value)).map((rule) => rule.message);
  return { valid: errors.length === 0, errors };
}
