import { NextRequest, NextResponse } from 'next/server';
import { testAssignmentsService } from '../../lib/services/testAssignmentsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const employee_id = searchParams.get('employee_id');

    console.log('🚀 API: Loading test assignments', { date, employee_id });

    if (date) {
      const data = await testAssignmentsService.getAssignmentsByDate(date);
      return NextResponse.json({ success: true, data });
    } else if (employee_id) {
      // Get assignments for specific employee using available service method
      const data = await testAssignmentsService.getAssignmentsByDate(new Date().toISOString().split('T')[0]);
      // Filter by employee_id on the client side
      const filteredData = {
        ...data,
        assignments: data.assignments.filter((assignment: any) => assignment.employee_id === employee_id)
      };
      return NextResponse.json({ success: true, data: filteredData });
    } else {
      return NextResponse.json(
        { success: false, error: 'Date or employee_id parameter is required' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('❌ API: Error loading test assignments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load test assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const assignmentData = await request.json();
    console.log('🚀 API: Creating test assignment', assignmentData);

    const result = await testAssignmentsService.createAssignment(assignmentData);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Test assignment created successfully' 
    });

  } catch (error: any) {
    console.error('❌ API: Error creating test assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create test assignment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    console.log('🚀 API: Updating test assignment', { assignmentId });

    // Enhanced error handling for the update operation
    try {
      const result = await testAssignmentsService.updateAssignment(assignmentId, updateData);
      
      console.log('✅ API: Assignment updated successfully:', {
        id: result.id,
        status: result.status,
        employee: result.employee_name
      });
    
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: 'Test assignment updated successfully' 
      });
      
    } catch (serviceError: any) {
      console.error('❌ API: Service error updating assignment:', serviceError);
      
      // Provide more specific error messages
      let errorMessage = serviceError.message || 'Failed to update test assignment';
      
      if (serviceError.message?.includes('Assignment not found')) {
        errorMessage = 'Test assignment no longer exists or has been deleted';
      } else if (serviceError.message?.includes('duplicate key')) {
        errorMessage = 'Assignment update would create a conflict';
      } else if (serviceError.message?.includes('violates foreign key')) {
        errorMessage = 'Invalid employee or test reference';
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ API: Error updating test assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update test assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    console.log('🚀 API: Deleting test assignment', { assignmentId });

    await testAssignmentsService.deleteAssignment(assignmentId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Test assignment deleted successfully' 
    });

  } catch (error: any) {
    console.error('❌ API: Error deleting test assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete test assignment' },
      { status: 500 }
    );
  }
}