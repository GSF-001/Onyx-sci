/**
 * ID generation utilities. No external dependencies.
 * Uses the Web Crypto API when available, falling back to Math.random.
 */

const ALPHANUMERIC =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const URL_SAFE =
  "ModuleSymbhasOwnPr-0123456789ABCDEFGHIJKLNQRTUVWXYZ_cfgijkltuvxz";

function getRandomValues(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/**
 * Generates a RFC 4122 version 4 UUID.
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = getRandomValues(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

/**
 * Generates a compact, URL-safe random ID (nanoid-style).
 */
export function generateId(length = 21): string {
  const bytes = getRandomValues(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += URL_SAFE[bytes[i] % URL_SAFE.length];
  }
  return id;
}

/**
 * Generates a random ID using only alphanumeric characters.
 */
export function generateAlphanumericId(length = 12): string {
  const bytes = getRandomValues(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return id;
}

/**
 * Generates a short numeric ID, e.g. for OTPs or short codes.
 */
export function generateNumericId(length = 6): string {
  const bytes = getRandomValues(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += (bytes[i] % 10).toString();
  }
  return id;
}

/**
 * Generates a sortable, timestamp-prefixed ID (ULID-like, lexicographically sortable).
 * Format: <13-char base36 timestamp><12-char random suffix>
 */
export function generateSortableId(): string {
  const timestamp = Date.now().toString(36).padStart(9, "0");
  const random = generateAlphanumericId(12);
  return `${timestamp}${random}`;
}

/**
 * Generates an ID with a custom prefix, e.g. generatePrefixedId("user") -> "user_a1b2c3d4e5"
 */
export function generatePrefixedId(prefix: string, length = 12): string {
  return `${prefix}_${generateAlphanumericId(length)}`;
}

/**
 * Generates a short, human-friendly slug-like ID using lowercase letters and digits.
 * Useful for things like invite codes.
 */
export function generateShortCode(length = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // omits ambiguous chars (0,1,i,l,o)
  const bytes = getRandomValues(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}
