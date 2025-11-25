interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  staleUntil: number;
}

interface CachedData<T> {
  data: T;
  isStale: boolean;
  isFresh: boolean;
  age: number;
}

interface CacheOptions {
  ttl?: number;
  staleTtl?: number;
  backgroundRefresh?: boolean;
}

class OptimizedCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private refreshPromises = new Map<string, Promise<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly defaultStaleTTL = 30 * 60 * 1000; // 30 minutes
  
  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<CachedData<T> | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    const isStale = now > entry.staleUntil;
    const isFresh = now <= entry.timestamp + entry.ttl;
    
    // Check if entry is completely expired
    if (now > entry.timestamp + this.defaultStaleTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return {
      data: entry.data,
      isStale,
      isFresh,
      age
    };
  }
  
  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const ttl = options.ttl || this.defaultTTL;
    const staleTtl = options.staleTtl || this.defaultStaleTTL;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      staleUntil: now + ttl
    });
    
    console.log(`📦 Cache: Set ${key} (TTL: ${ttl}ms, Stale TTL: ${staleTtl}ms)`);
  }
  
  /**
   * Get data from cache or fetch if not available (stale-while-revalidate pattern)
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CachedData<T>> {
    const cached = await this.get<T>(key);
    
    if (cached && !cached.isStale) {
      // Fresh data available
      console.log(`📦 Cache: Hit (fresh) ${key}`);
      return cached;
    }
    
    if (cached && cached.isStale) {
      // Stale data available - return immediately and refresh in background
      console.log(`📦 Cache: Hit (stale) ${key} - refreshing in background`);
      
      if (options.backgroundRefresh !== false) {
        this.refreshInBackground(key, fetcher, options);
      }
      
      return cached;
    }
    
    // No cache data - fetch immediately
    console.log(`📦 Cache: Miss ${key} - fetching`);
    try {
      const data = await fetcher();
      this.set(key, data, options);
      
      return {
        data,
        isStale: false,
        isFresh: true,
        age: 0
      };
    } catch (error) {
      console.error(`❌ Cache: Fetch failed for ${key}:`, error);
      throw error;
    }
  }
  
  /**
   * Refresh data in background without blocking current request
   */
  private refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): void {
    // Prevent multiple concurrent refreshes for the same key
    if (this.refreshPromises.has(key)) {
      return;
    }
    
    const refreshPromise = fetcher()
      .then(data => {
        this.set(key, data, options);
        console.log(`🔄 Cache: Background refresh completed for ${key}`);
      })
      .catch(error => {
        console.error(`❌ Cache: Background refresh failed for ${key}:`, error);
      })
      .finally(() => {
        this.refreshPromises.delete(key);
      });
    
    this.refreshPromises.set(key, refreshPromise);
  }
  
  /**
   * Force refresh data (bypass cache)
   */
  async forceRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    console.log(`🔄 Cache: Force refresh ${key}`);
    
    try {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    } catch (error) {
      console.error(`❌ Cache: Force refresh failed for ${key}:`, error);
      throw error;
    }
  }
  
  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache: Invalidated ${key}`);
    }
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.refreshPromises.clear();
    console.log(`🗑️ Cache: Cleared ${size} entries`);
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    const freshEntries = entries.filter(entry => now <= entry.timestamp + entry.ttl);
    const staleEntries = entries.filter(entry => 
      now > entry.timestamp + entry.ttl && now <= entry.timestamp + this.defaultStaleTTL
    );
    
    return {
      entries: this.cache.size,
      freshEntries: freshEntries.length,
      staleEntries: staleEntries.length,
      ongoingRefreshes: this.refreshPromises.size,
      hitRate: 0 // Would need hit/miss counters for accurate calculation
    };
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + this.defaultStaleTTL) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cache: Cleaned up ${cleanedCount} expired entries`);
    }
  }
}

// Create singleton instance
export const optimizedCache = new OptimizedCacheService();

// Export types
export type { CacheOptions, CachedData };