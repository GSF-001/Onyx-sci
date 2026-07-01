/**
 * ID generation utilities backed by Node's crypto module.
 */
import { randomBytes, randomUUID } from "node:crypto";

const URL_SAFE_ALPHABET =
  "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GTcfjkqzXOR";
const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a RFC 4122 version 4 UUID.
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Generates a compact, URL-safe random ID (nanoid-style).
 */
export function generateId(length = 21): string {
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += URL_SAFE_ALPHABET[bytes[i] % URL_SAFE_ALPHABET.length];
  }
  return id;
}

/**
 * Generates a random alphanumeric ID.
 */
export function generateAlphanumericId(length = 12): string {
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return id;
}

/**
 * Generates a random numeric ID (e.g. for OTPs).
 */
export function generateNumericId(length = 6): string {
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += (bytes[i] % 10).toString();
  }
  return id;
}

/**
 * Generates a lexicographically sortable ID: a millisecond timestamp
 * (base36) followed by random suffix characters.
 */
export function generateSortableId(randomLength = 12): string {
  const timestamp = Date.now().toString(36).padStart(9, "0");
  return `${timestamp}${generateAlphanumericId(randomLength)}`;
}

/**
 * Generates an ID with a custom prefix, e.g. "usr_9f8a2c1b3d4e".
 */
export function generatePrefixedId(prefix: string, length = 16): string {
  return `${prefix}_${generateId(length)}`;
}

/**
 * Generates a cryptographically secure API key with a recognizable prefix,
 * e.g. "sk_live_9f8a2c1b3d4e5f6a7b8c9d0e1f2a3b4c".
 */
export function generateApiKey(prefix = "sk", length = 32): string {
  return `${prefix}_${randomBytes(length).toString("hex")}`;
}

/**
 * Generates a short, human-friendly code using an unambiguous character set
 * (excludes 0, O, 1, I, l). Useful for invite codes, coupons, etc.
 */
export function generateShortCode(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Extracts the embedded millisecond timestamp from an ID created with
 * generateSortableId. Returns null if the ID doesn't look like a sortable ID.
 */
export function extractTimestampFromSortableId(id: string): Date | null {
  const timestampPart = id.slice(0, 9);
  const ms = parseInt(timestampPart, 36);
  if (Number.isNaN(ms)) return null;
  return new Date(ms);
}
