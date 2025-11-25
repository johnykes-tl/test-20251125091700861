import { employeeService } from './employeeService';
import { leaveRequestService } from './leaveRequestService';
import { recentActivityService, type RecentActivity } from './recentActivityService';
import { timesheetService } from './timesheetService';

// Type definitions for dashboard data structures
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  completedTimesheets: number;
  incompleteTimesheets: number;
  absentEmployees: number;
  attendanceRate: number;
  weeklyAttendanceRate: number;
  monthlyAttendanceRate: number;
  totalLeaveRequests: number;
  pendingLeaveRequests: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  errors: string[];
}

export interface WeeklyAttendanceDay {
  day: string;
  attendanceRate: number;
  completedCount: number;
  totalCount: number;
}

export interface DashboardPageData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  weeklyAttendance: WeeklyAttendanceDay[];
  error?: string | null;
}

interface TimesheetStatsCalculation {
  completed: number;
  incomplete: number;
  absent: number;
  attendanceRate: number;
}

export const dashboardService = {
  /**
   * Main method to load all dashboard data
   */
  async getDashboardPageData(): Promise<DashboardPageData> {
    try {
      console.log('📊 Loading comprehensive dashboard data...');

      // Load all required data in parallel for optimal performance
      const [
        employees,
        recentActivity,
        weeklyAttendance,
        leaveStats,
        pendingCount,
        todaysTimesheetEntries
      ] = await Promise.all([
        employeeService.getEmployees(),
        recentActivityService.getRecentActivities(10),
        this.getWeeklyAttendance(),
        leaveRequestService.getLeaveStats({ year: new Date().getFullYear() }),
        leaveRequestService.getPendingLeaveRequestsCount(),
        timesheetService.getTimesheetEntriesForDate(new Date().toISOString().split('T')[0])
      ]);

      // Filter to active employees only
      const activeEmployees = employees.filter(emp => emp.is_active);
      
      // Calculate real-time timesheet statistics
      const timesheetStats = this.calculateTimesheetStats(activeEmployees, todaysTimesheetEntries);

      // Build comprehensive dashboard statistics
      const stats: DashboardStats = {
        totalEmployees: activeEmployees.length,
        activeEmployees: activeEmployees.length,
        completedTimesheets: timesheetStats.completed,
        incompleteTimesheets: timesheetStats.incomplete,
        absentEmployees: timesheetStats.absent,
        attendanceRate: timesheetStats.attendanceRate,
        weeklyAttendanceRate: this.calculateWeeklyAttendanceRate(weeklyAttendance),
        monthlyAttendanceRate: this.calculateMonthlyAttendanceRate(weeklyAttendance),
        totalLeaveRequests: leaveStats.approved + leaveStats.pending + leaveStats.rejected,
        pendingLeaveRequests: pendingCount,
        systemHealth: 'healthy' as const,
        errors: []
      };

      console.log('✅ Dashboard data loaded successfully:', {
        employees: activeEmployees.length,
        timesheetStats,
        recentActivities: recentActivity.length,
        weeklyDays: weeklyAttendance.length
      });

      return {
        stats,
        recentActivity,
        weeklyAttendance,
        error: null
      };

    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error);
      
      // Return fallback data structure with error information
      return {
        stats: this.getEmptyStats(),
        recentActivity: [],
        weeklyAttendance: [],
        error: error.message || 'Failed to load dashboard data'
      };
    }
  },

  /**
   * Calculate timesheet statistics from employees and entries
   */
  calculateTimesheetStats(employees: any[], timesheetEntries: any[]): TimesheetStatsCalculation {
    try {
      console.log('📊 Calculating timesheet statistics:', {
        employeeCount: employees.length,
        entryCount: timesheetEntries.length
      });

      // Create a map for efficient lookup of timesheet entries by employee ID
      const entriesMap = new Map(timesheetEntries.map(entry => [entry.employee_id, entry]));
      
      let completed = 0;
      let incomplete = 0;
      let absent = 0;
      
      // Process each active employee
      employees.forEach(employee => {
        const entry = entriesMap.get(employee.id);
        
        if (entry) {
          // Employee has a timesheet entry - check status
          switch (entry.status) {
            case 'complete':
              completed++;
              break;
            case 'incomplete':
              incomplete++;
              break;
            default:
              absent++;
              break;
          }
        } else {
          // No timesheet entry means absent
          absent++;
        }
      });
      
      // Calculate attendance rate (present = completed + incomplete)
      const totalPresent = completed + incomplete;
      const attendanceRate = employees.length > 0 ? Math.round((totalPresent / employees.length) * 100) : 0;
      
      const result = {
        completed,
        incomplete,
        absent,
        attendanceRate
      };

      console.log('✅ Timesheet statistics calculated:', result);
      return result;

    } catch (error: any) {
      console.error('❌ Error calculating timesheet stats:', error);
      return {
        completed: 0,
        incomplete: 0,
        absent: employees.length,
        attendanceRate: 0
      };
    }
  },

  /**
   * Get weekly attendance data for the past 7 days
   */
  async getWeeklyAttendance(): Promise<WeeklyAttendanceDay[]> {
    try {
      console.log('📅 Loading weekly attendance data...');
      
      const weeklyData: WeeklyAttendanceDay[] = [];
      const today = new Date();
      
      // Generate data for the past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        try {
          // Load employees and timesheet entries for this date
          const [employees, timesheetEntries] = await Promise.all([
            employeeService.getEmployees(),
            timesheetService.getTimesheetEntriesForDate(dateString)
          ]);

          const activeEmployees = employees.filter(emp => emp.is_active);
          const stats = this.calculateTimesheetStats(activeEmployees, timesheetEntries);
          
          weeklyData.push({
            day: date.toLocaleDateString('ro-RO', { weekday: 'short' }),
            attendanceRate: stats.attendanceRate,
            completedCount: stats.completed + stats.incomplete,
            totalCount: activeEmployees.length
          });

        } catch (dayError) {
          console.warn(`⚠️ Error loading data for ${dateString}:`, dayError);
          // Add fallback data for this day
          weeklyData.push({
            day: date.toLocaleDateString('ro-RO', { weekday: 'short' }),
            attendanceRate: 0,
            completedCount: 0,
            totalCount: 0
          });
        }
      }

      console.log('✅ Weekly attendance data loaded:', weeklyData.length, 'days');
      return weeklyData;

    } catch (error: any) {
      console.error('❌ Error loading weekly attendance:', error);
      return [];
    }
  },

  /**
   * Calculate average weekly attendance rate
   */
  calculateWeeklyAttendanceRate(weeklyAttendance: WeeklyAttendanceDay[]): number {
    if (weeklyAttendance.length === 0) return 0;
    
    const totalRate = weeklyAttendance.reduce((sum, day) => sum + day.attendanceRate, 0);
    return Math.round(totalRate / weeklyAttendance.length);
  },

  /**
   * Calculate monthly attendance rate (using weekly data as approximation)
   */
  calculateMonthlyAttendanceRate(weeklyAttendance: WeeklyAttendanceDay[]): number {
    // For now, use weekly average as monthly approximation
    // In the future, this could be enhanced to load actual monthly data
    return this.calculateWeeklyAttendanceRate(weeklyAttendance);
  },

  /**
   * Get empty stats structure for error fallback
   */
  getEmptyStats(): DashboardStats {
    return {
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
      systemHealth: 'critical' as const,
      errors: ['Failed to load dashboard data']
    };
  },

  /**
   * Health check for dashboard service
   */
  async performHealthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Test basic service connectivity
      await Promise.all([
        employeeService.getEmployees(),
        timesheetService.getTimesheetEntriesForDate(new Date().toISOString().split('T')[0])
      ]);

      return {
        healthy: true,
        message: 'Dashboard service is healthy'
      };

    } catch (error: any) {
      return {
        healthy: false,
        message: `Dashboard service health check failed: ${error.message}`
      };
    }
  }
};