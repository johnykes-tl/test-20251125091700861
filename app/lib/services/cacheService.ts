import { dataCache } from '../utils/dataCache';

/**
 * A generic cache handler to avoid re-fetching data constantly.
 * It uses a simple in-memory cache.
 */
export const cacheService = {
  /**
   * Retrieves data from cache. If not present or expired, it fetches, caches, and returns new data.
   * @param key A unique string to identify the cached data.
   * @param fetcher An async function that returns the data to be cached.
   * @param ttl Time-to-live for the cache in seconds. Defaults to 300 (5 minutes).
   * @param forceRefresh If true, bypasses the cache and fetches new data.
   * @returns The cached or freshly fetched data.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300,
    forceRefresh: boolean = false
  ): Promise<T> {
    if (!forceRefresh) {
      const cachedData = dataCache.get<T>(key);
      if (cachedData) {
        console.log(`[Cache] HIT: ${key}`);
        return cachedData;
      }
    }

    console.log(`[Cache] MISS: ${key}. Fetching new data...`);
    const data = await fetcher();
    
    // The fix is here: passing ttl as part of an options object.
    dataCache.set(key, data, { ttl });
    
    return data;
  },

  /**
   * Invalidates a specific cache entry.
   * @param key The cache key to invalidate.
   */
  invalidate(key: string): void {
    console.log(`[Cache] INVALIDATE: ${key}`);
    dataCache.delete(key);
  },

  /**
   * Clears the entire cache.
   */
  clearAll(): void {
    console.log(`[Cache] CLEAR ALL`);
    dataCache.clear();
  }
};