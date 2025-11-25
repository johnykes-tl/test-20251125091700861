import { NextRequest, NextResponse } from 'next/server';
import { employeeService } from '../../../lib/services/employeeService';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API: Loading department stats');

    const stats = await employeeService.getDepartmentStats();
    
    return NextResponse.json({ 
      success: true, 
      data: stats 
    });

  } catch (error: any) {
    console.error('❌ API: Error loading department stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load department stats' },
      { status: 500 }
    );
  }
}