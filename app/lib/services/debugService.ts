import { supabase } from '../supabase';

export interface DebugInfo {
  timestamp: string;
  step: string;
  success: boolean;
  data?: any;
  error?: any;
  details?: any;
}

export interface SystemDiagnostic {
  connectionTest: DebugInfo;
  tablesCheck: DebugInfo;
  environmentCheck: DebugInfo;
  permissionsCheck: DebugInfo;
  dataCheck: DebugInfo;
  serverEnvironmentCheck?: DebugInfo; // Optional server-side check
  overall: {
    success: boolean;
    issues: string[];
    recommendations: string[];
  };
}

class DebugService {
  private logs: DebugInfo[] = [];

  private log(step: string, success: boolean, data?: any, error?: any, details?: any): DebugInfo {
    const logEntry: DebugInfo = {
      timestamp: new Date().toISOString(),
      step,
      success,
      data,
      error: error ? {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      } : undefined,
      details
    };

    this.logs.push(logEntry);
    console.log(`🔍 [DEBUG] ${step}:`, success ? '✅ SUCCESS' : '❌ FAILED', { data, error, details });
    return logEntry;
  }

  async performSystemDiagnostic(): Promise<SystemDiagnostic> {
    console.log('🚀 Starting comprehensive system diagnostic...');
    this.logs = []; // Reset logs

    const diagnostic: SystemDiagnostic = {
      connectionTest: await this.testConnection(),
      tablesCheck: await this.checkTables(),
      environmentCheck: this.checkClientEnvironment(), // ✅ Fixed: Only check client env
      permissionsCheck: await this.checkPermissions(),
      dataCheck: await this.checkDefaultData(),
      overall: {
        success: false,
        issues: [],
        recommendations: []
      }
    };

    // Try to get server environment check via API
    try {
      const serverEnvCheck = await this.checkServerEnvironment();
      diagnostic.serverEnvironmentCheck = serverEnvCheck;
    } catch (error) {
      console.log('⚠️ Server environment check not available:', error);
    }

    // Analyze overall health
    const allTests = [
      diagnostic.connectionTest,
      diagnostic.tablesCheck,
      diagnostic.environmentCheck,
      diagnostic.permissionsCheck,
      diagnostic.dataCheck
    ];

    const successfulTests = allTests.filter(test => test.success);
    diagnostic.overall.success = successfulTests.length === allTests.length;

    // Collect issues and recommendations
    if (!diagnostic.connectionTest.success) {
      diagnostic.overall.issues.push('Database connection failed');
      diagnostic.overall.recommendations.push('Check Supabase URL and credentials');
    }

    if (!diagnostic.tablesCheck.success) {
      diagnostic.overall.issues.push('Required tables missing or inaccessible');
      diagnostic.overall.recommendations.push('Run database migrations');
    }

    if (!diagnostic.environmentCheck.success) {
      diagnostic.overall.issues.push('Client environment variables missing');
      diagnostic.overall.recommendations.push('Check client-side environment variables');
    }

    // Add server environment issues if check was performed
    if (diagnostic.serverEnvironmentCheck && !diagnostic.serverEnvironmentCheck.success) {
      diagnostic.overall.issues.push('Server environment variables missing');
      diagnostic.overall.recommendations.push('Check .env.local file configuration');
    }

    if (!diagnostic.permissionsCheck.success) {
      diagnostic.overall.issues.push('Database permissions insufficient');
      diagnostic.overall.recommendations.push('Check RLS policies and user permissions');
    }

    if (!diagnostic.dataCheck.success) {
      diagnostic.overall.issues.push('Default data missing');
      diagnostic.overall.recommendations.push('Initialize default settings and options');
    }

    // Override success if connection and basic functionality work
    if (diagnostic.connectionTest.success && diagnostic.tablesCheck.success) {
      diagnostic.overall.success = true;
    }

    console.log('📊 System diagnostic completed:', diagnostic.overall);
    return diagnostic;
  }

