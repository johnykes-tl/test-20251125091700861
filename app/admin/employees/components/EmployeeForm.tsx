'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Building, Calendar, Phone, AlertCircle, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { employeesApi } from '../../../lib/api/employeesApi';
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from '../../../shared/types/Employee';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: CreateEmployeeData | UpdateEmployeeData) => void;
  employee?: Employee | null;
  mode: 'add' | 'edit';
  loading?: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export default function EmployeeForm({ 
  isOpen, 
  onClose, 
  onSave, 
  employee, 
  mode,
  loading = false 
}: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    join_date: new Date().toISOString().split('T')[0],
    phone: '',
    is_active: true,
    create_user_account: true,
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'failed'>('unknown');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Test database connection when form opens
  useEffect(() => {
    const testConnection = async () => {
      if (!isOpen) return;
      
      setTestingConnection(true);
      try {
        // 🌐 Test connection via API
        const isConnected = await employeesApi.testConnection();
        setConnectionStatus(isConnected ? 'success' : 'failed');
      } catch (error) {
        console.error('Connection test failed:', error);
        setConnectionStatus('failed');
      } finally {
        setTestingConnection(false);
      }
    };

    testConnection();
  }, [isOpen]);

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      if (!isOpen) return;
      
      setLoadingDepartments(true);
      try {
        // 🌐 Load departments via API
        const depts = await employeesApi.getDepartments();
        // Fixed: Use Array.from() instead of spread operator for Set
        const allDepartments = Array.from(new Set([...depts, 'IT', 'HR', 'Marketing', 'Finance', 'Sales', 'Operations'])).sort();
        setDepartments(allDepartments);
      } catch (error) {
        console.error('Failed to load departments:', error);
        setDepartments(['IT', 'HR', 'Marketing', 'Finance', 'Sales', 'Operations']);
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [isOpen]);

  // Initialize form data
  useEffect(() => {
    if (employee && mode === 'edit') {
      setFormData({
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        join_date: employee.join_date,
        phone: employee.phone,
        is_active: employee.is_active,
        create_user_account: false,
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        department: '',
        position: '',
        join_date: new Date().toISOString().split('T')[0],
        phone: '',
        is_active: true,
        create_user_account: true,
        password: '',
        confirmPassword: ''
      });
    }
    setErrors({});
  }, [employee, mode, isOpen]);

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    
    let score = 0;
    let label = '';
    let color = '';

    if (password.length === 0) {
      return { score: 0, label: '', color: '', requirements };
    }

    if (metRequirements <= 2) {
      score = 1;
      label = 'Weak';
      color = 'text-danger-600 bg-danger-100';
    } else if (metRequirements <= 3) {
      score = 2;
      label = 'Fair';
      color = 'text-warning-600 bg-warning-100';
    } else if (metRequirements <= 4) {
      score = 3;
      label = 'Good';
      color = 'text-primary-600 bg-primary-100';
    } else {
      score = 4;
      label = 'Strong';
      color = 'text-success-600 bg-success-100';
    }

    return { score, label, color, requirements };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is not valid';
    }

    // Password validation (only for add mode when creating user account)
    if (mode === 'add' && formData.create_user_account) {
      if (!formData.password) {
        newErrors.password = 'Password is required when creating user account';
      } else {
        if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long';
        } else if (passwordStrength.score < 3) {
          newErrors.password = 'Password must be at least "Good" strength';
        }
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (connectionStatus === 'failed') {
      alert('Database connection failed. Please check your configuration and try again.');
      return;
    }

    try {
      if (mode === 'add') {
        const createData: CreateEmployeeData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          department: formData.department || 'General',
          position: formData.position.trim() || 'Employee',
          join_date: formData.join_date || new Date().toISOString().split('T')[0],
          phone: formData.phone.trim() || '',
          create_user_account: formData.create_user_account,
          password: formData.create_user_account ? formData.password : undefined
        };
        await onSave(createData);
      } else {
        const updateData: UpdateEmployeeData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          department: formData.department || 'General',
          position: formData.position.trim() || 'Employee',
          join_date: formData.join_date || new Date().toISOString().split('T')[0],
          phone: formData.phone.trim() || '',
          is_active: formData.is_active
        };
        await onSave(updateData);
      }
      
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">
              {mode === 'add' ? 'Add New Employee' : 'Edit Employee'}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {testingConnection && (
          <div className="p-4 bg-neutral-50 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-neutral-600">Testing database connection...</span>
            </div>
          </div>
        )}

        {connectionStatus === 'failed' && (
          <div className="p-4 bg-danger-50 border-b border-danger-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-danger-600" />
              <span className="text-sm text-danger-700">Database connection failed. Please check your Supabase configuration.</span>
            </div>
          </div>
        )}

        {connectionStatus === 'success' && (
          <div className="p-4 bg-success-50 border-b border-success-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span className="text-sm text-success-700">Database connection successful</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? 'border-danger-500' : 'border-neutral-200'
                }`}
                placeholder="e.g., John Doe"
                disabled={loading}
              />
              {errors.name && <p className="mt-1 text-sm text-danger-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="col-span-1">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.email ? 'border-danger-500' : 'border-neutral-200'
                }`}
                placeholder="john.doe@company.com"
                disabled={loading}
              />
              {errors.email && <p className="mt-1 text-sm text-danger-600">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="col-span-1">
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.phone ? 'border-danger-500' : 'border-neutral-200'
                }`}
                placeholder="0712345678"
                disabled={loading}
              />
              {errors.phone && <p className="mt-1 text-sm text-danger-600">{errors.phone}</p>}
            </div>

            {/* Department */}
            <div className="col-span-1">
              <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading || loadingDepartments}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.department ? 'border-danger-500' : 'border-neutral-200'
                }`}
              >
                <option value="">
                  {loadingDepartments ? 'Loading departments...' : 'Select department'}
                </option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-sm text-danger-600">{errors.department}</p>}
            </div>

            {/* Position */}
            <div className="col-span-1">
              <label htmlFor="position" className="block text-sm font-medium text-neutral-700 mb-2">
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.position ? 'border-danger-500' : 'border-neutral-200'
                }`}
                placeholder="e.g., Developer, Manager, Specialist"
                disabled={loading}
              />
              {errors.position && <p className="mt-1 text-sm text-danger-600">{errors.position}</p>}
            </div>

            {/* Join Date */}
            <div className="col-span-1">
              <label htmlFor="join_date" className="block text-sm font-medium text-neutral-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Join Date
              </label>
              <input
                type="date"
                id="join_date"
                name="join_date"
                value={formData.join_date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.join_date ? 'border-danger-500' : 'border-neutral-200'
                }`}
                disabled={loading}
              />
              {errors.join_date && <p className="mt-1 text-sm text-danger-600">{errors.join_date}</p>}
            </div>
          </div>

          {/* Create User Account (Add Mode Only) */}
          {mode === 'add' && (
            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="create_user_account"
                  name="create_user_account"
                  checked={formData.create_user_account}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="create_user_account" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Create user account for this employee
                </label>
              </div>
              <p className="text-xs text-neutral-500 ml-7">
                {formData.create_user_account 
                  ? "A login account will be created with the password you specify below." 
                  : "Employee record will be created without a login account. You can create the account later."
                }
              </p>

              {/* Password Fields (only when creating user account) */}
              {formData.create_user_account && (
                <div className="mt-4 space-y-4">
                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                      <Key className="inline h-4 w-4 mr-1" />
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.password ? 'border-danger-500' : 'border-neutral-200'
                        }`}
                        placeholder="Enter a secure password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-danger-600">{errors.password}</p>}

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-neutral-600">Password strength:</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`flex items-center gap-1 ${passwordStrength.requirements.length ? 'text-success-600' : 'text-neutral-400'}`}>
                            {passwordStrength.requirements.length ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            At least 8 characters
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.requirements.uppercase ? 'text-success-600' : 'text-neutral-400'}`}>
                            {passwordStrength.requirements.uppercase ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            Uppercase letter
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.requirements.lowercase ? 'text-success-600' : 'text-neutral-400'}`}>
                            {passwordStrength.requirements.lowercase ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            Lowercase letter
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.requirements.number ? 'text-success-600' : 'text-neutral-400'}`}>
                            {passwordStrength.requirements.number ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            Number
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.confirmPassword ? 'border-danger-500' : 'border-neutral-200'
                        }`}
                        placeholder="Re-enter the password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword}</p>}
                    
                    {/* Password Match Indicator */}
                    {formData.confirmPassword && (
                      <div className="mt-1 flex items-center gap-1">
                        {formData.password === formData.confirmPassword ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-success-600" />
                            <span className="text-xs text-success-600">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-danger-600" />
                            <span className="text-xs text-danger-600">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Status (Edit Mode Only) */}
          {mode === 'edit' && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-neutral-700">
                Employee is active
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || connectionStatus === 'failed'}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === 'add' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {mode === 'add' ? 'Create Employee' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}