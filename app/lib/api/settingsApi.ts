class SettingsApiClient {
  private baseUrl = '/api/settings';

  async testConnection(): Promise<{success: boolean; message: string; responseTime?: number}> {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/test-db-connection');
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error || 'Database connection test failed',
          responseTime
        };
      }
      
      const data = await response.json();
      return {
        success: data.success,
        message: data.success ? 'Connection successful' : data.error,
        responseTime
      };
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        message: error.message || 'Network error during connection test'
      };
    }
  }

  async loadAllSettings() {
    try {
      console.log('🔄 Loading all settings...');
      
      const response = await fetch(`${this.baseUrl}?load_all=true`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Settings load failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to load settings'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load settings');
      }
      
      console.log('✅ All settings loaded:', result.data);
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to load settings:', error);
      throw new Error(error.message || 'Failed to load settings');
    }
  }

  async initializeDefaults() {
    try {
      console.log('🔄 Initializing default settings...');
      
      const response = await fetch('/api/settings/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Empty body but proper JSON
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Settings initialization failed:', response.status, errorData);
        throw new Error(`HTTP ${response.status}: ${errorData || 'Bad Request'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize default settings');
      }
      
      console.log('✅ Default settings initialized:', result.data);
      return result.data;
      
    } catch (error: any) {
      console.error('❌ API Client: Failed to initialize defaults:', error);
      throw new Error(error.message || 'Failed to initialize default settings');
    }
  }

  async createTimesheetOption(optionData: {title: string; key: string; employee_text: string}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_timesheet_option',
          data: optionData
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to create timesheet option:', error);
      throw error;
    }
  }

  async updateTimesheetOption(id: number, optionData: {title: string; key: string; employee_text: string}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_timesheet_option',
          data: { id, ...optionData }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to update timesheet option:', error);
      throw error;
    }
  }

  async deleteTimesheetOption(id: number) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_timesheet_option',
          data: { id }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to delete timesheet option:', error);
      throw error;
    }
  }

  async toggleTimesheetOption(id: number) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_timesheet_option',
          data: { id }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to toggle timesheet option:', error);
      throw error;
    }
  }

  async reorderTimesheetOptions(id: number, direction: 'up' | 'down') {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder_timesheet_options',
          data: { id, direction }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to reorder timesheet options:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings: Array<{key: string; value: string}>) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_multiple_settings',
          data: settings
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to update system settings:', error);
      throw error;
    }
  }
}

export const settingsApi = new SettingsApiClient();