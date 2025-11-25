import { api } from './apiClient';
import type { TimesheetEntry, CreateTimesheetEntryData } from '../../lib/types/timesheet';

class BackendTimesheetService {
  // Get timesheet entry for specific employee and date
  async getTimesheetEntry(employeeId: string, entryDate: string): Promise<TimesheetEntry | null> {
    try {
      const response = await api.get<TimesheetEntry>('/api/timesheet', {
        employee_id: employeeId,
        entry_date: entryDate
      });
      return response.data || null;
    } catch (error) {
      // Return null if entry doesn't exist (404 is expected)
      return null;
    }
  }

  // Get all timesheet entries for a specific date
  async getTimesheetEntriesForDate(date: string): Promise<TimesheetEntry[]> {
    const response = await api.get<TimesheetEntry[]>('/api/timesheet', {
      for_date: date
    });
    return response.data || [];
  }

  // Create or update timesheet entry
  async upsertTimesheetEntry(entryData: CreateTimesheetEntryData): Promise<TimesheetEntry> {
    const response = await api.post<TimesheetEntry>('/api/timesheet', entryData);
    return response.data!;
  }

  // Get timesheet entries for an employee within a date range
  async getEmployeeTimesheetEntries(
    employeeId: string, 
    startDate: string, 
    endDate: string
  ): Promise<TimesheetEntry[]> {
    try {
      // Since we don't have a specific endpoint for date ranges, 
      // we'll need to make multiple calls or create a new API endpoint
      const entries: TimesheetEntry[] = [];
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const entry = await this.getTimesheetEntry(employeeId, dateStr);
        if (entry) {
          entries.push(entry);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return entries;
    } catch (error: any) {
      console.error('Error loading employee timesheet entries:', error);
      return [];
    }
  }
}

export const backendTimesheetService = new BackendTimesheetService();