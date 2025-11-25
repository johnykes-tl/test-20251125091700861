import { NextRequest, NextResponse } from 'next/server';
import { timesheetService } from '../../../lib/services/timesheetService';
import { timesheetOptionsService } from '../../../lib/services/timesheetOptionsService';
import { employeeService } from '../../../lib/services/employeeService';
import { statisticsService } from '../../../lib/services/statisticsService';
import { recentActivityService } from '../../../lib/services/recentActivityService';
import { employeeTestsService } from '../../../lib/services/employeeTestsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const entry_date = searchParams.get('entry_date');
    const action = searchParams.get('action') || 'full_data';

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API Employee Timesheet:', { user_id, entry_date, action });

    // Get employee data first
    const employee = await employeeService.getEmployeeByUserId(user_id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee profile not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'full_data':
        // Load all initial data for timesheet page
        const [
          timesheetOptions,
          recentActivities,
          todaysTests,
          monthlyStats,
          recentEntries
        ] = await Promise.all([
          timesheetOptionsService.getActiveTimesheetOptions(),
          recentActivityService.getRecentActivities(),
          employeeTestsService.getTodaysAssignments(employee.id),
          statisticsService.getEmployeeMonthlyStats(user_id),
          statisticsService.getEmployeeRecentEntries(user_id, 4)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            employee,
            timesheetOptions,
            recentActivities,
            todaysTests,
            monthlyStats,
            recentEntries
          }
        });

      case 'entry_data':
        if (!entry_date) {
          return NextResponse.json(
            { success: false, error: 'Entry date is required for entry_data action' },
            { status: 400 }
          );
        }
        
        const entry = await timesheetService.getTimesheetEntry(employee.id, entry_date);
        return NextResponse.json({
          success: true,
          data: { entry }
        });

      case 'stats_refresh':
        // Refresh stats after save
        const [updatedStats, updatedEntries] = await Promise.all([
          statisticsService.getEmployeeMonthlyStats(user_id),
          statisticsService.getEmployeeRecentEntries(user_id, 4)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            monthlyStats: updatedStats,
            recentEntries: updatedEntries
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('❌ API Employee Timesheet Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load timesheet data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, entry_data } = await request.json();

    if (!user_id || !entry_data) {
      return NextResponse.json(
        { success: false, error: 'User ID and entry data are required' },
        { status: 400 }
      );
    }

    console.log('💾 API Employee Timesheet Save:', { 
      user_id, 
      entry_date: entry_data.entry_date 
    });

    // Get employee
    const employee = await employeeService.getEmployeeByUserId(user_id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee profile not found' },
        { status: 404 }
      );
    }

    // Validate required notes
    if (!entry_data.notes || !entry_data.notes.trim()) {
      return NextResponse.json(
        { success: false, error: 'Taskurile sunt obligatorii. Te rog completează ce ai realizat astăzi.' },
        { status: 400 }
      );
    }

    // Prepare entry data
    const entryDataToSave = {
      employee_id: employee.id,
      entry_date: entry_data.entry_date,
      timesheet_data: entry_data.timesheet_data,
      notes: entry_data.notes.trim()
    };

    // Save timesheet entry
    const savedEntry = await timesheetService.upsertTimesheetEntry(entryDataToSave);

    // Refresh stats if saving for current date
    let refreshedStats = null;
    const currentDate = new Date().toISOString().split('T')[0];
    if (entry_data.entry_date === currentDate) {
      const [updatedStats, updatedEntries] = await Promise.all([
        statisticsService.getEmployeeMonthlyStats(user_id),
        statisticsService.getEmployeeRecentEntries(user_id, 4)
      ]);

      refreshedStats = {
        monthlyStats: updatedStats,
        recentEntries: updatedEntries
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        savedEntry,
        refreshedStats
      },
      message: 'Timesheet entry saved successfully'
    });

  } catch (error: any) {
    console.error('❌ API Employee Timesheet Save Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save timesheet entry' },
      { status: 500 }
    );
  }
}