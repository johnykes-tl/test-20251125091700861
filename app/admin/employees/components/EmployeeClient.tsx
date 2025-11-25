'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { Search, Plus, Edit, UserCheck, UserX, RefreshCw, AlertCircle, X, TestTube } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import { employeesApi } from '../../../lib/api/employeesApi';
import type { Employee } from '../../../shared/types/Employee';

interface EmployeeClientProps {
  initialEmployees: Employee[];
  initialDepartmentStats: Array<{department: string, count: number, active_count: number}>;
  error?: string | null;
}

export default function EmployeeClient({ 
  initialEmployees, 
  initialDepartmentStats,
  error: initialError 
}: EmployeeClientProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  
  // Data state
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Department stats
  const [departmentStats, setDepartmentStats] = useState(initialDepartmentStats);

  // Load employees data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 🌐 Load data via API
      const [data, stats] = await Promise.all([
        employeesApi.getEmployees(),
        employeesApi.getDepartmentStats()
      ]);
      setEmployees(data);
      setDepartmentStats(stats);
      console.log('✅ Employees reloaded via API successfully', { count: data.length });
    } catch (err: any) {
      console.error('❌ Failed to reload employees via API:', err);
      setError(err.message || 'Failed to reload employees');
    } finally {
      setLoading(false);
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

  // Handlers
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
    try {
      if (formMode === 'add') {
        setActionLoading('creating');
        // 🌐 Create employee via API
        await employeesApi.createEmployee(employeeData);
        console.log('✅ Employee created successfully');
      } else if (editingEmployee) {
        setActionLoading('updating');
        // 🌐 Update employee via API
        await employeesApi.updateEmployee(editingEmployee.id, employeeData);
        console.log('✅ Employee updated successfully');
      }
      await loadData(); // Reload all data to reflect changes
    } catch (err: any) {
      console.error('❌ Employee save failed:', err);
      setError(err.message || 'Failed to save employee');
    } finally {
      setActionLoading(null);
      setShowForm(false);
    }
  };

  const handleToggleEmployeeStatus = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    try {
      setActionLoading(employeeId);
      // 🌐 Toggle employee status via API
      if (employee.is_active) {
        await employeesApi.deactivateEmployee(employeeId);
      } else {
        await employeesApi.activateEmployee(employeeId);
      }
      await loadData();
    } catch (err: any) {
      console.error('❌ Employee status toggle failed:', err);
      setError(err.message || 'Failed to update employee status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleTestEligibility = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    try {
      setActionLoading(`test-${employeeId}`);
      const newEligibility = !employee.test_eligible;
      // 🌐 Toggle test eligibility via API
      await employeesApi.toggleTestEligibility(employeeId, newEligibility);
      await loadData();
    } catch (err: any) {
      console.error('❌ Test eligibility toggle failed:', err);
      setError(err.message || 'Failed to update test eligibility');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">Employee Management</h1>
            <p className="text-neutral-600 text-sm sm:text-base hidden sm:block">Manage active and inactive employees</p>
            {departmentStats.length > 0 && (
              <p className="text-xs text-neutral-500 mt-1">
                {departmentStats.reduce((sum, dept) => sum + dept.active_count, 0)} active employees across {departmentStats.length} departments
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={loadData}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleAddEmployee}
              className="btn-primary flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Employee</span>
              <span className="sm:hidden">Add</span>
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
                              onClick={() => handleToggleEmployeeStatus(employee.id)}
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
                              onClick={() => handleToggleEmployeeStatus(employee.id)}
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
                          onClick={() => handleToggleEmployeeStatus(employee.id)}
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
                          onClick={() => handleToggleEmployeeStatus(employee.id)}
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

        {/* Employee Form Modal */}
        <EmployeeForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingEmployee(null);
            setError(null);
          }}
          onSave={handleSaveEmployee}
          employee={editingEmployee}
          mode={formMode}
          loading={actionLoading === 'creating' || actionLoading === 'updating'}
        />
      </div>
    </DashboardLayout>
  );
}