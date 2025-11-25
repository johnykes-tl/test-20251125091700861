import { useState, useEffect, useCallback } from 'react';
import { validateClientOperation } from './validationMiddleware';
import { useAuth } from '../../contexts/AuthContext';

// Real-time validation hook
export function useRealTimeValidation(
  field: string,
  value: string,
  validationType: 'email' | 'phone' | 'name',
  excludeId?: string
) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    warning?: string;
    isDuplicate?: boolean;
    existingUser?: any;
  } | null>(null);

  const validateField = useCallback(async (fieldValue: string) => {
    if (!fieldValue?.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    
    try {
      const response = await fetch('/api/validation/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: validationType,
          value: fieldValue,
          excludeUserId: excludeId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setValidationResult({
          isValid: !result.data.isDuplicate,
          isDuplicate: result.data.isDuplicate,
          existingUser: result.data.existingUser,
          error: result.data.isDuplicate ? 
            `${getFieldLabel(validationType)} este deja folosit de ${result.data.existingUser?.name}` : 
            undefined
        });
      }
    } catch (error) {
      console.error('Real-time validation error:', error);
      setValidationResult({
        isValid: true,
        warning: 'Nu s-a putut verifica duplicarea'
      });
    } finally {
      setIsValidating(false);
    }
  }, [validationType, excludeId]);

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validateField(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, validateField]);

  return {
    isValidating,
    validationResult,
    revalidate: () => validateField(value)
  };
}

// Leave conflict checking hook
export function useLeaveConflictValidation(
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
) {
  const [isChecking, setIsChecking] = useState(false);
  const [conflicts, setConflicts] = useState<{
    hasConflicts: boolean;
    hasWarnings: boolean;
    insufficientBalance: boolean;
    workDays: number;
    balance: any;
    details: any;
  } | null>(null);

  const checkConflicts = useCallback(async () => {
    if (!employeeId || !startDate || !endDate) {
      setConflicts(null);
      return;
    }

    setIsChecking(true);
    
    try {
      const response = await fetch('/api/validation/leave-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          start_date: startDate,
          end_date: endDate,
          exclude_request_id: excludeRequestId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setConflicts(result.data);
      }
    } catch (error) {
      console.error('Conflict checking error:', error);
      setConflicts({
        hasConflicts: false,
        hasWarnings: false,
        insufficientBalance: false,
        workDays: 0,
        balance: null,
        details: { error: 'Nu s-au putut verifica conflictele' }
      });
    } finally {
      setIsChecking(false);
    }
  }, [employeeId, startDate, endDate, excludeRequestId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkConflicts();
    }, 300);

    return () => clearTimeout(timer);
  }, [checkConflicts]);

  return {
    isChecking,
    conflicts,
    recheck: checkConflicts
  };
}

// Form-level validation aggregator
export function useFormValidationAggregator(
  formType: 'employee' | 'leave' | 'login',
  formData: any
) {
  const { user } = useAuth();
  const [globalValidation, setGlobalValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateForm = useCallback(async () => {
    setIsValidating(true);
    
    try {
      let operationType: any;
      switch (formType) {
        case 'employee':
          operationType = formData.id ? 'user_update' : 'user_create';
          break;
        case 'leave':
          operationType = formData.id ? 'leave_update' : 'leave_create';
          break;
        case 'login':
          operationType = 'login';
          break;
      }

      const validation = await validateClientOperation(operationType, formData, user || undefined);
      setGlobalValidation(validation);
      
      return validation;
    } catch (error) {
      console.error('Form validation error:', error);
      return {
        canProceed: false,
        errors: { form: 'Eroare de validare' },
        warnings: [],
        securityIssues: []
      };
    } finally {
      setIsValidating(false);
    }
  }, [formType, formData, user]);

  return {
    globalValidation,
    isValidating,
    validateForm,
    clearValidation: () => setGlobalValidation(null)
  };
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    email: 'Email-ul',
    phone: 'Telefonul', 
    name: 'Numele'
  };
  return labels[field] || field;
}