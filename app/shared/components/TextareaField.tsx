import React from 'react';

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

export default function TextareaField({
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