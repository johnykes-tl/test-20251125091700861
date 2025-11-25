/**
 * Performance Optimizer - Client-side performance monitoring and optimization
 */

interface PerformanceMetrics {
  renderTime: number;
  dataLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  timestamp: Date;
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  measureRender<T>(component: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const renderTime = performance.now() - startTime;

    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`Slow render detected: ${component} took ${renderTime.toFixed(2)}ms`);
    }

    this.addMetric({ renderTime, component });
    return result;
  }

  async measureDataLoad<T>(operation: string, loadFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await loadFn();
    const dataLoadTime = performance.now() - startTime;

    if (dataLoadTime > 1000) { // More than 1 second
      console.warn(`Slow data load: ${operation} took ${dataLoadTime.toFixed(2)}ms`);
    }

    this.addMetric({ dataLoadTime, operation });
    return result;
  }

  private addMetric(metric: Partial<PerformanceMetrics> & { component?: string; operation?: string }) {
    const fullMetric: PerformanceMetrics = {
      renderTime: metric.renderTime || 0,
      dataLoadTime: metric.dataLoadTime || 0,
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage: this.getMemoryUsage(),
      timestamp: new Date()
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private calculateCacheHitRate(): number {
    // This would integrate with dataCache to calculate hit rate
    return 0; // Placeholder
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageRenderTime(): number {
    const renderTimes = this.metrics.map(m => m.renderTime).filter(t => t > 0);
    return renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : 0;
  }

  getAverageLoadTime(): number {
    const loadTimes = this.metrics.map(m => m.dataLoadTime).filter(t => t > 0);
    return loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const measureRender = <T>(renderFn: () => T): T => {
    return performanceOptimizer.measureRender(componentName, renderFn);
  };

  const measureDataLoad = async <T>(operation: string, loadFn: () => Promise<T>): Promise<T> => {
    return performanceOptimizer.measureDataLoad(`${componentName}.${operation}`, loadFn);
  };

  return {
    measureRender,
    measureDataLoad,
    getMetrics: () => performanceOptimizer.getMetrics(),
    getAverageRenderTime: () => performanceOptimizer.getAverageRenderTime(),
    getAverageLoadTime: () => performanceOptimizer.getAverageLoadTime()
  };
}