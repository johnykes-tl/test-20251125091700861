// Manual type declarations for custom RPC functions
// This file provides TypeScript definitions for our custom database functions

export interface ValidationResult {
  valid: boolean;
  error?: string;
  email?: string;
  message?: string;
}

export interface UserProfileResult {
  success: boolean;
  user_id?: string;
  role?: string;
  created_at?: string;
  error?: string;
}

export interface EmployeeAccountResult {
  success: boolean;
  message?: string;
  email?: string;
  error?: string;
}

// Extend the Supabase client type to include our RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc(
      fn: 'validate_user_creation_data',
      args: {
        email_param: string;
        password_param: string;
      }
    ): Promise<{ data: ValidationResult | null; error: any }>;

    rpc(
      fn: 'create_user_profile',
      args: {
        user_id: string;
        user_role?: string;
      }
    ): Promise<{ data: UserProfileResult | null; error: any }>;

    rpc(
      fn: 'create_employee_account',
      args: {
        user_email: string;
        user_password: string;
        employee_data: any;
      }
    ): Promise<{ data: EmployeeAccountResult | null; error: any }>;
  }
}