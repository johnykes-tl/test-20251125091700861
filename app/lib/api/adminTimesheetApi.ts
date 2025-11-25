class AdminTimesheetApiClient {
  private baseUrl = '/api/admin/timesheet';

  async getAdminTimesheetData(date: string) {
    try {
      console.log('🔄 Loading admin timesheet data for:', date);
      
      const response = await fetch(`${this.baseUrl}?date=${date}&action=full_data`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Admin timesheet load failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to load timesheet data'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load timesheet data');
      }
      
      console.log('✅ Admin timesheet data loaded:', {
        employees: result.data.employees?.length || 0,
        timesheetEntries: result.data.timesheetEntries?.length || 0,
        timesheetOptions: result.data.timesheetOptions?.length || 0
      });
      
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to load admin timesheet data:', error);
      throw new Error(error.message || 'Failed to load admin timesheet data');
    }
  }

  async updateTimesheetCheckbox(
    employeeId: string, 
    entryDate: string, 
    optionKey: string, 
    value: boolean,
    timesheetData: Record<string, boolean>
  ) {
    try {
      console.log('🔄 Updating timesheet checkbox via API:', { 
        employeeId, 
        entryDate, 
        optionKey, 
        value 
      });
      
      const response = await fetch(`${this.baseUrl}/update-checkbox`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          entry_date: entryDate,
          option_key: optionKey,
          value: value,
          timesheet_data: timesheetData
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Checkbox update failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to update checkbox'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update timesheet checkbox');
      }
      
      console.log('✅ Timesheet checkbox updated successfully via API');
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to update timesheet checkbox:', error);
      throw new Error(error.message || 'Failed to update timesheet checkbox');
    }
  }

  async getDailyTasks(date: string, tab: 'active' | 'inactive' = 'active') {
    try {
      console.log('🔄 Loading daily tasks for:', date, tab);
      
      const response = await fetch(`${this.baseUrl}?date=${date}&action=daily_tasks&tab=${tab}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to load daily tasks'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load daily tasks');
      }
      
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to load daily tasks:', error);
      throw new Error(error.message || 'Failed to load daily tasks');
    }
  }

  async getTimesheetStats(date: string, tab: 'active' | 'inactive') {
    try {
      const response = await fetch(`${this.baseUrl}?date=${date}&action=stats&tab=${tab}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load stats');
      }
      
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to load timesheet stats:', error);
      throw error;
    }
  }
}

export const adminTimesheetApi = new AdminTimesheetApiClient();