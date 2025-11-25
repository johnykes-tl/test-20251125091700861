import { supabase } from '../supabase';
import type { TimesheetEntry, TimesheetOption } from '../supabase';

export const timesheetService = {
  // Get timesheet options
  async getTimesheetOptions(): Promise<TimesheetOption[]> {
    const { data, error } = await supabase
      .from('timesheet_options')
      .select('*')
      .eq('active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  // Get all timesheet options (admin)
  async getAllTimesheetOptions(): Promise<TimesheetOption[]> {
    const { data, error } = await supabase
      .from('timesheet_options')
      .select('*')
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  // Create timesheet option
  async createTimesheetOption(option: Omit<TimesheetOption, 'id' | 'created_at' | 'updated_at'>): Promise<TimesheetOption> {
    const { data, error } = await supabase
      .from('timesheet_options')
      .insert(option)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update timesheet option
  async updateTimesheetOption(id: number, updates: Partial<TimesheetOption>): Promise<TimesheetOption> {
    const { data, error } = await supabase
      .from('timesheet_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete timesheet option
  async deleteTimesheetOption(id: number): Promise<void> {
    const { error } = await supabase
      .from('timesheet_options')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get timesheet entry for employee and date
  async getTimesheetEntry(employeeId: string, date: string): Promise<TimesheetEntry | null> {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('entry_date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  // Create or update timesheet entry
  async upsertTimesheetEntry(entry: Omit<TimesheetEntry, 'id' | 'created_at' | 'updated_at'>): Promise<TimesheetEntry> {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .upsert(entry, { 
        onConflict: 'employee_id,entry_date',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get timesheet entries for date range
  async getTimesheetEntries(startDate: string, endDate: string): Promise<TimesheetEntry[]> {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select(`
        *,
        employees:employee_id (
          name,
          department,
          is_active
        )
      `)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get timesheet entries for specific employee
  async getEmployeeTimesheetEntries(employeeId: string, startDate?: string, endDate?: string): Promise<TimesheetEntry[]> {
    let query = supabase
      .from('timesheet_entries')
      .select('*')
      .eq('employee_id', employeeId);

    if (startDate) query = query.gte('entry_date', startDate);
    if (endDate) query = query.lte('entry_date', endDate);

    const { data, error } = await query.order('entry_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get timesheet statistics
  async getTimesheetStats(date: string) {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('status, employees!inner(is_active)')
      .eq('entry_date', date)
      .eq('employees.is_active', true);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      complete: data?.filter(entry => entry.status === 'complete').length || 0,
      incomplete: data?.filter(entry => entry.status === 'incomplete').length || 0,
      absent: data?.filter(entry => entry.status === 'absent').length || 0,
    };

    return stats;
  },
};