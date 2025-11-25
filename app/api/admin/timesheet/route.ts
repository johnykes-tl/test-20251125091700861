import { NextRequest, NextResponse } from 'next/server';
import { employeeService } from '../../../lib/services/employeeService';
import { timesheetService } from '../../../lib/services/timesheetService';
import { timesheetOptionsService } from '../../../lib/services/timesheetOptionsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const action = searchParams.get('action') || 'full_data';

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API Admin Timesheet:', { date, action });

    switch (action) {
      case 'full_data':
        // Load all data needed for admin timesheet page
        const [employees, timesheetOptions, existingEntries] = await Promise.all([
          employeeService.getEmployees(),
          timesheetOptionsService.getActiveTimesheetOptions(),
          timesheetService.getTimesheetEntriesForDate(date)
        ]);

        // Create map of existing entries by employee ID
        const entriesMap = new Map(
          existingEntries.map(entry => [entry.employee_id, entry])
        );

        // Create timesheet entries for all employees
        const timesheetEntries = employees.map(employee => {
          const existingEntry = entriesMap.get(employee.id);
          
          if (existingEntry) {
            return {
              id: existingEntry.employee_id + '_' + date,
              employeeId: employee.id,
              employeeName: employee.name,
              department: employee.department,
              timesheetData: existingEntry.timesheet_data,
              submittedAt: existingEntry.submitted_at,
              status: existingEntry.status,
              isActive: employee.is_active,
              notes: existingEntry.notes
            };
          } else {
            const defaultTimesheetData: Record<string, boolean> = {};
            timesheetOptions.forEach(option => {
              defaultTimesheetData[option.key] = false;
            });

            return {
              id: employee.id + '_' + date,
              employeeId: employee.id,
              employeeName: employee.name,
              department: employee.department,
              timesheetData: defaultTimesheetData,
              submittedAt: null,
              status: 'absent' as const,
              isActive: employee.is_active,
              notes: undefined
            };
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            employees,
            timesheetEntries,
            timesheetOptions,
            stats: calculateStats(timesheetEntries, 'active')
          }
        });

      case 'stats':
        const tabFilter = searchParams.get('tab') || 'active';
        const statsEntries = await timesheetService.getTimesheetEntriesForDate(date);
        const allEmployees = await employeeService.getEmployees();
        
        const statsEntriesData = allEmployees.map(employee => {
          const entry = statsEntries.find(e => e.employee_id === employee.id);
          return {
            employeeId: employee.id,
            status: entry?.status || 'absent',
            isActive: employee.is_active
          };
        });

        const stats = calculateStats(statsEntriesData, tabFilter as 'active' | 'inactive');
        
        return NextResponse.json({
          success: true,
          data: stats
        });

      case 'daily_tasks':
        const taskTabFilter = searchParams.get('tab') || 'active';
        const taskEntries = await timesheetService.getTimesheetEntriesForDate(date);
        const taskEmployees = await employeeService.getEmployees();
        
        const tasksData = taskEmployees
          .filter(emp => taskTabFilter === 'active' ? emp.is_active : !emp.is_active)
          .map(employee => {
            const entry = taskEntries.find(e => e.employee_id === employee.id);
            return {
              id: employee.id + '_' + date,
              employeeId: employee.id,
              employeeName: employee.name,
              department: employee.department,
              timesheetData: entry?.timesheet_data || {},
              submittedAt: entry?.submitted_at,
              status: entry?.status || 'absent',
              isActive: employee.is_active,
              notes: entry?.notes
            };
          })
          .filter(entry => entry.notes && entry.notes.trim());

        return NextResponse.json({
          success: true,
          data: tasksData
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('❌ API Admin Timesheet Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load admin timesheet data' },
      { status: 500 }
    );
  }
}

// Helper function to calculate stats
// Helper function to calculate stats
function calculateStats(entries: any[], tabFilter: 'active' | 'inactive') {
  const filteredEntries = entries.filter(entry => 
    tabFilter === 'active' ? entry.isActive : !entry.isActive
  );

  return {
    total: filteredEntries.length,
    complete: filteredEntries.filter(e => e.status === 'complete').length,
    incomplete: filteredEntries.filter(e => e.status === 'incomplete').length,
    absent: filteredEntries.filter(e => e.status === 'absent').length
  };
}