import { supabase } from '../supabase';
import type { TestAssignmentWithDetails } from '../types/tests';

export interface EmployeeTestAssignment {
  id: string;
  test_id: string;
  test_title: string;
  test_description: string;
  test_instructions: string | null;
  assigned_date: string;
  due_date: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at: string | null;
  notes: string | null;
}

export interface EmployeeTestStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

class EmployeeTestsService {
  /**
   * Get all test assignments for a specific employee
   */
  async getEmployeeTestAssignments(employeeId: string): Promise<EmployeeTestAssignment[]> {
    try {
      console.log('📋 Loading test assignments for employee:', employeeId);

      const { data, error } = await supabase
        .from('test_assignments_with_details')
        .select(`
          id,
          test_id,
          test_title,
          test_description,
          test_instructions,
          assigned_date,
          due_date,
          status,
          completed_at,
          notes
        `)
        .eq('employee_id', employeeId)
        .order('assigned_date', { ascending: false });

      if (error) {
        console.error('❌ Error loading employee test assignments:', error);
        throw new Error(`Failed to load test assignments: ${error.message}`);
      }

      console.log('✅ Employee test assignments loaded:', data?.length || 0);
      return data || [];

    } catch (error: any) {
      console.error('❌ Employee tests service error:', error);
      throw error;
    }
  }

  /**
   * Get test assignments for current week
   */
  async getCurrentWeekAssignments(employeeId: string): Promise<EmployeeTestAssignment[]> {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];

      console.log('📅 Loading current week assignments:', { startDate, endDate });

      const { data, error } = await supabase
        .from('test_assignments_with_details')
        .select(`
          id,
          test_id,
          test_title,
          test_description,
          test_instructions,
          assigned_date,
          due_date,
          status,
          completed_at,
          notes
        `)
        .eq('employee_id', employeeId)
        .gte('assigned_date', startDate)
        .lte('assigned_date', endDate)
        .order('assigned_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to load current week assignments: ${error.message}`);
      }

      return data || [];

    } catch (error: any) {
      console.error('❌ Error loading current week assignments:', error);
      throw error;
    }
  }

  /**
   * Get employee test statistics
   */
  async getEmployeeTestStats(employeeId: string): Promise<EmployeeTestStats> {
    try {
      console.log('📊 Loading employee test statistics:', employeeId);

      const assignments = await this.getEmployeeTestAssignments(employeeId);
      const today = new Date();

      const stats: EmployeeTestStats = {
        totalAssigned: assignments.length,
        completed: assignments.filter(a => a.status === 'completed').length,
        pending: assignments.filter(a => a.status === 'pending').length,
        overdue: assignments.filter(a => {
          if (a.status !== 'pending') return false;
          const dueDate = new Date(a.due_date);
          return dueDate < today;
        }).length,
        completionRate: 0
      };

      if (stats.totalAssigned > 0) {
        stats.completionRate = Math.round((stats.completed / stats.totalAssigned) * 100);
      }

      console.log('✅ Employee test stats calculated:', stats);
      return stats;

    } catch (error: any) {
      console.error('❌ Error calculating employee test stats:', error);
      throw error;
    }
  }

  /**
   * Update test assignment status
   */
  async updateTestAssignmentStatus(
    assignmentId: string, 
    status: 'completed' | 'skipped',
    notes?: string
  ): Promise<void> {
    try {
      console.log('📝 Updating test assignment status:', { assignmentId, status });

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('test_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) {
        throw new Error(`Failed to update test assignment: ${error.message}`);
      }

      console.log('✅ Test assignment status updated successfully');

    } catch (error: any) {
      console.error('❌ Error updating test assignment status:', error);
      throw error;
    }
  }

  /**
   * Get today's assignments for employee
   */
  async getTodaysAssignments(employeeId: string): Promise<EmployeeTestAssignment[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      console.log('📅 Loading today\'s assignments for employee:', employeeId);

      const { data, error } = await supabase
        .from('test_assignments_with_details')
        .select(`
          id,
          test_id,
          test_title,
          test_description,
          test_instructions,
          assigned_date,
          due_date,
          status,
          completed_at,
          notes
        `)
        .eq('employee_id', employeeId)
        .eq('assigned_date', today)
        .order('assigned_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to load today's assignments: ${error.message}`);
      }

      console.log('✅ Today\'s assignments loaded:', data?.length || 0);
      return data || [];

    } catch (error: any) {
      console.error('❌ Error loading today\'s assignments:', error);
      throw error;
    }
  }
}

export const employeeTestsService = new EmployeeTestsService();