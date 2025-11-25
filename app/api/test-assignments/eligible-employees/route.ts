import { NextRequest, NextResponse } from 'next/server';
import { testAssignmentsService } from '../../../lib/services/testAssignmentsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    console.log('🚀 API: Loading eligible employees for date:', date);

    const eligibleEmployees = await testAssignmentsService.getEligibleEmployees();
    
    return NextResponse.json({ 
      success: true, 
      data: eligibleEmployees 
    });

  } catch (error: any) {
    console.error('❌ API: Error loading eligible employees:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load eligible employees' },
      { status: 500 }
    );
  }
}