  private async testConnection(): Promise<DebugInfo> {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      const { data, error, status, statusText } = await supabase
        .from('system_settings')
        .select('key')
        .limit(1);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (error) {
        return this.log('Connection Test', false, null, error, {
          responseTime,
          status,
          statusText,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        });
      }

      return this.log('Connection Test', true, { recordCount: data?.length || 0 }, null, {
        responseTime,
        status: 200,
        statusText: 'OK'
      });

    } catch (error: any) {
      return this.log('Connection Test', false, null, error, {
        errorType: 'Exception',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      });
    }
  }

  private async checkTables(): Promise<DebugInfo> {
    try {
      const requiredTables = ['system_settings', 'timesheet_options', 'employees', 'user_profiles'];
      const tableResults: Record<string, any> = {};

      for (const table of requiredTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          tableResults[table] = {
            exists: !error,
            accessible: !error,
            hasData: data && data.length > 0,
            error: error ? error.message : null
          };

        } catch (tableError: any) {
          tableResults[table] = {
            exists: false,
            accessible: false,
            hasData: false,
            error: tableError.message
          };
        }
      }

      const allTablesAccessible = Object.values(tableResults).every((result: any) => result.accessible);

      return this.log('Tables Check', allTablesAccessible, tableResults, null, {
        requiredTables,
        accessibleCount: Object.values(tableResults).filter((r: any) => r.accessible).length
      });

    } catch (error: any) {
      return this.log('Tables Check', false, null, error);
    }
  }

  /**
   * ✅ FIXED: Check only client-side environment variables
   */
  private checkClientEnvironment(): DebugInfo {
    const clientEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };

    const missingVars = Object.entries(clientEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    const maskedVars = Object.fromEntries(
      Object.entries(clientEnvVars).map(([key, value]) => [
        key,
        value ? `${value.substring(0, 20)}...` : 'MISSING'
      ])
    );

    const success = missingVars.length === 0;

    return this.log('Client Environment Check', success, maskedVars, null, {
      missingVars,
      totalVars: Object.keys(clientEnvVars).length,
      presentVars: Object.keys(clientEnvVars).length - missingVars.length,
      note: 'Client-side environment variables only (NEXT_PUBLIC_* prefixed)'
    });
  }

  /**
   * ✅ NEW: Check server environment via API
   */
  private async checkServerEnvironment(): Promise<DebugInfo> {
    try {
      const response = await fetch('/api/system-diagnostic', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API response: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        return this.log('Server Environment Check', true, result.environment, null, {
          serverEnvironmentOk: true,
          allVariablesPresent: result.environment?.allPresent || false
        });
      } else {
        return this.log('Server Environment Check', false, result.environment, { message: result.error }, {
          serverEnvironmentOk: false,
          missingServerVars: result.environment?.missingVars || []
        });
      }

    } catch (error: any) {
      return this.log('Server Environment Check', false, null, error, {
        serverEnvironmentOk: false,
        apiError: error.message
      });
    }
  }

  private async checkPermissions(): Promise<DebugInfo> {
    try {
      const permissions: Record<string, any> = {};

      // Test select permissions
      try {
        const { data: selectTest, error: selectError } = await supabase
          .from('system_settings')
          .select('key, value')
          .limit(1);

        permissions.select = {
          allowed: !selectError,
          error: selectError?.message || null
        };
      } catch (error: any) {
        permissions.select = {
          allowed: false,
          error: error.message
        };
      }

      // Test insert permissions with safe test data
      try {
        const testKey = `test_permission_${Date.now()}`;
        const { data: insertTest, error: insertError } = await supabase
          .from('system_settings')
          .insert({
            key: testKey,
            value: 'test_value',
            setting_type: 'string',
            description: 'Test permission insert'
          })
          .select();

        if (!insertError && insertTest) {
          // Clean up test data
          await supabase
            .from('system_settings')
            .delete()
            .eq('key', testKey);
        }

        permissions.insert = {
          allowed: !insertError,
          error: insertError?.message || null
        };
      } catch (error: any) {
        permissions.insert = {
          allowed: false,
          error: error.message
        };
      }

      // Test update permissions (safe operation)
      try {
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({ updated_at: new Date().toISOString() })
          .eq('key', 'non_existent_key_safe_test');

        permissions.update = {
          allowed: !updateError,
          error: updateError?.message || null
        };
      } catch (error: any) {
        permissions.update = {
          allowed: false,
          error: error.message
        };
      }

      const allPermissionsWorking = Object.values(permissions).every((p: any) => p.allowed);

      return this.log('Permissions Check', allPermissionsWorking, permissions, null, {
        testedOperations: Object.keys(permissions),
        recommendedAction: allPermissionsWorking ? 'All permissions working' : 'Check RLS policies'
      });

    } catch (error: any) {
      return this.log('Permissions Check', false, null, error);
    }
  }

  private async checkDefaultData(): Promise<DebugInfo> {
    try {
      const dataCheck: Record<string, any> = {};

      // Check system_settings data
      try {
        const { data: settings, error: settingsError } = await supabase
          .from('system_settings')
          .select('key, value');

        dataCheck.system_settings = {
          exists: !settingsError,
          count: settings?.length || 0,
          hasRequiredKeys: settings ? this.hasRequiredSystemSettings(settings) : false,
          error: settingsError?.message || null
        };
      } catch (error: any) {
        dataCheck.system_settings = {
          exists: false,
          count: 0,
          hasRequiredKeys: false,
          error: error.message
        };
      }

      // Check timesheet_options data
      try {
        const { data: options, error: optionsError } = await supabase
          .from('timesheet_options')
          .select('id, key, title, active');

        dataCheck.timesheet_options = {
          exists: !optionsError,
          count: options?.length || 0,
          hasActiveOptions: options ? options.some(opt => opt.active) : false,
          error: optionsError?.message || null
        };
      } catch (error: any) {
        dataCheck.timesheet_options = {
          exists: false,
          count: 0,
          hasActiveOptions: false,
          error: error.message
        };
      }

      const hasAllRequiredData = dataCheck.system_settings.exists && 
                                 dataCheck.timesheet_options.exists;

      return this.log('Default Data Check', hasAllRequiredData, dataCheck, null, {
        tablesChecked: Object.keys(dataCheck),
        systemSettingsCount: dataCheck.system_settings.count,
        timesheetOptionsCount: dataCheck.timesheet_options.count
      });

    } catch (error: any) {
      return this.log('Default Data Check', false, null, error);
    }
  }

  private hasRequiredSystemSettings(settings: any[]): boolean {
    const requiredKeys = [
      'pontaj_cutoff_time',
      'allow_weekend_pontaj',
      'require_daily_notes',
      'auto_approve_leave',
      'max_leave_days_per_year',
      'email_notifications'
    ];

    const existingKeys = settings.map(s => s.key);
    return requiredKeys.every(key => existingKeys.includes(key));
  }

  getLogs(): DebugInfo[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const debugService = new DebugService();