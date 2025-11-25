import React from 'react';

interface StatusBadgeProps {
  status: 'approved' | 'pending' | 'rejected' | 'complete' | 'incomplete' | 'absent' | 'active' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      approved: { text: 'Aprobat', color: 'bg-success-100 text-success-700' },
      pending: { text: 'În așteptare', color: 'bg-warning-100 text-warning-700' },
      rejected: { text: 'Respins', color: 'bg-danger-100 text-danger-700' },
      complete: { text: 'Complet', color: 'bg-success-100 text-success-700' },
      incomplete: { text: 'Incomplet', color: 'bg-warning-100 text-warning-700' },
      absent: { text: 'Absent', color: 'bg-danger-100 text-danger-700' },
      active: { text: 'Activ', color: 'bg-success-100 text-success-700' },
      inactive: { text: 'Inactiv', color: 'bg-neutral-100 text-neutral-700' }
    };
    return configs[status] || { text: status, color: 'bg-neutral-100 text-neutral-700' };
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const config = getStatusConfig(status);

  return (
    <span className={`${config.color} ${sizeClasses[size]} rounded-full font-medium ${className}`}>
      {config.text}
    </span>
  );
}