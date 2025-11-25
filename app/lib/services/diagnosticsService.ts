import { supabase } from '../supabase';
import { SupabaseAdminService } from '../supabase-admin';

export interface TableHealth {
  name: string;
  status: 'ok' | 'missing' | 'error';
  recordCount?: number;
  error?: string;
}

export interface ServiceHealth {
  name: string;
  status: 'ok' | 'failed';
  error?: string;
}

export interface DatabaseHealthCheck {
  connection: 'ok' | 'failed';
  overallHealth: 'healthy' | 'degraded' | 'critical';
  tables: TableHealth[];
  services: ServiceHealth[];
  recommendations: string[];
}

export const diagnosticsService = {
  /**
   * Performs a comprehensive health check of the database and services.
   */
  async performHealthCheck(): Promise<DatabaseHealthCheck> {
    const result: DatabaseHealthCheck = {
      connection: 'ok',
      overallHealth: 'healthy',
      tables: [],
      services: [],
      recommendations: [],
    };

    // 1. Check basic connection
    const { error: connectionError } = await supabase.from('employees').select('id').limit(1);
    if (connectionError && connectionError.code !== 'PGRST116') {
      result.connection = 'failed';
      result.overallHealth = 'critical';
      result.recommendations.push('Database connection failed. Check Supabase URL and network.');
      return result;
    }

    // 2. Check all expected tables
    const expectedTables = [
      'employees', 'leave_requests', 'system_settings', 
      'test_assignment_history', 'test_assignments', 'tests', 
      'timesheet_entries', 'timesheet_options', 'user_profiles'
    ];

    for (const tableName of expectedTables) {
      const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
      if (error) {
        result.tables.push({ name: tableName, status: 'missing', error: error.message });
        result.recommendations.push(`Table "${tableName}" is missing or inaccessible.`);
      } else {
        result.tables.push({ name: tableName, status: 'ok', recordCount: count || 0 });
      }
    }

    // 3. Check critical services (RPC functions)
    const expectedFunctions = ['assign_daily_tests', 'create_user_profile', 'get_department_stats'];
    for (const funcName of expectedFunctions) {
      const { error } = await supabase.rpc(funcName, {}, { head: true });
      if (error) {
        result.services.push({ name: funcName, status: 'failed', error: error.message });
        result.recommendations.push(`RPC function "${funcName}" is missing or has permission issues.`);
      } else {
        result.services.push({ name: funcName, status: 'ok' });
      }
    }

    // 4. Check admin service key permissions
    const adminTest = await SupabaseAdminService.testAdminPermissions();
    if (!adminTest.success) {
      result.services.push({ name: 'Admin Auth', status: 'failed', error: adminTest.error });
      result.recommendations.push('Supabase service role key is invalid or lacks permissions.');
    } else {
      result.services.push({ name: 'Admin Auth', status: 'ok' });
    }

    // 5. Determine overall health
    const tableErrors = result.tables.filter(t => t.status !== 'ok').length;
    const serviceErrors = result.services.filter(s => s.status !== 'ok').length;

    if (tableErrors > 0 || serviceErrors > 0) {
      result.overallHealth = tableErrors > 2 ? 'critical' : 'degraded';
    }

    return result;
  },

  /**
   * Attempts to automatically repair common database issues.
   * This is a placeholder for more complex repair logic.
   */
  async repairDatabase(): Promise<{ success: boolean; message: string; actions: string[] }> {
    // In a real application, this would run migrations or fix specific issues.
    // For now, it will just re-run the health check.
    const actions: string[] = [];
    actions.push('Attempting to re-run health check to verify status.');
    
    const healthCheck = await this.performHealthCheck();
    
    if (healthCheck.overallHealth === 'healthy') {
      return {
        success: true,
        message: 'System health verified. No issues found.',
        actions,
      };
    } else {
      return {
        success: false,
        message: 'Repair check completed. Issues still persist.',
        actions: [...actions, ...healthCheck.recommendations],
      };
    }
  },

  /**
   * Initializes sample data for demonstration purposes.
   */
  async initializeSampleData(): Promise<{ success: boolean; message: string }> {
    // This would call an RPC function to populate the database with sample data.
    // For now, it's a placeholder.
    return {
      success: true,
      message: 'Sample data initialization is not yet implemented.',
    };
  },
};