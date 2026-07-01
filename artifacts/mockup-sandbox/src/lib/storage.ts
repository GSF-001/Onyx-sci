/**
 * Type-safe wrapper around Web Storage (localStorage / sessionStorage)
 * with JSON serialization, namespacing, expiry, and graceful fallback
 * when storage is unavailable (e.g. private browsing, SSR).
 */

export interface StorageOptions {
  /** Prefix prepended to every key, e.g. "app:" -> "app:myKey" */
  namespace?: string;
  /** Which storage backend to use. Defaults to "local". */
  type?: "local" | "session";
}

interface StoredEnvelope<T> {
  value: T;
  /** Epoch ms timestamp after which this entry is considered expired. */
  expiresAt?: number;
}

function getBackend(type: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = type === "session" ? window.sessionStorage : window.localStorage;
    // Quick availability check (throws in some private-browsing modes)
    const testKey = "__storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

export class TypedStorage {
  private backend: Storage | null;
  private namespace: string;
  private memoryFallback = new Map<string, string>();

  constructor(options: StorageOptions = {}) {
    this.backend = getBackend(options.type ?? "local");
    this.namespace = options.namespace ?? "";
  }

  private key(key: string): string {
    return this.namespace ? `${this.namespace}${key}` : key;
  }

  private read(rawKey: string): string | null {
    if (this.backend) {
      return this.backend.getItem(rawKey);
    }
    return this.memoryFallback.get(rawKey) ?? null;
  }

  private write(rawKey: string, value: string): void {
    if (this.backend) {
      this.backend.setItem(rawKey, value);
    } else {
      this.memoryFallback.set(rawKey, value);
    }
  }

  private remove(rawKey: string): void {
    if (this.backend) {
      this.backend.removeItem(rawKey);
    } else {
      this.memoryFallback.delete(rawKey);
    }
  }

  /**
   * Stores a value, optionally expiring after `ttlMs` milliseconds.
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const envelope: StoredEnvelope<T> = {
      value,
      expiresAt: ttlMs !== undefined ? Date.now() + ttlMs : undefined,
    };
    try {
      this.write(this.key(key), JSON.stringify(envelope));
    } catch {
      // Storage full or value not serializable; silently ignore.
    }
  }

  /**
   * Retrieves a value. Returns `fallback` (or null) if missing, expired, or malformed.
   */
  get<T>(key: string, fallback: T | null = null): T | null {
    const raw = this.read(this.key(key));
    if (raw === null) return fallback;

    try {
      const envelope: StoredEnvelope<T> = JSON.parse(raw);
      if (envelope.expiresAt !== undefined && Date.now() > envelope.expiresAt) {
        this.remove(this.key(key));
        return fallback;
      }
      return envelope.value;
    } catch {
      return fallback;
    }
  }

  /** Returns true if a non-expired value exists for the key. */
  has(key: string): boolean {
    return this.get(key, Symbol("missing") as unknown as null) !== null;
  }

  /** Removes a single key. */
  removeItem(key: string): void {
    this.remove(this.key(key));
  }

  /** Removes all keys within this instance's namespace. */
  clear(): void {
    if (this.backend) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.backend.length; i++) {
        const k = this.backend.key(i);
        if (k && (!this.namespace || k.startsWith(this.namespace))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => this.backend!.removeItem(k));
    } else {
      if (this.namespace) {
        for (const k of Array.from(this.memoryFallback.keys())) {
          if (k.startsWith(this.namespace)) this.memoryFallback.delete(k);
        }
      } else {
        this.memoryFallback.clear();
      }
    }
  }

  /** Lists all keys (without namespace prefix) within this instance's namespace. */
  keys(): string[] {
    const allKeys: string[] = [];
    if (this.backend) {
      for (let i = 0; i < this.backend.length; i++) {
        const k = this.backend.key(i);
        if (k && (!this.namespace || k.startsWith(this.namespace))) {
          allKeys.push(this.namespace ? k.slice(this.namespace.length) : k);
        }
      }
    } else {
      for (const k of this.memoryFallback.keys()) {
        if (!this.namespace || k.startsWith(this.namespace)) {
          allKeys.push(this.namespace ? k.slice(this.namespace.length) : k);
        }
      }
    }
    return allKeys;
  }

  /** Returns whether a real browser storage backend is in use (vs in-memory fallback). */
  isPersistent(): boolean {
    return this.backend !== null;
  }
}

/** Default localStorage-backed instance. */
export const localStore = new TypedStorage({ type: "local" });

/** Default sessionStorage-backed instance. */
export const sessionStore = new TypedStorage({ type: "session" });

/**
 * Creates a namespaced storage instance, e.g. createStorage("myApp:", "session").
 */
export function createStorage(namespace: string, type: "local" | "session" = "local"): TypedStorage {
  return new TypedStorage({ namespace, type });
}
