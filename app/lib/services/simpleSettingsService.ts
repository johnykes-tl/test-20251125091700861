import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface TimesheetOption {
  id: number;
  title: string;
  key: string;
  employee_text: string;
  display_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  setting_type: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

class SimpleSettingsService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async testConnection(): Promise<{success: boolean; message: string; responseTime?: number}> {
    try {
      const startTime = Date.now();
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          success: false,
          message: `Database error: ${error.message}`,
          responseTime
        };
      }

      return {
        success: true,
        message: 'Database connection successful',
        responseTime
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  async loadAllSettings(): Promise<{timesheetOptions: TimesheetOption[]; systemSettings: SystemSetting[]}> {
    try {
      console.log('📋 Loading all settings from database...');

      const [timesheetResult, settingsResult] = await Promise.all([
        this.supabase
          .from('timesheet_options')
          .select('*')
          .order('display_order'),
        this.supabase
          .from('system_settings')
          .select('*')
          .order('key')
      ]);

      if (timesheetResult.error) {
        throw new Error(`Timesheet options error: ${timesheetResult.error.message}`);
      }

      if (settingsResult.error) {
        throw new Error(`System settings error: ${settingsResult.error.message}`);
      }

      return {
        timesheetOptions: timesheetResult.data || [],
        systemSettings: settingsResult.data || []
      };
    } catch (error: any) {
      console.error('❌ Failed to load settings:', error);
      throw new Error(error.message || 'Failed to load settings from database');
    }
  }

  async initializeDefaults(): Promise<{success: boolean; message: string}> {
    try {
      console.log('🔧 Initializing default settings...');

      // Check if data already exists
      const { data: existingOptions } = await this.supabase
        .from('timesheet_options')
        .select('id')
        .limit(1);

      const { data: existingSettings } = await this.supabase
        .from('system_settings')
        .select('id')
        .limit(1);

      if (existingOptions && existingOptions.length > 0 && 
          existingSettings && existingSettings.length > 0) {
        return {
          success: true,
          message: 'Default settings already exist, no initialization needed'
        };
      }

      // Initialize timesheet options if missing
      if (!existingOptions || existingOptions.length === 0) {
        const defaultOptions = [
          {
            title: 'Prezența',
            key: 'present',
            employee_text: 'Am fost prezent în această zi',
            display_order: 1,
            active: true
          },
          {
            title: 'Update PR',
            key: 'update_pr', 
            employee_text: 'Am actualizat PR-ul astăzi',
            display_order: 2,
            active: true
          },
          {
            title: 'Lucru de acasă',
            key: 'work_from_home',
            employee_text: 'Am lucrat de acasă',
            display_order: 3,
            active: true
          }
        ];

        const { error: optionsError } = await this.supabase
          .from('timesheet_options')
          .insert(defaultOptions);

        if (optionsError) {
          throw new Error(`Failed to insert timesheet options: ${optionsError.message}`);
        }

        console.log('✅ Default timesheet options created');
      }

      // Initialize system settings if missing
      if (!existingSettings || existingSettings.length === 0) {
        const defaultSettings = [
          { key: 'pontaj_cutoff_time', value: '22:00', setting_type: 'time', description: 'Ora limită pentru completarea pontajului' },
          { key: 'allow_weekend_pontaj', value: 'false', setting_type: 'boolean', description: 'Permite pontaj în weekend' },
          { key: 'require_daily_notes', value: 'false', setting_type: 'boolean', description: 'Note zilnice obligatorii' },
          { key: 'max_leave_days_per_year', value: '25', setting_type: 'integer', description: 'Zile concediu maxime pe an' },
          { key: 'email_notifications', value: 'true', setting_type: 'boolean', description: 'Notificări email' }
        ];

        const { error: settingsError } = await this.supabase
          .from('system_settings')
          .insert(defaultSettings);

        if (settingsError) {
          throw new Error(`Failed to insert system settings: ${settingsError.message}`);
        }

        console.log('✅ Default system settings created');
      }

      return {
        success: true,
        message: 'Default settings initialized successfully'
      };

    } catch (error: any) {
      console.error('❌ Failed to initialize defaults:', error);
      throw new Error(error.message || 'Failed to initialize default settings');
    }
  }

  async createTimesheetOption(optionData: {title: string; key: string; employee_text: string}): Promise<TimesheetOption> {
    try {
      // Get next display order
      const { data: maxOrderData } = await this.supabase
        .from('timesheet_options')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = maxOrderData && maxOrderData.length > 0 
        ? maxOrderData[0].display_order + 1 
        : 1;

      const { data, error } = await this.supabase
        .from('timesheet_options')
        .insert({
          ...optionData,
          display_order: nextOrder,
          active: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Failed to create timesheet option:', error);
      throw error;
    }
  }

  async updateTimesheetOption(id: number, optionData: {title: string; key: string; employee_text: string}): Promise<TimesheetOption> {
    try {
      const { data, error } = await this.supabase
        .from('timesheet_options')
        .update(optionData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Failed to update timesheet option:', error);
      throw error;
    }
  }

  async deleteTimesheetOption(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('timesheet_options')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('❌ Failed to delete timesheet option:', error);
      throw error;
    }
  }

  async toggleTimesheetOption(id: number): Promise<TimesheetOption> {
    try {
      // Get current state
      const { data: current, error: fetchError } = await this.supabase
        .from('timesheet_options')
        .select('active')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Toggle the active state
      const { data, error } = await this.supabase
        .from('timesheet_options')
        .update({ active: !current.active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Failed to toggle timesheet option:', error);
      throw error;
    }
  }

  async reorderTimesheetOptions(id: number, direction: 'up' | 'down'): Promise<void> {
    try {
      // Get current option
      const { data: currentOption, error: currentError } = await this.supabase
        .from('timesheet_options')
        .select('display_order')
        .eq('id', id)
        .single();

      if (currentError) {
        throw new Error(currentError.message);
      }

      // Get all options sorted by display_order
      const { data: allOptions, error: allError } = await this.supabase
        .from('timesheet_options')
        .select('id, display_order')
        .order('display_order');

      if (allError) {
        throw new Error(allError.message);
      }

      const currentIndex = allOptions.findIndex(opt => opt.id === id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= allOptions.length) {
        throw new Error('Cannot move option in that direction');
      }

      const targetOption = allOptions[targetIndex];

      // Swap display orders
      const updates = [
        this.supabase
          .from('timesheet_options')
          .update({ display_order: targetOption.display_order })
          .eq('id', id),
        this.supabase
          .from('timesheet_options')
          .update({ display_order: currentOption.display_order })
          .eq('id', targetOption.id)
      ];

      const results = await Promise.all(updates);
      
      for (const result of results) {
        if (result.error) {
          throw new Error(result.error.message);
        }
      }

    } catch (error: any) {
      console.error('❌ Failed to reorder timesheet options:', error);
      throw error;
    }
  }

  async updateMultipleSettings(settings: Array<{key: string; value: string}>): Promise<void> {
    try {
      const updates = settings.map(setting =>
        this.supabase
          .from('system_settings')
          .update({ value: setting.value })
          .eq('key', setting.key)
      );

      const results = await Promise.all(updates);
      
      for (const result of results) {
        if (result.error) {
          throw new Error(result.error.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to update system settings:', error);
      throw error;
    }
  }
}

export const simpleSettingsService = new SimpleSettingsService();