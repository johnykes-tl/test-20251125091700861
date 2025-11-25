import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  operations: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
    slowestOperation: { name: string; time: number } | null;
  };
  cache: {
    entries: number;
    hitRate: number;
    freshEntries: number;
    staleEntries: number;
    ongoingRefreshes: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    usagePercentage: number;
  };
  connections: {
    active: number;
    errors: number;
    avgLatency: number;
  };
}

interface PerformanceOperation {
  name: string;
  startTime: number;
  endTime?: number;
  success?: boolean;
  error?: string;
}

export function usePerformanceOptimization(enabled: boolean = true) {
  const [showMetrics, setShowMetrics] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    operations: {
      total: 0,
      successful: 0,
      failed: 0,
      avgResponseTime: 0,
      slowestOperation: null
    },
    cache: {
      entries: 0,
      hitRate: 0,
      freshEntries: 0,
      staleEntries: 0,
      ongoingRefreshes: 0
    },
    memory: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      usagePercentage: 0
    },
    connections: {
      active: 0,
      errors: 0,
      avgLatency: 0
    }
  });

  const operationsRef = useRef<PerformanceOperation[]>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update metrics periodically
  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      const operations = operationsRef.current;
      const completedOps = operations.filter(op => op.endTime);
      const successfulOps = completedOps.filter(op => op.success);
      const failedOps = completedOps.filter(op => !op.success);

      // Calculate response times
      const responseTimes = completedOps.map(op => (op.endTime! - op.startTime));
      const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : 0;

      // Find slowest operation
      let slowestOperation = null;
      if (completedOps.length > 0) {
        const slowest = completedOps.reduce((prev, current) => {
          const prevTime = prev.endTime! - prev.startTime;
          const currentTime = current.endTime! - current.startTime;
          return currentTime > prevTime ? current : prev;
        });
        slowestOperation = {
          name: slowest.name,
          time: slowest.endTime! - slowest.startTime
        };
      }

      // Get memory info
      let memoryInfo = { usedJSHeapSize: 0, totalJSHeapSize: 0, usagePercentage: 0 };
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory;
        memoryInfo = {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // Convert to MB
          usagePercentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
        };
      }

      setMetrics({
        operations: {
          total: operations.length,
          successful: successfulOps.length,
          failed: failedOps.length,
          avgResponseTime,
          slowestOperation
        },
        cache: {
          entries: 0, // Will be populated by cache service
          hitRate: 0,
          freshEntries: 0,
          staleEntries: 0,
          ongoingRefreshes: 0
        },
        memory: memoryInfo,
        connections: {
          active: 1, // Will be updated by connection service
          errors: failedOps.length,
          avgLatency: avgResponseTime
        }
      });
    };

    // Update metrics every 2 seconds
    updateIntervalRef.current = setInterval(updateMetrics, 2000);
    updateMetrics(); // Initial update

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [enabled]);

  // Listen for keyboard shortcut (Ctrl+Shift+P)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowMetrics(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  // Track performance operation
  const trackOperation = useCallback((name: string): string => {
    if (!enabled) return '';

    const operationId = `${name}-${Date.now()}-${Math.random()}`;
    const operation: PerformanceOperation = {
      name,
      startTime: Date.now()
    };

    operationsRef.current.push(operation);

    // Keep only last 100 operations to prevent memory leaks
    if (operationsRef.current.length > 100) {
      operationsRef.current = operationsRef.current.slice(-100);
    }

    return operationId;
  }, [enabled]);

  // Complete performance operation
  const completeOperation = useCallback((operationId: string, success: boolean = true, error?: string) => {
    if (!enabled || !operationId) return;

    const operation = operationsRef.current.find(op => 
      `${op.name}-${op.startTime}` === operationId.split('-').slice(0, -1).join('-')
    );

    if (operation) {
      operation.endTime = Date.now();
      operation.success = success;
      operation.error = error;
    }
  }, [enabled]);

  // Update cache metrics (called by cache service)
  const updateCacheMetrics = useCallback((cacheMetrics: {
    entries: number;
    hitRate: number;
    freshEntries: number;
    staleEntries: number;
    ongoingRefreshes: number;
  }) => {
    if (!enabled) return;

    setMetrics(prev => ({
      ...prev,
      cache: cacheMetrics
    }));
  }, [enabled]);

  // Clear all metrics
  const clearMetrics = useCallback(() => {
    operationsRef.current = [];
    setMetrics({
      operations: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        slowestOperation: null
      },
      cache: {
        entries: 0,
        hitRate: 0,
        freshEntries: 0,
        staleEntries: 0,
        ongoingRefreshes: 0
      },
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        usagePercentage: 0
      },
      connections: {
        active: 0,
        errors: 0,
        avgLatency: 0
      }
    });
  }, []);

  return {
    metrics,
    showMetrics,
    setShowMetrics,
    trackOperation,
    completeOperation,
    updateCacheMetrics,
    clearMetrics,
    enabled
  };
}

export default usePerformanceOptimization;