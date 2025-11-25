'use client';

import React from 'react';
import { AlertTriangle, Shield, CheckCircle, X, AlertCircle } from 'lucide-react';

interface ValidationAlertProps {
  errors?: Record<string, string>;
  warnings?: string[];
  securityIssues?: string[];
  onDismiss?: () => void;
  className?: string;
}

export default function ValidationAlert({
  errors = {},
  warnings = [],
  securityIssues = [],
  onDismiss,
  className = ''
}: ValidationAlertProps) {
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = warnings.length > 0;
  const hasSecurityIssues = securityIssues.length > 0;

  if (!hasErrors && !hasWarnings && !hasSecurityIssues) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Errors */}
      {hasErrors && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-danger-900 mb-2">Erori de validare</h4>
              <ul className="text-sm text-danger-700 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="flex items-start gap-2">
                    <span className="font-medium">{getFieldLabel(field)}:</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-danger-600 hover:text-danger-700 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Security Issues */}
      {hasSecurityIssues && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-900 mb-2">Probleme de securitate</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                {securityIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-warning-900 mb-2">Avertismente</h4>
              <ul className="text-sm text-warning-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-warning-600">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get user-friendly field labels
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    email: 'Email',
    password: 'Parolă',
    name: 'Nume',
    phone: 'Telefon',
    department: 'Departament',
    position: 'Poziție',
    join_date: 'Data angajării',
    start_date: 'Data început',
    end_date: 'Data sfârșit',
    leave_type: 'Tip concediu',
    reason: 'Motiv',
    dates: 'Date',
    overlap: 'Suprapunere',
    balance: 'Sold concedii',
    business: 'Reguli business',
    rateLimit: 'Limite de securitate'
  };

  return labels[field] || field;
}