'use client';
import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, User, Mail, Building, Calendar, Phone, Key, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import ValidationAlert from '../../../components/validation/ValidationAlert';
import ConfirmationDialog from '../../../components/validation/ConfirmationDialog';
import PasswordStrengthIndicator from '../../../components/validation/PasswordStrengthIndicator';
import { validateClientOperation } from '../../../lib/validation/validationMiddleware';
import { useAuth } from '../../../contexts/AuthContext';
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
}

interface SimpleEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: any) => Promise<void>;
  employee?: Employee | null;
  mode: 'add' | 'edit';
  loading?: boolean;
}

const defaultDepartments = ['IT', 'HR', 'Marketing', 'Finance', 'Sales', 'Operations', 'Management'];

export default function SimpleEmployeeForm({ 
  isOpen, 
  onClose, 
  onSave, 
  employee, 
  mode,
  loading = false 
}: SimpleEmployeeFormProps) {
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  
  const { user } = useAuth();

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

  // Validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    setValidationResult(null);
    
    // Comprehensive validation
    const operationType = mode === 'add' ? 'user_create' : 'user_update';
    const validation = await validateClientOperation(operationType, formData, user || undefined);
    
    if (!validation.canProceed) {
      setValidationResult(validation);
      return false;
    }
    
    // Handle confirmation requirement
    if (validation.requiresConfirmation && !pendingFormData) {
      setShowConfirmation(true);
      setPendingFormData(formData);
      return false;
    }
     return true;
 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
     if (!(await validateForm())) {
     return;
    }

    try {
      if (mode === 'add') {
        const createData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          department: formData.department.trim(),
          position: formData.position.trim(),
          join_date: formData.join_date,
          phone: formData.phone.trim(),
          create_user_account: formData.create_user_account,
          password: formData.create_user_account ? formData.password : undefined
        };
        await onSave(createData);
      } else {
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          department: formData.department.trim(),
          position: formData.position.trim(),
          join_date: formData.join_date,
          phone: formData.phone.trim(),
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
          </div>
        </div>

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
                required
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
                required
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
                Department *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.department ? 'border-danger-500' : 'border-neutral-200'
                }`}
                required
              >
                <option value="">Select department</option>
                {defaultDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-sm text-danger-600">{errors.department}</p>}
            </div>

            {/* Position */}
            <div className="col-span-1">
              <label htmlFor="position" className="block text-sm font-medium text-neutral-700 mb-2">
                Position *
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
                required
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
                        required
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
                        <PasswordStrengthIndicator
                          password={formData.password}
                          showPassword={showPassword}
                          onToggleVisibility={() => setShowPassword(!showPassword)}
                        />
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
                        required
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
                            <Check className="h-3 w-3 text-success-600" />
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
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
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
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Confirmă Crearea Angajatului"
        message={validationResult?.confirmationMessage || 'Există avertismente pentru datele introduse. Vrei să continui?'}
        warnings={validationResult?.warnings}
        securityIssues={validationResult?.securityIssues}
        onConfirm={async () => {
          setShowConfirmation(false);
          // Proceed with submission
          if (pendingFormData) {
            try {
              if (mode === 'add') {
                const createData = {
                  ...pendingFormData,
                  confirmValidationWarnings: true
                };
                await onSave(createData);
              } else {
                const updateData = {
                  ...pendingFormData,
                  confirmValidationWarnings: true
                };
                await onSave(updateData);
              }
              onClose();
            } catch (error) {
              console.error('Form submission error after confirmation:', error);
            }
          }
          setPendingFormData(null);
        }}
        onCancel={() => {
          setShowConfirmation(false);
          setPendingFormData(null);
        }}
        type="warning"
      />
      </div>
    </div>
  );
}