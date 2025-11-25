'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
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
  X
} from 'lucide-react';
import SimpleEmployeeForm from './components/SimpleEmployeeForm';
import { employeesApi } from '../../lib/api/employeesApi';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export default function AdminEmployeesPage() {
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
      
      // Load data using direct API calls
      const [employeesData, statsData] = await Promise.all([
        employeesApi.getEmployees(),
        employeesApi.getDepartmentStats()
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
        await employeesApi.createEmployee(employeeData);
        setSuccess('Employee created successfully');
      } else if (editingEmployee) {
        await employeesApi.updateEmployee(editingEmployee.id, employeeData);
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
        await employeesApi.deactivateEmployee(employeeId);
        setSuccess('Employee deactivated successfully');
      } else {
        await employeesApi.activateEmployee(employeeId);
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
      await employeesApi.toggleTestEligibility(employeeId, newEligibility);
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
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Department Stats */}
        {departmentStats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Department Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {departmentStats.map((dept) => (
                <div key={dept.department} className="card p-3 text-center">
                  <h4 className="font-medium text-neutral-900 text-sm">{dept.department}</h4>
                  <p className="text-xs text-neutral-600 mt-1">
                    {dept.active_count} / {dept.count} active
                  </p>
                </div>
              ))}
            </div>
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

        {/* Main Content */}
        <div className="card">
          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 sm:px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'active'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <UserCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Active Employees</span>
                  <span className="sm:hidden">Active</span>
                  ({activeEmployees.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`px-4 sm:px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'inactive'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <UserX className="h-4 w-4" />
                  <span className="hidden sm:inline">Inactive Employees</span>
                  <span className="sm:hidden">Inactive</span>
                  ({inactiveEmployees.length})
                </div>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Join Date</th>
                    <th className="text-center py-3 px-4 font-medium text-neutral-700">Test Eligible</th>
                    {activeTab === 'inactive' && (
                      <th className="text-left py-3 px-4 font-medium text-neutral-700">Leave Date</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-neutral-900">{employee.name}</div>
                      </td>
                      <td className="py-4 px-4 text-neutral-600">{employee.email}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                          {employee.department}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-neutral-600">{employee.position}</td>
                      <td className="py-4 px-4 text-neutral-600">
                        {new Date(employee.join_date).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleTestEligibility(employee.id)}
                          disabled={actionLoading === `test-${employee.id}` || !employee.is_active}
                          className={`p-2 rounded-lg transition-colors ${
                            employee.test_eligible 
                              ? 'bg-success-100 text-success-700 hover:bg-success-200' 
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {actionLoading === `test-${employee.id}` ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      {activeTab === 'inactive' && (
                        <td className="py-4 px-4 text-neutral-600">
                          {employee.leave_date ? new Date(employee.leave_date).toLocaleDateString('ro-RO') : '-'}
                        </td>
                      )}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditEmployee(employee)}
                             disabled={actionLoading === employee.id}
                           className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {activeTab === 'active' ? (
                            <button 
                              onClick={() => handleToggleStatus(employee.id)}
                              disabled={actionLoading === employee.id}
                              className="p-2 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg disabled:opacity-50"
                            >
                              {actionLoading === employee.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserX className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleToggleStatus(employee.id)}
                              disabled={actionLoading === employee.id}
                              className="p-2 text-neutral-600 hover:text-success-600 hover:bg-success-50 rounded-lg disabled:opacity-50"
                            >
                              {actionLoading === employee.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-neutral-900 text-sm">{employee.name}</h3>
                      <p className="text-xs text-neutral-500">{employee.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleTestEligibility(employee.id)}
                        disabled={actionLoading === `test-${employee.id}` || !employee.is_active}
                        className={`p-1.5 rounded transition-colors ${
                          employee.test_eligible 
                            ? 'bg-success-100 text-success-700 hover:bg-success-200' 
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {actionLoading === `test-${employee.id}` ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <TestTube className="h-3 w-3" />
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleEditEmployee(employee)}
                        disabled={actionLoading === employee.id}
                        className="p-1.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded disabled:opacity-50"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      {activeTab === 'active' ? (
                        <button 
                          onClick={() => handleToggleStatus(employee.id)}
                          disabled={actionLoading === employee.id}
                          className="p-1.5 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded disabled:opacity-50"
                        >
                          {actionLoading === employee.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleStatus(employee.id)}
                          disabled={actionLoading === employee.id}
                          className="p-1.5 text-neutral-600 hover:text-success-600 hover:bg-success-50 rounded disabled:opacity-50"
                        >
                          {actionLoading === employee.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-neutral-500">Department</p>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                        {employee.department}
                      </span>
                    </div>
                    <div>
                      <p className="text-neutral-500">Position</p>
                      <p className="text-neutral-900 font-medium">{employee.position}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Join Date</p>
                      <p className="text-neutral-900">{new Date(employee.join_date).toLocaleDateString('ro-RO')}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Test Eligible</p>
                      <p className={`font-medium ${employee.test_eligible ? 'text-success-600' : 'text-neutral-600'}`}>
                        {employee.test_eligible ? 'Yes' : 'No'}
                      </p>
                    </div>
                    {activeTab === 'inactive' && employee.leave_date && (
                      <div>
                        <p className="text-neutral-500">Leave Date</p>
                        <p className="text-neutral-900">{new Date(employee.leave_date).toLocaleDateString('ro-RO')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">No employees found matching your search criteria.</p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-primary-600 hover:text-primary-700 text-sm mt-2"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
         {/* Simple Employee Form Modal */}
        {showForm && (
          <SimpleEmployeeForm
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingEmployee(null);
              setError(null);
            }}
            onSave={handleSaveEmployee}
            employee={editingEmployee}
            mode={formMode}
            loading={actionLoading === 'saving'}
          />
        )}
      </div>
    </DashboardLayout>
  );
}