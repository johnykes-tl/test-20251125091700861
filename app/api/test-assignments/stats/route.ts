import { NextRequest, NextResponse } from 'next/server';
import { testAssignmentsService } from '../../../lib/services/testAssignmentsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    console.log('🚀 API: Loading assignment stats for date:', date);

    // Get assignments for the date and calculate stats manually
    const assignmentsData = await testAssignmentsService.getAssignmentsByDate(date);
    
    // Calculate stats from the assignments data
    const stats = {
      totalTests: assignmentsData.totalTests || 0,
      totalAssignments: assignmentsData.totalAssignments || 0,
      pendingAssignments: assignmentsData.assignments.filter((a: any) => a.status === 'pending').length,
      completedAssignments: assignmentsData.assignments.filter((a: any) => a.status === 'completed').length,
      skippedAssignments: assignmentsData.assignments.filter((a: any) => a.status === 'skipped').length,
      assignmentDate: date,
      isToday: assignmentsData.isToday || false
    };
    
    return NextResponse.json({ 
      success: true, 
      data: stats 
    });

  } catch (error: any) {
    console.error('❌ API: Error loading assignment stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load assignment stats' },
      { status: 500 }
    );
  }
}