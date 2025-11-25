import { supabase } from '../supabase';
import { SupabaseAdminService } from '../supabase-admin';
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from '../../shared/types/Employee';

export class EmployeeService {
  /**
   * Get all employees
   */
  async getEmployees(): Promise<Employee[]> {
    try {
      console.log('📋 Loading all employees...');
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading employees:', error);
        throw new Error(`Failed to load employees: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Service error loading employees:', error);
      throw new Error(error.message || 'Failed to load employees');
    }
  }

  /**
   * Get employee by user ID
   */
  async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    try {
      console.log('👤 Loading employee by user ID:', userId);

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading employee by user ID:', error);
        throw new Error(`Failed to load employee: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Service error loading employee by user ID:', error);
      throw new Error(error.message || 'Failed to load employee by user ID');
    }
  }

  /**
   * Get employees for dropdown (with optional inactive)
   */
  async getEmployeesForDropdown(options: { include_inactive?: boolean } = {}): Promise<Array<{
    id: string;
    name: string;
    department: string;
    email: string;
    is_active: boolean;
  }>> {
    try {
      console.log('📋 Loading employees for dropdown...', options);

      let query = supabase
        .from('employees')
        .select('id, name, department, email, is_active')
        .order('name');

      if (!options.include_inactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error loading employees for dropdown:', error);
        throw new Error(`Failed to load employees: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Service error loading employees for dropdown:', error);
      throw new Error(error.message || 'Failed to load employees for dropdown');
    }
  }

  /**
   * Create new employee with optional user account
   */
  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      console.log('👤 Creating employee:', { 
        name: employeeData.name, 
        email: employeeData.email,
        createAccount: employeeData.create_user_account 
      });

      let userId: string | null = null;

      // Step 1: Create user account if requested
      if (employeeData.create_user_account && employeeData.password) {
        console.log('🔐 Creating user account...');
        
        try {
          // Call SupabaseAdminService directly instead of HTTP request
          const { user: authUser } = await SupabaseAdminService.createAuthUser(
            employeeData.email, 
            employeeData.password
          );

          if (authUser) {
            userId = authUser.id;
            
            // Create user profile
            const profileResult = await SupabaseAdminService.createUserProfile(authUser.id, 'employee');
            if (!profileResult.success) {
              console.warn('⚠️ User profile creation failed, continuing with employee creation:', profileResult.error);
            }
          }
        } catch (authError: any) {
          console.warn('⚠️ User account creation failed, continuing with employee-only creation:', authError.message);
          // Continue with employee creation even if user account fails
        }
      }

      // Step 2: Create employee record using safe creation function
      console.log('📝 Creating employee record in database...');
      
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_employee_safe', {
          employee_name: employeeData.name,
          employee_email: employeeData.email,
          employee_department: employeeData.department || 'General',
          employee_position: employeeData.position || 'Employee',
          employee_join_date: employeeData.join_date || new Date().toISOString().split('T')[0],
          employee_phone: employeeData.phone || null,
          employee_user_id: userId
        });

      if (functionError) {
        console.error('❌ Safe creation function failed:', functionError);
        
        // If user was created but employee creation failed, clean up
        if (userId) {
          console.log('🧹 Cleaning up auth user due to employee creation failure...');
          await SupabaseAdminService.deleteAuthUser(userId);
        }
        
        throw new Error(`Employee creation failed: ${functionError.message}`);
      }

      if (!functionResult || !functionResult.success) {
        const errorMsg = functionResult?.error || 'Unknown error during employee creation';
        console.error('❌ Employee creation function returned error:', errorMsg);
        
        // Clean up auth user if needed
        if (userId) {
          console.log('🧹 Cleaning up auth user due to function failure...');
          await SupabaseAdminService.deleteAuthUser(userId);
        }
        
        throw new Error(errorMsg);
      }

      const newEmployeeId = functionResult.employee_id;
      console.log('✅ Employee created successfully:', newEmployeeId);

      // Step 3: Fetch the complete employee record
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', newEmployeeId)
        .single();

      if (fetchError || !employee) {
        console.error('❌ Error fetching created employee:', fetchError);
        throw new Error('Employee created but failed to fetch complete record');
      }

      console.log('✅ Employee creation completed successfully:', {
        id: employee.id,
        name: employee.name,
        hasUserAccount: !!userId
      });

      return employee;

    } catch (error: any) {
      console.error('❌ Employee creation service error:', error);
      throw new Error(error.message || 'Failed to create employee');
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(employeeId: string, updateData: UpdateEmployeeData): Promise<Employee> {
    try {
      console.log('📝 Updating employee:', { employeeId, updateData });

      const { data, error } = await supabase
        .from('employees')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating employee:', error);
        throw new Error(`Failed to update employee: ${error.message}`);
      }

      if (!data) {
        throw new Error('Employee not found');
      }

      console.log('✅ Employee updated successfully:', data.id);
      return data;

    } catch (error: any) {
      console.error('❌ Service error updating employee:', error);
      throw new Error(error.message || 'Failed to update employee');
    }
  }

  /**
   * Activate employee
   */
  async activateEmployee(employeeId: string): Promise<Employee> {
    return this.updateEmployee(employeeId, { 
      is_active: true, 
      leave_date: null 
    });
  }

  /**
   * Deactivate employee
   */
  async deactivateEmployee(employeeId: string): Promise<Employee> {
    return this.updateEmployee(employeeId, { 
      is_active: false, 
      leave_date: new Date().toISOString().split('T')[0]
    });
  }

  /**
   * Toggle test eligibility
   */
  async toggleTestEligibility(employeeId: string, testEligible: boolean): Promise<Employee> {
    return this.updateEmployee(employeeId, { test_eligible: testEligible });
  }

  /**
   * Get unique departments
   */
  async getDepartments(): Promise<string[]> {
    try {
      console.log('🏢 Loading departments...');

      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .not('department', 'is', null);

      if (error) {
        console.error('❌ Error loading departments:', error);
        throw new Error(`Failed to load departments: ${error.message}`);
      }

      // Extract unique departments
      const uniqueDepartments = Array.from(
        new Set(data?.map(item => item.department).filter(Boolean))
      ).sort();

      return uniqueDepartments;
    } catch (error: any) {
      console.error('❌ Service error loading departments:', error);
      throw new Error(error.message || 'Failed to load departments');
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(): Promise<Array<{
    department: string;
    count: number;
    active_count: number;
  }>> {
    try {
      console.log('📊 Loading department stats...');

      const { data, error } = await supabase
        .rpc('get_department_stats');

      if (error) {
        console.error('❌ Error loading department stats:', error);
        throw new Error(`Failed to load department stats: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Service error loading department stats:', error);
      throw new Error(error.message || 'Failed to load department stats');
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  /**
   * Delete employee (admin only)
   */
  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting employee:', employeeId);

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) {
        console.error('❌ Error deleting employee:', error);
        throw new Error(`Failed to delete employee: ${error.message}`);
      }

      console.log('✅ Employee deleted successfully');
    } catch (error: any) {
      console.error('❌ Service error deleting employee:', error);
      throw new Error(error.message || 'Failed to delete employee');
    }
  }
}

// Export singleton instance
export const employeeService = new EmployeeService();