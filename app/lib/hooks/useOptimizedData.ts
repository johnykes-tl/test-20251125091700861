import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizedCache } from '../services/optimizedCacheService';

interface UseOptimizedDataOptions {
  cache?: boolean;
  ttl?: number;
  staleTtl?: number;
  backgroundRefresh?: boolean;
  retries?: number;
  timeout?: number;
}

interface UseOptimizedDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  refresh: () => Promise<void>;
  clearCache: () => Promise<void>;
  lastUpdated: Date | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

/**
 * Custom hook for optimized data loading with intelligent caching
 * Supports stale-while-revalidate pattern and background refresh
 */
export function useOptimizedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseOptimizedDataOptions = {}
): UseOptimizedDataReturn<T> {
  const {
    cache = true,
    ttl = 5 * 60 * 1000, // 5 minutes
    staleTtl = 15 * 60 * 1000, // 15 minutes  
    backgroundRefresh = true,
    retries = 3,
    timeout = 10000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchInProgress = useRef(false);
  const backgroundRefreshInProgress = useRef(false);

  // Safe cache operations with fallback
  const getCachedData = useCallback(async (cacheKey: string): Promise<CacheEntry<T> | null> => {
    try {
      if (!cache || !optimizedCache) return null;
      
      // Try different possible method names for getting cache data
      if (typeof (optimizedCache as any).getItem === 'function') {
        const cached = await (optimizedCache as any).getItem(cacheKey);
        return cached ? JSON.parse(cached) : null;
      }
      
      if (typeof (optimizedCache as any).getFromCache === 'function') {
        return await (optimizedCache as any).getFromCache(cacheKey);
      }
      
      // If no cache methods available, return null
      console.warn('Cache service methods not available, falling back to direct fetch');
      return null;
      
    } catch (error) {
      console.error('Cache get operation failed:', error);
      return null;
    }
  }, [cache]);

  const setCachedData = useCallback(async (cacheKey: string, data: T): Promise<void> => {
    try {
      if (!cache || !optimizedCache) return;
      
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        isStale: false
      };
      
      // Try different possible method names for setting cache data
      if (typeof (optimizedCache as any).setItem === 'function') {
        await (optimizedCache as any).setItem(cacheKey, JSON.stringify(cacheEntry));
        return;
      }
      
      if (typeof (optimizedCache as any).set === 'function') {
        await (optimizedCache as any).set(cacheKey, cacheEntry, { ttl });
        return;
      }
      
      // If no cache methods available, skip caching
      console.warn('Cache service set methods not available');
      
    } catch (error) {
      console.error('Cache set operation failed:', error);
    }
  }, [cache, ttl]);

  const deleteCachedData = useCallback(async (cacheKey: string): Promise<void> => {
    try {
      if (!cache || !optimizedCache) return;
      
      // Try different possible method names for deleting cache data
      if (typeof (optimizedCache as any).removeItem === 'function') {
        await (optimizedCache as any).removeItem(cacheKey);
        return;
      }
      
      if (typeof (optimizedCache as any).delete === 'function') {
        await (optimizedCache as any).delete(cacheKey);
        return;
      }
      
      if (typeof (optimizedCache as any).clear === 'function') {
        await (optimizedCache as any).clear();
        return;
      }
      
    } catch (error) {
      console.error('Cache delete operation failed:', error);
    }
  }, [cache]);

  // Fetch data with retry logic
  const fetchWithRetry = useCallback(async (attempt: number = 1): Promise<T> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const result = await fetcher();
        clearTimeout(timeoutId);
        return result;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error: any) {
      if (attempt < retries) {
        console.warn(`Fetch attempt ${attempt} failed, retrying...`, error.message);
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }
      throw error;
    }
  }, [fetcher, retries, timeout]);

  // Main data loading function
  const loadData = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    if (fetchInProgress.current && !forceRefresh) {
      return;
    }

    const cacheKey = `optimized_data_${key}`;
    
    try {
      if (!forceRefresh && cache) {
        // Try to get from cache first
        const cachedEntry = await getCachedData(cacheKey);
        
        if (cachedEntry) {
          const age = Date.now() - cachedEntry.timestamp;
          const isExpired = age > ttl;
          const isStaleExpired = age > staleTtl;
          
          if (!isStaleExpired) {
            // Use cached data
            setData(cachedEntry.data);
            setIsStale(isExpired);
            setLastUpdated(new Date(cachedEntry.timestamp));
            setLoading(false);
            setError(null);
            
            // If data is stale but not expired, trigger background refresh
            if (isExpired && backgroundRefresh && !backgroundRefreshInProgress.current) {
              backgroundRefreshInProgress.current = true;
              console.log('�� Starting background refresh for stale data');
              
              try {
                const freshData = await fetchWithRetry();
                await setCachedData(cacheKey, freshData);
                setData(freshData);
                setIsStale(false);
                setLastUpdated(new Date());
                console.log('✅ Background refresh completed');
              } catch (bgError) {
                console.warn('⚠️ Background refresh failed, keeping stale data:', bgError);
              } finally {
                backgroundRefreshInProgress.current = false;
              }
            }
            
            return;
          }
        }
      }

      // No cache or cache expired, fetch fresh data
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);
      
      const freshData = await fetchWithRetry();
      
      // Cache the fresh data
      if (cache) {
        await setCachedData(cacheKey, freshData);
      }
      
      setData(freshData);
      setIsStale(false);
      setLastUpdated(new Date());
      setError(null);
      
    } catch (error: any) {
      console.error('❌ Data loading failed:', error);
      setError(error.message || 'Failed to load data');
      
      // Try to use stale cache data as fallback
      if (cache) {
        const staleEntry = await getCachedData(cacheKey);
        if (staleEntry) {
          console.log('🔄 Using stale cache data as fallback');
          setData(staleEntry.data);
          setIsStale(true);
          setLastUpdated(new Date(staleEntry.timestamp));
        }
      }
      
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [key, fetcher, cache, ttl, staleTtl, backgroundRefresh, getCachedData, setCachedData, fetchWithRetry]);

  // Refresh function
  const refresh = useCallback(async (): Promise<void> => {
    await loadData(true);
  }, [loadData]);

  // Clear cache function
  const clearCache = useCallback(async (): Promise<void> => {
    const cacheKey = `optimized_data_${key}`;
    await deleteCachedData(cacheKey);
  }, [key, deleteCachedData]);

  // Load data on mount and when key changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    clearCache,
    lastUpdated
  };
}

export default useOptimizedData;