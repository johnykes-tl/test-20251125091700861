import { api } from './apiClient';
import type { Test, TestStats } from '../../lib/types/tests';

interface CreateTestData {
  title: string;
  description: string;
  instructions?: string;
  status?: 'active' | 'inactive' | 'archived';
  assignment_type?: 'automatic' | 'manual_employees' | 'manual_departments';
  assigned_employees?: string[] | null;
  assigned_departments?: string[] | null;
}

interface UpdateTestData {
  title?: string;
  description?: string;
  instructions?: string;
  status?: 'active' | 'inactive' | 'archived';
  assignment_type?: 'automatic' | 'manual_employees' | 'manual_departments';
  assigned_employees?: string[] | null;
  assigned_departments?: string[] | null;
}

class BackendTestsService {
  // Get all tests
  async getTests(): Promise<Test[]> {
    const response = await api.get<Test[]>('/api/tests');
    return response.data || [];
  }

  // Get test statistics
  async getTestStats(): Promise<TestStats> {
    const response = await api.get<TestStats>('/api/tests', { stats_only: 'true' });
    return response.data || {
      totalTests: 0,
      activeTests: 0,
      totalAssignments: 0,
      pendingAssignments: 0,
      completedAssignments: 0,
      eligibleEmployees: 0
    };
  }

  // Create new test
  async createTest(testData: CreateTestData): Promise<Test> {
    const response = await api.post<Test>('/api/tests', testData);
    return response.data!;
  }

  // Update test
  async updateTest(testId: string, updateData: UpdateTestData): Promise<Test> {
    const response = await api.put<Test>(`/api/tests?id=${testId}`, updateData);
    return response.data!;
  }

  // Delete test
  async deleteTest(testId: string): Promise<void> {
    await api.delete(`/api/tests?id=${testId}`);
  }

  // Trigger daily test assignment
  async triggerDailyAssignment(date?: string): Promise<any> {
    const response = await api.post('/api/tests/assign-daily', { 
      date: date || new Date().toISOString().split('T')[0] 
    });
    return response.data;
  }
}

export const backendTestsService = new BackendTestsService();