class DataCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  /**
   * Retrieves an item from the cache if it exists and has not expired.
   * @param key The key of the item to retrieve.
   * @returns The cached item or undefined.
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.value as T;
    }
    // If item exists but is expired, delete it
    if (item) {
      this.cache.delete(key);
    }
    return undefined;
  }

  /**
   * Adds or updates an item in the cache with a specific time-to-live (TTL).
   * @param key The key of the item to set.
   * @param value The value to cache.
   * @param options An object containing the TTL in seconds.
   */
  set(key: string, value: any, options?: { ttl?: number }): void {
    // Default TTL to 5 minutes (300 seconds) if not provided
    const ttlInSeconds = options?.ttl || 300;
    const ttlInMs = ttlInSeconds * 1000;
    const expiry = Date.now() + ttlInMs;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Deletes a specific item from the cache.
   * @param key The key of the item to delete.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const dataCache = new DataCache();