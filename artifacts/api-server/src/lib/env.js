/**
 * Environment variable utilities: typed, validated access to process.env
 * with clear startup-time errors instead of silent undefined bugs.
 */

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

function raw(key: string): string | undefined {
  return typeof process !== "undefined" ? process.env[key] : undefined;
}

/**
 * Returns a required string env var, or throws if missing/empty.
 */
export function requireEnv(key: string): string {
  const value = raw(key);
  if (value === undefined || value === "") {
    throw new EnvError(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Returns an optional string env var, or `fallback` if missing/empty.
 */
export function optionalEnv(key: string, fallback = ""): string {
  const value = raw(key);
  return value === undefined || value === "" ? fallback : value;
}

/**
 * Returns a required env var parsed as a number, or throws if missing/invalid.
 */
export function requireEnvNumber(key: string): number {
  const value = requireEnv(key);
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new EnvError(`Environment variable ${key} is not a valid number: "${value}"`);
  }
  return parsed;
}

/**
 * Returns an optional env var parsed as a number, or `fallback` if missing/invalid.
 */
export function optionalEnvNumber(key: string, fallback: number): number {
  const value = raw(key);
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const TRUTHY = new Set(["1", "true", "yes", "on"]);
const FALSY = new Set(["0", "false", "no", "off"]);

/**
 * Returns a required env var parsed as a boolean, or throws if missing/invalid.
 * Accepts: 1/0, true/false, yes/no, on/off (case-insensitive).
 */
export function requireEnvBool(key: string): boolean {
  const value = requireEnv(key).toLowerCase();
  if (TRUTHY.has(value)) return true;
  if (FALSY.has(value)) return false;
  throw new EnvError(`Environment variable ${key} is not a valid boolean: "${value}"`);
}

/**
 * Returns an optional env var parsed as a boolean, or `fallback` if missing/invalid.
 */
export function optionalEnvBool(key: string, fallback: boolean): boolean {
  const value = raw(key);
  if (value === undefined || value === "") return fallback;
  const lower = value.toLowerCase();
  if (TRUTHY.has(lower)) return true;
  if (FALSY.has(lower)) return false;
  return fallback;
}

/**
 * Returns a required env var parsed as a comma-separated list.
 */
export function requireEnvList(key: string, separator = ","): string[] {
  return requireEnv(key)
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Returns an optional env var parsed as a comma-separated list.
 */
export function optionalEnvList(key: string, fallback: string[] = [], separator = ","): string[] {
  const value = raw(key);
  if (value === undefined || value === "") return fallback;
  return value
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Returns a required env var, asserting it is one of the given allowed values.
 */
export function requireEnvEnum<T extends string>(key: string, allowed: readonly T[]): T {
  const value = requireEnv(key);
  if (!allowed.includes(value as T)) {
    throw new EnvError(
      `Environment variable ${key} has invalid value "${value}". Expected one of: ${allowed.join(", ")}`
    );
  }
  return value as T;
}

export type NodeEnv = "development" | "production" | "test";

/**
 * Returns the current NODE_ENV, defaulting to "development".
 */
export function getNodeEnv(): NodeEnv {
  const value = optionalEnv("NODE_ENV", "development");
  return (["development", "production", "test"].includes(value) ? value : "development") as NodeEnv;
}

export function isProduction(): boolean {
  return getNodeEnv() === "production";
}

export function isDevelopment(): boolean {
  return getNodeEnv() === "development";
}

export function isTest(): boolean {
  return getNodeEnv() === "test";
}

/**
 * Validates that all given keys exist in the environment, throwing a single
 * aggregated error listing every missing variable. Call this once at startup.
 *
 * @example assertEnv(["DATABASE_URL", "GROQ_API_KEY", "JWT_SECRET"]);
 */
export function assertEnv(keys: string[]): void {
  const missing = keys.filter((key) => {
    const value = raw(key);
    return value === undefined || value === "";
  });

  if (missing.length > 0) {
    throw new EnvError(
      `Missing required environment variable(s): ${missing.join(", ")}`
    );
  }
}

/**
 * Loads and validates a typed config object from environment variables using
 * a schema of accessor functions. Throws immediately with all errors collected
 * if any required variable is invalid.
 *
 * @example
 * const config = loadEnvConfig({
 *   port: () => optionalEnvNumber("PORT", 3000),
 *   apiKey: () => requireEnv("GROQ_API_KEY"),
 * });
 */
export function loadEnvConfig<T extends Record<string, unknown>>(
  schema: { [K in keyof T]: () => T[K] }
): T {
  const result = {} as T;
  const errors: string[] = [];

  for (const key of Object.keys(schema) as Array<keyof T>) {
    try {
      result[key] = schema[key]();
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (errors.length > 0) {
    throw new EnvError(`Invalid environment configuration:\n  - ${errors.join("\n  - ")}`);
  }

  return result;
}
