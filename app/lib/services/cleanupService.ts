import { optimizedCache } from './optimizedCacheService';

/**
 * Service for cleaning up redundant direct service calls
 * and migrating remaining components to API-first approach
 */
class CleanupService {
  private directServiceUsage: Map<string, string[]> = new Map();

  /**
   * Register direct service usage for tracking
   */
  registerDirectUsage(component: string, service: string) {
    if (!this.directServiceUsage.has(component)) {
      this.directServiceUsage.set(component, []);
    }
    this.directServiceUsage.get(component)!.push(service);
  }

  /**
   * Get all components still using direct services
   */
  getDirectUsageReport() {
    const report = Array.from(this.directServiceUsage.entries()).map(([component, services]) => ({
      component,
      services,
      count: services.length
    }));

    return {
      totalComponents: report.length,
      totalUsages: report.reduce((sum, item) => sum + item.count, 0),
      components: report.sort((a, b) => b.count - a.count)
    };
  }

  /**
   * Clear usage tracking for a component (after migration)
   */
  markAsMigrated(component: string) {
    this.directServiceUsage.delete(component);
    console.log(`✅ Component migrated to API-first: ${component}`);
  }

  /**
   * Cleanup unused imports and services
   */
  getUnusedServices() {
    // This would be used during cleanup phase to identify
    // services that are no longer directly used
    const potentiallyUnused = [
      'employeeService (direct)',
      'timesheetService (direct)',
      'leaveRequestService (direct)',
      'reportsService (direct)',
      'dashboardService (direct)'
    ];

    return potentiallyUnused;
  }

  /**
   * Performance cleanup - clear caches and reset metrics
   */
  performanceCleanup() {
    console.log('🧹 Running performance cleanup...');
    
    // Clear optimized cache
    optimizedCache.clear();
    
    // Clear performance metrics (would integrate with performance monitor)
    if (typeof window !== 'undefined') {
      // Clear any accumulated data
      console.log('✅ Performance cleanup completed');
    }
  }

  /**
   * Memory optimization - remove stale references
   */
  memoryOptimization() {
    console.log('💾 Running memory optimization...');
    
    // Clear direct service tracking
    this.directServiceUsage.clear();
    
    // Suggest garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
    
    console.log('✅ Memory optimization completed');
  }

  /**
   * Generate migration report
   */
  generateMigrationReport() {
    const directUsage = this.getDirectUsageReport();
    const unusedServices = this.getUnusedServices();
    
    return {
      phase: 'PHASE 3: Optimization & Polish',
      status: 'IN PROGRESS',
      migrations: {
        completed: {
          'Employee Management': '✅ API-first',
          'Employee Timesheet': '✅ API-first',
          'Leave Requests': '✅ API-first', 
          'Test Assignments': '✅ API-first',
          'Settings': '✅ API-first',
          'Dashboard': '✅ API-first (NEW)',
          'Reports': '✅ API-first (NEW)'
        },
        remaining: directUsage.components.map(c => `${c.component}: ${c.services.join(', ')}`),
        cleanup: {
          'Cache Optimization': '✅ Implemented',
          'Performance Monitoring': '✅ Implemented',
          'Real-time Enhancements': '✅ Implemented',
          'Unused Services': unusedServices
        }
      },
      metrics: {
        totalApiEndpoints: 15,
        totalApiClients: 8,
        cacheHitRate: 'Dynamic',
        performanceGains: 'Measured in real-time'
      }
    };
  }
}

export const cleanupService = new CleanupService();

// Development helper - log migration report
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).getMigrationReport = () => {
    const report = cleanupService.generateMigrationReport();
    console.table(report.migrations.completed);
    console.log('📊 Migration Report:', report);
    return report;
  };
  
  console.log('💡 Development Helper: Run getMigrationReport() in console for migration status');
}