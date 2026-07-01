/**
 * Hashing and password-hashing utilities backed by Node's crypto module.
 * Uses scrypt for password hashing (no external dependencies required,
 * unlike bcrypt/argon2 which need native bindings).
 */
import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SALT_LENGTH = 16;

/**
 * Computes a hex-encoded SHA-256 digest of the input.
 */
export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Computes a hex-encoded SHA-512 digest of the input.
 */
export function sha512(input: string | Buffer): string {
  return createHash("sha512").update(input).digest("hex");
}

/**
 * Computes a hex-encoded MD5 digest. Not cryptographically secure —
 * suitable only for non-security use cases like cache keys or checksums.
 */
export function md5(input: string | Buffer): string {
  return createHash("md5").update(input).digest("hex");
}

/**
 * Computes a hex-encoded HMAC-SHA256 signature.
 */
export function hmacSha256(input: string | Buffer, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("hex");
}

/**
 * Verifies an HMAC-SHA256 signature using a timing-safe comparison.
 */
export function verifyHmacSha256(input: string | Buffer, secret: string, signature: string): boolean {
  const expected = hmacSha256(input, secret);
  return timingSafeEqualHex(expected, signature);
}

/**
 * Compares two hex strings in constant time. Returns false (rather than
 * throwing) if lengths differ or inputs are malformed.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Hashes a password using scrypt with a random salt.
 * Returns a self-contained string of the form "salt:hash" (both hex).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_LENGTH).toString("hex");
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password against a hash produced by hashPassword.
 * Uses a timing-safe comparison to avoid timing side-channels.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scrypt(password, salt, keyBuffer.length)) as Buffer;

  if (derivedKey.length !== keyBuffer.length) return false;
  return timingSafeEqual(derivedKey, keyBuffer);
}

/**
 * Computes a SHA-256 hash of a file's contents, streaming to avoid
 * loading the whole file into memory.
 */
export async function hashFile(filePath: string): Promise<string> {
  const { createReadStream } = await import("node:fs");
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Generates a short, deterministic, non-cryptographic hash of a string,
 * useful for cache keys, sharding, or ETags. Not suitable for security.
 */
export function shortHash(input: string): string {
  return sha256(input).slice(0, 12);
}

/**
 * Produces a stable ETag-style hash for a response body.
 */
export function computeEtag(content: string | Buffer): string {
  return `"${sha256(content).slice(0, 16)}"`;
}
