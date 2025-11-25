import { api } from './apiClient';
import type { DashboardStats, WeeklyAttendanceDay } from './dashboardService';
import type { RecentActivity } from './recentActivityService';

interface DashboardPageData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  weeklyAttendance: WeeklyAttendanceDay[];
  error?: string;
}

class BackendDashboardService {
  // Get complete dashboard data
  async getDashboardPageData(): Promise<DashboardPageData> {
    const response = await api.get<DashboardPageData>('/api/dashboard');
    return response.data || {
      stats: {
        totalEmployees: 0,
        activeEmployees: 0,
        completedTimesheets: 0,
        incompleteTimesheets: 0,
        absentEmployees: 0,
        attendanceRate: 0,
        weeklyAttendanceRate: 0,
        monthlyAttendanceRate: 0,
        totalLeaveRequests: 0,
        pendingLeaveRequests: 0,
        systemHealth: 'critical',
        errors: []
      },
      recentActivity: [],
      weeklyAttendance: []
    };
  }
}

export const backendDashboardService = new BackendDashboardService();