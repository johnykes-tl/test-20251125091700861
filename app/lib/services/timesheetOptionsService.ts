import { supabase } from '../supabase';
import type { 
  TimesheetOption, 
  CreateTimesheetOptionData, 
  UpdateTimesheetOptionData 
} from '../types/timesheet';

export const timesheetOptionsService = {
  /**
   * Fetches all active timesheet options, ordered by display_order.
   */
  async getActiveTimesheetOptions(): Promise<TimesheetOption[]> {
    const { data, error } = await supabase
      .from('timesheet_options')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching active timesheet options:', error);
      throw new Error('Could not fetch active timesheet options.');
    }
    return data || [];
  },

  /**
   * Fetches all timesheet options, regardless of their active status.
   */
  async getAllTimesheetOptions(): Promise<TimesheetOption[]> {
    const { data, error } = await supabase
      .from('timesheet_options')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching all timesheet options:', error);
      throw new Error('Could not fetch all timesheet options.');
    }
    return data || [];
  },

  /**
   * Creates a new timesheet option.
   */
  async createTimesheetOption(optionData: CreateTimesheetOptionData): Promise<TimesheetOption> {
    // Get max display order to append new option at the end
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('timesheet_options')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    if (maxOrderError && maxOrderError.code !== 'PGRST116') { // Ignore 'not found' error
      throw new Error('Could not determine display order.');
    }

    const newOrder = (maxOrderData?.display_order || 0) + 1;

    const { data, error } = await supabase
      .from('timesheet_options')
      .insert([{ ...optionData, display_order: newOrder }])
      .select()
      .single();

    if (error) {
      console.error('Error creating timesheet option:', error);
      throw new Error('Could not create timesheet option.');
    }
    return data;
  },

  /**
   * Updates an existing timesheet option.
   */
  async updateTimesheetOption(id: number, optionData: UpdateTimesheetOptionData): Promise<TimesheetOption> {
    const { data, error } = await supabase
      .from('timesheet_options')
      .update(optionData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating timesheet option:', error);
      throw new Error('Could not update timesheet option.');
    }
    return data;
  },

  /**
   * Deletes a timesheet option.
   */
  async deleteTimesheetOption(id: number): Promise<void> {
    const { error } = await supabase
      .from('timesheet_options')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting timesheet option:', error);
      throw new Error('Could not delete timesheet option.');
    }
  },
};