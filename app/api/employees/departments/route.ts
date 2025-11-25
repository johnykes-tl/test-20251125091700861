import { NextRequest, NextResponse } from 'next/server';
import { employeeService } from '../../../lib/services/employeeService';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API: Loading departments');

    const departments = await employeeService.getDepartments();
    
    return NextResponse.json({ 
      success: true, 
      data: departments 
    });

  } catch (error: any) {
    console.error('❌ API: Error loading departments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load departments' },
      { status: 500 }
    );
  }
}