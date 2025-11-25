import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface Test {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  status: 'active' | 'inactive' | 'archived';
  assignment_type: 'automatic' | 'manual_employees' | 'manual_departments';
  assigned_employees?: string[];
  assigned_departments?: string[];
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TestStats {
  totalTests: number;
  activeTests: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  eligibleEmployees: number;
}

class TestsService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async getTests(): Promise<Test[]> {
    try {
      const { data, error } = await this.supabase
        .from('tests')
        .select('*')
        .order('display_order');

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Failed to load tests:', error);
      throw error;
    }
  }

  async getTestStats(): Promise<TestStats> {
    try {
      console.log('📊 Loading test statistics...');

      // Load all data in parallel
      const [testsData, assignmentsData, eligibleData] = await Promise.all([
        this.supabase.from('tests').select('id, status'),
        this.supabase.from('test_assignments').select('id, status'),
        this.supabase.from('employees').select('id').eq('is_active', true).eq('test_eligible', true)
      ]);

      if (testsData.error) throw new Error(testsData.error.message);
      if (assignmentsData.error) throw new Error(assignmentsData.error.message);
      if (eligibleData.error) throw new Error(eligibleData.error.message);

      const tests = testsData.data || [];
      const assignments = assignmentsData.data || [];
      const eligible = eligibleData.data || [];

      const stats: TestStats = {
        totalTests: tests.length,
        activeTests: tests.filter(t => t.status === 'active').length,
        totalAssignments: assignments.length,
        pendingAssignments: assignments.filter(a => a.status === 'pending').length,
        completedAssignments: assignments.filter(a => a.status === 'completed').length,
        eligibleEmployees: eligible.length
      };

      console.log('✅ Test stats calculated:', stats);
      return stats;

    } catch (error: any) {
      console.error('❌ Failed to load test stats:', error);
      throw error;
    }
  }

  async createTest(testData: any): Promise<Test> {
    try {
      // Get next display order
      const { data: maxOrderData } = await this.supabase
        .from('tests')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = maxOrderData && maxOrderData.length > 0 
        ? maxOrderData[0].display_order + 1 
        : 1;

      const { data, error } = await this.supabase
        .from('tests')
        .insert({
          ...testData,
          display_order: nextOrder
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Failed to create test:', error);
      throw error;
    }
  }

  async updateTest(testId: string, updateData: any): Promise<Test> {
    try {
      const { data, error } = await this.supabase
        .from('tests')
        .update(updateData)
        .eq('id', testId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Failed to update test:', error);
      throw error;
    }
  }

  async deleteTest(testId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('tests')
        .delete()
        .eq('id', testId);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('❌ Failed to delete test:', error);
      throw error;
    }
  }
}

export const testsService = new TestsService();