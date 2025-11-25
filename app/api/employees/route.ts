import { NextRequest, NextResponse } from 'next/server';
import { employeeService } from '../../lib/services/employeeService';
import { withValidation, formatValidationResponse } from '../../lib/validation/validationMiddleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const include_inactive = searchParams.get('include_inactive') === 'true';
    const for_dropdown = searchParams.get('for_dropdown') === 'true';

    console.log('🚀 API: Loading employees', { user_id, include_inactive, for_dropdown });
    
    // Handle single employee by user_id
    if (user_id) {
      const employee = await employeeService.getEmployeeByUserId(user_id);
      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Employee not found for this user' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: employee });
    }
    
    // Handle dropdown request
    if (for_dropdown) {
      const employees = await employeeService.getEmployeesForDropdown({ include_inactive });
      return NextResponse.json({ success: true, data: employees });
    }
    
    // Default: return all employees
    const employees = await employeeService.getEmployees();
    return NextResponse.json({ success: true, data: employees });

  } catch (error: any) {
    console.error('❌ API: Error loading employees:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load employees' },
      { status: 500 }
    );
  }
}

const handleCreateEmployee = async (request: NextRequest) => {
  try {
    const employeeData = await request.json();
    console.log('🚀 API: Creating employee', { email: employeeData.email });
    
    // Enhanced validation result is available in request.validationResult
    const validationResult = (request as any).validationResult;

    const result = await employeeService.createEmployee(employeeData);
    
    return NextResponse.json(formatValidationResponse(
      true,
      result,
      validationResult,
      'Employee created successfully'
    ));
  } catch (error: any) {
    console.error('❌ API: Error creating employee:', error);
    return NextResponse.json(formatValidationResponse(
      false,
      null,
      null,
      error.message || 'Failed to create employee'
    ), { status: 500 });
  }
};

export const POST = withValidation({
  operationType: 'user_create',
  requireAuth: false,
  adminOnly: false
})(handleCreateEmployee);

const handleUpdateEmployee = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');
    const action = searchParams.get('action');
    
    const validationResult = (request as any).validationResult;
    
    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    console.log('🚀 API: Updating employee', { employeeId, action, updateData });
    
    // Handle specific actions
    let result;
    switch (action) {
      case 'activate':
        result = await employeeService.updateEmployee(employeeId, { 
          is_active: true, 
          leave_date: null 
        });
        break;
      case 'deactivate':
        result = await employeeService.updateEmployee(employeeId, { 
          is_active: false, 
          leave_date: updateData.leave_date || new Date().toISOString().split('T')[0]
        });
        break;
      case 'toggle_test_eligibility':
        result = await employeeService.updateEmployee(employeeId, { 
          test_eligible: updateData.test_eligible 
        });
        break;
      default:
        // Regular update
        result = await employeeService.updateEmployee(employeeId, updateData);
        break;
    }
   
    return NextResponse.json(formatValidationResponse(
      true,
      result,
      validationResult,
      'Employee updated successfully'
    ));
  } catch (error: any) {
    console.error('❌ API: Error updating employee:', error);
    return NextResponse.json(formatValidationResponse(
      false,
      null,
      null,
      error.message || 'Failed to update employee'
    ), { status: 500 });
  }
};

export const PUT = withValidation({
  operationType: 'user_update',
  requireAuth: false,
  adminOnly: false
})(handleUpdateEmployee);
