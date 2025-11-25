import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'password';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  icon: Icon,
  className = ''
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-2">
        {Icon && <Icon className="inline h-4 w-4 mr-1" />}
        {label} {required && '*'}
      </label>
      <div className="relative">
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          min={min}
          max={max}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            error ? 'border-danger-500' : 'border-neutral-200'
          } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  placeholder = "Selectează o opțiune",
  icon: Icon,
  className = ''
}: SelectFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-2">
        {Icon && <Icon className="inline h-4 w-4 mr-1" />}
        {label} {required && '*'}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
          error ? 'border-danger-500' : 'border-neutral-200'
        } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function TextareaField({
  label,
  id,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  icon: Icon,
  className = ''
}: TextareaFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-2">
        {Icon && <Icon className="inline h-4 w-4 mr-1" />}
        {label} {required && '*'}
      </label>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
          error ? 'border-danger-500' : 'border-neutral-200'
        } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  description?: string;
 icon?: React.ComponentType<{ className?: string }>;
}

export function CheckboxField({
  label,
  id,
  checked,
  onChange,
  disabled = false,
  className = '',
  description,
  icon: Icon
}: CheckboxFieldProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        type="checkbox"
        id={id}
        name={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 mt-1"
      />
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {Icon && <Icon className="inline h-4 w-4 mr-1" />}
          {label}
        </label>
        {description && (
          <p className="text-sm text-neutral-600 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}