import { optimizedCache } from '../services/optimizedCacheService';

interface ApiRequestOptions {
  cache?: boolean;
  ttl?: number;
  retries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    cached?: boolean;
    responseTime?: number;
    fromCache?: boolean;
    stale?: boolean;
  };
}

interface CacheResult<T> {
  data: T;
  fromCache: boolean;
  stale: boolean;
}

/**
 * Optimized API Client with intelligent caching and retry logic
 * Uses public cache methods only and provides consistent error handling
 */
export class OptimizedApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(baseUrl: string = '', timeout: number = 10000, retries: number = 3) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
    this.defaultRetries = retries;
  }

  /**
   * Generate cache key from endpoint and method
   */
  private generateCacheKey(endpoint: string, method: string): string {
    return `api_${method}_${endpoint}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Safe cache get with fallback
   */
  private async safeCacheGet<T>(cacheKey: string): Promise<T | null> {
    try {
      // Safely check if cache service exists and has methods
      if (!optimizedCache) {
        return null;
      }
      
      // Try different possible cache method names with safe type checking
      const cacheService = optimizedCache as any;
      
      if (typeof cacheService.get === 'function') {
        return await cacheService.get(cacheKey);
      }
      if (typeof cacheService.getItem === 'function') {
        return await cacheService.getItem(cacheKey);
      }
      if (typeof cacheService.retrieve === 'function') {
        return await cacheService.retrieve(cacheKey);
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Cache get failed:', error);
      return null;
    }
  }

  /**
   * Safe cache set with fallback
   */
  private async safeCacheSet<T>(cacheKey: string, data: T, ttl?: number): Promise<void> {
    try {
      // Safely check if cache service exists
      if (!optimizedCache) {
        return;
      }
      
      // Try different possible cache method names with safe type checking
      const cacheService = optimizedCache as any;
      
      if (typeof cacheService.set === 'function') {
        await cacheService.set(cacheKey, data, ttl);
      } else if (typeof cacheService.setItem === 'function') {
        await cacheService.setItem(cacheKey, data, ttl);
      } else if (typeof cacheService.store === 'function') {
        await cacheService.store(cacheKey, data, { ttl });
      }
    } catch (error) {
      console.warn('⚠️ Cache set failed:', error);
      // Don't throw - cache failure shouldn't break the request
    }
  }

  /**
   * Safe cache invalidate with fallback
   */
  private async safeCacheInvalidate(cacheKey: string): Promise<void> {
    try {
      // Safely check if cache service exists
      if (!optimizedCache) {
        return;
      }
      
      // Try different possible cache method names with safe type checking
      const cacheService = optimizedCache as any;
      
      if (typeof cacheService.invalidate === 'function') {
        await cacheService.invalidate(cacheKey);
      } else if (typeof cacheService.delete === 'function') {
        await cacheService.delete(cacheKey);
      } else if (typeof cacheService.remove === 'function') {
        await cacheService.remove(cacheKey);
      }
    } catch (error) {
      console.warn('⚠️ Cache invalidate failed:', error);
    }
  }

  /**
   * Fetch with retry logic and timeout
   */
  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    retries: number = 3, 
    timeout: number = 10000
  ): Promise<any> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;

      } catch (error: any) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          lastError = new Error(`Request timeout after ${timeout}ms`);
        }

        // Don't retry on final attempt
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`🔄 Retry ${attempt + 1}/${retries} after ${delay}ms for ${url}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * GET request with intelligent caching
   */
  async get<T>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const {
      cache = true,
      ttl = 300000, // 5 minutes default
      retries = this.defaultRetries,
      timeout = this.defaultTimeout,
      headers = {}
    } = options;

    try {
      const fullUrl = `${this.baseUrl}${endpoint}`;
      const cacheKey = this.generateCacheKey(endpoint, 'GET');

      // Use cache if enabled
      if (cache) {
        // Try to get from cache first
        const cachedData = await this.safeCacheGet<T>(cacheKey);
        
        if (cachedData) {
          return {
            success: true,
            data: cachedData,
            metadata: {
              cached: true,
              responseTime: Date.now() - startTime,
              fromCache: true,
              stale: false
            }
          };
        }
        
        // If not in cache, fetch and store
        const fetchedData = await this.fetchWithRetry(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }, retries, timeout);
        
        // Store in cache safely
        await this.safeCacheSet(cacheKey, fetchedData, ttl);

        return {
          success: true,
          data: fetchedData,
          metadata: {
            cached: false,
            responseTime: Date.now() - startTime,
            fromCache: false,
            stale: false
          }
        };
      } else {
        // No cache - direct fetch
        const fetchedData = await this.fetchWithRetry(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }, retries, timeout);

        return {
          success: true,
          data: fetchedData,
          metadata: {
            cached: false,
            responseTime: Date.now() - startTime,
            fromCache: false,
            stale: false
          }
        };
      }

    } catch (error: any) {
      console.error(`❌ GET request failed for ${endpoint}:`, error);
      
      return {
        success: false,
        data: null as any,
        error: error.message || 'Request failed',
        metadata: {
          cached: false,
          responseTime: Date.now() - startTime,
          fromCache: false,
          stale: false
        }
      };
    }
  }

  /**
   * POST request with automatic cache invalidation
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const {
      retries = this.defaultRetries,
      timeout = this.defaultTimeout,
      headers = {}
    } = options;

    try {
      const fullUrl = `${this.baseUrl}${endpoint}`;

      const response = await this.fetchWithRetry(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined
      }, retries, timeout);

      // Invalidate related cache entries after successful POST
      await this.invalidateCache(endpoint);

      return {
        success: true,
        data: response,
        metadata: {
          cached: false,
          responseTime: Date.now() - startTime,
          fromCache: false,
          stale: false
        }
      };

    } catch (error: any) {
      console.error(`❌ POST request failed for ${endpoint}:`, error);
      
      return {
        success: false,
        data: null as any,
        error: error.message || 'Request failed',
        metadata: {
          cached: false,
          responseTime: Date.now() - startTime,
          fromCache: false,
          stale: false
        }
      };
    }
  }

  /**
   * PUT request with automatic cache invalidation
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const {
      retries = this.defaultRetries,
      timeout = this.defaultTimeout,
      headers = {}
    } = options;

    try {
      const fullUrl = `${this.baseUrl}${endpoint}`;

      const response = await this.fetchWithRetry(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined
      }, retries, timeout);

      // Invalidate related cache entries after successful PUT
      await this.invalidateCache(endpoint);

      return {
        success: true,
        data: response,
        metadata: {
          cached: false,
          responseTime: Date.now() - startTime,
          fromCache: false,
          stale: false
        }
      };

    } catch (error: any) {
      console.error(`❌ PUT request failed for ${endpoint}:`, error);
      
      return {
        success: false,
        data: null as any,
        error: error.message || 'Request failed',
        metadata: {
          cached: false,
          responseTime: Date.now() - startTime,
          fromCache: false,
          stale: false
        }
      };
    }
  }

  /**
   * DELETE request with automatic cache invalidation
   */
  async delete<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const {
      retries = this.defaultRetries,
      timeout = this.defaultTimeout,
      headers = {}
    } = options;

    try {
      const fullUrl = `${this.baseUrl}${endpoint}`;

      const response = await this.fetchWithRetry(fullUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }, retries, timeout);

      // Invalidate related cache entries after successful DELETE
      await this.invalidateCache(endpoint);

      return {
        success: true,
        data: response,
        metadata: {
          cached: false,
          responseTime: Date.now() - startTime,
          fromCache: false,
          stale: false
        }
      };

    } catch (error: any) {
      console.error(`❌ DELETE request failed for ${endpoint}:`, error);
      
      return {
        success: false,
        data: null as any,
        error: error.message || 'Request failed',
        metadata: {
          cached: false,
          responseTime: Date.now() - startTime,
          fromCache: false,
          stale: false
        }
      };
    }
  }

  /**
   * Invalidate cache entries related to an endpoint
   */
  async invalidateCache(endpoint?: string): Promise<void> {
    try {
      if (endpoint) {
        const cacheKey = this.generateCacheKey(endpoint, 'GET');
        await this.safeCacheInvalidate(cacheKey);
      } else {
        // Try to clear all cache with safe fallback
        if (!optimizedCache) {
          return;
        }
        
        const cacheService = optimizedCache as any;
        
        if (typeof cacheService.clear === 'function') {
          await cacheService.clear();
        } else if (typeof cacheService.clearAll === 'function') {
          await cacheService.clearAll();
        }
      }
    } catch (error) {
      console.warn('⚠️ Cache invalidation failed:', error);
      // Don't throw error for cache issues
    }
  }

  /**
   * Get cache statistics (optional)
   */
  getCacheStats(): any {
    try {
      if (!optimizedCache) {
        return null;
      }
      
      const cacheService = optimizedCache as any;
      
      if (typeof cacheService.getStats === 'function') {
        return cacheService.getStats();
      }
      if (typeof cacheService.stats === 'function') {
        return cacheService.stats();
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Cache stats unavailable:', error);
      return null;
    }
  }
}

// Create default instance
export const apiClient = new OptimizedApiClient('/api', 15000, 2);

// Export helper functions for common patterns
export const createApiClient = (baseUrl: string, timeout?: number, retries?: number) => {
  return new OptimizedApiClient(baseUrl, timeout, retries);
};

export default apiClient;