// Simple in-memory cache with TTL
export class Cache<T> {
  private data: Map<string, { value: T; expires: number }> = new Map();

  get(key: string): T | undefined {
    const entry = this.data.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.data.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.data.set(key, { value, expires: Date.now() + ttlMs });
  }

  clear(): void {
    this.data.clear();
  }
}

// Global cache for settings (5 minutes TTL)
export const settingsCache = new Cache<{ priceOriginal: number; pricePromo: number }>();
