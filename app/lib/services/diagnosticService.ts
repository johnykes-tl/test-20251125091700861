import { supabase } from '../supabase';

export interface DiagnosticResult {
  service: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class DiagnosticService {
  /**
   * Run comprehensive system diagnostics
   */
  static async runDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      console.log('🔍 Running system diagnostics...');

      // Test 1: Database Connection
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('count')
          .limit(1);

        if (error) {
          results.push({
            service: 'Database Connection',
            status: 'error',
            message: 'Database connection failed',
            details: error
          });
        } else {
          results.push({
            service: 'Database Connection',
            status: 'ok',
            message: 'Database connection successful'
          });
        }
      } catch (error) {
        results.push({
          service: 'Database Connection',
          status: 'error',
          message: 'Database connection exception',
          details: error
        });
      }

      // Test 2: Essential Tables
      const tables = [
        'employees',
        'timesheet_entries', 
        'leave_requests',
        'timesheet_options',
        'user_profiles'
      ];

      for (const table of tables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            results.push({
              service: `Table: ${table}`,
              status: 'error',
              message: `Table ${table} query failed`,
              details: error
            });
          } else {
            results.push({
              service: `Table: ${table}`,
              status: 'ok',
              message: `Table ${table} accessible (${count || 0} records)`
            });
          }
        } catch (error) {
          results.push({
            service: `Table: ${table}`,
            status: 'error',
            message: `Table ${table} exception`,
            details: error
          });
        }
      }

      // Test 3: Data Dependencies
      try {
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('id, name, is_active')
          .eq('is_active', true);

        if (empError) {
          results.push({
            service: 'Active Employees',
            status: 'error',
            message: 'Failed to load active employees',
            details: empError
          });
        } else {
          const activeCount = employees?.length || 0;
          results.push({
            service: 'Active Employees',
            status: activeCount > 0 ? 'ok' : 'warning',
            message: activeCount > 0 
              ? `${activeCount} active employees found`
              : 'No active employees found - dashboard will show empty data'
          });
        }
      } catch (error) {
        results.push({
          service: 'Active Employees',
          status: 'error',
          message: 'Exception loading employees',
          details: error
        });
      }

      // Test 4: Timesheet Options
      try {
        const { data: options, error: optError } = await supabase
          .from('timesheet_options')
          .select('*')
          .eq('active', true);

        if (optError) {
          results.push({
            service: 'Timesheet Options',
            status: 'error',
            message: 'Failed to load timesheet options',
            details: optError
          });
        } else {
          const optionsCount = options?.length || 0;
          results.push({
            service: 'Timesheet Options',
            status: optionsCount > 0 ? 'ok' : 'warning',
            message: optionsCount > 0 
              ? `${optionsCount} timesheet options configured`
              : 'No timesheet options configured - employees cannot submit timesheets'
          });
        }
      } catch (error) {
        results.push({
          service: 'Timesheet Options',
          status: 'error',
          message: 'Exception loading timesheet options',
          details: error
        });
      }

      return results;

    } catch (error: any) {
      console.error('❌ Diagnostics failed:', error);
      return [{
        service: 'Diagnostic System',
        status: 'error',
        message: 'Diagnostic system failed to run',
        details: error
      }];
    }
  }

  /**
   * Initialize default data if missing
   */
  static async initializeDefaultData(): Promise<void> {
    try {
      console.log('🔧 Initializing default data...');

      // Check if timesheet options exist
      const { data: existingOptions, error: checkError } = await supabase
        .from('timesheet_options')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('❌ Error checking timesheet options:', checkError);
        return;
      }

      // If no options exist, create defaults
      if (!existingOptions || existingOptions.length === 0) {
        console.log('📝 Creating default timesheet options...');
        
        const defaultOptions = [
          {
            title: 'Prezență',
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

        const { error: insertError } = await supabase
          .from('timesheet_options')
          .insert(defaultOptions);

        if (insertError) {
          console.error('❌ Error creating default timesheet options:', insertError);
        } else {
          console.log('✅ Default timesheet options created');
        }
      }

    } catch (error: any) {
      console.error('❌ Error initializing default data:', error);
    }
  }
}

export const diagnosticService = DiagnosticService;