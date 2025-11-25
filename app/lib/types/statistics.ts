export interface EmployeeMonthlyStats {
  workDaysInMonth: number;
  presentDays: number;
  completeDays: number;
  incompleteDays: number;
  absentDays: number;
  attendanceRate: number;
  completionRate: number;
}

export interface EmployeeRecentEntry {
  date: string;
  status: 'complete' | 'incomplete' | 'absent';
  itemsCount: number;
  submittedAt?: string;
}

export interface SystemOverviewStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingRequests: number;
  totalLeaveDays: number;
  averageAttendance: number;
  systemHealth: 'healthy' | 'degraded' | 'error' | 'critical';
  errors: string[];
}

export interface WeeklyAttendanceDayStats {
  day: string;
  presentEmployees: number;
  totalActiveEmployees: number;
  attendanceRate: number;
}