import { supabase } from '../supabase';
import type { 
  LeaveRequest, 
  CreateLeaveRequestData, 
  UpdateLeaveRequestData,
  LeaveRequestWithEmployee,
  LeaveStats,
  EmployeeLeaveBalance 
} from '../types/leave';

export class LeaveService {
  /**
   * Get leave requests by employee ID
   */
  async getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    try {
      console.log('📋 Fetching leave requests for employee:', employeeId);
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching leave requests:', error);
        throw new Error(`Failed to fetch leave requests: ${error.message}`);
      }

      console.log('✅ Leave requests fetched:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('❌ Exception in getLeaveRequestsByEmployee:', error);
      throw error;
    }
  }

  /**
   * Get all leave requests with employee details
   */
  async getAllLeaveRequests(): Promise<LeaveRequestWithEmployee[]> {
    try {
      console.log('📋 Fetching all leave requests with employee details...');
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees (
            name,
            department,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all leave requests:', error);
        throw new Error(`Failed to fetch leave requests: ${error.message}`);
      }

      // Transform the data to include employee details
      const transformedData: LeaveRequestWithEmployee[] = (data || []).map(request => ({
        ...request,
        employee_name: (request.employees as any)?.name || 'Unknown',
        employee_department: (request.employees as any)?.department || 'Unknown',
        employee_email: (request.employees as any)?.email || 'Unknown'
      }));

      console.log('✅ All leave requests fetched:', transformedData.length);
      return transformedData;
    } catch (error: any) {
      console.error('❌ Exception in getAllLeaveRequests:', error);
      throw error;
    }
  }

  /**
   * Get pending leave requests
   */
  async getPendingLeaveRequests(): Promise<LeaveRequestWithEmployee[]> {
    try {
      console.log('⏳ Fetching pending leave requests...');
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees (
            name,
            department,
            email
          )
        `)
        .eq('status', 'pending')
        .order('submitted_date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching pending leave requests:', error);
        throw new Error(`Failed to fetch pending leave requests: ${error.message}`);
      }

      // Transform the data to include employee details
      const transformedData: LeaveRequestWithEmployee[] = (data || []).map(request => ({
        ...request,
        employee_name: (request.employees as any)?.name || 'Unknown',
        employee_department: (request.employees as any)?.department || 'Unknown',
        employee_email: (request.employees as any)?.email || 'Unknown'
      }));

      console.log('✅ Pending leave requests fetched:', transformedData.length);
      return transformedData;
    } catch (error: any) {
      console.error('❌ Exception in getPendingLeaveRequests:', error);
      throw error;
    }
  }

  /**
   * Create new leave request
   */
  async createLeaveRequest(requestData: CreateLeaveRequestData): Promise<LeaveRequest> {
    try {
      console.log('➕ Creating leave request for employee:', requestData.employee_id);
      
      // Calculate number of days
      const startDate = new Date(requestData.start_date);
      const endDate = new Date(requestData.end_date);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

      const newRequest = {
        ...requestData,
        days: daysDiff,
        status: 'pending' as const,
        submitted_date: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('leave_requests')
        .insert([newRequest])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating leave request:', error);
        throw new Error(`Failed to create leave request: ${error.message}`);
      }

      console.log('✅ Leave request created successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Exception in createLeaveRequest:', error);
      throw error;
    }
  }

  /**
   * Update leave request
   */
  async updateLeaveRequest(requestId: string, updateData: UpdateLeaveRequestData): Promise<LeaveRequest> {
    try {
      console.log('✏️ Updating leave request:', requestId);
      
      const updates = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // If dates are being updated, recalculate days
      if (updateData.start_date && updateData.end_date) {
        const startDate = new Date(updateData.start_date);
        const endDate = new Date(updateData.end_date);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        (updates as any).days = daysDiff;
      }

      // If status is being approved, set approval timestamp
      if (updateData.status === 'approved') {
        (updates as any).approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating leave request:', error);
        throw new Error(`Failed to update leave request: ${error.message}`);
      }

      console.log('✅ Leave request updated successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Exception in updateLeaveRequest:', error);
      throw error;
    }
  }

  /**
   * Approve leave request
   */
  async approveLeaveRequest(requestId: string, approvedBy: string): Promise<LeaveRequest> {
    try {
      console.log('✅ Approving leave request:', requestId);
      
      return await this.updateLeaveRequest(requestId, {
        status: 'approved',
        approved_by: approvedBy
      });
    } catch (error: any) {
      console.error('❌ Exception in approveLeaveRequest:', error);
      throw error;
    }
  }

  /**
   * Reject leave request
   */
  async rejectLeaveRequest(requestId: string, rejectedBy: string): Promise<LeaveRequest> {
    try {
      console.log('❌ Rejecting leave request:', requestId);
      
      return await this.updateLeaveRequest(requestId, {
        status: 'rejected',
        approved_by: rejectedBy
      });
    } catch (error: any) {
      console.error('❌ Exception in rejectLeaveRequest:', error);
      throw error;
    }
  }

  /**
   * Delete leave request
   */
  async deleteLeaveRequest(requestId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting leave request:', requestId);
      
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('❌ Error deleting leave request:', error);
        throw new Error(`Failed to delete leave request: ${error.message}`);
      }

      console.log('✅ Leave request deleted successfully');
    } catch (error: any) {
      console.error('❌ Exception in deleteLeaveRequest:', error);
      throw error;
    }
  }

  /**
   * Get leave statistics
   */
  async getLeaveStats(): Promise<LeaveStats> {
    try {
      console.log('📊 Fetching leave statistics...');
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select('status, days');

      if (error) {
        console.error('❌ Error fetching leave stats:', error);
        throw new Error(`Failed to fetch leave stats: ${error.message}`);
      }

      const stats: LeaveStats = {
        total_requests: data?.length || 0,
        pending_requests: data?.filter(r => r.status === 'pending').length || 0,
        approved_requests: data?.filter(r => r.status === 'approved').length || 0,
        rejected_requests: data?.filter(r => r.status === 'rejected').length || 0,
        total_days_requested: data?.reduce((sum, r) => sum + r.days, 0) || 0,
        total_days_approved: data?.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.days, 0) || 0
      };

      console.log('✅ Leave statistics calculated');
      return stats;
    } catch (error: any) {
      console.error('❌ Exception in getLeaveStats:', error);
      throw error;
    }
  }

  /**
   * Get employee leave balance
   */
  async getEmployeeLeaveBalance(employeeId: string): Promise<EmployeeLeaveBalance | null> {
    try {
      console.log('💰 Fetching leave balance for employee:', employeeId);
      
      // Get employee details
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('name')
        .eq('id', employeeId)
        .single();

      if (employeeError) {
        console.error('❌ Error fetching employee:', employeeError);
        return null;
      }

      // Get leave requests for current year
      const currentYear = new Date().getFullYear();
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('leave_requests')
        .select('status, days')
        .eq('employee_id', employeeId)
        .gte('start_date', `${currentYear}-01-01`)
        .lte('start_date', `${currentYear}-12-31`);

      if (leaveError) {
        console.error('❌ Error fetching leave requests:', leaveError);
        throw new Error(`Failed to fetch leave requests: ${leaveError.message}`);
      }

      const daysUsed = leaveRequests?.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.days, 0) || 0;
      const daysPending = leaveRequests?.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.days, 0) || 0;
      const totalDaysAllocated = 25; // Default - could be made configurable

      const balance: EmployeeLeaveBalance = {
        employee_id: employeeId,
        employee_name: employee.name,
        total_days_allocated: totalDaysAllocated,
        days_used: daysUsed,
        days_pending: daysPending,
        days_remaining: totalDaysAllocated - daysUsed - daysPending
      };

      console.log('✅ Leave balance calculated');
      return balance;
    } catch (error: any) {
      console.error('❌ Exception in getEmployeeLeaveBalance:', error);
      throw error;
    }
  }
}

// Export service instance
export const leaveService = new LeaveService();

// Export types for use in components
export type { 
  LeaveRequest, 
  CreateLeaveRequestData, 
  UpdateLeaveRequestData,
  LeaveRequestWithEmployee,
  LeaveStats,
  EmployeeLeaveBalance 
};