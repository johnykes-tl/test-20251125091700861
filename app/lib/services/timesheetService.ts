import { supabase } from '../supabase';
import type { TimesheetEntry } from '../types/timesheet';

export const timesheetService = {
  /**
   * Fetches a single timesheet entry for a specific employee and date.
   */
  async getTimesheetEntry(employeeId: string, date: string): Promise<TimesheetEntry | null> {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('entry_date', date)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found, which is not an error here
      console.error(`Error fetching timesheet entry for employee ${employeeId} on ${date}:`, error);
      throw new Error('Failed to fetch timesheet entry.');
    }
    return data;
  },

  /**
   * Fetches all timesheet entries for a specific date.
   */
  async getTimesheetEntriesForDate(date: string): Promise<TimesheetEntry[]> {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('entry_date', date);

    if (error) {
      console.error(`Error fetching timesheet entries for date ${date}:`, error);
      throw new Error('Failed to fetch timesheet entries for date.');
    }
    return data || [];
  },

  /**
   * Creates or updates a timesheet entry.
   */
  async upsertTimesheetEntry(entryData: {
    employee_id: string;
    entry_date: string;
    timesheet_data: Record<string, boolean>;
    notes?: string;
  }): Promise<TimesheetEntry> {
    const { data, error } = await supabase
      .from('timesheet_entries')
      .upsert(entryData, { onConflict: 'employee_id, entry_date' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting timesheet entry:', error);
      throw new Error('Failed to save timesheet entry.');
    }
    if (!data) {
      throw new Error('Upsert operation did not return data.');
    }
    return data;
  },
};