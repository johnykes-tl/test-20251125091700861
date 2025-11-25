class TestsApiClient {
  private baseUrl = '/api/tests';

  async getTestsWithStats() {
    try {
      console.log('🔄 Loading tests with stats...');
      
      // Load tests and stats in parallel
      const [testsResponse, statsResponse] = await Promise.all([
        fetch(this.baseUrl),
        fetch(`${this.baseUrl}?stats_only=true`)
      ]);

      if (!testsResponse.ok) {
        const errorText = await testsResponse.text();
        throw new Error(`HTTP ${testsResponse.status}: ${errorText || 'Failed to load tests'}`);
      }

      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        throw new Error(`HTTP ${statsResponse.status}: ${errorText || 'Failed to load stats'}`);
      }

      const [testsResult, statsResult] = await Promise.all([
        testsResponse.json(),
        statsResponse.json()
      ]);

      if (!testsResult.success) {
        throw new Error(testsResult.error || 'Failed to load tests');
      }

      if (!statsResult.success) {
        throw new Error(statsResult.error || 'Failed to load stats');
      }

      console.log('✅ Tests and stats loaded successfully');
      
      return {
        tests: testsResult.data,
        stats: statsResult.data
      };
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to load tests with stats:', error);
      throw new Error(error.message || 'Failed to load tests with stats');
    }
  }

  async createTest(testData: any) {
    try {
      console.log('🔄 Creating test:', testData.title);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to create test'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create test');
      }
      
      console.log('✅ Test created successfully');
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to create test:', error);
      throw new Error(error.message || 'Failed to create test');
    }
  }

  async updateTest(testId: string, updateData: any) {
    try {
      console.log('🔄 Updating test:', testId);
      
      const response = await fetch(`${this.baseUrl}?id=${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to update test'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update test');
      }
      
      console.log('✅ Test updated successfully');
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to update test:', error);
      throw new Error(error.message || 'Failed to update test');
    }
  }

  async deleteTest(testId: string) {
    try {
      console.log('�� Deleting test:', testId);
      
      const response = await fetch(`${this.baseUrl}?id=${testId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to delete test'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete test');
      }
      
      console.log('✅ Test deleted successfully');
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to delete test:', error);
      throw new Error(error.message || 'Failed to delete test');
    }
  }

  async triggerDailyAssignment(date?: string) {
    try {
      const assignmentDate = date || new Date().toISOString().split('T')[0];
      console.log('🔄 Triggering daily test assignment for:', assignmentDate);
      
      const response = await fetch('/api/tests/assign-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: assignmentDate }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to trigger assignment'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger daily assignment');
      }
      
      console.log('✅ Daily assignment triggered successfully:', result.data);
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to trigger daily assignment:', error);
      throw new Error(error.message || 'Failed to trigger daily assignment');
    }
  }
}

export const testsApi = new TestsApiClient();