import { useState, useEffect, useCallback, useRef } from 'react';
import { dataCache } from '../utils/dataCache';

// State interface for the hook
interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  progress: number;
  stage: string;
}

// Configuration for the hook
interface OptimizedLoadingConfig {
  cacheKey?: string;
  cacheTTL?: number; // in seconds
  enableCache?: boolean;
  autoLoad?: boolean;
}

const defaultConfig: Required<OptimizedLoadingConfig> = {
  cacheKey: '',
  cacheTTL: 300, // 5 minutes
  enableCache: false,
  autoLoad: true,
};

export function useOptimizedLoading<T>(
  fetcher: () => Promise<T>,
  config: OptimizedLoadingConfig = {}
) {
  const mergedConfig = { ...defaultConfig, ...config };
  const { cacheKey, enableCache, cacheTTL, autoLoad } = mergedConfig;

  const [state, setState] = useState<LoadingState<T>>({
    data: null,
    loading: autoLoad,
    error: null,
    progress: 0,
    stage: 'initializing',
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const updateState = (updates: Partial<LoadingState<T>>) => {
    if (isMounted.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  };

  const loadData = useCallback(async (forceRefresh = false) => {
    updateState({ loading: true, error: null, progress: 0, stage: 'initializing' });

    try {
      // Step 1: Check cache if enabled
      if (enableCache && cacheKey && !forceRefresh) {
        updateState({ stage: 'checking-cache', progress: 10 });
        const cachedData = dataCache.get<T>(cacheKey);
        if (cachedData) {
          updateState({ data: cachedData, loading: false, progress: 100, stage: 'completed' });
          console.log(`[useOptimizedLoading] Cache HIT for key: ${cacheKey}`);
          return;
        }
        console.log(`[useOptimizedLoading] Cache MISS for key: ${cacheKey}`);
      }

      // Step 2: Fetch data
      updateState({ stage: 'fetching', progress: 30 });
      const data = await fetcher();
      updateState({ progress: 70 });

      // Step 3: Process and set data
      updateState({ stage: 'processing', progress: 90 });
      
      // Step 4: Cache the result if enabled
      if (enableCache && cacheKey) {
        // Corrected call to dataCache.set
        dataCache.set(cacheKey, data, { ttl: cacheTTL });
        console.log(`[useOptimizedLoading] Data cached for key: ${cacheKey} with TTL: ${cacheTTL}s`);
      }

      updateState({ data, loading: false, progress: 100, stage: 'completed' });

    } catch (error: any) {
      console.error('[useOptimizedLoading] Error fetching data:', error);
      updateState({
        error: error.message || 'An unknown error occurred',
        loading: false,
        stage: 'error',
      });
    }
  }, [fetcher, enableCache, cacheKey, cacheTTL]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return { ...state, refresh: loadData };
}