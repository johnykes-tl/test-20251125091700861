import { NextRequest, NextResponse } from 'next/server';
import { timesheetService } from '../../lib/services/timesheetService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');
    const entry_date = searchParams.get('entry_date');
    const for_date = searchParams.get('for_date');

    console.log('🚀 API: Loading timesheet data', { employee_id, entry_date, for_date });

    if (employee_id && entry_date) {
      const entry = await timesheetService.getTimesheetEntry(employee_id, entry_date);
      return NextResponse.json({ success: true, data: entry });
    } else if (for_date) {
      const entries = await timesheetService.getTimesheetEntriesForDate(for_date);
      return NextResponse.json({ success: true, data: entries });
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('❌ API: Error loading timesheet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load timesheet data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const entryData = await request.json();
    console.log('🚀 API: Creating/updating timesheet entry', { 
      employee_id: entryData.employee_id, 
      entry_date: entryData.entry_date 
    });

    const result = await timesheetService.upsertTimesheetEntry(entryData);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Timesheet entry saved successfully' 
    });

  } catch (error: any) {
    console.error('❌ API: Error saving timesheet entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save timesheet entry' },
      { status: 500 }
    );
  }
}