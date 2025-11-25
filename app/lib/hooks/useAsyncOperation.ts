import { useState, useCallback } from 'react';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  successDuration?: number;
}

export function useAsyncOperation<T = any>(
  options: UseAsyncOperationOptions = {}
) {
  const { onSuccess, onError, successDuration = 3000 } = options;

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false
  });

  const execute = useCallback(async (
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null, success: false }));

    try {
      const result = await operation();
      
      setState(prev => ({ 
        ...prev, 
        data: result, 
        loading: false, 
        success: true 
      }));

      if (onSuccess) {
        onSuccess(result);
      }

      // Auto-clear success state
      if (successDuration > 0) {
        setTimeout(() => {
          setState(prev => ({ ...prev, success: false }));
        }, successDuration);
      }

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Operation failed';
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));

      if (onError) {
        onError(errorMessage);
      }

      return null;
    }
  }, [onSuccess, onError, successDuration]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearSuccess = useCallback(() => {
    setState(prev => ({ ...prev, success: false }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    clearError,
    clearSuccess
  };
}