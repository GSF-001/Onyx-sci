import crypto from "crypto";

/**
 * Generate token acak yang dikirim ke user via email (raw token),
 * dan hash-nya yang disimpan di database. Ini best practice supaya
 * kalau DB bocor, token asli tetap tidak bisa dipakai (mirip password reset di produksi).
 */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60_000);
}
