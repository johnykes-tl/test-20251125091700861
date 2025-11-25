import { NextRequest, NextResponse } from 'next/server';
import { leaveRequestService } from '../../../lib/services/leaveRequestService';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API: Loading pending leave requests count');

    const count = await leaveRequestService.getPendingLeaveRequestsCount();
    
    return NextResponse.json({ 
      success: true, 
      data: { count } 
    });

  } catch (error: any) {
    console.error('❌ API: Error loading pending count:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load pending count' },
      { status: 500 }
    );
  }
}