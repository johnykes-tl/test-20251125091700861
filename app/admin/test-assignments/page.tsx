'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DateNavigation from './components/DateNavigation';
import AssignmentCard from './components/AssignmentCard';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Target, 
  Users,
  Calendar,
  Settings
} from 'lucide-react';
import { testAssignmentsApi } from '../../lib/api/testAssignmentsApi';
import type { 
  AssignmentsByDate, 
  EligibleEmployee 
} from '../../lib/services/testAssignmentsService';
import type { TestAssignmentWithDetails } from '../../lib/types/tests'; // Corrected path
// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TestAssignmentsPage() {
  // State management
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Data states
  const [assignmentsData, setAssignmentsData] = useState<AssignmentsByDate | null>(null);
  const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployee[]>([]);
  const [groupedAssignments, setGroupedAssignments] = useState<Map<string, TestAssignmentWithDetails[]>>(new Map());

  // Load data when component mounts or date changes
  useEffect(() => {
    loadPageData();
  }, [selectedDate]);

  // Group assignments when data changes
  useEffect(() => {
    if (assignmentsData) {
      groupAssignmentsByTest();
    }
  }, [assignmentsData]);

  const loadPageData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Loading test assignments page data for:', selectedDate);

      // Fetch assignments and eligible employees (if not already loaded) in parallel
      const assignmentsPromise = testAssignmentsApi.getAssignmentsByDate(selectedDate);
      const employeesPromise = testAssignmentsApi.getEligibleEmployees();
      const [assignmentsResult, employeesResult] = await Promise.all([
        assignmentsPromise,
        employeesPromise
      ]);
      
      setAssignmentsData(assignmentsResult);
      setEligibleEmployees(employeesResult);
      
      // FIX: Explicitly map employee data to ensure correct property names
      const mappedEmployees = (employeesResult || []).map((emp: any) => ({
        id: emp.employee_id || emp.id,
        name: emp.employee_name || emp.name,
        department: emp.department,
      }));
      setEligibleEmployees(mappedEmployees);
    } catch (error: any) {
      console.error('❌ Error loading page data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (assignmentId: string, newEmployeeId: string) => {
    setActionLoading(`update-${assignmentId}`);
    setError(null);

    try {
      console.log('🔄 Updating assignment employee:', { assignmentId, newEmployeeId });
      
      await testAssignmentsApi.updateAssignment(assignmentId, { employee_id: newEmployeeId });
      setSuccess('Assignment updated successfully');
      setTimeout(() => setSuccess(null), 3000);

      // Reload data
       const assignmentsResult = await testAssignmentsApi.getAssignmentsByDate(selectedDate);
     setAssignmentsData(assignmentsResult);
    } catch (error: any) {
      console.error('❌ Error updating assignment:', error);
      setError(error.message || 'Failed to update assignment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateAssignmentStatus = async (assignmentId: string, status: 'pending' | 'completed' | 'skipped') => {
    setActionLoading(`status-${assignmentId}`);
    setError(null);

    // Store original data for rollback
    const originalAssignmentsData = assignmentsData;

    // Optimistic UI update
    if (assignmentsData) {
      const newAssignments = assignmentsData.assignments.map(a => 
        a.id === assignmentId ? { 
          ...a, 
          status: status, 
          completed_at: status === 'completed' ? new Date().toISOString() : a.completed_at 
        } : a
      );
      setAssignmentsData({ ...assignmentsData, assignments: newAssignments });
    }

    try {
      console.log('🔄 Updating assignment status:', { assignmentId, status });
      
       await testAssignmentsApi.updateAssignment(assignmentId, { 
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      });
      setSuccess('Assignment status updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error updating assignment status, rolling back:', error);
      setError(error.message || 'Failed to update assignment status');
      // Rollback on error
      if (originalAssignmentsData) {
        setAssignmentsData(originalAssignmentsData);
      }
    } finally {
      setActionLoading(null);
    }
 };

  const groupAssignmentsByTest = () => {
    if (!assignmentsData) return;

    const grouped = new Map<string, TestAssignmentWithDetails[]>();
    
    assignmentsData.assignments.forEach(assignment => {
      const testId = assignment.test_id;
      if (!grouped.has(testId)) {
        grouped.set(testId, []);
      }
      grouped.get(testId)?.push(assignment);
    });

    setGroupedAssignments(grouped);
    console.log('📊 Assignments grouped by test:', grouped.size, 'tests');
  };

  const handleAddAssignment = async (testId: string, employeeId: string) => {
    if (!assignmentsData?.isToday) {
      setError('Assignments can only be added for today');
      return;
    }

    setActionLoading(`add-${testId}`);
    setError(null);

    try {
      console.log('➕ Adding assignment:', { testId, employeeId, date: selectedDate });
      
      await testAssignmentsApi.createAssignment({
        test_id: testId,
        employee_id: employeeId,
        assigned_date: selectedDate
      });

      setSuccess('Assignment added successfully');
      setTimeout(() => setSuccess(null), 3000);

      // Reload data
      const assignmentsResult = await testAssignmentsApi.getAssignmentsByDate(selectedDate);
      setAssignmentsData(assignmentsResult);
    } catch (error: any) {
      console.error('❌ Error adding assignment:', error);
      setError(error.message || 'Failed to add assignment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!assignmentsData?.isToday) {
      setError('Assignments can only be removed for today');
      return;
    }

    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    setActionLoading(assignmentId);
    setError(null);

    try {
      console.log('🗑️ Removing assignment:', assignmentId);
      
      await testAssignmentsApi.deleteAssignment(assignmentId);
      setSuccess('Assignment removed successfully');
      setTimeout(() => setSuccess(null), 3000);

      // Reload data
       const assignmentsResult = await testAssignmentsApi.getAssignmentsByDate(selectedDate);
     setAssignmentsData(assignmentsResult);
    } catch (error: any) {
      console.error('❌ Error removing assignment:', error);
      setError(error.message || 'Failed to remove assignment');
    } finally {
      setActionLoading(null);
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
    await loadPageData();
  };

  // Get unique tests from grouped assignments
  const getUniqueTests = () => {
    const tests = new Map<string, { title: string; description: string }>();
    assignmentsData?.assignments.forEach(assignment => {
      if (!tests.has(assignment.test_id)) {
        tests.set(assignment.test_id, {
          title: assignment.test_title,
          description: assignment.test_description
        });
      }
    });
    return tests;
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading test assignments...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const uniqueTests = getUniqueTests();

  return (
    <DashboardLayout userRole="admin">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Assignări Teste</h1>
            <p className="text-neutral-600">Vizualizează și editează assignările de teste pe zi</p>
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

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
            <p className="text-sm text-success-700">{success}</p>
          </div>
        )}

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

        {/* Date Navigation */}
        <DateNavigation 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onNavigate={navigateDate}
        />

        {/* Stats */}
        {assignmentsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-neutral-600">Teste cu Assignări</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{assignmentsData.totalTests}</p>
              <p className="text-xs text-neutral-500">teste active</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-success-600" />
                <span className="text-sm font-medium text-neutral-600">Total Assignări</span>
              </div>
              <p className="text-2xl font-bold text-success-600">{assignmentsData.totalAssignments}</p>
              <p className="text-xs text-neutral-500">angajați assignați</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-neutral-600">Finalizate</span>
              </div>
              <p className="text-2xl font-bold text-primary-600">
                {assignmentsData.assignments.filter(a => a.status === 'completed').length}
              </p>
              <p className="text-xs text-neutral-500">teste complete</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-warning-600" />
                <span className="text-sm font-medium text-neutral-600">În Așteptare</span>
              </div>
              <p className="text-2xl font-bold text-warning-600">
                {assignmentsData.assignments.filter(a => a.status === 'pending').length}
              </p>
              <p className="text-xs text-neutral-500">teste pendente</p>
            </div>
          </div>
        )}

        {/* Assignment Cards */}
        <div className="space-y-6">
          {uniqueTests.size === 0 ? (
            <div className="card p-8">
              <div className="text-center">
                <Target className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  Nu există assignări pentru această zi
                </h3>
                <p className="text-neutral-600 mb-4">
                  {assignmentsData?.isToday 
                    ? 'Nu s-au generat assignări pentru astăzi încă.' 
                    : 'Nu au fost assignate teste în această zi.'}
                </p>
                {assignmentsData?.isToday && (
                  <div className="flex items-center justify-center gap-2">
                    <Settings className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-500">
                      Mergi la Management Teste pentru a genera assignări automat
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            Array.from(uniqueTests.entries()).map(([testId, testInfo]) => (
              <AssignmentCard
                key={testId}
                testId={testId}
                testTitle={testInfo.title}
                testDescription={testInfo.description}
                assignments={groupedAssignments.get(testId) || []}
                isToday={assignmentsData?.isToday || false}
                eligibleEmployees={eligibleEmployees}
                onAddAssignment={handleAddAssignment}
                onRemoveAssignment={handleRemoveAssignment}
                onUpdateAssignment={handleUpdateAssignment}
                onUpdateStatus={handleUpdateAssignmentStatus}
                loading={actionLoading}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}