import { employeeService } from './employeeService';
import { timesheetService } from './timesheetService';
import { leaveRequestService } from './leaveRequestService';

import { supabase } from '../supabase-browser';

export interface RecentActivity {
  id: string;
  employeeName: string;
  department: string;
  action: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export const recentActivityService = {
  getRecentActivities: async (limit: number = 10): Promise<RecentActivity[]> => {
    try {
      console.log('📊 Loading recent activities for dashboard...');
      
      // Get all employees for activity context
      const employees = await employeeService.getEmployees();
      const employeesMap = new Map(employees.map(emp => [emp.id, emp]));
      
      // Get recent timesheet entries (last 7 days)
      const activities: RecentActivity[] = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const entries = await timesheetService.getTimesheetEntriesForDate(dateStr);
          
          entries.forEach(entry => {
            const employee = employeesMap.get(entry.employee_id);
            if (employee && activities.length < limit) {
              activities.push({
                id: `${entry.employee_id}_${dateStr}`,
                employeeName: employee.name,
                department: employee.department,
                action: getActionFromStatus(entry.status),
                description: getDescriptionFromEntry(entry),
                timestamp: entry.submitted_at || entry.created_at || dateStr,
                status: getActivityStatus(entry.status)
              });
            }
          });
        } catch (error) {
          console.warn(`Could not load activities for ${dateStr}`);
        }
      }
      
      // Sort by timestamp (most recent first) and limit
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      
      console.log('✅ Recent activities loaded:', sortedActivities.length);
      return sortedActivities;
      
    } catch (error: any) {
      console.error('❌ Error loading recent activities:', error);
      return [];
    }
  },
  async getEmployeeRecentActivities(employeeId: string, limit: number = 5): Promise<RecentActivity[]> {
    // Mock implementation
    console.log(`Fetching recent activities for employee ${employeeId}`);
    return [
      {
        id: '1',
        employeeName: 'Mock User',
        department: 'IT',
        action: 'Pontaj salvat',
        description: 'Pontajul pentru azi a fost salvat cu status Complet.',
        timestamp: new Date().toISOString(),
        status: 'success',
      },
    ];
  },
  async getRecentActivityFeed(limit: number = 8): Promise<RecentActivity[]> {
    // Mock implementation
    console.log(`Fetching recent activity feed`);
    return [];
  }
};

function getActionFromStatus(status: string): string {
  switch (status) {
    case 'approved':
      return 'Pontaj aprobat';
    case 'pending':
      return 'Pontaj în așteptare';
    case 'rejected':
      return 'Pontaj respins';
    case 'submitted':
      return 'Pontaj trimis';
    default:
      return 'Pontaj actualizat';
  }
}

function getDescriptionFromEntry(entry: any): string {
  return `${entry.status}`;
}

function getActivityStatus(status: string): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'info';
    case 'rejected':
      return 'error';
    case 'submitted':
      return 'info';
    default:
      return 'warning';
  }
}