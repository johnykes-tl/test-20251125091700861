import { api } from './apiClient';
import type { 
  TestAssignmentWithDetails,
  CreateAssignmentData,
  UpdateAssignmentData
} from '../types/tests';
import type { 
  AssignmentsByDate,
  EligibleEmployee
} from './testAssignmentsService';

export const backendTestAssignmentsService = {
  async getAssignmentsByDate(date: string): Promise<AssignmentsByDate> {
    console.log('🚀 Backend API: Loading assignments for date:', date);
    
    const response = await api.get<AssignmentsByDate>(`/api/test-assignments?date=${date}`);
    
    if (!response.data) {
      throw new Error('No assignment data received from API');
    }

    console.log('✅ Backend API: Assignments loaded successfully');
    return response.data;
  },

  async getEligibleEmployees(): Promise<EligibleEmployee[]> {
    console.log('🚀 Backend API: Loading eligible employees');
    
    const response = await api.get<EligibleEmployee[]>('/api/test-assignments/eligible-employees');
    
    console.log('✅ Backend API: Eligible employees loaded successfully');
    return response.data || [];
  },

  async createAssignment(assignmentData: CreateAssignmentData): Promise<TestAssignmentWithDetails> {
    console.log('🚀 Backend API: Creating assignment');
    
    const response = await api.post<TestAssignmentWithDetails>('/api/test-assignments', assignmentData);
    
    if (!response.data) {
      throw new Error('Failed to create assignment - no data returned');
    }

    console.log('✅ Backend API: Assignment created successfully');
    return response.data;
  },

  async updateAssignment(assignmentId: string, updateData: UpdateAssignmentData): Promise<TestAssignmentWithDetails> {
    console.log('🚀 Backend API: Updating assignment:', assignmentId);
    
    const response = await api.put<TestAssignmentWithDetails>(
      `/api/test-assignments?id=${assignmentId}`, 
      updateData
    );
    
    if (!response.data) {
      throw new Error('Failed to update assignment - no data returned');
    }

    console.log('✅ Backend API: Assignment updated successfully');
    return response.data;
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    console.log('🚀 Backend API: Deleting assignment:', assignmentId);
    
    await api.delete(`/api/test-assignments?id=${assignmentId}`);
    
    console.log('✅ Backend API: Assignment deleted successfully');
  },

  async getAssignmentStats(date: string): Promise<any> {
    console.log('🚀 Backend API: Loading assignment stats for date:', date);
    
    const response = await api.get(`/api/test-assignments/stats?date=${date}`);
    
    console.log('✅ Backend API: Assignment stats loaded successfully');
    return response.data || {
      totalTests: 0,
      totalAssignments: 0,
      pendingAssignments: 0,
      completedAssignments: 0,
      skippedAssignments: 0,
      assignmentDate: date,
      isToday: false
    };
  }
};