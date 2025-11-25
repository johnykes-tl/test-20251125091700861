'use client';

import React from 'react';
import { AlertTriangle, Shield, CheckCircle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  warnings?: string[];
  securityIssues?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'security' | 'info';
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  warnings = [],
  securityIssues = [],
  onConfirm,
  onCancel,
  confirmText = 'Continuă',
  cancelText = 'Anulează',
  type = 'warning'
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'security':
        return <Shield className="h-6 w-6 text-orange-600" />;
      case 'info':
        return <CheckCircle className="h-6 w-6 text-primary-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-warning-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'security':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-900',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'info':
        return {
          bg: 'bg-primary-50',
          border: 'border-primary-200',
          text: 'text-primary-900',
          button: 'bg-primary-600 hover:bg-primary-700'
        };
      default:
        return {
          bg: 'bg-warning-50',
          border: 'border-warning-200',
          text: 'text-warning-900',
          button: 'bg-warning-600 hover:bg-warning-700'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className={`p-4 ${colors.bg} ${colors.border} border rounded-lg mb-6`}>
            <div className="flex items-start gap-3">
              {getIcon()}
              <div className="flex-1">
                <h3 className={`font-semibold ${colors.text} mb-2`}>
                  {title}
                </h3>
                <p className={`text-sm ${colors.text} mb-3`}>
                  {message}
                </p>

                {warnings.length > 0 && (
                  <div className="mb-3">
                    <h4 className={`font-medium ${colors.text} text-xs mb-1`}>Avertismente:</h4>
                    <ul className={`text-xs ${colors.text} space-y-1`}>
                      {warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {securityIssues.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-orange-900 text-xs mb-1">Probleme de securitate:</h4>
                    <ul className="text-xs text-orange-700 space-y-1">
                      {securityIssues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${colors.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}