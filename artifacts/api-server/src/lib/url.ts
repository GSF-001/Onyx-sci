/**
 * URL building, parsing, and manipulation utilities.
 */

export type QueryValue = string | number | boolean | null | undefined | Array<string | number | boolean>;
export type QueryParams = Record<string, QueryValue>;

/**
 * Serializes an object of query parameters into a query string
 * (without the leading "?"). Skips null/undefined values.
 * Arrays produce repeated keys: { tag: ["a", "b"] } -> "tag=a&tag=b"
 */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  return searchParams.toString();
}

/**
 * Builds a complete URL by combining a base URL, path, and query params.
 *
 * @example buildUrl("https://api.example.com", "/users", { page: 2, active: true })
 * -> "https://api.example.com/users?page=2&active=true"
 */
export function buildUrl(base: string, path = "", params?: QueryParams): string {
  const trimmedBase = base.replace(/\/+$/, "");
  const trimmedPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  const query = params ? buildQueryString(params) : "";
  return `${trimmedBase}${trimmedPath}${query ? `?${query}` : ""}`;
}

/**
 * Parses a query string (with or without leading "?") into a plain object.
 * Keys that appear multiple times become arrays.
 */
export function parseQueryString(query: string): Record<string, string | string[]> {
  const cleaned = query.startsWith("?") ? query.slice(1) : query;
  const searchParams = new URLSearchParams(cleaned);
  const result: Record<string, string | string[]> = {};

  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }

  return result;
}

/**
 * Joins URL path segments, normalizing slashes without touching the protocol.
 * @example joinPaths("https://api.example.com/", "/v1/", "/users/") -> "https://api.example.com/v1/users"
 */
export function joinPaths(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .map((segment, index) => {
      let s = segment;
      if (index !== 0) s = s.replace(/^\/+/, "");
      if (index !== segments.length - 1) s = s.replace(/\/+$/, "");
      return s;
    })
    .join("/")
    .replace(/([^:]\/)\/+/g, "$1");
}

/**
 * Returns true if the given string is a syntactically valid absolute URL.
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts the hostname (without port) from a URL. Returns null if invalid.
 */
export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Returns true if `url` belongs to the same origin as `base`.
 */
export function isSameOrigin(url: string, base: string): boolean {
  try {
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

/**
 * Adds or overrides query parameters on an existing URL string, preserving
 * the rest of the URL.
 */
export function withQueryParams(url: string, params: QueryParams): string {
  const parsed = new URL(url);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      parsed.searchParams.delete(key);
      continue;
    }
    if (Array.isArray(value)) {
      parsed.searchParams.delete(key);
      for (const item of value) parsed.searchParams.append(key, String(item));
    } else {
      parsed.searchParams.set(key, String(value));
    }
  }

  return parsed.toString();
}

/**
 * Removes one or more query parameters from a URL string.
 */
export function removeQueryParams(url: string, keys: string[]): string {
  const parsed = new URL(url);
  for (const key of keys) parsed.searchParams.delete(key);
  return parsed.toString();
}

/**
 * Converts a string into a URL-friendly slug.
 * @example slugify("Hello, World! 2024") -> "hello-world-2024"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensures a URL has a protocol, defaulting to https if missing.
 */
export function ensureProtocol(url: string, defaultProtocol = "https"): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `${defaultProtocol}://${url}`;
}

/**
 * Extracts the file extension from a URL path (without the dot), or null if none.
 */
export function getUrlExtension(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}
