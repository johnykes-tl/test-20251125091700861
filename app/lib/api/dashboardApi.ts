import { apiClient } from './apiClient';
import type { DashboardStats, DashboardPageData } from '../services/dashboardService';
import type { DatabaseHealthCheck } from '../services/diagnosticsService';

interface DashboardApiResponse {
  stats: DashboardStats;
  recentActivity: any[];
  weeklyAttendance: any[];
  error?: string;
}

export const dashboardApi = {
  /**
   * Get complete dashboard page data with stats, activity, and weekly attendance
   */
  async getDashboardPageData(): Promise<DashboardApiResponse> {
    try {
      console.log('🌐 API: Loading complete dashboard data...');
      
      const response = await apiClient.get<{ data: DashboardPageData }>('/api/dashboard');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load dashboard data');
      }

      console.log('✅ API: Dashboard data loaded successfully');
      const data = response.data.data || response.data;
      return data as DashboardApiResponse;
    } catch (error: any) {
      console.error('❌ API: Dashboard data loading failed:', error);
      throw new Error(error.message || 'Failed to load dashboard data');
    }
  },

  /**
   * Get dashboard stats only (lighter request)
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('🌐 API: Loading dashboard stats only...');
      
      const response = await apiClient.get<{ data: { stats: DashboardStats } }>('/api/dashboard?stats_only=true');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load dashboard stats');
      }

      console.log('✅ API: Dashboard stats loaded successfully');
      return response.data.data.stats;
    } catch (error: any) {
      console.error('❌ API: Dashboard stats loading failed:', error);
      throw new Error(error.message || 'Failed to load dashboard stats');
    }
  },

  /**
   * Run system health check
   */
  async getSystemHealth(): Promise<DatabaseHealthCheck> {
    try {
      console.log('🌐 API: Running system health check...');
      
      const response = await apiClient.get<{ data: { health: DatabaseHealthCheck } }>('/api/dashboard?health_check=true');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to run health check');
      }

      console.log('✅ API: Health check completed successfully');
      return response.data.data.health;
    } catch (error: any) {
      console.error('❌ API: Health check failed:', error);
      throw new Error(error.message || 'Failed to run health check');
    }
  }
};