import { NextRequest, NextResponse } from 'next/server';
import { timesheetService } from '../../../../lib/services/timesheetService';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API Route: Admin timesheet checkbox update received');
    
    const { employee_id, entry_date, option_key, value, timesheet_data } = await request.json();

    if (!employee_id || !entry_date || !option_key || value === undefined) {
      console.error('❌ Missing required parameters:', { employee_id, entry_date, option_key, value });
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('💾 API Admin Timesheet Checkbox Update:', { 
      employee_id, 
      entry_date, 
      option_key, 
      value 
    });

    // Validate timesheet_data structure
    if (!timesheet_data || typeof timesheet_data !== 'object') {
      console.error('❌ Invalid timesheet_data structure:', timesheet_data);
      return NextResponse.json(
        { success: false, error: 'Invalid timesheet_data structure' },
        { status: 400 }
      );
    }

    // Calculate new status based on updated timesheet data
    const updatedData = { ...timesheet_data, [option_key]: value };
    const checkedCount = Object.values(updatedData).filter(Boolean).length;
    
    let newStatus: 'complete' | 'incomplete' | 'absent';
    if (checkedCount === 0) {
      newStatus = 'absent';
    } else if (checkedCount >= 2) {
      newStatus = 'complete';
    } else {
      newStatus = 'incomplete';
    }

    console.log('📊 Calculated status:', { checkedCount, newStatus });

    // Save to database
    const entryData = {
      employee_id,
      entry_date,
      timesheet_data: updatedData,
      notes: null // Admin checkbox updates don't modify notes
    };

    console.log('💾 Saving entry data to database...');
    const savedEntry = await timesheetService.upsertTimesheetEntry(entryData);
    console.log('✅ Entry saved successfully:', savedEntry.id);

    return NextResponse.json({
      success: true,
      data: {
        entry: {
          id: savedEntry.id,
          status: savedEntry.status,
          timesheet_data: savedEntry.timesheet_data,
          submitted_at: savedEntry.submitted_at
        }
      },
      message: 'Timesheet checkbox updated successfully'
    });

  } catch (error: any) {
    console.error('❌ API Admin Timesheet Update Error:', error);
    
    // Enhanced error logging
    console.error('❌ Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update timesheet checkbox' },
      { status: 500 }
    );
  }
}