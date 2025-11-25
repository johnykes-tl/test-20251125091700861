import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../../../lib/services/employeeService';
import { leaveRequestService } from '../../../lib/services/leaveRequestService';
import { timesheetService } from '../../../lib/services/timesheetService';
import type { 
  AttendanceReportData, 
  LeaveReportData, 
  DepartmentSummaryData,
  TimesheetReportData 
} from '../../../lib/services/reportsService';

export interface AttendanceData {
  employee: string;
  department: string;
  workDays: number;
  presentDays: number;
  absences: number;
  rate: number;
}

export interface LeaveData {
  employee: string;
  department: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
}

export interface DepartmentStats {
  name: string;
  employees: number;
  attendance: number;
  leaves: number;
}

export interface TimesheetData {
  angajat: string;
  departament: string;
  prezenta: string;
  update_pr: string;
  lucru_acasa: string;
  status: string;
  ora_trimitere: string;
}

export interface SummaryStats {
  totalEmployees: number;
  averageAttendance: number;
  totalLeaveDays: number;
  pendingRequests: number;
  completedTimesheets: number;
  incompleteTimesheets: number;
}

export interface UseReportsDataOptions {
  year: number;
  month: number;
  reportType: 'attendance' | 'leave' | 'summary' | 'timesheet';
  selectedDate?: string;
  autoLoad?: boolean;
}

export interface UseReportsDataReturn {
  // Data
  attendanceData: AttendanceData[];
  leaveData: LeaveData[];
  departmentStats: DepartmentStats[];
  timesheetData: TimesheetData[];
  summaryStats: SummaryStats;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing reports data
 * Provides centralized data loading and state management for reports
 */
export function useReportsData(options: UseReportsDataOptions): UseReportsDataReturn {
  const { year, month, reportType, selectedDate, autoLoad = true } = options;

  // Data states
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveData[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [timesheetData, setTimesheetData] = useState<TimesheetData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalEmployees: 0,
    averageAttendance: 0,
    totalLeaveDays: 0,
    pendingRequests: 0,
    completedTimesheets: 0,
    incompleteTimesheets: 0
  });

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate work days in a month (excluding weekends)
   */
  const getWorkDaysInMonth = useCallback((year: number, month: number): number => {
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
  }, []);

