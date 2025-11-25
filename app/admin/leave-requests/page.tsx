'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar as CalendarIcon, List, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import LeaveCalendar from './components/LeaveCalendar';
import LeaveList from './components/LeaveList';
import PendingRequests from './components/PendingRequests';
import LeaveForm from './components/LeaveForm';
import { leaveRequestsApi } from '../../lib/api/leaveRequestsApi';
import { employeesApi } from '../../lib/api/employeesApi';
import { useAuth } from '../../contexts/AuthContext';
import type { LeaveRequestWithEmployee, LeaveRequest } from '../../lib/types/leaveRequest';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLeaveRequestsPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [listFilter, setListFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState<any>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  
  // Data states - NOW DYNAMIC!
  const [leaveData, setLeaveData] = useState<LeaveRequestWithEmployee[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Calculate pending requests from real data
  const pendingRequests = leaveData.filter(leave => leave.status === 'pending');
  const pendingCount = pendingRequests.length;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Loading admin leave requests data...');

      // Load employees and leave requests in parallel
      const [employeesData, leaveRequestsData] = await Promise.all([
        employeesApi.getEmployees(),
        leaveRequestsApi.getLeaveRequestsWithEmployees()
      ]);
      setEmployees(employeesData);
      setLeaveData(leaveRequestsData);

      console.log('✅ Admin leave data loaded:', {
        employees: employeesData.length,
        leaveRequests: leaveRequestsData.length,
        pending: leaveRequestsData.filter(l => l.status === 'pending').length
      });

    } catch (error: any) {
      console.error('❌ Error loading admin leave data:', error);
      setError(error.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // ✅ FIXED: Now accepts string ID (UUID) instead of number
  const handleApprove = async (id: string) => {
    if (!user) return;

    setActionLoading(id);
    setError(null);

    try {
      console.log('✅ Approving leave request with UUID:', id);
      
      // ✅ FIXED: Pass UUID string directly, no conversion needed
      await leaveRequestsApi.approveLeaveRequest(id, user.id);
      
      // Update local state
      setLeaveData(prev => 
        prev.map(leave => 
          leave.id === id 
            ? { ...leave, status: 'approved' as const, approved_by: user.id, approved_at: new Date().toISOString() } 
            : leave
        )
      );

      console.log('✅ Leave request approved successfully');
    } catch (error: any) {
      console.error('❌ Error approving leave request:', error);
      setError(error.message || 'Failed to approve leave request');
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ FIXED: Now accepts string ID (UUID) instead of number
  const handleReject = async (id: string) => {
    if (!user) return;

    setActionLoading(id);
    setError(null);

    try {
      console.log('❌ Rejecting leave request with UUID:', id);
      
      // ✅ FIXED: Pass UUID string directly, no conversion needed
      await leaveRequestsApi.rejectLeaveRequest(id, user.id);
      
      // Update local state
      setLeaveData(prev => 
        prev.map(leave => 
          leave.id === id 
            ? { ...leave, status: 'rejected' as const, approved_by: user.id, approved_at: new Date().toISOString() } 
            : leave
        )
      );

      console.log('✅ Leave request rejected successfully');
    } catch (error: any) {
      console.error('❌ Error rejecting leave request:', error);
      setError(error.message || 'Failed to reject leave request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddLeave = () => {
    setFormMode('add');
    setEditingLeave(null);
    setShowForm(true);
  };

  const handleEditLeave = (leave: any) => {
    setFormMode('edit');
    setEditingLeave(leave);
    setShowForm(true);
  };

  const handleSaveLeave = async (leaveRequest: any) => {
    setError(null);

    try {
      console.log('💾 Saving leave request:', {
        mode: formMode,
        employeeName: leaveRequest.employeeName,
        employeeId: leaveRequest.employeeId,
        leaveType: leaveRequest.leaveType
      });

      if (formMode === 'add') {
        console.log('➕ Creating new leave request via admin...');
        
        // Validate we have employee ID
        if (!leaveRequest.employeeId) {
          throw new Error('Employee ID is required for creating leave request');
        }
        
        // Create the leave request with correct employee_id
        const newLeave = await leaveRequestsApi.createLeaveRequest({
          employee_id: leaveRequest.employeeId, // Use UUID instead of name
          start_date: leaveRequest.startDate,
          end_date: leaveRequest.endDate,
          leave_type: leaveRequest.leaveType,
          reason: leaveRequest.reason
        });

        console.log('✅ Leave request created:', newLeave);

        // If status should be different from default 'pending', update it
        if (leaveRequest.status && leaveRequest.status !== 'pending' && user) {
          if (leaveRequest.status === 'approved') {
            await leaveRequestsApi.approveLeaveRequest(newLeave.id, user.id);
          } else if (leaveRequest.status === 'rejected') {
            await leaveRequestsApi.rejectLeaveRequest(newLeave.id, user.id);
          }
        }

        // Reload data to get the complete record with employee info
        await loadInitialData();
        
      } else if (editingLeave) {
        console.log('✏️ Updating leave request via admin...');
        
        // Validate we have employee ID for updates too
        if (!leaveRequest.employeeId) {
          throw new Error('Employee ID is required for updating leave request');
        }
        
        // Update the leave request
        await leaveRequestsApi.updateLeaveRequest(editingLeave.id, {
          start_date: leaveRequest.startDate,
          end_date: leaveRequest.endDate,
          leave_type: leaveRequest.leaveType,
          reason: leaveRequest.reason
        });

        // Handle status changes
        if (leaveRequest.status !== editingLeave.status && user) {
          if (leaveRequest.status === 'approved') {
            await leaveRequestsApi.approveLeaveRequest(editingLeave.id, user.id);
          } else if (leaveRequest.status === 'rejected') {
            await leaveRequestsApi.rejectLeaveRequest(editingLeave.id, user.id);
          }
        }

        // Reload data
        await loadInitialData();
      }

      console.log('✅ Leave request saved successfully via admin');
    } catch (error: any) {
      console.error('❌ Error saving leave request:', error);
      setError(error.message || 'Failed to save leave request');
    }
  };

  const handleRefresh = async () => {
    await loadInitialData();
  };

  // ✅ FIXED: No more parseInt() - keep UUIDs as strings
  const getFormattedLeaveData = () => {
    return leaveData.map(leave => ({
      id: leave.id, // ✅ Keep UUID as string
      employeeName: leave.employee_name,
      department: leave.department,
      leaveType: leave.leave_type,
      startDate: leave.start_date,
      endDate: leave.end_date,
      days: leave.days,
      reason: leave.reason,
      status: leave.status,
      submittedDate: leave.submitted_date
    }));
  };

  // ✅ FIXED: No more parseInt() - keep UUIDs as strings
  const getFormattedPendingRequests = () => {
    return pendingRequests.map(leave => ({
      id: leave.id, // ✅ Keep UUID as string 
      employeeName: leave.employee_name,
      department: leave.department,
      leaveType: leave.leave_type,
      startDate: leave.start_date,
      endDate: leave.end_date,
      days: leave.days,
      reason: leave.reason,
      submittedDate: leave.submitted_date
    }));
  };

  const getFormattedEmployees = () => {
    return employees.map(emp => ({
      name: emp.name,
      department: emp.department,
      id: emp.id // Include employee ID for form mapping
    }));
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout userRole="admin" pendingLeaveRequests={0}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading leave requests...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin" pendingLeaveRequests={pendingCount}>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">Gestionare Concedii</h1>
            <p className="text-neutral-600 text-sm sm:text-base hidden sm:block">Monitorizează concediile angajaților prin calendar sau listă</p>
            <p className="text-xs text-neutral-500 mt-1">
              {leaveData.length} cereri totale, {pendingCount} în așteptare
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeView === 'calendar'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeView === 'list'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <List className="h-4 w-4" />
                Lista
              </button>
            </div>
            <button 
              onClick={handleAddLeave}
              className="btn-primary flex items-center gap-2 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Adaugă Concediu</span>
              <span className="sm:hidden">Adaugă</span>
            </button>
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

        {/* Pending Requests - Only show if there are any */}
        {pendingRequests.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <PendingRequests 
              requests={getFormattedPendingRequests()}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        )}

        {activeView === 'calendar' ? (
          <LeaveCalendar 
            leaves={getFormattedLeaveData()}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />
        ) : (
          <LeaveList 
            leaves={getFormattedLeaveData()}
            filterStatus={listFilter}
            onFilterChange={setListFilter}
            onEditLeave={handleEditLeave}
          />
        )}

        <LeaveForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSave={handleSaveLeave}
          leave={editingLeave}
          mode={formMode}
          employees={getFormattedEmployees()}
        />
      </div>
    </DashboardLayout>
  );
}