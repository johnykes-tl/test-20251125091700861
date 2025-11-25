'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { testsApi } from '../../../lib/api/testsApi';
import { employeesApi } from '../../../lib/api/employeesApi';
import type { Test } from '../../../lib/types/tests';
import type { Employee } from '../../../shared/types/Employee';

interface TestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  test?: Test | null;
}

export default function TestForm({ isOpen, onClose, onSave, test }: TestFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
    assignment_type: 'automatic' as 'automatic' | 'manual_employees' | 'manual_departments',
    assigned_employees: [] as string[],
    assigned_departments: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Data for selects
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDataLoading(true);
      Promise.all([
        employeesApi.getEmployees(),
        employeesApi.getDepartments()
      ]).then(([employees, departments]) => {
        setAllEmployees(employees);
        setAllDepartments(departments);
      }).catch(err => {
        console.error("Failed to load data for form", err);
        setErrors(prev => ({ ...prev, data: "Failed to load employees and departments" }));
      }).finally(() => {
        setDataLoading(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (test) {
      setFormData({
        title: test.title,
        description: test.description,
        instructions: test.instructions || '',
        status: test.status,
        assignment_type: test.assignment_type,
        assigned_employees: test.assigned_employees || [],
        assigned_departments: test.assigned_departments || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        instructions: '',
        status: 'active',
        assignment_type: 'automatic',
        assigned_employees: [],
        assigned_departments: []
      });
    }
    setErrors({});
  }, [test, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    if (formData.assignment_type === 'manual_employees' && formData.assigned_employees.length === 0) {
      newErrors.assigned_employees = 'Please select at least one employee.';
    }
    if (formData.assignment_type === 'manual_departments' && formData.assigned_departments.length === 0) {
      newErrors.assigned_departments = 'Please select at least one department.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        assigned_employees: formData.assignment_type === 'manual_employees' ? formData.assigned_employees : null,
        assigned_departments: formData.assignment_type === 'manual_departments' ? formData.assigned_departments : null,
      };

      if (test) {
        await testsApi.updateTest(test.id, payload);
      } else {
        await testsApi.createTest(payload);
      }
      await onSave();
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save test.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelectChange = (type: 'employees' | 'departments', value: string) => {
    const key = type === 'employees' ? 'assigned_employees' : 'assigned_departments';
    const currentValues = formData[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFormData(prev => ({ ...prev, [key]: newValues }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">
              {test ? 'Editează Test' : 'Adaugă Test Nou'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <X className="h-5 w-5 text-neutral-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {errors.form && <p className="text-sm text-danger-600">{errors.form}</p>}
          
          <FormField id="title" label="Titlu Test *" error={errors.title}>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </FormField>

          <FormField id="description" label="Descriere *" error={errors.description}>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
          </FormField>

          <FormField id="instructions" label="Instrucțiuni (opțional)">
            <textarea value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} rows={4} />
          </FormField>

          <FormField id="status" label="Status">
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
              <option value="active">Activ</option>
              <option value="inactive">Inactiv</option>
              <option value="archived">Arhivat</option>
            </select>
          </FormField>

          <div className="card p-4">
            <h3 className="font-medium text-neutral-900 mb-3">Strategie de Atribuire</h3>
            <div className="space-y-3">
              <RadioOption id="auto" label="Automat" description="Atribuie la 2 angajați eligibili aleatoriu din tot sistemul." value="automatic" />
              <RadioOption id="manual_emp" label="Manual (Angajați)" description="Atribuie doar angajaților selectați de tine." value="manual_employees" />
              <RadioOption id="manual_dept" label="Manual (Departamente)" description="Atribuie doar angajaților din departamentele selectate." value="manual_departments" />
            </div>

            {dataLoading && <p>Loading options...</p>}

            {formData.assignment_type === 'manual_employees' && (
              <MultiSelectCheckboxes
                label="Selectează Angajați"
                error={errors.assigned_employees}
                options={allEmployees.map(e => ({ value: e.id, label: `${e.name} (${e.department})` }))}
                selected={formData.assigned_employees}
                onChange={(value) => handleMultiSelectChange('employees', value)}
              />
            )}

            {formData.assignment_type === 'manual_departments' && (
              <MultiSelectCheckboxes
                label="Selectează Departamente"
                error={errors.assigned_departments}
                options={allDepartments.map(d => ({ value: d, label: d }))}
                selected={formData.assigned_departments}
                onChange={(value) => handleMultiSelectChange('departments', value)}
              />
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Anulează</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {test ? 'Salvează Modificările' : 'Creează Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  function FormField({ id, label, error, children }: { id: string, label: string, error?: string, children: React.ReactNode }) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-2">{label}</label>
        <div className="relative">
          {React.Children.map(children, child => 
            React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, {
              id,
              className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${error ? 'border-danger-500' : 'border-neutral-200'}`
            }) : child
          )}
        </div>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }

  function RadioOption({ id, label, description, value }: { id: string, label: string, description: string, value: string }) {
    const isChecked = formData.assignment_type === value;
    return (
      <label htmlFor={id} className={`block p-3 border rounded-lg cursor-pointer ${isChecked ? 'bg-primary-50 border-primary-500' : 'border-neutral-200'}`}>
        <div className="flex items-center">
          <input type="radio" id={id} name="assignment_type" value={value} checked={isChecked} onChange={e => setFormData({...formData, assignment_type: e.target.value as any})} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
          <div className="ml-3">
            <p className="font-medium text-neutral-900">{label}</p>
            <p className="text-sm text-neutral-600">{description}</p>
          </div>
        </div>
      </label>
    );
  }

  function MultiSelectCheckboxes({ label, error, options, selected, onChange }: { label: string, error?: string, options: {value: string, label: string}[], selected: string[], onChange: (value: string) => void }) {
    return (
      <div className="mt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">{label}</label>
        <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg p-2 space-y-1">
          {options.map(option => (
            <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded cursor-pointer">
              <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onChange(option.value)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-neutral-800">{option.label}</span>
            </label>
          ))}
        </div>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
}