  /**
   * Get employee timesheet entries for a specific month
   */
  const getEmployeeTimesheetForMonth = useCallback(async (employeeId: string, year: number, month: number) => {
    try {
      const daysInMonth = new Date(year, month, 0).getDate();
      const entries = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        try {
          const entry = await timesheetService.getTimesheetEntry(employeeId, date);
          if (entry) {
            entries.push(entry);
          }
        } catch (error) {
          // Entry doesn't exist, skip
        }
      }
      
      return entries;
    } catch (error) {
      console.error('Error loading timesheet for month:', error);
      return [];
    }
  }, []);

  /**
   * Load attendance report data
   */
  const loadAttendanceData = useCallback(async () => {
    try {
      console.log('📊 Loading attendance data for:', { year, month });
      
      const employees = await employeeService.getEmployees();
      const activeEmployees = employees.filter(emp => emp.is_active);
      const workDaysInMonth = getWorkDaysInMonth(year, month);
      
      const attendancePromises = activeEmployees.map(async (employee) => {
        try {
          const entries = await getEmployeeTimesheetForMonth(employee.id, year, month);
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
          } as AttendanceData;
        } catch (error) {
          console.error(`Error loading attendance for ${employee.name}:`, error);
          return {
            employee: employee.name,
            department: employee.department,
            workDays: workDaysInMonth,
            presentDays: 0,
            absences: workDaysInMonth,
            rate: 0
          } as AttendanceData;
        }
      });

      const data = await Promise.all(attendancePromises);
      setAttendanceData(data);
      
      console.log('✅ Attendance data loaded:', data.length, 'employees');
    } catch (error) {
      console.error('❌ Error loading attendance data:', error);
      throw new Error('Failed to load attendance data');
    }
  }, [year, month, getWorkDaysInMonth, getEmployeeTimesheetForMonth]);

  /**
   * Load leave report data
   */
  const loadLeaveData = useCallback(async () => {
    try {
      console.log('📊 Loading leave data for year:', year);
      
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
          } as LeaveData;
        } catch (error) {
          console.error(`Error loading leave data for ${employee.name}:`, error);
          return {
            employee: employee.name,
            department: employee.department,
            totalDays: 25,
            usedDays: 0,
            remainingDays: 25,
            pendingDays: 0
          } as LeaveData;
        }
      });

      const data = await Promise.all(leavePromises);
      setLeaveData(data);
      
      console.log('✅ Leave data loaded:', data.length, 'employees');
    } catch (error) {
      console.error('❌ Error loading leave data:', error);
      throw new Error('Failed to load leave data');
    }
  }, [year]);

  /**
   * Load department summary data
   */
  const loadDepartmentStats = useCallback(async () => {
    try {
      console.log('📊 Loading department stats for:', { year, month });
      
      const employees = await employeeService.getEmployees();
      const activeEmployees = employees.filter(emp => emp.is_active);
      
      // Group by department
      const departments = new Map<string, { 
        employees: number; 
        totalAttendance: number; 
        totalLeaves: number; 
      }>();
      
      for (const employee of activeEmployees) {
        if (!departments.has(employee.department)) {
          departments.set(employee.department, { 
            employees: 0, 
            totalAttendance: 0, 
            totalLeaves: 0 
          });
        }
        
        const dept = departments.get(employee.department)!;
        dept.employees++;
        
        try {
          // Get attendance rate for this employee
          const entries = await getEmployeeTimesheetForMonth(employee.id, year, month);
          const workDays = getWorkDaysInMonth(year, month);
          const presentDays = entries.filter(e => e.status === 'complete' || e.status === 'incomplete').length;
          const attendanceRate = workDays > 0 ? (presentDays / workDays) * 100 : 0;
          dept.totalAttendance += attendanceRate;
          
          // Get leave days used
          const balance = await leaveRequestService.getEmployeeLeaveBalance(employee.id, year);
          dept.totalLeaves += balance?.used_days || 0;
        } catch (error) {
          console.error(`Error calculating stats for ${employee.name}:`, error);
        }
      }
      
      // Convert to array format
      const data: DepartmentStats[] = Array.from(departments.entries()).map(([name, data]) => ({
        name,
        employees: data.employees,
        attendance: data.employees > 0 ? Math.round(data.totalAttendance / data.employees) : 0,
        leaves: data.totalLeaves
      }));
      
      setDepartmentStats(data);
      console.log('✅ Department stats loaded:', data.length, 'departments');
    } catch (error) {
      console.error('❌ Error loading department stats:', error);
      throw new Error('Failed to load department statistics');
    }
  }, [year, month, getWorkDaysInMonth, getEmployeeTimesheetForMonth]);

  /**
   * Load timesheet report data
   */
  const loadTimesheetData = useCallback(async () => {
    try {
      const dateToUse = selectedDate || `${year}-${month.toString().padStart(2, '0')}-01`;
      console.log('📊 Loading timesheet data for date:', dateToUse);
      
      const employees = await employeeService.getEmployees();
      const entries = await timesheetService.getTimesheetEntriesForDate(dateToUse);
      const entriesMap = new Map(entries.map(entry => [entry.employee_id, entry]));
      
      const data: TimesheetData[] = employees.map(employee => {
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
      
      setTimesheetData(data);
      console.log('✅ Timesheet data loaded:', data.length, 'employees');
    } catch (error) {
      console.error('❌ Error loading timesheet data:', error);
      throw new Error('Failed to load timesheet data');
    }
  }, [year, month, selectedDate]);

  /**
   * Load summary statistics
   */
  const loadSummaryStats = useCallback(async () => {
    try {
      console.log('📊 Loading summary stats for:', { year, month });
      
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
          const entries = await getEmployeeTimesheetForMonth(employee.id, year, month);
          completedTimesheets += entries.filter(e => e.status === 'complete').length;
          incompleteTimesheets += entries.filter(e => e.status === 'incomplete').length;
        } catch (error) {
          console.error(`Error loading stats for ${employee.name}:`, error);
        }
      }
      
      setSummaryStats({
        totalEmployees: activeEmployees.length,
        averageAttendance: 0, // Will be calculated by specific report
        totalLeaveDays: leaveStats.approved || 0,
        pendingRequests: pendingCount,
        completedTimesheets,
        incompleteTimesheets
      });
      
      console.log('✅ Summary stats loaded');
    } catch (error) {
      console.error('❌ Error loading summary stats:', error);
      throw new Error('Failed to load summary statistics');
    }
  }, [year, month, getEmployeeTimesheetForMonth]);

  /**
   * Main data loading function
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Always load summary stats
      await loadSummaryStats();

      // Load specific report data based on type
      switch (reportType) {
        case 'attendance':
          await loadAttendanceData();
          break;
        case 'leave':
          await loadLeaveData();
          break;
        case 'summary':
          await loadDepartmentStats();
          break;
        case 'timesheet':
          await loadTimesheetData();
          break;
        default:
          await loadDepartmentStats();
      }

      console.log('✅ All data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading reports data:', error);
      setError(error.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  }, [reportType, loadSummaryStats, loadAttendanceData, loadLeaveData, loadDepartmentStats, loadTimesheetData]);

  /**
   * Refresh data (alias for loadData)
   */
  const refreshData = useCallback(() => {
    return loadData();
  }, [loadData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load data when options change
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [loadData, autoLoad]);

  return {
    // Data
    attendanceData,
    leaveData,
    departmentStats,
    timesheetData,
    summaryStats,
    
    // State
    loading,
    error,
    
    // Actions
    loadData,
    refreshData,
    clearError
  };
}

export default useReportsData;