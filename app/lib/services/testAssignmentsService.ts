import { supabase } from '../supabase';
import type { 
  TestAssignmentWithDetails, 
  CreateTestAssignmentData, 
  UpdateTestAssignmentData 
} from '../types/tests';

export interface AssignmentsByDate {
  assignments: TestAssignmentWithDetails[];
  totalTests: number;
  totalAssignments: number;
  isToday: boolean;
  selectedDate: string;
}

export interface EligibleEmployee {
  id: string;
  employee_id?: string;
  name: string;
  employee_name?: string;
  department: string;
  email?: string;
}

export class TestAssignmentsService {
  async getAssignmentsByDate(date: string): Promise<AssignmentsByDate> {
    try {
      console.log('🔍 Loading test assignments for date:', date);

      // Get all test assignments for the date with test and employee details
      const { data: assignments, error } = await supabase
        .from('test_assignments')
        .select(`
          id,
          test_id,
          employee_id,
          assigned_date,
          due_date,
          status,
          completed_at,
          notes,
          tests:test_id (
            id,
            title,
            description,
            instructions,
            status
          ),
          employees:employee_id (
            id,
            name,
            department,
            email
          )
        `)
        .eq('assigned_date', date)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error loading assignments:', error);
        throw new Error(`Failed to load assignments: ${error.message}`);
      }

      // Transform the data to match our interface
      const transformedAssignments: TestAssignmentWithDetails[] = (assignments || []).map(assignment => ({
        id: assignment.id,
        test_id: assignment.test_id,
        employee_id: assignment.employee_id,
        assigned_date: assignment.assigned_date,
        due_date: assignment.due_date,
        status: assignment.status,
        completed_at: assignment.completed_at,
        notes: assignment.notes,
        test_title: assignment.tests?.title || 'Unknown Test',
        test_description: assignment.tests?.description || '',
        test_instructions: assignment.tests?.instructions || '',
        employee_name: assignment.employees?.name || 'Unknown Employee',
        employee_department: assignment.employees?.department || 'Unknown'
      }));

      // Calculate stats
      const uniqueTestIds = new Set(transformedAssignments.map(a => a.test_id));
      const totalTests = uniqueTestIds.size;
      const totalAssignments = transformedAssignments.length;
      const isToday = date === new Date().toISOString().split('T')[0];

      console.log('✅ Assignments loaded:', {
        date,
        totalAssignments,
        totalTests,
        isToday
      });

      return {
        assignments: transformedAssignments,
        totalTests,
        totalAssignments,
        isToday,
        selectedDate: date
      };

    } catch (error: any) {
      console.error('❌ Error in getAssignmentsByDate:', error);
      throw error;
    }
  }

  async createAssignment(assignmentData: CreateTestAssignmentData): Promise<TestAssignmentWithDetails> {
    try {
      console.log('➕ Creating test assignment:', assignmentData);

      const { data, error } = await supabase
        .from('test_assignments')
        .insert({
          test_id: assignmentData.test_id,
          employee_id: assignmentData.employee_id,
          assigned_date: assignmentData.assigned_date,
          due_date: assignmentData.due_date || new Date(new Date(assignmentData.assigned_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .select(`
          id,
          test_id,
          employee_id,
          assigned_date,
          due_date,
          status,
          completed_at,
          notes,
          tests:test_id (
            title,
            description,
            instructions
          ),
          employees:employee_id (
            name,
            department
          )
        `)
        .single();

      if (error) {
        console.error('❌ Database error creating assignment:', error);
        throw new Error(`Failed to create assignment: ${error.message}`);
      }

      // Transform the response to match our interface
      const transformedAssignment: TestAssignmentWithDetails = {
        id: data.id,
        test_id: data.test_id,
        employee_id: data.employee_id,
        assigned_date: data.assigned_date,
        due_date: data.due_date,
        status: data.status,
        completed_at: data.completed_at,
        notes: data.notes,
        test_title: data.tests?.title || 'Unknown Test',
        test_description: data.tests?.description || '',
        test_instructions: data.tests?.instructions || '',
        employee_name: data.employees?.name || 'Unknown Employee',
        employee_department: data.employees?.department || 'Unknown'
      };

      console.log('✅ Assignment created successfully:', transformedAssignment.id);
      return transformedAssignment;

    } catch (error: any) {
      console.error('❌ Error creating assignment:', error);
      throw error;
    }
  }

  async updateAssignment(assignmentId: string, updateData: UpdateTestAssignmentData): Promise<TestAssignmentWithDetails> {
    try {
      console.log('�� Updating test assignment:', { assignmentId, updateData });

      // First, get the current assignment to ensure it exists
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('test_assignments')
        .select('id, test_id, employee_id')
        .eq('id', assignmentId)
        .single();

      if (fetchError) {
        console.error('❌ Assignment not found:', fetchError);
        throw new Error(`Assignment not found: ${fetchError.message}`);
      }

      if (!existingAssignment) {
        throw new Error('Assignment not found');
      }

      console.log('📍 Found existing assignment:', existingAssignment);

      // Build the update object
      const updateObject: any = {};
      
      if (updateData.status !== undefined) {
        updateObject.status = updateData.status;
      }
      
      if (updateData.notes !== undefined) {
        updateObject.notes = updateData.notes;
      }
      
      if (updateData.completed_at !== undefined) {
        updateObject.completed_at = updateData.completed_at;
      }

      if (updateData.employee_id !== undefined) {
        updateObject.employee_id = updateData.employee_id;
      }

      // Always update the updated_at timestamp
      updateObject.updated_at = new Date().toISOString();

      console.log('💾 Update object:', updateObject);

      // Perform the update
      const { data: updatedData, error: updateError } = await supabase
        .from('test_assignments')
        .update(updateObject)
        .eq('id', assignmentId)
        .select(`
          id,
          test_id,
          employee_id,
          assigned_date,
          due_date,
          status,
          completed_at,
          notes,
          tests:test_id (
            title,
            description,
            instructions
          ),
          employees:employee_id (
            name,
            department
          )
        `)
        .single();

      if (updateError) {
        console.error('❌ Database error updating assignment:', updateError);
        throw new Error(`Failed to update assignment: ${updateError.message}`);
      }

      if (!updatedData) {
        throw new Error('Update operation returned no data');
      }

      // Transform the response to match our interface
      const transformedAssignment: TestAssignmentWithDetails = {
        id: updatedData.id,
        test_id: updatedData.test_id,
        employee_id: updatedData.employee_id,
        assigned_date: updatedData.assigned_date,
        due_date: updatedData.due_date,
        status: updatedData.status,
        completed_at: updatedData.completed_at,
        notes: updatedData.notes,
        test_title: updatedData.tests?.title || 'Unknown Test',
        test_description: updatedData.tests?.description || '',
        test_instructions: updatedData.tests?.instructions || '',
        employee_name: updatedData.employees?.name || 'Unknown Employee',
        employee_department: updatedData.employees?.department || 'Unknown'
      };

      console.log('✅ Assignment updated successfully:', {
        id: transformedAssignment.id,
        status: transformedAssignment.status,
        employee: transformedAssignment.employee_name
      });

      return transformedAssignment;

    } catch (error: any) {
      console.error('❌ Error updating assignment:', error);
      throw error;
    }
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting test assignment:', assignmentId);

      const { error } = await supabase
        .from('test_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        console.error('❌ Database error deleting assignment:', error);
        throw new Error(`Failed to delete assignment: ${error.message}`);
      }

      console.log('✅ Assignment deleted successfully');

    } catch (error: any) {
      console.error('❌ Error deleting assignment:', error);
      throw error;
    }
  }

  async getEligibleEmployees(): Promise<EligibleEmployee[]> {
    try {
      console.log('👥 Loading eligible employees for test assignments');

      const { data, error } = await supabase
        .from('employees')
        .select('id, name, department, email')
        .eq('is_active', true)
        .eq('test_eligible', true)
        .order('name');

      if (error) {
        console.error('❌ Database error loading eligible employees:', error);
        throw new Error(`Failed to load eligible employees: ${error.message}`);
      }

      // Transform to consistent interface
      const eligibleEmployees: EligibleEmployee[] = (data || []).map(emp => ({
        id: emp.id,
        employee_id: emp.id, // For backward compatibility
        name: emp.name,
        employee_name: emp.name, // For backward compatibility  
        department: emp.department,
        email: emp.email
      }));

      console.log('✅ Eligible employees loaded:', eligibleEmployees.length);
      return eligibleEmployees;

    } catch (error: any) {
      console.error('❌ Error loading eligible employees:', error);
      throw error;
    }
  }

  // Helper method to get assignment stats for a specific date
  async getAssignmentStats(date: string) {
    try {
      const { data, error } = await supabase
        .from('test_assignments')
        .select('status')
        .eq('assigned_date', date);

      if (error) {
        throw new Error(`Failed to load assignment stats: ${error.message}`);
      }

      const assignments = data || [];
      return {
        totalAssignments: assignments.length,
        pendingAssignments: assignments.filter(a => a.status === 'pending').length,
        completedAssignments: assignments.filter(a => a.status === 'completed').length,
        skippedAssignments: assignments.filter(a => a.status === 'skipped').length
      };

    } catch (error: any) {
      console.error('❌ Error loading assignment stats:', error);
      throw error;
    }
  }
}

export const testAssignmentsService = new TestAssignmentsService();