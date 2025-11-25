'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { 
  Search, 
  Plus, 
  Edit, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  TestTube,
  Users
} from 'lucide-react';
import SimpleEmployeeForm from './SimpleEmployeeForm';
import { employeesApiClient } from '../../../lib/api/employeesApiClient';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  join_date: string;
  phone: string;
  is_active: boolean;
  test_eligible: boolean;
  leave_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentStat {
  department: string;
  count: number;
  active_count: number;
}

export default function EmployeePageClient() {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // UI states
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Loading employee management data...');
      
      // Test connection first
      const connectionOk = await employeesApiClient.testConnection();
      if (!connectionOk) {
        throw new Error('Database connection failed. Please check your configuration.');
      }
      
      // Load data in parallel
      const [employeesData, statsData] = await Promise.all([
        employeesApiClient.getEmployees(),
        employeesApiClient.getDepartmentStats()
      ]);
      
      setEmployees(employeesData);
      setDepartmentStats(statsData);
      
      console.log('✅ All employee data loaded successfully:', {
        employees: employeesData.length,
        departments: statsData.length
      });
      
    } catch (error: any) {
      console.error('❌ Error loading employee data:', error);
      setError(error.message || 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAllData();
  };

  const handleAddEmployee = () => {
    setFormMode('add');
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setFormMode('edit');
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleSaveEmployee = async (employeeData: any) => {
    setActionLoading('saving');
    setError(null);
    
    try {
      if (formMode === 'add') {
        await employeesApiClient.createEmployee(employeeData);
        setSuccess('Employee created successfully');
      } else if (editingEmployee) {
        await employeesApiClient.updateEmployee(editingEmployee.id, employeeData);
        setSuccess('Employee updated successfully');
      }
      
      setTimeout(() => setSuccess(null), 3000);
      setShowForm(false);
      await loadAllData(); // Reload all data
      
    } catch (error: any) {
      setError(error.message || 'Failed to save employee');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    setActionLoading(employeeId);
    setError(null);

    try {
      if (employee.is_active) {
        await employeesApiClient.deactivateEmployee(employeeId);
        setSuccess('Employee deactivated successfully');
      } else {
        await employeesApiClient.activateEmployee(employeeId);
        setSuccess('Employee activated successfully');
      }
      
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData(); // Reload data
      
    } catch (error: any) {
      setError(error.message || 'Failed to update employee status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleTestEligibility = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    setActionLoading(`test-${employeeId}`);
    setError(null);

    try {
      const newEligibility = !employee.test_eligible;
      await employeesApiClient.toggleTestEligibility(employeeId, newEligibility);
      setSuccess(`Test eligibility ${newEligibility ? 'enabled' : 'disabled'} successfully`);
      
      setTimeout(() => setSuccess(null), 3000);
      await loadAllData(); // Reload data
      
    } catch (error: any) {
      setError(error.message || 'Failed to update test eligibility');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter employees
  const activeEmployees = employees.filter(emp => emp.is_active);
  const inactiveEmployees = employees.filter(emp => !emp.is_active);
  const currentEmployees = activeTab === 'active' ? activeEmployees : inactiveEmployees;
  
  const filteredEmployees = currentEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate test eligibility stats
  const testEligibleActive = employees.filter(emp => emp.is_active && emp.test_eligible).length;
  const totalActive = employees.filter(emp => emp.is_active).length;
  const eligibilityRate = totalActive > 0 ? Math.round((testEligibleActive / totalActive) * 100) : 0;

  // Loading state
  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading employee management...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="p-8">
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

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Employee Management</h1>
            <p className="text-neutral-600">Manage active and inactive employees</p>
            {departmentStats.length > 0 && (
              <p className="text-sm text-neutral-500 mt-1">
                {departmentStats.reduce((sum, dept) => sum + dept.active_count, 0)} active employees across {departmentStats.length} departments
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleAddEmployee}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Department Stats */}
        {departmentStats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {departmentStats.map((dept) => (
              <div key={dept.department} className="card p-4 text-center">
                <h4 className="font-medium text-neutral-900 text-sm">{dept.department}</h4>
                <p className="text-xs text-neutral-600 mt-1">
                  {dept.active_count} / {dept.count} active
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Test Eligibility Quick Stats */}
        <div className="mb-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <TestTube className="h-5 w-5 text-primary-600" />
              <h3 className="text-sm font-medium text-primary-900">Test Eligibility Overview</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-primary-900">
                  {employees.filter(emp => emp.is_active && emp.test_eligible).length}
                </p>
                <p className="text-primary-700">Eligible Active</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-neutral-900">
                  {employees.filter(emp => emp.is_active && !emp.test_eligible).length}
                </p>
                <p className="text-neutral-600">Not Eligible Active</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-neutral-900">
                  {employees.filter(emp => emp.is_active).length}
                </p>
                <p className="text-neutral-600">Total Active</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-primary-900">
                  {Math.round((employees.filter(emp => emp.is_active && emp.test_eligible).length / Math.max(employees.filter(emp => emp.is_active).length, 1)) * 100)}%
                </p>
                <p className="text-primary-700">Eligibility Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content and Employee Table placeholder */}
        <div className="card p-6">
          <p className="text-center text-neutral-500">Employee table component will be rendered here</p>
        </div>
      </div>
    </DashboardLayout>
  );
}