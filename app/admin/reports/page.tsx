'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar, TrendingUp, Users, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import ExportButtons from './components/ExportButtons';
import AttendanceReport from './components/AttendanceReport';
import LeaveReport from './components/LeaveReport';
import SummaryReport from './components/SummaryReport';
import TimesheetReport from './components/TimesheetReport';
import { reportsApi } from '../../lib/api/reportsApi';
import type { 
  AttendanceReportData, 
  LeaveReportData, 
  DepartmentSummaryData,
  TimesheetReportData 
} from '../../lib/services/reportsService';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SummaryStats {
  totalEmployees: number;
  averageAttendance: number;
  totalLeaveDays: number;
  pendingRequests: number;
  completedTimesheets: number;
  incompleteTimesheets: number;
}

export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportType, setReportType] = useState<'attendance' | 'leave' | 'summary' | 'timesheet'>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic data states
  const [attendanceData, setAttendanceData] = useState<AttendanceReportData[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveReportData[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentSummaryData[]>([]);
  const [timesheetData, setTimesheetData] = useState<TimesheetReportData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalEmployees: 0,
    averageAttendance: 0,
    totalLeaveDays: 0,
    pendingRequests: 0,
    completedTimesheets: 0,
    incompleteTimesheets: 0
  });

  // Pending leave requests for sidebar
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState(0);

  // Load data when component mounts or filters change
  useEffect(() => {
    loadReportsData();
  }, [selectedMonth, reportType]);

  const loadReportsData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Loading dynamic reports data...', { selectedMonth, reportType });

      const [year, month] = selectedMonth.split('-').map(Number);

      // Load summary stats first (needed for sidebar and overview)
      const summary = await reportsApi.getSummaryStats(year, month);
      setSummaryStats(summary);
      setPendingLeaveRequests(summary.pendingRequests);

      // Load specific report data based on type
      switch (reportType) {
        case 'attendance':
          console.log('📈 Loading attendance report...');
          const attendance = await reportsApi.getAttendanceReport(year, month);
          setAttendanceData(attendance);
          
          // Calculate average attendance for summary
          const avgAttendance = attendance.length > 0 
            ? Math.round(attendance.reduce((sum, emp) => sum + emp.rate, 0) / attendance.length)
            : 0;
          setSummaryStats(prev => ({ ...prev, averageAttendance: avgAttendance }));
          break;

        case 'leave':
          console.log('🏖️ Loading leave report...');
          const leave = await reportsApi.getLeaveReport(year);
          setLeaveData(leave);
          break;

        case 'timesheet':
          console.log('⏰ Loading timesheet report...');
          const selectedDate = selectedMonth + '-01'; // Use first day of month for now
          const timesheet = await reportsApi.getTimesheetReport(selectedDate);
          setTimesheetData(timesheet);
          break;

        case 'summary':
        default:
          console.log('📋 Loading department summary...');
          const departments = await reportsApi.getDepartmentSummary(year, month);
          setDepartmentStats(departments);
          
          // Calculate average attendance from departments
          const deptAvgAttendance = departments.length > 0 
            ? Math.round(departments.reduce((sum, dept) => sum + dept.attendance, 0) / departments.length)
            : 0;
          setSummaryStats(prev => ({ ...prev, averageAttendance: deptAvgAttendance }));
          break;
      }

      console.log('✅ Dynamic reports data loaded successfully');

    } catch (error: any) {
      console.error('❌ Error loading reports data:', error);
      setError(error.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (reportType) {
      case 'attendance':
        return attendanceData;
      case 'leave':
        return leaveData;
      case 'timesheet':
        return timesheetData;
      case 'summary':
      default:
        return departmentStats;
    }
  };

  const handleRefresh = async () => {
    await loadReportsData();
  };

  const formatSelectedDate = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

  return (
    <DashboardLayout userRole="admin" pendingLeaveRequests={pendingLeaveRequests}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Rapoarte Dinamice</h1>
            <p className="text-neutral-600">Analize și statistici în timp real despre prezență și concedii</p>
            <p className="text-sm text-neutral-500 mt-1">Perioada: {formatSelectedDate()}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <ExportButtons 
              data={getCurrentData()}
              reportType={reportType}
              selectedMonth={selectedMonth}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-danger-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-danger-600 hover:text-danger-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-neutral-600">Total Angajați</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{summaryStats.totalEmployees}</p>
            <p className="text-xs text-neutral-500">activi în sistem</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-success-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success-600" />
              </div>
              <span className="text-sm font-medium text-neutral-600">Rata Prezență</span>
            </div>
            <p className="text-2xl font-bold text-success-600">{summaryStats.averageAttendance}%</p>
            <p className="text-xs text-neutral-500">media pe departamente</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Calendar className="h-5 w-5 text-warning-600" />
              </div>
              <span className="text-sm font-medium text-neutral-600">Zile Concediu</span>
            </div>
            <p className="text-2xl font-bold text-warning-600">{summaryStats.totalLeaveDays}</p>
            <p className="text-xs text-neutral-500">aprobate anul acesta</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-neutral-100 rounded-lg">
                <Clock className="h-5 w-5 text-neutral-600" />
              </div>
              <span className="text-sm font-medium text-neutral-600">Cereri Pendente</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{summaryStats.pendingRequests}</p>
            <p className="text-xs text-neutral-500">în așteptare</p>
          </div>
        </div>

        <div className="card mb-8">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Perioada raport
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tip raport
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="summary">Sumar general</option>
                  <option value="attendance">Raport prezență</option>
                  <option value="leave">Raport concedii</option>
                  <option value="timesheet">Raport pontaj zilnic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Se încarcă datele din baza de date...</p>
              <p className="text-sm text-neutral-500 mt-2">Procesare date pentru {formatSelectedDate()}</p>
            </div>
          )}

          {/* Report Content */}
          {!loading && (
            <>
              {reportType === 'summary' && (
                 <SummaryReport data={departmentStats} selectedMonth={selectedMonth} />
              )}

              {reportType === 'attendance' && (
                <AttendanceReport data={attendanceData} selectedMonth={selectedMonth} />
              )}

              {reportType === 'leave' && (
                <LeaveReport data={leaveData} selectedMonth={selectedMonth} />
              )}

              {reportType === 'timesheet' && (
                <TimesheetReport data={timesheetData} selectedMonth={selectedMonth} />
              )}
           </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}