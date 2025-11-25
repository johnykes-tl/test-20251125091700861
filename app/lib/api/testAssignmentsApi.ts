import { apiClient } from './apiClient';
import type { 
  TestAssignmentWithDetails,
  CreateTestAssignmentData,
  UpdateTestAssignmentData 
} from '../types/tests';
import type { 
  AssignmentsByDate,
  EligibleEmployee 
} from '../services/testAssignmentsService';

class TestAssignmentsApi {
  async getAssignmentsByDate(date: string): Promise<AssignmentsByDate> {
    try {
      console.log('🔍 API: Loading test assignments for date:', date);
      
      const response = await apiClient.get(`/api/test-assignments?date=${encodeURIComponent(date)}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load assignments');
      }

      console.log('✅ API: Test assignments loaded for date:', date);
      return response.data;

    } catch (error: any) {
      console.error('❌ API: Error loading assignments by date:', error);
      throw new Error(error.message || 'Failed to load test assignments for date');
    }
  }

  async getEligibleEmployees(): Promise<EligibleEmployee[]> {
    try {
      console.log('👥 API: Loading eligible employees');
      
      const response = await apiClient.get('/api/test-assignments/eligible-employees');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load eligible employees');
      }

      console.log('✅ API: Eligible employees loaded');
      return response.data;

    } catch (error: any) {
      console.error('❌ API: Error loading eligible employees:', error);
      throw new Error(error.message || 'Failed to load eligible employees');
    }
  }

  async createAssignment(assignmentData: CreateTestAssignmentData): Promise<TestAssignmentWithDetails> {
    try {
      console.log('➕ API: Creating test assignment');
      
      const response = await apiClient.post('/api/test-assignments', assignmentData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create assignment');
      }

      console.log('✅ API: Test assignment created');
      return response.data;

    } catch (error: any) {
      console.error('❌ API: Error creating assignment:', error);
      throw new Error(error.message || 'Failed to create test assignment');
    }
  }

  async updateAssignment(assignmentId: string, updateData: UpdateTestAssignmentData): Promise<TestAssignmentWithDetails> {
    try {
      console.log('🔄 API: Updating test assignment:', { assignmentId, updateData });
      
      const response = await apiClient.put(`/api/test-assignments?id=${encodeURIComponent(assignmentId)}`, updateData);
      
      if (!response.success) {
        console.error('❌ API: Assignment update failed:', response.error);
        throw new Error(response.error || 'Failed to update assignment');
      }

      console.log('✅ API: Test assignment updated successfully');
      return response.data;

    } catch (error: any) {
      console.error('❌ API: Assignment update failed:', error.message);
      throw new Error(error.message || 'Failed to update test assignment');
    }
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      console.log('🗑️ API: Deleting test assignment:', assignmentId);
      
      const response = await apiClient.delete(`/api/test-assignments?id=${encodeURIComponent(assignmentId)}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete assignment');
      }

      console.log('✅ API: Test assignment deleted');

    } catch (error: any) {
      console.error('❌ API: Error deleting assignment:', error);
      throw new Error(error.message || 'Failed to delete test assignment');
    }
  }

  // Get assignments summary for employee
  async getEmployeeTestsSummary(employeeId: string) {
    try {
      console.log('📊 API: Loading employee tests summary:', employeeId);
      
      const response = await apiClient.get(`/api/employee/tests?employee_id=${encodeURIComponent(employeeId)}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load employee tests');
      }

      console.log('✅ API: Employee tests summary loaded');
      return response.data;

    } catch (error: any) {
      console.error('❌ API: Error loading employee tests summary:', error);
      throw new Error(error.message || 'Failed to load employee tests summary');
    }
  }

  // Update assignment status (employee action)
  async updateAssignmentStatus(assignmentId: string, status: 'completed' | 'skipped', notes?: string): Promise<TestAssignmentWithDetails> {
    try {
      console.log('🔄 API: Updating assignment status:', { assignmentId, status, notes });

      const updateData: UpdateTestAssignmentData = {
        status,
        notes,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined
      };
      
      return await this.updateAssignment(assignmentId, updateData);

    } catch (error: any) {
      console.error('❌ API: Error updating assignment status:', error);
      throw new Error(error.message || 'Failed to update assignment status');
    }
  }
}

export const testAssignmentsApi = new TestAssignmentsApi();