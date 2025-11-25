interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalOperations: number;
  successRate: number;
  averageResponseTime: number;
  slowestOperations: PerformanceMetric[];
  errorRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 operations

  /**
   * Start performance measurement
   */
  start(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics.push({
      operation,
      startTime: performance.now(),
      success: false,
      metadata
    });

    return id;
  }

  /**
   * End performance measurement
   */
  end(operation: string, success: boolean = true, error?: string) {
    const metric = this.metrics
      .reverse()
      .find(m => m.operation === operation && !m.endTime);
    
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      metric.error = error;

      // Log slow operations
      if (metric.duration > 2000) { // > 2 seconds
        console.warn(`🐌 Slow operation detected: ${operation} took ${metric.duration.toFixed(2)}ms`);
      }

      // Cleanup old metrics
      if (this.metrics.length > this.maxMetrics) {
        this.metrics = this.metrics.slice(-this.maxMetrics);
      }
    }

    return metric?.duration;
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return {
        totalOperations: 0,
        successRate: 0,
        averageResponseTime: 0,
        slowestOperations: [],
        errorRate: 0
      };
    }

    const successCount = completedMetrics.filter(m => m.success).length;
    const errorCount = completedMetrics.filter(m => !m.success).length;
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    
    const slowestOperations = completedMetrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    return {
      totalOperations: completedMetrics.length,
      successRate: (successCount / completedMetrics.length) * 100,
      averageResponseTime: totalDuration / completedMetrics.length,
      slowestOperations,
      errorRate: (errorCount / completedMetrics.length) * 100
    };
  }

  /**
   * Get recent metrics for debugging
   */
  getRecentMetrics(count: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration !== undefined)
      .slice(-count)
      .reverse();
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Log performance summary
   */
  logSummary() {
    const stats = this.getStats();
    
    console.group('📊 Performance Summary');
    console.log(`Total operations: ${stats.totalOperations}`);
    console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`Error rate: ${stats.errorRate.toFixed(1)}%`);
    
    if (stats.slowestOperations.length > 0) {
      console.log('🐌 Slowest operations:');
      stats.slowestOperations.slice(0, 5).forEach((op, index) => {
        console.log(`  ${index + 1}. ${op.operation}: ${op.duration?.toFixed(2)}ms`);
      });
    }
    
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-log summary every 5 minutes in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = performanceMonitor.getStats();
    if (stats.totalOperations > 0) {
      performanceMonitor.logSummary();
    }
  }, 5 * 60 * 1000);
}