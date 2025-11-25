import { supabase } from '../supabase';
import type { SystemSetting } from '../supabase';

export const settingsService = {
  // Get all system settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) throw error;
    return data || [];
  },

  // Get setting by key
  async getSettingByKey(key: string): Promise<SystemSetting | null> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update setting
  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    const { data, error } = await supabase
      .from('system_settings')
      .update({ value })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create setting
  async createSetting(setting: Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>): Promise<SystemSetting> {
    const { data, error } = await supabase
      .from('system_settings')
      .insert(setting)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get settings as key-value object
  async getSettingsObject(): Promise<Record<string, string>> {
    const settings = await this.getSystemSettings();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  },

  // Update multiple settings
  async updateMultipleSettings(updates: Array<{ key: string; value: string }>): Promise<void> {
    const promises = updates.map(({ key, value }) => this.updateSetting(key, value));
    await Promise.all(promises);
  },
};