import { NextRequest, NextResponse } from 'next/server';
import { leaveRequestService } from '../../lib/services/leaveRequestService';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');
    const with_employee_data = searchParams.get('with_employee_data') === 'true';

    console.log('🚀 API: Loading leave requests', { employee_id, with_employee_data });

    if (with_employee_data) {
      const data = await leaveRequestService.getLeaveRequestsWithEmployeeData();
      return NextResponse.json({ success: true, data });
    } else if (employee_id) {
      const data = await leaveRequestService.getLeaveRequests({ employee_id });
      return NextResponse.json({ success: true, data });
    } else {
      const data = await leaveRequestService.getLeaveRequests();
      return NextResponse.json({ success: true, data });
    }

  } catch (error: any) {
    console.error('❌ API: Error loading leave requests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load leave requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
 try {
    const requestData = await request.json();
    console.log('🚀 API: Creating leave request', { employee_id: requestData.employee_id });
    
     // Basic validation
    if (!requestData.employee_id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    if (!requestData.start_date || !requestData.end_date) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }
    
    if (!requestData.leave_type) {
      return NextResponse.json(
        { success: false, error: 'Leave type is required' },
        { status: 400 }
      );
    }
    const result = await leaveRequestService.createLeaveRequest(requestData);
    
     return NextResponse.json({
      success: true,
      data: result,
      message: 'Leave request created successfully'
    });
 } catch (error: any) {
    console.error('❌ API: Error creating leave request:', error);
     return NextResponse.json(
      { success: false, error: error.message || 'Failed to create leave request' },
      { status: 500 }
    );
 }
}
export async function PUT(request: NextRequest) {
 try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const requestBody = await request.json();
     if (action === 'approve') {
      const { admin_id } = requestBody;
      if (!admin_id) {
        return NextResponse.json(
          { success: false, error: 'Admin ID is required for approval' },
          { status: 400 }
        );
      }
      
      console.log('✅ API: Approving leave request', { requestId, admin_id });
      const result = await leaveRequestService.approveLeaveRequest(requestId, admin_id);
      
       return NextResponse.json({
        success: true,
        data: result,
        message: 'Leave request approved'
      });
     
    } else if (action === 'reject') {
      const { admin_id } = requestBody;
      if (!admin_id) {
        return NextResponse.json(
          { success: false, error: 'Admin ID is required for rejection' },
          { status: 400 }
        );
      }
      
      console.log('❌ API: Rejecting leave request', { requestId, admin_id });
      const result = await leaveRequestService.rejectLeaveRequest(requestId, admin_id);
      
       return NextResponse.json({
        success: true,
        data: result,
        message: 'Leave request rejected'
      });
     
    } else {
      // Regular update
      console.log('🚀 API: Updating leave request', { requestId });
      const result = await leaveRequestService.updateLeaveRequest(requestId, requestBody);
      
       return NextResponse.json({
        success: true,
        data: result,
        message: 'Leave request updated successfully'
      });
   }

  } catch (error: any) {
    console.error('❌ API: Error updating leave request:', error);
     return NextResponse.json(
      { success: false, error: error.message || 'Failed to update leave request' },
      { status: 500 }
    );
 }
}