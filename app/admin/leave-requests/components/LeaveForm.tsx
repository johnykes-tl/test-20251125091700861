'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, FileText, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { calculateWorkDays } from '../../../lib/utils/workDaysCalculator';
import { employeesApi } from '../../../lib/api/employeesApi';
import { useFormValidation } from '../../../shared/hooks/useFormValidation';
import { FormField, SelectField, TextareaField, CheckboxField } from '../../../shared/components/FormFields';

interface LeaveRequest {
  id?: number;
  employeeName: string;
  employeeId?: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedDate: string;
}

interface DropdownEmployee {
  id: string;
  name: string;
  department: string;
  email: string;
  is_active: boolean;
}

interface LeaveFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leave: LeaveRequest) => void;
  leave?: LeaveRequest | null;
  mode: 'add' | 'edit';
  employees: Array<{ name: string; department: string; id?: string }>;
}

 const leaveTypes = [
    { value: 'vacation', label: 'Concediu de odihnă' },
    { value: 'medical', label: 'Concediu medical' },
    { value: 'personal', label: 'Concediu personal' },
    { value: 'maternity', label: 'Concediu maternal' },
    { value: 'paternity', label: 'Concediu paternal' },
    { value: 'unpaid', label: 'Concediu fără plată' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'În așteptare' },
    { value: 'approved', label: 'Aprobat' },
    { value: 'rejected', label: 'Respins' }
  ];

 const validationRules = {
  employeeId: { required: true },
  leaveType: { required: true },
  startDate: { required: true },
  endDate: { required: true },
};

