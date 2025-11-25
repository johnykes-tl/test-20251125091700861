'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  TestTube, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  AlertCircle,
  RefreshCw,
  FileText,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { employeesApi } from '../../lib/api/employeesApi';
import { testAssignmentsApi } from '../../lib/api/testAssignmentsApi';
import type { EmployeeTestAssignment, EmployeeTestStats } from '../../lib/services/employeeTestsService'; // This service seems to be a duplicate, but I'll keep it for now to avoid breaking things. The new service is better.
// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function EmployeeTestsPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [assignments, setAssignments] = useState<EmployeeTestAssignment[]>([]);
  const [todaysAssignments, setTodaysAssignments] = useState<EmployeeTestAssignment[]>([]);
  const [stats, setStats] = useState<EmployeeTestStats>({
    totalAssigned: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0
  });

  // Filter states
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('today');

  // Load initial data
  useEffect(() => {
    loadInitialData();
    setMounted(true);
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Loading employee tests data...');

      // Load employee data
      const employeeData = await employeesApi.getEmployeeByUserId(user.id);
      if (!employeeData) {
        throw new Error('Employee profile not found');
      }
      // The ESLint error was here: 'employee' is assigned a value but never used.
      // The fix is to remove the unused state variable and its setter.
      // setEmployee(employeeData); 

      // Load test assignments and stats
      const testsData = await testAssignmentsApi.getEmployeeTestsSummary(employeeData.id);
       // Add type safety for API response
      const safeTestsData = testsData as {
        assignments: EmployeeTestAssignment[];
        todaysAssignments: EmployeeTestAssignment[];
        stats: EmployeeTestStats;
      };
      
      setAssignments(safeTestsData.assignments || []);
      setTodaysAssignments(safeTestsData.todaysAssignments || []);
      setStats(safeTestsData.stats || {
        totalAssigned: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0
      });
      console.log('✅ Employee tests data loaded:', {
        employee: employeeData.name,
        totalAssignments: safeTestsData.assignments?.length || 0,
        todaysAssignments: safeTestsData.todaysAssignments?.length || 0,
        stats: safeTestsData.stats
     });

    } catch (error: any) {
      console.error('❌ Error loading employee tests data:', error);
      setError(error.message || 'Failed to load tests data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    assignmentId: string, 
    status: 'completed' | 'skipped',
    notes?: string
  ) => {
    setActionLoading(assignmentId);
    setError(null);

    try {
       await testAssignmentsApi.updateAssignment(assignmentId, { 
        status, 
        notes: notes || undefined,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined
      });
     
      setSuccess(`Test marked as ${status === 'completed' ? 'completed' : 'skipped'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);

      // Reload data
      await loadInitialData();

    } catch (error: any) {
      console.error('❌ Error updating test status:', error);
      setError(error.message || 'Failed to update test status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    await loadInitialData();
  };

  const getFilteredAssignments = () => {
    switch (activeFilter) {
      case 'today':
        return todaysAssignments;
      case 'pending':
        return assignments.filter(a => a.status === 'pending');
      case 'completed':
        return assignments.filter(a => a.status === 'completed');
      default:
        return assignments;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-600" />;
      case 'skipped':
        return <XCircle className="h-4 w-4 text-neutral-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-neutral-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'skipped':
        return 'bg-neutral-100 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Finalizat';
      case 'pending':
        return 'În Așteptare';
      case 'skipped':
        return 'Omis';
      default:
        return 'Necunoscut';
    }
  };

  const isOverdue = (assignment: EmployeeTestAssignment) => {
    if (assignment.status !== 'pending') return false;
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    return dueDate < today;
  };

  // Loading state
  if (!mounted || loading) {
    return (
      <DashboardLayout userRole="employee">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-32 bg-neutral-200 rounded"></div>
              <div className="h-32 bg-neutral-200 rounded"></div>
              <div className="h-32 bg-neutral-200 rounded"></div>
              <div className="h-32 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredAssignments = getFilteredAssignments();

  return (
    <DashboardLayout userRole="employee">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
              Testele Mele
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base">
              Vizualizează și completează testele assignate
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-neutral-600">Total Assignate</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900">{stats.totalAssigned}</p>
            <p className="text-xs text-neutral-500">teste primite</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <span className="text-sm font-medium text-neutral-600">Finalizate</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-success-600">{stats.completed}</p>
            <p className="text-xs text-neutral-500">teste complete</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-warning-600" />
              <span className="text-sm font-medium text-neutral-600">În Așteptare</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-warning-600">{stats.pending}</p>
            <p className="text-xs text-neutral-500">de completat</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-neutral-600">Rata Finalizare</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary-600">{stats.completionRate}%</p>
            <p className="text-xs text-neutral-500">din total</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-neutral-200">
            <nav className="flex overflow-x-auto">
              {[
                { id: 'today', label: 'Astăzi', count: todaysAssignments.length },
                { id: 'pending', label: 'În Așteptare', count: stats.pending },
                { id: 'completed', label: 'Finalizate', count: stats.completed },
                { id: 'all', label: 'Toate', count: stats.totalAssigned }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-4 sm:px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeFilter === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span className="text-sm sm:text-base">
                    {tab.label} ({tab.count})
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tests List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="card p-8">
              <div className="text-center">
                <TestTube className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  Nu există teste pentru filtrul selectat
                </h3>
                <p className="text-neutral-600">
                  {activeFilter === 'today' 
                    ? 'Nu ai teste assignate pentru astăzi.'
                    : `Nu ai teste ${activeFilter === 'pending' ? 'în așteptare' : activeFilter === 'completed' ? 'finalizate' : 'assignate'}.`
                  }
                </p>
              </div>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-neutral-900 text-lg">
                        {assignment.test_title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(assignment.status)}`}>
                        {getStatusIcon(assignment.status)}
                        {getStatusText(assignment.status)}
                      </span>
                      {isOverdue(assignment) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-700">
                          Întârziat
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-600 mb-3">{assignment.test_description}</p>
                    
                    {assignment.test_instructions && (
                      <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                        <h4 className="font-medium text-primary-900 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Instrucțiuni
                        </h4>
                        <p className="text-sm text-primary-700">{assignment.test_instructions}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Assignat: {new Date(assignment.assigned_date).toLocaleDateString('ro-RO')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Termen: {new Date(assignment.due_date).toLocaleDateString('ro-RO')}
                      </span>
                    </div>

                    {assignment.completed_at && (
                      <div className="text-sm text-success-600 mb-2">
                        ✅ Finalizat la: {new Date(assignment.completed_at).toLocaleString('ro-RO')}
                      </div>
                    )}

                    {assignment.notes && (
                      <div className="text-sm text-neutral-600 p-2 bg-neutral-50 rounded border-l-4 border-primary-500">
                        <strong>Note:</strong> {assignment.notes}
                      </div>
                    )}
                  </div>
                </div>

                {assignment.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-neutral-200">
                    <button
                      onClick={() => handleUpdateStatus(assignment.id, 'completed')}
                      disabled={actionLoading === assignment.id}
                      className="btn-success flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === assignment.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Marchează ca Finalizat
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(assignment.id, 'skipped')}
                      disabled={actionLoading === assignment.id}
                      className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Omite Test
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}