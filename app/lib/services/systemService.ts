import { supabase } from '../supabase';
import type { SystemSetting } from '../types/settings';

// ⚠️ NOTICE: This appears to be a duplicate of settingsService.ts
// TODO: Evaluate if this should be merged with settingsService or removed

export const systemService = {
  async getSystemSettings(): Promise<SystemSetting[]> {
    try {
      console.log('⚙️ [systemService] Fetching system settings...');
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) {
        console.error('❌ [systemService] Error fetching system settings:', error);
        throw new Error(`Failed to fetch system settings: ${error.message}`);
      }

      console.log('✅ [systemService] System settings fetched:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('❌ [systemService] Exception in getSystemSettings:', error);
      throw error;
    }
  },

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    try {
      console.log('✏️ [systemService] Updating system setting:', { key, value });
      
      const { data, error } = await supabase
        .from('system_settings')
        .update({ 
          value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        console.error('❌ [systemService] Error updating system setting:', error);
        throw new Error(`Failed to update setting ${key}: ${error.message}`);
      }

      console.log('✅ [systemService] System setting updated successfully:', key);
      return data;
    } catch (error: any) {
      console.error('❌ [systemService] Exception in updateSystemSetting:', error);
      throw error;
    }
  },

  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    try {
      console.log('🔍 [systemService] Fetching system setting:', key);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📭 [systemService] Setting not found:', key);
          return null;
        }
        console.error('❌ [systemService] Error fetching system setting:', error);
        throw new Error(`Failed to fetch setting ${key}: ${error.message}`);
      }

      console.log('✅ [systemService] System setting fetched:', key);
      return data;
    } catch (error: any) {
      console.error('❌ [systemService] Exception in getSystemSetting:', error);
      throw error;
    }
  }
};

// Export type for consistency
export type { SystemSetting };

/* 
 * ⚠️ DEPRECATION NOTICE:
 * 
 * This systemService appears to duplicate functionality already present in:
 * - app/lib/services/settingsService.ts (SettingsService class)
 * 
 * RECOMMENDATION:
 * 1. Use the more comprehensive SettingsService class instead
 * 2. This file should be marked for removal after migration
 * 3. Update any imports to use settingsService instead
 * 
 * The SettingsService provides:
 * ✅ Class-based architecture
 * ✅ Comprehensive validation
 * ✅ Type conversion utilities  
 * ✅ Batch operations
 * ✅ Default initialization
 * ✅ Better error handling
 * 
 * Usage Migration:
 * OLD: import { systemService } from './systemService';
 * NEW: import { settingsService } from './settingsService';
 */