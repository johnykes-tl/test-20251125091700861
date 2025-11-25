import { supabase } from '../supabase';
import { debugService } from './debugService';

export interface SystemSettingsGroup {
  pontaj: {
    pontajCutoffTime: string;
    allowWeekendPontaj: boolean;
    requireDailyNotes: boolean;
  };
  concedii: {
    autoApproveLeave: boolean;
    maxLeaveDaysPerYear: number;
  };
  notificari: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  securitate: {
    passwordMinLength: number;
    requirePasswordChange: boolean;
    sessionTimeout: number;
    twoFactorAuth: boolean;
    allowRemoteAccess: boolean;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  details?: any;
  diagnostic?: any;
}

class SystemSettingsService {
  /**
   * ✅ IMPROVED: Enhanced connection test with better logic
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Running enhanced connection test...');
      
      // Run full system diagnostic
      const diagnostic = await debugService.performSystemDiagnostic();
      
      // Enhanced success criteria
      const connectionOk = diagnostic.connectionTest.success;
      const tablesOk = diagnostic.tablesCheck.success;
      
      // Core functionality check - if connection and tables work, we're good
      const coreSuccess = connectionOk && tablesOk;
      
      return {
        success: coreSuccess,
        error: coreSuccess ? undefined : diagnostic.overall.issues.join('; '),
        details: {
          connectionTime: diagnostic.connectionTest.details?.responseTime,
          tablesAccessible: Object.keys(diagnostic.tablesCheck.data || {}).length,
          environmentOk: diagnostic.environmentCheck.success,
          serverEnvironmentOk: diagnostic.serverEnvironmentCheck?.success,
          permissionsOk: diagnostic.permissionsCheck.success,
          dataOk: diagnostic.dataCheck.success,
          coreSystemWorking: coreSuccess
        },
        diagnostic
      };

    } catch (error: any) {
      console.error('❌ Connection test failed with exception:', error);
      return {
        success: false,
        error: `Connection test failed: ${error.message}`,
        details: {
          errorType: 'Exception',
          errorName: error.name
        }
      };
    }
  }

  /**
   * ✅ IMPROVED: Enhanced initialization with better error handling
   */
  async initializeDefaultSettings(): Promise<void> {
    console.log('🚀 Initializing default system settings...');

    const defaultSettings = [
      { key: 'pontaj_cutoff_time', value: '22:00', setting_type: 'time', description: 'Ora limită pentru completarea pontajului' },
      { key: 'allow_weekend_pontaj', value: 'false', setting_type: 'boolean', description: 'Permite pontaj în weekend' },
      { key: 'require_daily_notes', value: 'false', setting_type: 'boolean', description: 'Note zilnice obligatorii' },
      { key: 'auto_approve_leave', value: 'false', setting_type: 'boolean', description: 'Aprobare automată concedii' },
      { key: 'max_leave_days_per_year', value: '25', setting_type: 'integer', description: 'Zile concediu maxime pe an' },
      { key: 'email_notifications', value: 'true', setting_type: 'boolean', description: 'Notificări email' },
      { key: 'sms_notifications', value: 'false', setting_type: 'boolean', description: 'Notificări SMS' },
      { key: 'password_min_length', value: '8', setting_type: 'integer', description: 'Lungime minimă parolă' },
      { key: 'require_password_change', value: 'false', setting_type: 'boolean', description: 'Schimbare parolă obligatorie' },
      { key: 'session_timeout', value: '480', setting_type: 'integer', description: 'Timeout sesiune (minute)' },
      { key: 'two_factor_auth', value: 'false', setting_type: 'boolean', description: 'Autentificare cu doi factori' },
      { key: 'allow_remote_access', value: 'true', setting_type: 'boolean', description: 'Acces remote' }
    ];

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const setting of defaultSettings) {
      try {
        const { error } = await supabase
          .from('system_settings')
          .upsert(setting, { 
            onConflict: 'key',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ Failed to upsert setting ${setting.key}:`, error);
          errors.push(`${setting.key}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Setting upserted: ${setting.key}`);
          successCount++;
        }
      } catch (exception: any) {
        console.error(`❌ Exception upserting setting ${setting.key}:`, exception);
        errors.push(`${setting.key}: ${exception.message}`);
        errorCount++;
      }
    }

    console.log(`📊 Initialization complete: ${successCount} success, ${errorCount} errors`);
    
    if (errorCount > 0) {
      throw new Error(`Failed to initialize ${errorCount} settings: ${errors.join('; ')}`);
    }
  }

  /**
   * ✅ IMPROVED: Enhanced getAllSettings with better loading logic
   */
  async getAllSettings(): Promise<SystemSettingsGroup> {
    try {
      console.log('📋 Loading all system settings...');

      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('key, value, setting_type');

      if (error) {
        console.error('❌ Error loading settings:', error);
        
        // If it's a "relation does not exist" error, the table might not be created
        if (error.code === '42P01') {
          throw new Error('Database table "system_settings" does not exist. Please run migrations.');
        }
        
        // If no data found or other retrieval error, try to initialize defaults
        console.log('�� Settings loading failed, attempting to initialize defaults...');
        await this.initializeDefaultSettings();
        
        // Retry loading after initialization
        const { data: retrySettings, error: retryError } = await supabase
          .from('system_settings')
          .select('key, value, setting_type');
          
        if (retryError) {
          throw new Error(`Failed to load settings after initialization: ${retryError.message}`);
        }
        
        return this.processSettingsData(retrySettings || []);
      }

      if (!settings || settings.length === 0) {
        console.log('🔄 No settings found, initializing defaults...');
        await this.initializeDefaultSettings();
        
        // Retry after initialization
        const { data: retrySettings, error: retryError } = await supabase
          .from('system_settings')
          .select('key, value, setting_type');
          
        if (retryError) {
          throw new Error(`Failed to load settings after initialization: ${retryError.message}`);
        }
        
        return this.processSettingsData(retrySettings || []);
      }

      console.log('✅ Settings loaded successfully:', settings.length, 'settings found');
      return this.processSettingsData(settings);

    } catch (error: any) {
      console.error('❌ Error in getAllSettings:', error);
      
      // Return safe defaults if everything fails
      console.log('🔧 Returning fallback default settings due to error:', error.message);
      return this.getFallbackSettings();
    }
  }

  /**
   * ✅ NEW: Process settings data into grouped structure
   */
  private processSettingsData(settings: any[]): SystemSettingsGroup {
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    return {
      pontaj: {
        pontajCutoffTime: settingsMap.get('pontaj_cutoff_time') || '22:00',
        allowWeekendPontaj: settingsMap.get('allow_weekend_pontaj') === 'true',
        requireDailyNotes: settingsMap.get('require_daily_notes') === 'true',
      },
      concedii: {
        autoApproveLeave: settingsMap.get('auto_approve_leave') === 'true',
        maxLeaveDaysPerYear: parseInt(settingsMap.get('max_leave_days_per_year') || '25'),
      },
      notificari: {
        emailNotifications: settingsMap.get('email_notifications') !== 'false',
        smsNotifications: settingsMap.get('sms_notifications') === 'true',
      },
      securitate: {
        passwordMinLength: parseInt(settingsMap.get('password_min_length') || '8'),
        requirePasswordChange: settingsMap.get('require_password_change') === 'true',
        sessionTimeout: parseInt(settingsMap.get('session_timeout') || '480'),
        twoFactorAuth: settingsMap.get('two_factor_auth') === 'true',
        allowRemoteAccess: settingsMap.get('allow_remote_access') !== 'false',
      },
    };
  }

  /**
   * ✅ NEW: Get fallback settings when everything fails
   */
  private getFallbackSettings(): SystemSettingsGroup {
    return {
      pontaj: {
        pontajCutoffTime: '22:00',
        allowWeekendPontaj: false,
        requireDailyNotes: false,
      },
      concedii: {
        autoApproveLeave: false,
        maxLeaveDaysPerYear: 25,
      },
      notificari: {
        emailNotifications: true,
        smsNotifications: false,
      },
      securitate: {
        passwordMinLength: 8,
        requirePasswordChange: false,
        sessionTimeout: 480,
        twoFactorAuth: false,
        allowRemoteAccess: true,
      },
    };
  }

  /**
   * Update system settings with validation
   */
  async updateSettings(settings: SystemSettingsGroup): Promise<void> {
    try {
      console.log('💾 Updating system settings...');

      // Validate input
      this.validateSettings(settings);

      // Convert grouped settings to flat structure
      const flatSettings = this.flattenSettings(settings);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Update each setting
      for (const setting of flatSettings) {
        try {
          const { error } = await supabase
            .from('system_settings')
            .upsert({
              key: setting.key,
              value: setting.value,
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

          if (error) {
            console.error(`❌ Failed to update setting ${setting.key}:`, error);
            errors.push(`${setting.key}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (exception: any) {
          console.error(`❌ Exception updating setting ${setting.key}:`, exception);
          errors.push(`${setting.key}: ${exception.message}`);
          errorCount++;
        }
      }

      console.log(`📊 Update complete: ${successCount} success, ${errorCount} errors`);

      if (errorCount > 0) {
        throw new Error(`Failed to update ${errorCount} settings: ${errors.join('; ')}`);
      }

      console.log('✅ All settings updated successfully');

    } catch (error: any) {
      console.error('❌ Error updating settings:', error);
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }

  private validateSettings(settings: SystemSettingsGroup): void {
    if (settings.securitate.passwordMinLength < 6 || settings.securitate.passwordMinLength > 20) {
      throw new Error('Password minimum length must be between 6 and 20 characters');
    }

    if (settings.securitate.sessionTimeout < 30 || settings.securitate.sessionTimeout > 1440) {
      throw new Error('Session timeout must be between 30 and 1440 minutes');
    }

    if (settings.concedii.maxLeaveDaysPerYear < 1 || settings.concedii.maxLeaveDaysPerYear > 50) {
      throw new Error('Maximum leave days must be between 1 and 50');
    }

    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(settings.pontaj.pontajCutoffTime)) {
      throw new Error('Pontaj cutoff time must be in HH:MM format');
    }
  }

  private flattenSettings(settings: SystemSettingsGroup): Array<{key: string, value: string}> {
    return [
      { key: 'pontaj_cutoff_time', value: settings.pontaj.pontajCutoffTime },
      { key: 'allow_weekend_pontaj', value: settings.pontaj.allowWeekendPontaj.toString() },
      { key: 'require_daily_notes', value: settings.pontaj.requireDailyNotes.toString() },
      { key: 'auto_approve_leave', value: settings.concedii.autoApproveLeave.toString() },
      { key: 'max_leave_days_per_year', value: settings.concedii.maxLeaveDaysPerYear.toString() },
      { key: 'email_notifications', value: settings.notificari.emailNotifications.toString() },
      { key: 'sms_notifications', value: settings.notificari.smsNotifications.toString() },
      { key: 'password_min_length', value: settings.securitate.passwordMinLength.toString() },
      { key: 'require_password_change', value: settings.securitate.requirePasswordChange.toString() },
      { key: 'session_timeout', value: settings.securitate.sessionTimeout.toString() },
      { key: 'two_factor_auth', value: settings.securitate.twoFactorAuth.toString() },
      { key: 'allow_remote_access', value: settings.securitate.allowRemoteAccess.toString() },
    ];
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      console.log('🔄 Resetting settings to defaults...');

      // Delete all existing settings
      const { error: deleteError } = await supabase
        .from('system_settings')
        .delete()
        .neq('key', '__dummy__'); // Delete all

      if (deleteError) {
        console.warn('⚠️ Error deleting settings (may be empty):', deleteError);
      }

      // Reinitialize defaults
      await this.initializeDefaultSettings();

      console.log('✅ Settings reset to defaults successfully');

    } catch (error: any) {
      console.error('❌ Error resetting settings:', error);
      throw new Error(`Failed to reset settings: ${error.message}`);
    }
  }
}

// Export singleton instance
export const systemSettingsService = new SystemSettingsService();