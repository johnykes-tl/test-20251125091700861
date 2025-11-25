import { supabase } from '../supabase';
import { employeeService } from './employeeService';
import { leaveRequestService } from './leaveRequestService';
import { timesheetService } from './timesheetService';

// Types for report data - NO EXPORT here, only at bottom
interface AttendanceReportData {
  employee: string;
  department: string;
  workDays: number;
  presentDays: number;
  absences: number;
  rate: number;
}

interface LeaveReportData {
  employee: string;
  department: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
}

interface DepartmentSummaryData {
  name: string;
  employees: number;
  attendance: number;
  leaves: number;
}

interface TimesheetReportData {
  angajat: string;
  departament: string;
  prezenta: string;
  update_pr: string;
  lucru_acasa: string;
  status: string;
  ora_trimitere: string;
}

interface SystemOverviewStats {
  totalEmployees: number;
  averageAttendance: number;
  totalLeaveDays: number;
  pendingRequests: number;
  systemHealth: 'healthy' | 'degraded' | 'error';
  errors: string[];
}

interface WeeklyAttendanceData {
  day: string;
  attendanceRate: number;
  presentEmployees: number;
  totalEmployees: number;
}

export class ReportsService {
  /**
   * Calculate work days in a month (excluding weekends)
   */
  private getWorkDaysInMonth(year: number, month: number): number {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday(0) or Saturday(6)
        workDays++;
      }
    }
    
    return workDays;
  }

  /**
   * Get employee timesheet entries for a specific month
   */
  private async getEmployeeTimesheetForMonth(employeeId: string, year: number, month: number) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      
      const { data: entries, error } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);
      
      if (error) {
        console.error('Error loading timesheet for month:', error);
        return [];
      }
      
      return entries || [];
    } catch (error) {
      console.error('Error loading timesheet for month:', error);
      return [];
    }
  }

  /**
   * Generate attendance report for a specific month
   */
  async getAttendanceReport(year: number, month: number): Promise<AttendanceReportData[]> {
    try {
      console.log('📊 Generating attendance report for:', { year, month });
      
      const employees = await employeeService.getEmployees();
      const activeEmployees = employees.filter(emp => emp.is_active);
      const workDaysInMonth = this.getWorkDaysInMonth(year, month);
      
      const attendancePromises = activeEmployees.map(async (employee) => {
        try {
          const entries = await this.getEmployeeTimesheetForMonth(employee.id, year, month);
          const presentDays = entries.filter(entry => 
            entry.status === 'complete' || entry.status === 'incomplete'
          ).length;
          
          const absences = Math.max(0, workDaysInMonth - presentDays);
          const rate = workDaysInMonth > 0 ? Math.round((presentDays / workDaysInMonth) * 100) : 0;

          return {
            employee: employee.name,
            department: employee.department,
            workDays: workDaysInMonth,
            presentDays,
            absences,
            rate
          } as AttendanceReportData;
        } catch (error) {
          console.error(`Error processing attendance for ${employee.name}:`, error);
          return {
            employee: employee.name,
            department: employee.department,
            workDays: workDaysInMonth,
            presentDays: 0,
            absences: workDaysInMonth,
            rate: 0
          } as AttendanceReportData;
        }
      });

      const data = await Promise.all(attendancePromises);
      console.log('✅ Attendance report generated:', data.length, 'employees');
      return data;

    } catch (error: any) {
      console.error('❌ Error generating attendance report:', error);
      throw new Error('Failed to generate attendance report');
    }
  }

  /**
   * Generate leave report for a specific year
   */
  async getLeaveReport(year: number): Promise<LeaveReportData[]> {
    try {
      console.log('📊 Generating leave report for year:', year);
      
      const employees = await employeeService.getEmployees();
      const activeEmployees = employees.filter(emp => emp.is_active);
      
      const leavePromises = activeEmployees.map(async (employee) => {
        try {
          const balance = await leaveRequestService.getEmployeeLeaveBalance(employee.id, year);
          
          return {
            employee: employee.name,
            department: employee.department,
            totalDays: balance?.total_days_per_year || 25,
            usedDays: balance?.used_days || 0,
            remainingDays: balance?.remaining_days || 25,
            pendingDays: balance?.pending_days || 0
          } as LeaveReportData;
        } catch (error) {
          console.error(`Error processing leave data for ${employee.name}:`, error);
          return {
            employee: employee.name,
            department: employee.department,
            totalDays: 25,
            usedDays: 0,
            remainingDays: 25,
            pendingDays: 0
          } as LeaveReportData;
        }
      });

      const data = await Promise.all(leavePromises);
      console.log('✅ Leave report generated:', data.length, 'employees');
      return data;

    } catch (error: any) {
      console.error('❌ Error generating leave report:', error);
      throw new Error('Failed to generate leave report');
    }
  }

  /**
   * Generate department summary report
   */
  async getDepartmentSummary(year: number, month: number): Promise<DepartmentSummaryData[]> {
    try {
      console.log('📊 Generating department summary for:', { year, month });
      
      const employees = await employeeService.getEmployees();
      const activeEmployees = employees.filter(emp => emp.is_active);
      
      // Group employees by department using Map
      const departmentGroups = new Map<string, string[]>();
      
      activeEmployees.forEach(employee => {
        if (!departmentGroups.has(employee.department)) {
          departmentGroups.set(employee.department, []);
        }
        departmentGroups.get(employee.department)!.push(employee.id);
      });
      
      const departmentSummary: DepartmentSummaryData[] = [];

      // Convert Map to Array before iteration to avoid TypeScript issues
      const departmentEntries = Array.from(departmentGroups.entries());
      
      for (const [departmentName, employeeIds] of departmentEntries) {
        // Calculate attendance for this department
        let totalAttendance = 0;
        let validEmployees = 0;
        
        for (const employeeId of employeeIds) {
          try {
            const entries = await this.getEmployeeTimesheetForMonth(employeeId, year, month);
            const workDays = this.getWorkDaysInMonth(year, month);
            const presentDays = entries.filter(e => e.status === 'complete' || e.status === 'incomplete').length;
            const attendanceRate = workDays > 0 ? (presentDays / workDays) * 100 : 0;
            
            totalAttendance += attendanceRate;
            validEmployees++;
          } catch (error) {
            console.error(`Error calculating attendance for employee ${employeeId}:`, error);
          }
        }
        
        // Calculate leave days for department
        let totalLeaves = 0;
        for (const employeeId of employeeIds) {
          try {
            const balance = await leaveRequestService.getEmployeeLeaveBalance(employeeId, year);
            totalLeaves += balance?.used_days || 0;
          } catch (error) {
            console.error(`Error calculating leave for employee ${employeeId}:`, error);
          }
        }
        
        departmentSummary.push({
          name: departmentName,
          employees: employeeIds.length,
          attendance: validEmployees > 0 ? Math.round(totalAttendance / validEmployees) : 0,
          leaves: totalLeaves
        });
      }
      
      console.log('✅ Department summary generated:', departmentSummary.length, 'departments');
      return departmentSummary;

    } catch (error: any) {
      console.error('❌ Error generating department summary:', error);
      throw new Error('Failed to generate department summary');
    }
  }

  /**
   * Generate timesheet report for a specific date
   */
  async getTimesheetReport(selectedDate: string): Promise<TimesheetReportData[]> {
    try {
      console.log('📊 Generating timesheet report for date:', selectedDate);
      
      const employees = await employeeService.getEmployees();
      const entries = await timesheetService.getTimesheetEntriesForDate(selectedDate);
      
      // Create a map of entries by employee ID
      const entriesMap = new Map<string, any>();
      entries.forEach(entry => {
        entriesMap.set(entry.employee_id, entry);
      });
      
      const data: TimesheetReportData[] = employees.map(employee => {
        const entry = entriesMap.get(employee.id);
        
        if (entry && entry.timesheet_data) {
          return {
            angajat: employee.name,
            departament: employee.department,
            prezenta: entry.timesheet_data.present ? 'Da' : 'Nu',
            update_pr: entry.timesheet_data.update_pr ? 'Da' : 'Nu',
            lucru_acasa: entry.timesheet_data.work_from_home ? 'Da' : 'Nu',
            status: entry.status === 'complete' ? 'Complet' : 
                   entry.status === 'incomplete' ? 'Incomplet' : 'Absent',
            ora_trimitere: entry.submitted_at 
              ? new Date(entry.submitted_at).toLocaleTimeString('ro-RO')
              : 'Nu a trimis'
          };
        } else {
          return {
            angajat: employee.name,
            departament: employee.department,
            prezenta: 'Nu',
            update_pr: 'Nu',
            lucru_acasa: 'Nu',
            status: 'Absent',
            ora_trimitere: 'Nu a trimis'
          };
        }
      });
      
      console.log('✅ Timesheet report generated:', data.length, 'employees');
      return data;

    } catch (error: any) {
      console.error('❌ Error generating timesheet report:', error);
      throw new Error('Failed to generate timesheet report');
    }
  }

  /**
   * Get summary statistics for dashboard
   */
  async getSummaryStats(year: number, month: number): Promise<{
    totalEmployees: number;
    averageAttendance: number;
    totalLeaveDays: number;
    pendingRequests: number;
    completedTimesheets: number;
    incompleteTimesheets: number;
  }> {
    try {
      console.log('📊 Generating summary stats for:', { year, month });
      
      const [employees, leaveStats, pendingCount] = await Promise.all([
        employeeService.getEmployees(),
        leaveRequestService.getLeaveStats({ year }),
        leaveRequestService.getPendingLeaveRequestsCount()
      ]);

      const activeEmployees = employees.filter(emp => emp.is_active);
      
      // Calculate current month timesheet stats
      let completedTimesheets = 0;
      let incompleteTimesheets = 0;
      
      for (const employee of activeEmployees) {
        try {
          const entries = await this.getEmployeeTimesheetForMonth(employee.id, year, month);
          completedTimesheets += entries.filter(e => e.status === 'complete').length;
          incompleteTimesheets += entries.filter(e => e.status === 'incomplete').length;
        } catch (error) {
          console.error(`Error loading stats for ${employee.name}:`, error);
        }
      }
      
      const stats = {
        totalEmployees: activeEmployees.length,
        averageAttendance: 0, // Will be calculated by specific report
        totalLeaveDays: leaveStats.approved || 0,
        pendingRequests: pendingCount,
        completedTimesheets,
        incompleteTimesheets
      };
      
      console.log('✅ Summary stats generated:', stats);
      return stats;

    } catch (error: any) {
      console.error('❌ Error generating summary stats:', error);
      throw new Error('Failed to generate summary statistics');
    }
  }

  /**
   * Get system overview with health check
   */
  async getSystemOverviewStats(): Promise<SystemOverviewStats> {
    try {
      console.log('📊 Generating system overview stats...');
      
      const errors: string[] = [];
      let totalEmployees = 0;
      let averageAttendance = 0;
      let totalLeaveDays = 0;
      let pendingRequests = 0;
      
      try {
        const employees = await employeeService.getEmployees();
        totalEmployees = employees.filter(emp => emp.is_active).length;
      } catch (error) {
        errors.push('Failed to load employees');
        console.error('Error loading employees for overview:', error);
      }
      
      try {
        const currentYear = new Date().getFullYear();
        const leaveStats = await leaveRequestService.getLeaveStats({ year: currentYear });
        totalLeaveDays = leaveStats.approved || 0;
      } catch (error) {
        errors.push('Failed to load leave statistics');
        console.error('Error loading leave stats for overview:', error);
      }
      
      try {
        pendingRequests = await leaveRequestService.getPendingLeaveRequestsCount();
      } catch (error) {
        errors.push('Failed to load pending requests');
        console.error('Error loading pending requests for overview:', error);
      }
      
      // Determine system health
      let systemHealth: 'healthy' | 'degraded' | 'error';
      if (errors.length === 0) {
        systemHealth = 'healthy';
      } else if (errors.length <= 1) {
        systemHealth = 'degraded';
      } else {
        systemHealth = 'error';
      }
      
      const overview = {
        totalEmployees,
        averageAttendance,
        totalLeaveDays,
        pendingRequests,
        systemHealth,
        errors
      };
      
      console.log('✅ System overview generated:', overview);
      return overview;

    } catch (error: any) {
      console.error('❌ Error generating system overview:', error);
      return {
        totalEmployees: 0,
        averageAttendance: 0,
        totalLeaveDays: 0,
        pendingRequests: 0,
        systemHealth: 'error',
        errors: [`Critical error: ${error.message}`]
      };
    }
  }

  /**
   * Get weekly attendance statistics
   */
  async getWeeklyAttendanceStats(): Promise<WeeklyAttendanceData[]> {
    try {
      console.log('📊 Generating weekly attendance stats...');
      
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
      
      const weekDays = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'];
      const weeklyData: WeeklyAttendanceData[] = [];
      
      const employees = await employeeService.getEmployees();
      const activeEmployees = employees.filter(emp => emp.is_active);
      const totalEmployees = activeEmployees.length;
      
      for (let i = 0; i < 5; i++) { // Monday to Friday
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        try {
          const entries = await timesheetService.getTimesheetEntriesForDate(dateString);
          const presentEmployees = entries.filter(entry => 
            entry.status === 'complete' || entry.status === 'incomplete'
          ).length;
          
          const attendanceRate = totalEmployees > 0 ? Math.round((presentEmployees / totalEmployees) * 100) : 0;
          
          weeklyData.push({
            day: weekDays[i],
            attendanceRate,
            presentEmployees,
            totalEmployees
          });
        } catch (error) {
          console.error(`Error loading attendance for ${dateString}:`, error);
          weeklyData.push({
            day: weekDays[i],
            attendanceRate: 0,
            presentEmployees: 0,
            totalEmployees
          });
        }
      }
      
      console.log('✅ Weekly attendance stats generated:', weeklyData.length, 'days');
      return weeklyData;

    } catch (error: any) {
      console.error('❌ Error generating weekly attendance stats:', error);
      throw new Error('Failed to generate weekly attendance statistics');
    }
  }

  /**
   * Perform system health check
   */
  async performHealthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'error'; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Test employees service
      await employeeService.getEmployees();
    } catch (error) {
      errors.push('Employee service unavailable');
    }
    
    try {
      // Test leave service
      await leaveRequestService.getPendingLeaveRequestsCount();
    } catch (error) {
      errors.push('Leave request service unavailable');
    }
    
    try {
      // Test timesheet service
      await timesheetService.getTimesheetEntriesForDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      errors.push('Timesheet service unavailable');
    }
    
    let status: 'healthy' | 'degraded' | 'error';
    if (errors.length === 0) {
      status = 'healthy';
    } else if (errors.length <= 1) {
      status = 'degraded';
    } else {
      status = 'error';
    }
    
    return { status, errors };
  }
}

// Export singleton instance
export const reportsService = new ReportsService();

// ✅ FIXED: Export all types ONCE here only
export type {
  AttendanceReportData,
  LeaveReportData,
  DepartmentSummaryData,
  TimesheetReportData,
  SystemOverviewStats,
  WeeklyAttendanceData
};