import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface FormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrorsOnSubmit?: boolean;
}
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: ValidationRules
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const options: FormValidationOptions = {}
  const {
    validateOnChange = false,
    validateOnBlur = false,
    showErrorsOnSubmit = true
  } = options;

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validateField = useCallback((name: string, value: any): string | null => {
    const rules = validationRules[name];
    if (!rules) return null;

    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'Acest câmp este obligatoriu';
    }

    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Minimum ${rules.minLength} caractere`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `Maximum ${rules.maxLength} caractere`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Format invalid';
      }
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [validationRules]);

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [data, validateField, validationRules]);

  const updateField = useCallback((name: string, value: any) => {
    setData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
  }, [initialData]);

  const handleChange = useCallback((name: string, value: any) => {
    updateField(name, value);

    if (showErrorsOnSubmit) {
    }
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on change if enabled
    if (validateOnChange || touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    } else {
    }
  }, [updateField, validateField, touched, validateOnChange, showErrorsOnSubmit]);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      const error = validateField(name, data[name]);
      setErrors(prev => ({ ...prev, [name]: error ||'' }));
    }
  }, [validateField, data, validateOnBlur]);

  const handleSubmit = useCallback((callback: (data: T) => void) => {
    setIsSubmitting(true);
    const isValid = validateAll();
    if (isValid) {
      callback(data);
    }
    setIsSubmitting(false);
  }, [data, validateAll]);

  return {
    data,
    errors,
    updateField,
    validateAll,
    validateField,
    reset,
    setData,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    touched,
    isSubmitting
  };
}