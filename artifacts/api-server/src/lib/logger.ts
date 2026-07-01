/**
 * Application logger built on `pino`. Wraps a root pino instance and exposes
 * a small helper surface (child loggers, timing helper) consistent with the
 * rest of the lib/ utilities, while letting pino-http own HTTP request logs.
 */
import pino, { type Logger as PinoLogger, type LoggerOptions as PinoLoggerOptions } from "pino";
import { optionalEnv, isProduction } from "./env.js";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogFields {
  [key: string]: unknown;
}

function buildPinoOptions(level: LogLevel): PinoLoggerOptions {
  const pretty = !isProduction();

  return {
    level,
    ...(pretty
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
          },
        }
      : {}),
  };
}

/**
 * Thin wrapper around a pino instance providing a `.time()` convenience
 * helper and a typed `.child()` for scoping context (requestId, userId, etc).
 */
export class Logger {
  readonly pino: PinoLogger;

  constructor(pinoInstance: PinoLogger) {
    this.pino = pinoInstance;
  }

  trace(message: string, fields?: LogFields): void {
    this.pino.trace(fields ?? {}, message);
  }

  debug(message: string, fields?: LogFields): void {
    this.pino.debug(fields ?? {}, message);
  }

  info(message: string, fields?: LogFields): void {
    this.pino.info(fields ?? {}, message);
  }

  warn(message: string, fields?: LogFields): void {
    this.pino.warn(fields ?? {}, message);
  }

  error(message: string, error?: unknown, fields?: LogFields): void {
    const errorFields =
      error instanceof Error
        ? { err: error }
        : error !== undefined
        ? { error }
        : {};
    this.pino.error({ ...errorFields, ...fields }, message);
  }

  fatal(message: string, error?: unknown, fields?: LogFields): void {
    const errorFields =
      error instanceof Error
        ? { err: error }
        : error !== undefined
        ? { error }
        : {};
    this.pino.fatal({ ...errorFields, ...fields }, message);
  }

  /**
   * Creates a child logger with additional bound context fields
   * (e.g. requestId, userId, route).
   */
  child(context: LogFields): Logger {
    return new Logger(this.pino.child(context));
  }

  /** Times an operation and logs its duration on completion or failure. */
  async time<T>(label: string, fn: () => Promise<T> | T, fields?: LogFields): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - start);
      this.info(label, { ...fields, durationMs });
      return result;
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);
      this.error(label, error, { ...fields, durationMs, failed: true });
      throw error;
    }
  }
}

const level = (optionalEnv("LOG_LEVEL", "info") as LogLevel) || "info";

/** Root pino instance, exported for use with pino-http and other integrations. */
export const rootLogger = pino(buildPinoOptions(level));

/** Default application-wide logger instance. */
export const logger = new Logger(rootLogger);

/**
 * Creates a new standalone Logger wrapping a fresh pino instance
 * (or wrapping an existing pino instance, e.g. one bound via pino-http).
 */
export function createLogger(options?: { level?: LogLevel; pino?: PinoLogger }): Logger {
  if (options?.pino) return new Logger(options.pino);
  return new Logger(pino(buildPinoOptions(options?.level ?? level)));
}
