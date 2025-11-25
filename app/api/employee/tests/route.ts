import { NextRequest, NextResponse } from 'next/server';
import { employeeTestsService } from '../../../lib/services/employeeTestsService';
import { employeeService } from '../../../lib/services/employeeService';
import { testAssignmentsService } from '../../../lib/services/testAssignmentsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');
    const user_id = searchParams.get('user_id');

    let employeeId = employee_id;

    // If user_id provided, get employee_id first
    if (user_id && !employee_id) {
      const employee = await employeeService.getEmployeeByUserId(user_id);
      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Employee profile not found' },
          { status: 404 }
        );
      }
      employeeId = employee.id;
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID or User ID is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Loading employee tests data for:', employeeId);

    // Load all employee test data in parallel
    const [assignments, todaysAssignments, stats] = await Promise.all([
      employeeTestsService.getEmployeeTestAssignments(employeeId),
      employeeTestsService.getTodaysAssignments(employeeId),
      employeeTestsService.getEmployeeTestStats(employeeId)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        assignments,
        todaysAssignments, 
        stats
      }
    });

  } catch (error: any) {
    console.error('❌ API: Error loading employee tests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load employee tests data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignment_id');
    
    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const { status, notes } = await request.json();
    
    console.log('🚀 API: Updating employee test assignment:', { assignmentId, status });

    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const result = await testAssignmentsService.updateAssignment(assignmentId, updateData);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Test marked as ${status} successfully` 
    });

  } catch (error: any) {
    console.error('❌ API: Error updating test assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update test assignment' },
      { status: 500 }
    );
  }
}