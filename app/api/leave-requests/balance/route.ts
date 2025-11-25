import { NextRequest, NextResponse } from 'next/server';
import { leaveRequestService } from '../../../lib/services/leaveRequestService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');
    const year = searchParams.get('year');

    if (!employee_id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Loading leave balance', { employee_id, year });

    const balance = await leaveRequestService.getEmployeeLeaveBalance(
      employee_id, 
      year ? parseInt(year) : undefined
    );
    
    return NextResponse.json({ 
      success: true, 
      data: balance 
    });

  } catch (error: any) {
    console.error('❌ API: Error loading leave balance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load leave balance' },
      { status: 500 }
    );
  }
}