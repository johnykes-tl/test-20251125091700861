'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { credentialValidator } from '../../lib/validation/credentialValidator';

interface PasswordStrengthIndicatorProps {
  password: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
  className?: string;
}

export default function PasswordStrengthIndicator({
  password,
  showPassword,
  onToggleVisibility,
  className = ''
}: PasswordStrengthIndicatorProps) {
  const strength = credentialValidator.getPasswordStrength(password);

  const getStrengthColor = () => {
    switch (strength.strength) {
      case 'very-weak':
        return 'text-red-600 bg-red-100';
      case 'weak':
        return 'text-red-600 bg-red-100';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'strong':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getStrengthText = () => {
    switch (strength.strength) {
      case 'very-weak':
        return 'Foarte slabă';
      case 'weak':
        return 'Slabă';
      case 'fair':
        return 'Acceptabilă';
      case 'good':
        return 'Bună';
      case 'strong':
        return 'Foarte bună';
      default:
        return '';
    }
  };

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Puterea parolei:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrengthColor()}`}>
            {getStrengthText()}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleVisibility}
          className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Strength Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition-colors ${
              strength.score >= level
                ? strength.score === 1
                  ? 'bg-red-500'
                  : strength.score === 2
                  ? 'bg-yellow-500'
                  : strength.score === 3
                  ? 'bg-blue-500'
                  : 'bg-green-500'
                : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`flex items-center gap-1 ${
          strength.requirements.length ? 'text-green-600' : 'text-neutral-400'
        }`}>
          {strength.requirements.length ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span>Minimum 8 caractere</span>
        </div>

        <div className={`flex items-center gap-1 ${
          strength.requirements.uppercase ? 'text-green-600' : 'text-neutral-400'
        }`}>
          {strength.requirements.uppercase ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span>Litere mari</span>
        </div>

        <div className={`flex items-center gap-1 ${
          strength.requirements.lowercase ? 'text-green-600' : 'text-neutral-400'
        }`}>
          {strength.requirements.lowercase ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span>Litere mici</span>
        </div>

        <div className={`flex items-center gap-1 ${
          strength.requirements.numbers ? 'text-green-600' : 'text-neutral-400'
        }`}>
          {strength.requirements.numbers ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span>Cifre</span>
        </div>

        <div className={`flex items-center gap-1 ${
          strength.requirements.symbols ? 'text-green-600' : 'text-neutral-400'
        }`}>
          {strength.requirements.symbols ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span>Simboluri</span>
        </div>

        <div className={`flex items-center gap-1 ${
          strength.requirements.noCommon ? 'text-green-600' : 'text-neutral-400'
        }`}>
          {strength.requirements.noCommon ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span>Nu este comună</span>
        </div>
      </div>

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className="text-xs text-neutral-600">
          <span className="font-medium">Sugestii:</span> {strength.feedback.join(', ')}
        </div>
      )}
    </div>
  );
}