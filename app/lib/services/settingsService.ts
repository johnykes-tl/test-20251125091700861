import { supabase } from '../supabase';
import { DEFAULT_SYSTEM_SETTINGS } from '../types/settings';
import type { 
  SystemSetting, 
  CreateSystemSettingData, 
  UpdateSystemSettingData,
  AllSystemSettings,
  SettingType,
  SettingValidationResult,
  BooleanSetting,
  IntegerSetting,
  StringSetting,
  TimeSetting
} from '../types/settings';

export class SettingsService {
  /**
   * Get all system settings
   */
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    try {
      console.log('⚙️ Fetching all system settings...');
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) {
        console.error('❌ Error fetching system settings:', error);
        throw new Error(`Failed to fetch system settings: ${error.message}`);
      }

      console.log('✅ System settings fetched:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('❌ Exception in getAllSystemSettings:', error);
      throw error;
    }
  }

  /**
   * Get system setting by key
   */
  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    try {
      console.log('🔍 Fetching system setting:', key);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.log('📭 Setting not found:', key);
          return null;
        }
        console.error('❌ Error fetching system setting:', error);
        throw new Error(`Failed to fetch setting ${key}: ${error.message}`);
      }

      console.log('✅ System setting fetched:', key);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in getSystemSetting:', error);
      throw error;
    }
  }

  /**
   * Update system setting value
   */
  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    try {
      console.log('✏️ Updating system setting:', { key, value });
      
      // Get current setting to validate type
      const currentSetting = await this.getSystemSetting(key);
      if (!currentSetting) {
        throw new Error(`Setting with key '${key}' not found`);
      }

      // Validate the new value against the setting type
      const validation = this.validateSettingValue(value, currentSetting.setting_type);
      if (!validation.valid) {
        throw new Error(`Invalid value for setting ${key}: ${validation.error}`);
      }

      const updates = {
        value: value,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('system_settings')
        .update(updates)
        .eq('key', key)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating system setting:', error);
        throw new Error(`Failed to update setting ${key}: ${error.message}`);
      }

      console.log('✅ System setting updated successfully:', key);
      return data;
    } catch (error: any) {
      console.error('❌ Exception in updateSystemSetting:', error);
      throw error;
    }
  }

  /**
   * Create new system setting
   */
  async createSystemSetting(settingData: CreateSystemSettingData): Promise<SystemSetting> {
    try {
      console.log('➕ Creating system setting:', settingData.key);
      
      // Validate the value against the setting type
      const validation = this.validateSettingValue(settingData.value, settingData.setting_type);
      if (!validation.valid) {
        throw new Error(`Invalid value for setting ${settingData.key}: ${validation.error}`);
      }

      const { data, error } = await supabase
        .from('system_settings')
        .insert([settingData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating system setting:', error);
        throw new Error(`Failed to create setting: ${error.message}`);
      }

      console.log('✅ System setting created successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Exception in createSystemSetting:', error);
      throw error;
    }
  }

  /**
   * Delete system setting
   */
  async deleteSystemSetting(key: string): Promise<void> {
    try {
      console.log('🗑️ Deleting system setting:', key);
      
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('key', key);

      if (error) {
        console.error('❌ Error deleting system setting:', error);
        throw new Error(`Failed to delete setting ${key}: ${error.message}`);
      }

      console.log('✅ System setting deleted successfully');
    } catch (error: any) {
      console.error('❌ Exception in deleteSystemSetting:', error);
      throw error;
    }
  }

  /**
   * Get settings by type
   */
  async getSettingsByType(settingType: SettingType): Promise<SystemSetting[]> {
    try {
      console.log('🔍 Fetching settings by type:', settingType);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_type', settingType)
        .order('key');

      if (error) {
        console.error('❌ Error fetching settings by type:', error);
        throw new Error(`Failed to fetch ${settingType} settings: ${error.message}`);
      }

      console.log('✅ Settings by type fetched:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('❌ Exception in getSettingsByType:', error);
      throw error;
    }
  }

  /**
   * Get all settings as typed object
   */
  async getTypedSettings(): Promise<Partial<AllSystemSettings>> {
    try {
      console.log('🔄 Converting settings to typed object...');
      
      const settings = await this.getAllSystemSettings();
      const typedSettings: Partial<AllSystemSettings> = {};

      for (const setting of settings) {
        const convertedValue = this.convertSettingValue(setting.value, setting.setting_type);
        typedSettings[setting.key] = convertedValue;
      }

      console.log('✅ Settings converted to typed object');
      return typedSettings;
    } catch (error: any) {
      console.error('❌ Exception in getTypedSettings:', error);
      throw error;
    }
  }

  /**
   * Update multiple settings at once
   */
  async updateMultipleSettings(updates: Record<string, string>): Promise<SystemSetting[]> {
    try {
      console.log('📝 Updating multiple settings:', Object.keys(updates));
      
      const updatedSettings: SystemSetting[] = [];
      
      for (const [key, value] of Object.entries(updates)) {
        const updated = await this.updateSystemSetting(key, value);
        updatedSettings.push(updated);
      }

      console.log('✅ Multiple settings updated successfully');
      return updatedSettings;
    } catch (error: any) {
      console.error('❌ Exception in updateMultipleSettings:', error);
      throw error;
    }
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaultSettings(): Promise<void> {
    try {
      console.log('🚀 Initializing default system settings...');
      
      const existingSettings = await this.getAllSystemSettings();
      const existingKeys = new Set(existingSettings.map(s => s.key));
      
      const settingsToCreate = DEFAULT_SYSTEM_SETTINGS.filter(
        defaultSetting => !existingKeys.has(defaultSetting.key)
      );

      if (settingsToCreate.length === 0) {
        console.log('✅ All default settings already exist');
        return;
      }

      console.log('➕ Creating missing default settings:', settingsToCreate.length);
      
      for (const setting of settingsToCreate) {
        await this.createSystemSetting(setting);
      }

      console.log('✅ Default system settings initialized');
    } catch (error: any) {
      console.error('❌ Exception in initializeDefaultSettings:', error);
      throw error;
    }
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      console.log('🔄 Resetting all settings to defaults...');
      
      for (const defaultSetting of DEFAULT_SYSTEM_SETTINGS) {
        await this.updateSystemSetting(defaultSetting.key, defaultSetting.value);
      }

      console.log('✅ All settings reset to defaults');
    } catch (error: any) {
      console.error('❌ Exception in resetToDefaults:', error);
      throw error;
    }
  }

  /**
   * Validate setting value against its type
   */
  private validateSettingValue(value: string, settingType: SettingType): SettingValidationResult {
    try {
      switch (settingType) {
        case 'boolean':
          if (value !== 'true' && value !== 'false') {
            return { valid: false, error: 'Boolean value must be "true" or "false"' };
          }
          return { valid: true, formattedValue: value === 'true' };
        case 'integer':
          const intValue = parseInt(value, 10);
          if (isNaN(intValue) || !Number.isInteger(intValue)) {
            return { valid: false, error: 'Integer value must be a valid whole number' };
          }
          return { valid: true, formattedValue: intValue };
        case 'time':
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(value)) {
            return { valid: false, error: 'Time value must be in HH:MM format (24-hour)' };
          }
          return { valid: true, formattedValue: value };
        case 'string':
           return { valid: true, formattedValue: value };
        default:
          return { valid: false, error: `Unknown setting type: ${settingType}` };
      }
    } catch (error: any) {
      return { valid: false, error: `Validation error: ${error.message}` };
    }
  }

  /**
   * Convert string value to appropriate type
   */
  private convertSettingValue(value: string, settingType: SettingType): any {
    switch (settingType) {
      case 'boolean':
        return value === 'true';
      case 'integer':
        return parseInt(value, 10);
      case 'time':
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Get strongly typed setting value
   */
  async getBooleanSetting(key: string): Promise<boolean> {
    const setting = await this.getSystemSetting(key);
    if (!setting || setting.setting_type !== 'boolean') {
      throw new Error(`Setting ${key} is not a boolean setting`);
    }
    return setting.value === 'true';
  }

  async getIntegerSetting(key: string): Promise<number> {
    const setting = await this.getSystemSetting(key);
    if (!setting || setting.setting_type !== 'integer') {
      throw new Error(`Setting ${key} is not an integer setting`);
    }
    return parseInt(setting.value, 10);
  }

  async getStringSetting(key: string): Promise<string> {
    const setting = await this.getSystemSetting(key);
    if (!setting || setting.setting_type !== 'string') {
      throw new Error(`Setting ${key} is not a string setting`);
    }
    return setting.value;
  }

  async getTimeSetting(key: string): Promise<string> {
    const setting = await this.getSystemSetting(key);
    if (!setting || setting.setting_type !== 'time') {
      throw new Error(`Setting ${key} is not a time setting`);
    }
    return setting.value;
  }
}

// Export service instance
export const settingsService = new SettingsService();

// Export types for use in components
export type { 
  SystemSetting, 
  CreateSystemSettingData, 
  UpdateSystemSettingData,
  AllSystemSettings,
  SettingType,
  BooleanSetting,
  IntegerSetting,
  StringSetting,
  TimeSetting 
};