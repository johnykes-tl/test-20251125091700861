import { apiClient } from './apiClient';
import type { 
  AttendanceReportData, 
  LeaveReportData, 
  DepartmentSummaryData,
  TimesheetReportData 
} from '../services/reportsService';

interface SummaryStats {
  totalEmployees: number;
  averageAttendance: number;
  totalLeaveDays: number;
  pendingRequests: number;
  completedTimesheets: number;
  incompleteTimesheets: number;
}

export const reportsApi = {
  /**
   * Get attendance report for specific month
   */
  async getAttendanceReport(year: number, month: number): Promise<AttendanceReportData[]> {
    try {
      console.log('🌐 API: Loading attendance report...', { year, month });
      
      const response = await apiClient.get<{ data: AttendanceReportData[] }>(
        `/api/reports?type=attendance&year=${year}&month=${month}`
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load attendance report');
      }

      console.log('✅ API: Attendance report loaded successfully');
      // Handle nested API response structure
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray((response.data as any).data)) {
        return (response.data as any).data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('❌ API: Attendance report loading failed:', error);
      throw new Error(error.message || 'Failed to load attendance report');
    }
  },

  /**
   * Get leave report for specific year
   */
  async getLeaveReport(year: number): Promise<LeaveReportData[]> {
    try {
      console.log('🌐 API: Loading leave report...', { year });
      
      const response = await apiClient.get<{ data: LeaveReportData[] }>(
        `/api/reports?type=leave&year=${year}`
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load leave report');
      }

      console.log('✅ API: Leave report loaded successfully');
      // Handle nested API response structure
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray((response.data as any).data)) {
        return (response.data as any).data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('❌ API: Leave report loading failed:', error);
      throw new Error(error.message || 'Failed to load leave report');
    }
  },

  /**
   * Get department summary for specific month
   */
  async getDepartmentSummary(year: number, month: number): Promise<DepartmentSummaryData[]> {
    try {
      console.log('🌐 API: Loading department summary...', { year, month });
      
      const response = await apiClient.get<{ data: DepartmentSummaryData[] }>(
        `/api/reports?type=summary&year=${year}&month=${month}`
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load department summary');
      }

      console.log('✅ API: Department summary loaded successfully');
      // Handle nested API response structure
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray((response.data as any).data)) {
        return (response.data as any).data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('❌ API: Department summary loading failed:', error);
      throw new Error(error.message || 'Failed to load department summary');
    }
  },

  /**
   * Get timesheet report for specific date
   */
  async getTimesheetReport(date: string): Promise<TimesheetReportData[]> {
    try {
      console.log('🌐 API: Loading timesheet report...', { date });
      
      const response = await apiClient.get<{ data: TimesheetReportData[] }>(
        `/api/reports?type=timesheet&date=${date}`
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load timesheet report');
      }

      console.log('✅ API: Timesheet report loaded successfully');
      // Handle nested API response structure
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray((response.data as any).data)) {
        return (response.data as any).data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('❌ API: Timesheet report loading failed:', error);
      throw new Error(error.message || 'Failed to load timesheet report');
    }
  },

  /**
   * Get summary statistics for dashboard cards
   */
  async getSummaryStats(year: number, month: number): Promise<SummaryStats> {
    try {
      console.log('🌐 API: Loading summary stats...', { year, month });
      
      const response = await apiClient.get<{ data: SummaryStats }>(
        `/api/reports?type=stats&year=${year}&month=${month}`
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load summary stats');
      }

      console.log('✅ API: Summary stats loaded successfully');
      // Handle nested API response structure
      const defaultStats = {
        totalEmployees: 0,
        averageAttendance: 0,
        totalLeaveDays: 0,
        pendingRequests: 0,
        completedTimesheets: 0,
        incompleteTimesheets: 0
      };
      
      if (response.data && typeof response.data === 'object') {
        // Check if data is nested or direct
        const actualData = (response.data as any).data || response.data;
        return { ...defaultStats, ...actualData };
      } else {
        return defaultStats;
      }
    } catch (error: any) {
      console.error('❌ API: Summary stats loading failed:', error);
      throw new Error(error.message || 'Failed to load summary stats');
    }
  },

  /**
   * Export report data in various formats
   */
  async exportReport(
    type: 'attendance' | 'leave' | 'summary' | 'timesheet',
    format: 'csv' | 'excel' | 'pdf',
    year: number,
    month?: number,
    date?: string
  ): Promise<string> {
    try {
      console.log('🌐 API: Exporting report...', { type, format, year, month, date });
      
      let url = `/api/reports/export?type=${type}&format=${format}&year=${year}`;
      if (month) url += `&month=${month}`;
      if (date) url += `&date=${date}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Export request failed');
      }

      const content = await response.text();
      console.log('✅ API: Report exported successfully');
      return content;
    } catch (error: any) {
      console.error('❌ API: Report export failed:', error);
      throw new Error(error.message || 'Failed to export report');
    }
  }
};