export default function LeaveForm({ isOpen, onClose, onSave, leave, mode, employees }: LeaveFormProps) {
  const {
    data: formData,
    errors,
    handleChange,
    validateAll,
    setData: setFormData,
    setErrors
  } = useFormValidation<LeaveRequest>({
    employeeName: '',
    employeeId: '',
    department: '',
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
    days: 0,
    reason: '',
    status: 'pending',
    submittedDate: new Date().toISOString().split('T')[0]
  }, validationRules);

  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<DropdownEmployee[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);

 // Load active employees when form opens
  useEffect(() => {
    if (isOpen) {
      loadEmployeesForDropdown();
    }
  }, [isOpen, includeInactive]);

  const loadEmployeesForDropdown = async () => {
    setLoadingEmployees(true);
    try {
      console.log('👥 Loading employees for dropdown, includeInactive:', includeInactive);
      
      const employeesData = await employeesApi.getEmployeesForDropdown({
        include_inactive: includeInactive
      });
      
      setActiveEmployees(employeesData);
      
      console.log('✅ Employees loaded for dropdown:', {
        total: employeesData.length,
        active: employeesData.filter(emp => emp.is_active).length,
        inactive: employeesData.filter(emp => !emp.is_active).length
      });
    } catch (error: any) {
      console.error('❌ Error loading employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Initialize form data
  useEffect(() => {
    if (leave && mode === 'edit') {
      // For edit mode, find the employee ID from the employees list
      const employee = activeEmployees.find(emp => emp.name === leave.employeeName);
      setFormData({
        ...leave,
        employeeId: employee?.id || leave.employeeId || ''
      });
    } else {
      setFormData({
        employeeName: '',
        employeeId: '',
        department: '',
        leaveType: 'vacation',
        startDate: '',
        endDate: '',
        days: 0,
        reason: '',
        status: 'pending',
        submittedDate: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({});
  }, [leave, mode, isOpen, activeEmployees]);

  // Calculate work days in real-time
  const calculatedWorkDays = formData.startDate && formData.endDate 
    ? calculateWorkDays(formData.startDate, formData.endDate)
    : 0;

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const workDays = calculateWorkDays(formData.startDate, formData.endDate);
      setFormData(prev => ({ ...prev, days: workDays }));
      
      if (errors.endDate && workDays > 0) {
        setErrors(prev => ({ ...prev, endDate: '' }));
      }
    }
  }, [formData.startDate, formData.endDate, errors.endDate]);

   const validateForm = (currentData: LeaveRequest) => {
   const newErrors: Record<string, string> = {};

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Angajatul este obligatoriu';
    }

    if (!formData.employeeId) {
      newErrors.employeeId = 'ID-ul angajatului nu a fost găsit';
    }

    // Check if selected employee is inactive
     const selectedEmployee = activeEmployees.find(emp => emp.id === currentData.employeeId);
   if (selectedEmployee && !selectedEmployee.is_active && mode === 'add') {
      newErrors.employeeName = 'Nu se pot crea concedii pentru angajați inactivi';
    }

    if (!formData.leaveType) {
      newErrors.leaveType = 'Tipul concediului este obligatoriu';
    }

     if (!currentData.startDate) {
     newErrors.startDate = 'Data de început este obligatorie';
    }

     if (!currentData.endDate) {
     newErrors.endDate = 'Data de sfârșit este obligatorie';
    }

     if (currentData.startDate && currentData.endDate) {
      const start = new Date(currentData.startDate);
      const end = new Date(currentData.endDate);
     if (end < start) {
        newErrors.endDate = 'Data de sfârșit trebuie să fie după data de început';
      } else {
         const workDays = calculateWorkDays(currentData.startDate, currentData.endDate);
       if (workDays === 0) {
          newErrors.endDate = 'Perioada selectată nu conține zile lucrătoare';
        }
      }
    }

   setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
     if (!validateAll()) {
     return;
    }

    setLoading(true);

    try {
       await new Promise(resolve => setTimeout(resolve, 500));
     
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving leave request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmployeeId = e.target.value;
     const selectedEmployee = activeEmployees.find(emp => emp.id === selectedEmployeeId) || null;

    handleChange('employeeId', selectedEmployeeId);
    handleChange('employeeName', selectedEmployee?.name || '');
    handleChange('department', selectedEmployee?.department || '');
 };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">
              {mode === 'add' ? 'Adaugă Concediu Nou' : 'Editează Concediu'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-neutral-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employee Selection Section */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h4 className="font-medium text-primary-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Selecție Angajat
            </h4>
            
            <div className="space-y-4">
               <CheckboxField
                id="includeInactive"
                label="Include angajați inactivi/demiși"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              
             {/* Employee Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="employeeName" className="block text-sm font-medium text-neutral-700 mb-2">
                    Angajat *
                  </label>
                  <select
                    id="employeeName"
                    name="employeeName"
                    value={formData.employeeId}
                     onChange={(e) => handleEmployeeChange(e)}
                   disabled={loadingEmployees}
                     className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.employeeId ? 'border-danger-500' : 'border-neutral-200'} ${loadingEmployees ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                    <option value="">
                      {loadingEmployees ? 'Se încarcă angajații...' : 'Selectează angajatul'}
                    </option>
                    {/* Active Employees */}
                    {activeEmployees.filter(emp => emp.is_active).length > 0 && (
                      <optgroup label="🟢 Angajați Activi">
                        {activeEmployees
                          .filter(emp => emp.is_active)
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} - {emp.department}
                            </option>
                          ))
                        }
                      </optgroup>
                    )}
                    {/* Inactive Employees (if included) */}
                    {includeInactive && activeEmployees.filter(emp => !emp.is_active).length > 0 && (
                      <optgroup label="🔴 Angajați Inactivi">
                        {activeEmployees
                          .filter(emp => !emp.is_active)
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} - {emp.department} (INACTIV)
                            </option>
                          ))
                        }
                      </optgroup>
                    )}
                  </select>
                   {errors.employeeId && <p className="mt-1 text-sm text-danger-600">{errors.employeeId}</p>}
                 
                  {/* Status Indicator */}
                  {formData.employeeId && activeEmployees.length > 0 && (
                    <div className="mt-2">
                      {(() => {
                        const selectedEmployee = activeEmployees.find(emp => emp.id === formData.employeeId);
                        if (!selectedEmployee) return null;
                        
                        return selectedEmployee.is_active ? (
                          <div className="flex items-center gap-2 text-sm text-success-600">
                            <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                            Angajat activ - poate primi concedii
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-warning-600">
                            <AlertTriangle className="h-4 w-4" />
                            Angajat inactiv - verifică eligibilitatea
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div>
                   <FormField
                    label="Departament"
                   id="department"
                    value={formData.department}
                     onChange={() => {}} // Read-only
                    disabled={true}
                    className="bg-neutral-50"
                   placeholder="Se completează automat"
                  />
                </div>
              </div>

              {/* Statistics */}
              <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="font-medium text-neutral-900">{activeEmployees.filter(emp => emp.is_active).length}</span>
                    <p className="text-xs">Angajați activi</p>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">{activeEmployees.filter(emp => !emp.is_active).length}</span>
                    <p className="text-xs">Angajați inactivi</p>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">{activeEmployees.length}</span>
                    <p className="text-xs">Total disponibil</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rest of the form fields remain the same */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <SelectField
              label="Tipul Concediului"
              id="leaveType"
              value={formData.leaveType}
              onChange={(e) => handleChange('leaveType', e.target.value)}
              options={leaveTypes}
              error={errors.leaveType}
              required
            />

            <SelectField
              label="Status"
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
            />

            <FormField
              label="Data Început"
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              error={errors.startDate}
              icon={Calendar}
              required
            />

            <FormField
              label="Data Sfârșit"
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              min={formData.startDate}
              error={errors.endDate}
              icon={Calendar}
              required
            />

            <div className="relative">
              <FormField
                label="Zile Lucrătoare"
                id="days"
                type="number"
                value={formData.days}
                onChange={() => {}} // Read-only
                disabled={true}
                icon={Clock}
              />
             {formData.startDate && formData.endDate && (
                <p className="mt-1 text-xs text-neutral-500">
                  📅 Excludere weekenduri: {formData.days} {formData.days === 1 ? 'zi lucrătoare' : 'zile lucrătoare'}
                </p>
              )}
            </div>

             <FormField
              label="Data Cererii"
              id="submittedDate"
              type="date"
              value={formData.submittedDate}
              onChange={(e) => handleChange('submittedDate', e.target.value)}
            />
            <div className="md:col-span-2">
               <TextareaField
                label="Motivul Cererii (Opțional)"
               id="reason"
                value={formData.reason}
                 onChange={(e) => handleChange('reason', e.target.value)}
               rows={4}
                 error={errors.reason}
                icon={FileText}
               placeholder="Descrie motivul cererii de concediu..."
             />
            </div>
          </div>

          {/* Work Days Info */}
          {formData.startDate && formData.endDate && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-medium text-primary-900 mb-2">📅 Informații despre calculul zilelor</h4>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>• ✅ Weekendurile (sâmbăta și duminica) sunt excluse automat</li>
                <li>• 📅 Se calculează doar zilele lucrătoare (luni-vineri)</li>
                <li>• ⏰ Perioada selectată: {calculatedWorkDays} {calculatedWorkDays === 1 ? 'zi lucrătoare' : 'zile lucrătoare'}</li>
                {calculatedWorkDays === 0 && (
                  <li className="text-danger-600">• ⚠️ Perioada selectată nu conține zile lucrătoare</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn-secondary disabled:opacity-50"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={loading || calculatedWorkDays === 0}
            >
               {loading ? (
               <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === 'add' ? 'Se adaugă...' : 'Se salvează...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {mode === 'add' ? 'Adaugă Concediu' : 'Salvează Modificările'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}