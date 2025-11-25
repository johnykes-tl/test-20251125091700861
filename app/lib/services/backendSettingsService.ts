import { api } from './apiClient';
import type { TimesheetOption, SystemSetting } from './simpleSettingsService';

interface AllSettings {
  timesheetOptions: TimesheetOption[];
  systemSettings: SystemSetting[];
}

class BackendSettingsService {
  // Load all settings
  async loadAllSettings(): Promise<AllSettings> {
    const response = await api.get<AllSettings>('/api/settings', { load_all: 'true' });
    return response.data || { timesheetOptions: [], systemSettings: [] };
  }

  // Create timesheet option
  async createTimesheetOption(optionData: { title: string; key: string; employee_text: string }): Promise<TimesheetOption> {
    const response = await api.post<TimesheetOption>('/api/settings', {
      action: 'create_timesheet_option',
      data: optionData
    });
    return response.data!;
  }

  // Update timesheet option
  async updateTimesheetOption(id: number, optionData: { title: string; key: string; employee_text: string }): Promise<TimesheetOption> {
    const response = await api.post<TimesheetOption>('/api/settings', {
      action: 'update_timesheet_option',
      data: { id, ...optionData }
    });
    return response.data!;
  }

  // Delete timesheet option
  async deleteTimesheetOption(id: number): Promise<void> {
    await api.post('/api/settings', {
      action: 'delete_timesheet_option',
      data: { id }
    });
  }

  // Toggle timesheet option
  async toggleTimesheetOption(id: number): Promise<TimesheetOption> {
    const response = await api.post<TimesheetOption>('/api/settings', {
      action: 'toggle_timesheet_option',
      data: { id }
    });
    return response.data!;
  }

  // Reorder timesheet options
  async reorderTimesheetOptions(id: number, direction: 'up' | 'down'): Promise<void> {
    await api.post('/api/settings', {
      action: 'reorder_timesheet_options',
      data: { id, direction }
    });
  }

  // Update multiple system settings
  async updateMultipleSettings(settings: Array<{ key: string; value: string }>): Promise<void> {
    await api.post('/api/settings', {
      action: 'update_multiple_settings',
      data: settings
    });
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string; responseTime?: number }> {
    try {
      const startTime = Date.now();
      const response = await api.get('/api/health-check');
      const responseTime = Date.now() - startTime;
      
      return {
        success: response.success,
        message: 'Backend connection successful',
        responseTime
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Backend connection failed'
      };
    }
  }
}

export const backendSettingsService = new BackendSettingsService();