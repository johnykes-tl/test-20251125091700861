'use client';

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ValidationAlert from './validation/ValidationAlert';
import { validateClientOperation } from '../lib/validation/validationMiddleware';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationResult(null);
    
    // Client-side validation
    const validation = await validateClientOperation('login', { email, password });
    
    if (!validation.canProceed) {
      setValidationResult(validation);
      return;
    }
    
    setLoading(true);
    setFormError('');
   
    try {
      await signIn(email, password);
      // Navigation is handled by RouteGuard
      setAttemptCount(0); // Reset on successful login
    } catch (error: any) {
      console.error('Login error:', error);
      setAttemptCount(prev => prev + 1);
      
      // Enhanced error handling
      let errorMessage = 'Email sau parolă incorectă. Te rog încearcă din nou.';
      
      if (error?.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email sau parolă incorectă. Verifică datele introduse.';
      } else if (error?.message?.includes('Email not confirmed')) {
        errorMessage = 'Email-ul nu a fost confirmat. Verifică inbox-ul pentru linkul de confirmare.';
      } else if (error?.message?.includes('Too many requests')) {
        errorMessage = 'Prea multe încercări de conectare. Încearcă din nou mai târziu.';
      } else if (error?.message?.includes('User not found')) {
        errorMessage = 'Contul nu există. Verifică email-ul sau contactează administratorul.';
      }
      
      setFormError(errorMessage);
      
      // Show additional warnings after multiple failed attempts
      if (attemptCount >= 2) {
        setValidationResult({
          errors: {},
          warnings: ['Multiple încercări eșuate detectate'],
          canProceed: true
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8">
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
      
      {formError && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-danger-700">{formError}</p>
            {attemptCount >= 3 && (
              <p className="text-xs text-danger-600 mt-1">
                Pentru securitate, contactează administratorul dacă problemele persistă.
              </p>
            )}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="exemplu@company.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
            Parolă
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Introdu parola"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Se conectează...
            </div>
          ) : (
            'Conectare'
          )}
        </button>

        <div className="text-center text-sm text-neutral-500 mt-6">
          <p className="mb-2">Pentru testare, folosește contul din baza de date:</p>
          <div className="space-y-1">
            <p><strong>Admin:</strong> Folosește emailul și parola din Supabase Auth</p>
          </div>
          <p className="text-xs mt-3 text-neutral-400">
            Autentificare prin baza de date Supabase
          </p>
        </div>
      </form>
    </div>
  );
}