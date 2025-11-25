'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar, Clock, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { employeeTimesheetApi } from '../../lib/api/employeeTimesheetApi';
import type { RecentActivity } from '../../lib/services/recentActivityService';
import type { EmployeeTestAssignment } from '../../lib/services/employeeTestsService';
import type { TimesheetOption, TimesheetEntry } from '../../lib/types/timesheet';

interface EmployeeMonthlyStats {
  workDaysInMonth: number;
  presentDays: number;
  completeDays: number;
  incompleteDays: number;
  absentDays: number;
  attendanceRate: number;
  completionRate: number;
}

interface EmployeeRecentEntry {
  date: string;
  status: 'complete' | 'incomplete' | 'absent';
  itemsCount: number;
  submittedAt?: string;
}

export default function EmployeeTimesheet() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  
  // Date and time states
  const currentDate = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [isPontajAllowed, setIsPontajAllowed] = useState<boolean>(false);
  
  // Timesheet data states
  const [timesheetData, setTimesheetData] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<string>('');
  
  // Data states
  const [employee, setEmployee] = useState<any>(null);
  const [timesheetOptions, setTimesheetOptions] = useState<TimesheetOption[]>([]);
  const [existingEntry, setExistingEntry] = useState<TimesheetEntry | null>(null);
  
  // Statistics and activity
  const [monthlyStats, setMonthlyStats] = useState<EmployeeMonthlyStats>({
    workDaysInMonth: 0,
    presentDays: 0,
    completeDays: 0,
    incompleteDays: 0,
    absentDays: 0,
    attendanceRate: 0,
    completionRate: 0
  });
  const [recentEntries, setRecentEntries] = useState<EmployeeRecentEntry[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [todaysTests, setTodaysTests] = useState<EmployeeTestAssignment[]>([]);
  
  // Load employee, timesheet options, and existing entry
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await employeeTimesheetApi.loadFullData(user.id);
        
        setEmployee(data.employee);
        setTimesheetOptions(data.timesheetOptions);
        setRecentActivities(data.recentActivities);
        setTodaysTests(data.todaysTests);
        setMonthlyStats(data.monthlyStats);
        setRecentEntries(data.recentEntries);
        
        console.log('✅ All initial data loaded via API');
        
      } catch (error: any) {
        console.error('❌ Error loading initial data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // Load timesheet entry for the selected date
  useEffect(() => {
    const loadTimesheetEntry = async () => {
      if (!employee || !selectedDate || timesheetOptions.length === 0) return;
      
      try {
        // 🌐 Load entry data via API
        const entry = await employeeTimesheetApi.loadEntryData(user!.id, selectedDate);
        
        if (entry) {
          setExistingEntry(entry);
          // Populate timesheet data and notes from existing entry
          const data: Record<string, boolean> = {};
          timesheetOptions.forEach(option => {
            data[option.key] = entry.timesheet_data?.[option.key] || false;
          });
          setTimesheetData(data);
          setNotes(entry.notes || '');
        } else {
          // Reset if no entry found for the selected date
          setExistingEntry(null);
          const initialData: Record<string, boolean> = {};
          timesheetOptions.forEach(option => {
            initialData[option.key] = false;
          });
          setTimesheetData(initialData);
          setNotes('');
     }
      } catch (err: any) {
        console.error(`❌ Error loading timesheet entry for ${selectedDate}:`, err);
        setError(`Failed to load data for ${selectedDate}`);
        setExistingEntry(null);
        const initialData: Record<string, boolean> = {};
        timesheetOptions.forEach(option => {
          initialData[option.key] = false;
        });
        setTimesheetData(initialData);
        setNotes('');
      }
    };
    
    loadTimesheetEntry();
  }, [employee, selectedDate, timesheetOptions]);

  // Set up time restrictions and mounted state
  useEffect(() => {
    const hour = new Date().getHours();
    setIsPontajAllowed(hour < 22);
    setMounted(true);
  }, []);

  const handleCheckboxChange = (key: string) => {
    if (!isPontajAllowed || selectedDate !== currentDate) return;
    
    setTimesheetData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!employee) {
      setError('Employee data not loaded');
      return;
    }
    
    // Validate required notes
    if (!notes.trim()) {
      setError('Taskurile sunt obligatorii. Te rog completează ce ai realizat astăzi.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      console.log('💾 Saving timesheet entry...');
      
      // 🌐 Save timesheet entry via API
      const result = await employeeTimesheetApi.saveTimesheetEntry(user.id, {
        entry_date: selectedDate,
        timesheet_data: timesheetData,
        notes: notes.trim() || undefined,
      });
      
      setExistingEntry(result.savedEntry);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // Update statistics if refreshed stats were returned
      if (result.refreshedStats) {
        setMonthlyStats(result.refreshedStats.monthlyStats);
        setRecentEntries(result.refreshedStats.recentEntries);
        console.log('✅ Stats updated after save via API');
      }
      
      console.log('✅ Timesheet entry saved successfully via API:', result.savedEntry.status);
    } catch (error: any) {
      console.error('❌ Error saving timesheet:', error);
      setError(error.message || 'Failed to save timesheet entry');
    } finally {
      setSaving(false);
    }
  };

  const getStatusText = () => {
    if (!existingEntry) return 'Nu a fost completat';
    
    switch (existingEntry.status) {
      case 'complete':
        return 'Complet';
      case 'incomplete':
        return 'Incomplet';
      case 'absent':
        return 'Absent';
      default:
        return 'Necunoscut';
    }
  };

  const getStatusColor = () => {
    if (!existingEntry) return 'bg-neutral-100 text-neutral-700';
    
    switch (existingEntry.status) {
      case 'complete':
        return 'bg-success-100 text-success-700';
      case 'incomplete':
        return 'bg-warning-100 text-warning-700';
      case 'absent':
        return 'bg-danger-100 text-danger-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const formatRecentEntryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-success-100 text-success-700';
      case 'incomplete':
        return 'bg-warning-100 text-warning-700';
      case 'absent':
        return 'bg-danger-100 text-danger-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  // Loading state
  if (!mounted || loading) {
    return (
      <DashboardLayout userRole="employee">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-neutral-200 rounded"></div>
                <div className="h-64 bg-neutral-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-neutral-200 rounded"></div>
                <div className="h-48 bg-neutral-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="employee">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
            Pontaj Personal
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base hidden sm:block">
            Completează pontajul pentru ziua selectată
          </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            {/* Date Selection */}
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <Calendar className="h-6 w-6 text-primary-600" />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">Selectează Data</h2>
                  <p className="text-sm text-neutral-600 hidden sm:block">Alege ziua pentru care completezi pontajul</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={currentDate}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!isPontajAllowed}
                />
                
                {/* Current status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </div>
              </div>
              
              {!isPontajAllowed && (
                <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <p className="text-sm text-warning-700">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Pontajul poate fi completat doar până la ora 22:00.
                  </p>
                </div>
              )}
              
              {selectedDate !== currentDate && (
                <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <p className="text-sm text-neutral-600">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Pontajul poate fi completat doar pentru ziua curentă.
                  </p>
                </div>
              )}
            </div>

            {/* Timesheet Options */}
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-6">
                <CheckCircle className="h-6 w-6 text-primary-600" />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">Elemente Pontaj</h2>
                  <p className="text-sm text-neutral-600 hidden sm:block">Bifează activitățile realizate</p>
                </div>
              </div>

              {timesheetOptions.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">Nu există opțiuni de pontaj configurate.</p>
                  <p className="text-sm text-neutral-400 mt-1">Contactează administratorul pentru configurare.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {timesheetOptions.map((option) => (
                    <label 
                      key={option.key} 
                      className={`flex items-center gap-3 p-4 border border-neutral-200 rounded-lg transition-colors ${
                        isPontajAllowed && selectedDate === currentDate 
                          ? 'hover:bg-neutral-50 cursor-pointer' 
                          : 'bg-neutral-50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={timesheetData[option.key] || false}
                        onChange={() => handleCheckboxChange(option.key)}
                        disabled={!isPontajAllowed || selectedDate !== currentDate}
                        className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-neutral-900 font-medium text-sm sm:text-base">
                        {option.employee_text}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <label htmlFor="tasks" className="block text-sm font-medium text-neutral-700 mb-2">
                  Taskuri realizate *
                </label>
                <textarea
                  id="tasks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!isPontajAllowed || selectedDate !== currentDate}
                  rows={4}
                  placeholder="Descrie taskurile pe care le-ai realizat astăzi... (obligatoriu)"
                  className={`w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                    !isPontajAllowed || selectedDate !== currentDate ? 'bg-neutral-50 cursor-not-allowed' : ''
                  }`}
                  required
                />
                {!notes.trim() && (
                  <p className="mt-1 text-sm text-danger-600">Taskurile sunt obligatorii pentru salvarea pontajului</p>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!isPontajAllowed || selectedDate !== currentDate || saving || timesheetOptions.length === 0 || !notes.trim()}
                className={`btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                  saved ? 'bg-success-600 hover:bg-success-700' : ''
                }`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Se salvează...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Salvat cu succes!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvează Pontaj
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Statistics and History Sidebar */}
          <div className="space-y-6">
            {/* Personal Statistics */}
            <div className="card p-6">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">
                Statistici Personale
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 text-sm sm:text-base">Zile lucru luna aceasta</span>
                  <span className="font-semibold text-neutral-900 text-sm sm:text-base">
                    {monthlyStats.workDaysInMonth}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 text-sm sm:text-base">Prezent</span>
                  <span className="font-semibold text-neutral-900 text-sm sm:text-base">
                    {monthlyStats.presentDays}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 text-sm sm:text-base">Rata de prezență</span>
                  <span className="font-semibold text-success-600 text-sm sm:text-base">
                    {monthlyStats.attendanceRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 text-sm sm:text-base">Pontaje complete</span>
                  <span className="font-semibold text-success-600 text-sm sm:text-base">
                    {monthlyStats.completeDays}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 text-sm sm:text-base">Pontaje incomplete</span>
                  <span className="font-semibold text-warning-600 text-sm sm:text-base">
                    {monthlyStats.incompleteDays}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Entries */}
            <div className="card p-6">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">
                Istoric Recent
              </h3>
              <div className="space-y-3">
                {recentEntries.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-neutral-500 text-sm">Nu există intrări recente</p>
                  </div>
                ) : (
                  recentEntries.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {formatRecentEntryDate(entry.date)}
                        </p>
                        <p className="text-xs text-neutral-600">
                          {entry.itemsCount} elemente
                          {entry.submittedAt && ` • ${entry.submittedAt}`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(entry.status)}`}>
                        {entry.status === 'complete' ? 'Complet' : 
                         entry.status === 'incomplete' ? 'Incomplet' : 'Absent'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="card p-6">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">
                Activitate Recentă
              </h3>
              <div className="space-y-2">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-neutral-500 text-sm">Nu există activități recente</p>
                  </div>
                ) : (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="p-2 bg-neutral-50 rounded text-xs">
                      <p className="font-medium text-neutral-900">{activity.action}</p>
                      <p className="text-neutral-600">{activity.description}</p>
                      <p className="text-neutral-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Today's Tests */}
            <div className="card p-6">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4">
                Teste de Astăzi
              </h3>
              <div className="space-y-3">
                {todaysTests.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-neutral-500 text-sm">Nu ai teste assignate astăzi</p>
                  </div>
                ) : (
                  todaysTests.map((test) => (
                    <div key={test.id} className="p-3 bg-neutral-50 rounded-lg border-l-4 border-primary-500">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-neutral-900 text-sm">{test.test_title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.status === 'completed' ? 'bg-success-100 text-success-700' :
                          test.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {test.status === 'completed' ? 'Finalizat' : 
                           test.status === 'pending' ? 'În Așteptare' : 'Omis'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mb-2">{test.test_description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">
                          {new Date(test.due_date).toLocaleDateString('ro-RO')}
                        </span>
                        <a href={`/employee/tests/${test.id}`} className="text-xs text-primary-600 hover:underline">
                          Vezi detalii
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}