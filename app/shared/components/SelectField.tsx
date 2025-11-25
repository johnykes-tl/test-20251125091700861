import React from 'react';

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

export default function SelectField({
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