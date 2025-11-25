'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { employeesApi } from '../../lib/api/employeesApi';
import { leaveRequestsApi } from '../../lib/api/leaveRequestsApi';
import { calculateWorkDays, formatWorkDaysRange } from '../../lib/utils/workDaysCalculator';
import type { LeaveRequest, CreateLeaveRequestData, EmployeeLeaveBalance, LeaveType } from '../../lib/types/leaveRequest';
import ValidationAlert from '../../components/validation/ValidationAlert';
import ConfirmationDialog from '../../components/validation/ConfirmationDialog';
import { validateClientOperation } from '../../lib/validation/validationMiddleware';

export default function EmployeeLeave() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingRequestData, setPendingRequestData] = useState<any>(null);
  
  // Data states
  const [employee, setEmployee] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<EmployeeLeaveBalance | null>(null);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation' as LeaveType,
    reason: ''
  });
  
  const leaveTypes = [
    { value: 'vacation', label: 'Concediu de odihnă' },
    { value: 'medical', label: 'Concediu medical' },
    { value: 'personal', label: 'Concediu personal' },
    { value: 'maternity', label: 'Concediu maternal' },
    { value: 'paternity', label: 'Concediu paternal' },
    { value: 'unpaid', label: 'Concediu fără plată' }
  ];

  // ✅ Calculate work days in real-time
  const calculatedWorkDays = formData.startDate && formData.endDate 
    ? calculateWorkDays(formData.startDate, formData.endDate)
    : 0;

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Loading employee leave data...');
        
        // Load all data in parallel
        const employeeData = await employeesApi.getEmployeeByUserId(user.id);
        if (!employeeData) {
          throw new Error('Employee profile not found');
        }
        setEmployee(employeeData);
        console.log('✅ Employee data loaded:', employeeData.name);

        const [requests, balance] = await Promise.all([
          leaveRequestsApi.getEmployeeLeaveRequests(employeeData.id),
          leaveRequestsApi.getEmployeeLeaveBalance(employeeData.id)
        ]);
        
        setLeaveRequests(requests);
        setLeaveBalance(balance);
        console.log('✅ Leave requests and balance loaded');
        
      } catch (error: any) {
        console.error('❌ Error loading leave data:', error);
        setError(error.message || 'Failed to load leave data');
      } finally {
        setLoading(false);
        setMounted(true);
      }
    };
    
    loadInitialData();
  }, [user]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationResult(null);
    setError(null);
    
    if (!employee) {
      setError('Datele angajatului nu sunt încărcate');
      return;
    }
    
    // Prepare validation data
    const requestData = {
      employee_id: employee.id,
      start_date: formData.startDate,
      end_date: formData.endDate,
      leave_type: formData.type,
      reason: formData.reason.trim()
    };
    
    // Comprehensive validation
    const validation = await validateClientOperation('leave_create', requestData, user || undefined);
    
    if (!validation.canProceed) {
      setValidationResult(validation);
      return;
    }
    
    // Handle confirmation requirement
    if (validation.requiresConfirmation && !pendingRequestData) {
      setShowConfirmation(true);
      setPendingRequestData(requestData);
      return;
    }
   
    setSubmitting(true);
    
    try {
      console.log('📝 Submitting leave request...');
      
       const finalRequestData = pendingRequestData || requestData;
      const newRequest = await leaveRequestsApi.createLeaveRequest(finalRequestData);
     
      // Update local state
      setLeaveRequests(prev => [newRequest, ...prev]);
      
      // Refresh leave balance
      const updatedBalance = await leaveRequestsApi.getEmployeeLeaveBalance(employee.id);
      setLeaveBalance(updatedBalance);
      
      // Reset form
      setFormData({
        startDate: '',
        endDate: '',
        type: 'vacation',
        reason: ''
      });
      setShowForm(false);
      setSuccess('Cererea de concediu a fost trimisă cu succes!');
      setTimeout(() => setSuccess(null), 5000);
      
      console.log('✅ Leave request submitted successfully');
      setPendingRequestData(null);
    } catch (error: any) {
      console.error('❌ Error submitting leave request:', error);
      setError(error.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    if (!employee) return;
    
    setError(null);
    
    try {
      const [requests, balance] = await Promise.all([
        leaveRequestsApi.getEmployeeLeaveRequests(employee.id),
        leaveRequestsApi.getEmployeeLeaveBalance(employee.id)
      ]);
      
      setLeaveRequests(requests);
      setLeaveBalance(balance);
      
    } catch (error: any) {
      console.error('❌ Error refreshing data:', error);
      setError(error.message || 'Failed to refresh data');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-danger-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobat';
      case 'rejected':
        return 'Respins';
      case 'pending':
        return 'În așteptare';
      default:
        return 'Necunoscut';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-100 text-success-700';
      case 'rejected':
        return 'bg-danger-100 text-danger-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('ro-RO');
    const end = new Date(endDate).toLocaleDateString('ro-RO');
    return `${start} - ${end}`;
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    const typeMap = leaveTypes.find(t => t.value === type);
    return typeMap?.label || type;
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

  return (
    <DashboardLayout userRole="employee">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">Concedii</h1>
            <p className="text-neutral-600 text-sm sm:text-base">Gestionează cererile de concediu</p>
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
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Cerere Nouă</span>
              <span className="sm:hidden">Nouă</span>
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
            <p className="text-sm text-success-700">{success}</p>
          </div>
        )}

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
        
        {/* Enhanced Validation Alert */}
        {validationResult && (
          <div className="mb-6">
            <ValidationAlert
              errors={validationResult.errors}
              warnings={validationResult.warnings}
              securityIssues={validationResult.securityIssues}
              onDismiss={() => setValidationResult(null)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-neutral-600">Zile disponibile</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900">{leaveBalance?.remaining_days || 0}</p>
            <p className="text-xs text-neutral-500">din {leaveBalance?.total_days_per_year || 25} zile anuale</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <span className="text-sm font-medium text-neutral-600">Zile folosite</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900">{leaveBalance?.used_days || 0}</p>
            <p className="text-xs text-neutral-500">în acest an</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-warning-600" />
              <span className="text-sm font-medium text-neutral-600">În așteptare</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900">{leaveBalance?.pending_days || 0}</p>
            <p className="text-xs text-neutral-500">zile pendente</p>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-5 w-5 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-600">Total cereri</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-neutral-900">{leaveRequests.length}</p>
            <p className="text-xs text-neutral-500">în acest an</p>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Cerere Concediu Nouă</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Data început *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={submitting}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Data sfârșit *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    disabled={submitting}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                    required
                  />
                </div>

                {/* ✅ Work Days Preview */}
                {formData.startDate && formData.endDate && (
                  <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                    <p className="text-sm text-primary-700">
                      📅 <span className="font-medium">Zile lucrătoare:</span> {calculatedWorkDays} 
                      {calculatedWorkDays === 1 ? ' zi' : 'zile'}
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      ✅ Weekendurile sunt excluse automat din calcul
                    </p>
                    {calculatedWorkDays === 0 && (
                      <p className="text-xs text-danger-600 mt-1">
                        ⚠️ Perioada selectată nu conține zile lucrătoare
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tipul concediului *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as LeaveType})}
                    disabled={submitting}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  >
                    {leaveTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Motivul (Opțional)
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    rows={3}
                    disabled={submitting}
                    placeholder="Descrie motivul cererii..."
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={submitting || calculatedWorkDays === 0}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Se trimite...
                      </>
                    ) : (
                      'Trimite Cererea'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                    className="btn-secondary flex-1 disabled:opacity-50"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">Istoric Cereri</h2>
          </div>
          
          {leaveRequests.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-2">Nu ai cereri de concediu încă</p>
              <p className="text-sm text-neutral-400">Creează prima cerere folosind butonul "Cerere Nouă"</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {leaveRequests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(request.status)}
                        <h3 className="font-medium text-neutral-900">{getLeaveTypeLabel(request.leave_type)}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-600 space-y-1">
                        <p>
                          <span className="font-medium">Perioada:</span> {formatDateRange(request.start_date, request.end_date)}
                        </p>
                        <p>
                          <span className="font-medium">Durata:</span> {request.days} {request.days === 1 ? 'zi lucrătoare' : 'zile lucrătoare'}
                        </p>
                        <p>
                          <span className="font-medium">Trimis la:</span> {new Date(request.submitted_date).toLocaleDateString('ro-RO')}
                        </p>
                        {request.reason && (
                          <p>
                            <span className="font-medium">Motiv:</span> {request.reason}
                          </p>
                        )}
                        {request.approved_at && (
                          <p>
                            <span className="font-medium">Procesată la:</span> {new Date(request.approved_at).toLocaleDateString('ro-RO')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}