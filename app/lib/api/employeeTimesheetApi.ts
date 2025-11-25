// Employee Timesheet API Client - Specialized for timesheet operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

class EmployeeTimesheetApiClient {
  private supabase = createClient(supabaseUrl, supabaseAnonKey);

  // ✅ Load full timesheet page data
  async loadFullData(userId: string) {
    try {
      console.log('🚀 API Client: Loading full timesheet data for user:', userId);
      
      const response = await fetch(`/api/employee/timesheet?user_id=${userId}&action=full_data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Full timesheet data loaded:', {
        employee: result.data.employee?.name,
        timesheetOptions: result.data.timesheetOptions?.length,
        recentActivities: result.data.recentActivities?.length,
        todaysTests: result.data.todaysTests?.length
      });

      return result.data;
    } catch (error: any) {
      console.error('❌ Error loading full timesheet data:', error);
      throw error;
    }
  }

  // ✅ Load entry data for specific date
  async loadEntryData(userId: string, entryDate: string) {
    try {
      console.log('🚀 API Client: Loading entry data:', { userId, entryDate });
      
      const response = await fetch(`/api/employee/timesheet?user_id=${userId}&entry_date=${entryDate}&action=entry_data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.entry;
    } catch (error: any) {
      console.error('❌ Error loading entry data:', error);
      throw error;
    }
  }

  // ✅ Save timesheet entry
  async saveTimesheetEntry(userId: string, entryData: any) {
    try {
      console.log('🚀 API Client: Saving timesheet entry');
      
      const response = await fetch('/api/employee/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          entry_data: entryData
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Timesheet entry saved successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ Error saving timesheet entry:', error);
      throw error;
    }
  }

  // ✅ Refresh stats after save
  async refreshStats(userId: string) {
    try {
      console.log('🚀 API Client: Refreshing stats for user:', userId);
      
      const response = await fetch(`/api/employee/timesheet?user_id=${userId}&action=stats_refresh`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Error refreshing stats:', error);
      throw error;
    }
  }

  // ✅ Test connection
  async testConnection() {
    try {
      const response = await fetch('/api/health-check');
      const result = await response.json();
      return result.status === 'healthy';
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

export const employeeTimesheetApi = new EmployeeTimesheetApiClient();