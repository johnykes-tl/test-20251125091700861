import { supabase } from '../supabase-browser';
import { calculateWorkDays } from '../utils/workDaysCalculator';
import { diagnosticsService } from './diagnosticsService';
import type { 
  EmployeeMonthlyStats, 
  EmployeeRecentEntry, 
  SystemOverviewStats, 
  WeeklyAttendanceDayStats 
} from '../types/statistics';

function getWorkDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++;
    }
  }
  return workDays;
}

export const statisticsService = {
  async getEmployeeMonthlyStats(employeeId: string): Promise<EmployeeMonthlyStats> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    const { data: entries, error } = await supabase
      .from('timesheet_entries')
      .select('status')
      .eq('employee_id', employeeId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate);

    if (error) {
      console.error('Error fetching monthly stats:', error);
      throw new Error('Could not fetch monthly statistics.');
    }

    const workDaysInMonth = getWorkDaysInMonth(year, month);
    const completeDays = entries.filter(e => e.status === 'complete').length;
    const incompleteDays = entries.filter(e => e.status === 'incomplete').length;
    const presentDays = completeDays + incompleteDays;
    const absentDays = workDaysInMonth - presentDays;

    return {
      workDaysInMonth,
      presentDays,
      completeDays,
      incompleteDays,
      absentDays: Math.max(0, absentDays),
      attendanceRate: workDaysInMonth > 0 ? Math.round((presentDays / workDaysInMonth) * 100) : 0,
      completionRate: presentDays > 0 ? Math.round((completeDays / presentDays) * 100) : 0,
    };
  },

  async getEmployeeRecentEntries(employeeId: string, limit: number = 5): Promise<EmployeeRecentEntry[]> {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('entry_date, status, timesheet_data, submitted_at')
      .eq('employee_id', employeeId)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent entries:', error);
      throw new Error('Could not fetch recent entries.');
    }

    return data.map(entry => ({
      date: entry.entry_date,
      status: entry.status as 'complete' | 'incomplete' | 'absent',
      itemsCount: Object.values(entry.timesheet_data).filter(Boolean).length,
      submittedAt: entry.submitted_at ? new Date(entry.submitted_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : undefined,
    }));
  },

  async getSystemOverviewStats(): Promise<SystemOverviewStats> {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, is_active');
    
    if (empError) throw new Error('Could not fetch employees for stats.');

    const { count: pendingRequests, error: pendingError } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw new Error('Could not fetch pending leave requests.');

    const { data: leaveDays, error: leaveDaysError } = await supabase
      .from('leave_requests')
      .select('days')
      .eq('status', 'approved');

    if (leaveDaysError) throw new Error('Could not fetch approved leave days.');

    const totalLeaveDays = leaveDays?.reduce((sum, req) => sum + req.days, 0) || 0;
    const weeklyAttendance = await this.getWeeklyAttendanceStats();
    const averageAttendance = weeklyAttendance.length > 0 
      ? Math.round(weeklyAttendance.reduce((sum, day) => sum + day.attendanceRate, 0) / weeklyAttendance.length)
      : 0;

    const healthCheck = await diagnosticsService.performHealthCheck();

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.is_active).length,
      pendingRequests: pendingRequests || 0,
      totalLeaveDays,
      averageAttendance,
      systemHealth: healthCheck.overallHealth,
      errors: healthCheck.recommendations || [],
    };
  },

  async getWeeklyAttendanceStats(): Promise<WeeklyAttendanceDayStats[]> {
    const today = new Date();
    const weeklyStats: WeeklyAttendanceDayStats[] = [];

    const { data: activeEmployees, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('is_active', true);

    if (empError) throw new Error('Could not fetch active employees for weekly stats.');

    const totalActiveEmployees = activeEmployees.length;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('ro-RO', { weekday: 'short' });

      const { count: presentCount, error } = await supabase
        .from('timesheet_entries')
        .select('*', { count: 'exact', head: true })
        .eq('entry_date', dateString)
        .in('status', ['complete', 'incomplete']);

      if (error) {
        console.error(`Error fetching attendance for ${dateString}:`, error);
        continue;
      }

      weeklyStats.push({
        day: dayName,
        presentEmployees: presentCount || 0,
        totalActiveEmployees,
        attendanceRate: totalActiveEmployees > 0 ? Math.round(((presentCount || 0) / totalActiveEmployees) * 100) : 0,
      });
    }

    return weeklyStats;
  }
};