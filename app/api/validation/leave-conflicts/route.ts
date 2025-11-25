import { NextRequest, NextResponse } from 'next/server';
import { leaveRequestValidator } from '../../../lib/validation/leaveRequestValidator';

export async function POST(request: NextRequest) {
  try {
    const { employee_id, start_date, end_date, exclude_request_id } = await request.json();

    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'Employee ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    console.log('🔍 API: Checking leave conflicts', { 
      employee_id, 
      start_date, 
      end_date 
    });

    // Check for overlapping requests
    const overlapCheck = await leaveRequestValidator.checkOverlappingRequests(
      employee_id,
      start_date,
      end_date,
      exclude_request_id
    );

    // Check frequency
    const frequencyCheck = await leaveRequestValidator.checkLeaveFrequency(
      employee_id,
      start_date
    );

    // Get leave balance
    const balance = await leaveRequestValidator.getEmployeeLeaveBalance(employee_id);
    const workDays = leaveRequestValidator.calculateWorkDays(start_date, end_date);

    const hasConflicts = overlapCheck.hasOverlaps;
    const hasWarnings = overlapCheck.consecutive.length > 0 || frequencyCheck.isFrequent;
    const insufficientBalance = balance ? workDays > balance.remaining_days : false;

    return NextResponse.json({
      success: true,
      data: {
        hasConflicts,
        hasWarnings,
        insufficientBalance,
        workDays,
        balance,
        conflicts: {
          overlapping: overlapCheck.overlapping,
          consecutive: overlapCheck.consecutive,
          frequency: frequencyCheck
        }
      }
    });

  } catch (error: any) {
    console.error('❌ API: Error checking leave conflicts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check leave conflicts' },
      { status: 500 }
    );
  }
}