'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DateNavigation from './components/DateNavigation';
import TimesheetStats from './components/TimesheetStats';
import TimesheetTable from './components/TimesheetTable';
import TimesheetSummary from './components/TimesheetSummary';
import ExportButtons from '../reports/components/ExportButtons';
import { AlertCircle, RefreshCw, FileText, X } from 'lucide-react';
import { adminTimesheetApi } from '../../lib/api/adminTimesheetApi';
import type { TimesheetOption, TimesheetStats as TimesheetStatsType, EmployeeTimesheetData } from '../../lib/types/timesheet';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdminTimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  timesheetData: Record<string, boolean>;
  submittedAt: string | null;
  status: 'complete' | 'incomplete' | 'absent';
  isActive: boolean;
  notes?: string;
}

export default function AdminTimesheetPage() {
  // State management
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showDailyTasks, setShowDailyTasks] = useState(false);

  // Data states
  const [employees, setEmployees] = useState<any[]>([]);
  const [timesheetEntries, setTimesheetEntries] = useState<AdminTimesheetEntry[]>([]);
  const [timesheetOptions, setTimesheetOptions] = useState<TimesheetOption[]>([]);
  const [stats, setStats] = useState<TimesheetStatsType>({
    total: 0,
    complete: 0,
    incomplete: 0,
    absent: 0
  });

  // Pending leave requests for sidebar
  const pendingLeaveRequests = 3;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load timesheet data when date changes
  useEffect(() => {
    loadTimesheetData();
  }, [selectedDate, employees, timesheetOptions]);

  // Calculate stats when timesheet entries change
  useEffect(() => {
    calculateStats();
  }, [timesheetEntries, activeTab]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Loading admin timesheet initial data...');

      // 🌐 Load via API with proper error handling
      const data = await adminTimesheetApi.getAdminTimesheetData(selectedDate);
      
      // Ensure data structure is valid before setting state
      setEmployees(data?.employees || []);
      setTimesheetOptions(data?.timesheetOptions || []);
      setTimesheetEntries(data?.timesheetEntries || []);
      
      console.log('✅ Initial data loaded:', {
         employees: data?.employees?.length || 0,
        timesheetOptions: data?.timesheetOptions?.length || 0,
        timesheetEntries: data?.timesheetEntries?.length || 0
     });

    } catch (error: any) {
      console.error('❌ Error loading initial data:', error);
      setError(error.message || 'Failed to load initial data');
      
      // Set safe fallback data on error
      setEmployees([]);
      setTimesheetOptions([]);
      setTimesheetEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTimesheetData = async () => {
    if (!selectedDate) return;
    try {
      console.log('📋 Loading timesheet data for date:', selectedDate);

      //  Load via API with proper error handling
      const data = await adminTimesheetApi.getAdminTimesheetData(selectedDate);
      setTimesheetEntries(data?.timesheetEntries || []);
      
      console.log('✅ Timesheet data loaded via API for', data?.timesheetEntries?.length || 0, 'employees');
    } catch (error: any) {
      console.error('❌ Error loading timesheet data:', error);
      setError(error.message || 'Failed to load timesheet data');
      
      // Set safe fallback on error
      setTimesheetEntries([]);
    }
  };

  const calculateStats = () => {
    // Safety check to prevent undefined errors
    if (!Array.isArray(timesheetEntries)) {
      setStats({
        total: 0,
        complete: 0,
        incomplete: 0,
        absent: 0
      });
      return;
    }
    
    const filteredEntries = timesheetEntries.filter(entry => 
      activeTab === 'active' ? entry.isActive : !entry.isActive
    );

    const newStats: TimesheetStatsType = {
      total: filteredEntries.length,
      complete: filteredEntries.filter(e => e.status === 'complete').length,
      incomplete: filteredEntries.filter(e => e.status === 'incomplete').length,
      absent: filteredEntries.filter(e => e.status === 'absent').length
    };

    setStats(newStats);
  };

  const calculateStatus = (timesheetData: Record<string, boolean>): 'complete' | 'incomplete' | 'absent' => {
    const checkedCount = Object.values(timesheetData).filter(Boolean).length;
    
    if (checkedCount === 0) {
      return 'absent';
    } else if (checkedCount >= 2) {
      return 'complete';
    } else {
      return 'incomplete';
    }
  };

  const handleToggleCheckbox = async (entryId: string, optionKey: string) => {
    const entry = timesheetEntries.find(e => e.id === entryId);
    if (!entry) return;

    setSaving(entryId);
    setError(null);

    try {
      // Update local state optimistically
      const updatedTimesheetData = {
        ...entry.timesheetData,
        [optionKey]: !entry.timesheetData[optionKey]
      };

      // 🌐 Update via API
      const result = await adminTimesheetApi.updateTimesheetCheckbox(
        entry.employeeId,
        selectedDate,
        optionKey,
        !entry.timesheetData[optionKey],
        updatedTimesheetData
      );

      // Update local state with server response
      const newStatus = result.entry.status;
      const updatedEntry = {
        ...entry,
        timesheetData: updatedTimesheetData,
        status: newStatus,
        submittedAt: new Date().toLocaleTimeString('ro-RO')
      };

      setTimesheetEntries(prev => 
        prev.map(e => e.id === entryId ? updatedEntry : e)
      );

     console.log('✅ Timesheet entry saved successfully');

    } catch (error: any) {
      console.error('❌ Error saving timesheet entry:', error);
      setError(error.message || 'Failed to save timesheet entry');
      
      // Revert optimistic update on error
      await loadTimesheetData();
    } finally {
      setSaving(null);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const handleRefresh = async () => {
    await loadInitialData();
  };

  // Prepare export data
  const getExportData = () => {
    const filteredEntries = timesheetEntries.filter(entry => 
      activeTab === 'active' ? entry.isActive : !entry.isActive
    );

    return filteredEntries.map(entry => ({
      angajat: entry.employeeName,
      departament: entry.department,
      status: entry.status === 'complete' ? 'Complet' : 
             entry.status === 'incomplete' ? 'Incomplet' : 'Absent',
      ora_trimitere: entry.submittedAt || 'Nu a trimis'
    }));
  };

  // Show loading state on initial load (matching Dashboard pattern)
  if (loading || !employees || employees.length === 0) {
    return (
      <DashboardLayout userRole="admin" pendingLeaveRequests={0}>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading timesheet data...</p>
              <p className="text-sm text-neutral-500 mt-2">Fetching employees and timesheet options...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout userRole="admin" pendingLeaveRequests={pendingLeaveRequests}>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1">Pontaj Angajați</h1>
              <p className="text-neutral-600 text-sm hidden sm:block">Înregistrează prezența și activitatea angajaților</p>
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
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
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
        </div>

        <DateNavigation 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onNavigate={navigateDate}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900">
              Pontaj pentru {new Date(selectedDate).toLocaleDateString('ro-RO', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long', 
                year: 'numeric'
              })} - {activeTab === 'active' ? 'Angajați Activi' : 'Angajați Demisi'}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDailyTasks(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Vezi Taskuri Zilnice</span>
              <span className="sm:hidden">Taskuri</span>
            </button>
            <ExportButtons 
              data={getExportData()}
              reportType="timesheet"
              selectedMonth={selectedDate}
            />
          </div>
        </div>

        <TimesheetStats stats={stats} />

        <TimesheetTable 
          data={timesheetEntries || []}
          timesheetOptions={timesheetOptions}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggleCheckbox={handleToggleCheckbox}
          saving={saving}
        />

        <TimesheetSummary 
          selectedDate={selectedDate}
          stats={stats}
        />

        {/* Daily Tasks Modal */}
        {showDailyTasks && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Taskuri Zilnice - {new Date(selectedDate).toLocaleDateString('ro-RO', { 
                      weekday: 'long', 
                      day: 'numeric',
                      month: 'long', 
                      year: 'numeric'
                    })}
                  </h2>
                  <button
                    onClick={() => setShowDailyTasks(false)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-neutral-600" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {timesheetEntries
                    .filter(entry => entry.notes && entry.notes.trim())
                    .map((entry) => (
                      <div key={entry.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-neutral-900">{entry.employeeName}</h3>
                            <p className="text-sm text-neutral-600">{entry.department}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.status === 'complete' ? 'bg-success-100 text-success-700' :
                              entry.status === 'incomplete' ? 'bg-warning-100 text-warning-700' :
                              'bg-danger-100 text-danger-700'
                            }`}>
                              {entry.status === 'complete' ? 'Complet' :
                               entry.status === 'incomplete' ? 'Incomplet' : 'Absent'}
                            </span>
                            {entry.submittedAt && (
                              <span className="text-xs text-neutral-500">
                                {entry.submittedAt}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-neutral-50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">Taskuri realizate:</h4>
                          <p className="text-sm text-neutral-900 whitespace-pre-wrap">{entry.notes}</p>
                        </div>
                        
                        {/* Timesheet Options Status */}
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <div className="flex flex-wrap gap-2">
                            {timesheetOptions.map(option => (
                              <span
                                key={option.key}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  entry.timesheetData[option.key] 
                                    ? 'bg-success-100 text-success-700' 
                                    : 'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {option.title}: {entry.timesheetData[option.key] ? 'Da' : 'Nu'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {(!timesheetEntries || 
                    timesheetEntries
                      .filter(entry => activeTab === 'active' ? entry.isActive : !entry.isActive)
                      .filter(entry => entry.notes && entry.notes.trim()).length === 0) && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-500">Nu există taskuri completate pentru această zi.</p>
                      <p className="text-sm text-neutral-400 mt-1">
                        Angajații nu au completat încă taskurile pentru {new Date(selectedDate).toLocaleDateString('ro-RO')}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}