import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

class LeaveRequestService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async getLeaveRequests(filters?: { employee_id?: string }) {
    try {
      console.log('📋 Service: Loading leave requests', filters);

      let query = this.supabase
        .from('leave_requests')
        .select(`
          id,
          employee_id,
          start_date,
          end_date,
          days,
          leave_type,
          reason,
          status,
          submitted_date,
          approved_by,
          approved_at,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Service: Error loading leave requests:', error);
        throw new Error(error.message);
      }

      console.log('✅ Service: Leave requests loaded:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('❌ Service: Error in getLeaveRequests:', error);
      throw error;
    }
  }

  async getLeaveRequestsWithEmployeeData() {
    try {
      console.log('📋 Service: Loading leave requests with employee data');

      const { data, error } = await this.supabase
        .from('leave_requests')
        .select(`
          id,
          employee_id,
          start_date,
          end_date,
          days,
          leave_type,
          reason,
          status,
          submitted_date,
          approved_by,
          approved_at,
          employees (
            id,
            name,
            department,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Service: Error loading leave requests with employees:', error);
        throw new Error(error.message);
      }

      // Transform data to include employee details at top level
      const transformedData = (data || []).map(request => ({
        ...request,
        employee_name: request.employees?.name || 'Unknown',
        department: request.employees?.department || 'Unknown',
        employee_email: request.employees?.email || ''
      }));

      console.log('✅ Service: Leave requests with employees loaded:', transformedData.length);
      return transformedData;
    } catch (error: any) {
      console.error('❌ Service: Error in getLeaveRequestsWithEmployeeData:', error);
      throw error;
    }
  }

  async createLeaveRequest(requestData: {
    employee_id: string;
    start_date: string;
    end_date: string;
    leave_type: string;
    reason?: string;
  }) {
    try {
      console.log('📝 Service: Creating leave request', {
        employee_id: requestData.employee_id,
        leave_type: requestData.leave_type,
        start_date: requestData.start_date,
        end_date: requestData.end_date
      });

      // Validate required fields
      if (!requestData.employee_id || !requestData.start_date || !requestData.end_date || !requestData.leave_type) {
        throw new Error('Missing required fields for leave request creation');
      }

      // Calculate work days (exclude weekends)
      const startDate = new Date(requestData.start_date);
      const endDate = new Date(requestData.end_date);
      let workDays = 0;
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday(0) or Saturday(6)
          workDays++;
        }
      }

      const insertData = {
        employee_id: requestData.employee_id,
        start_date: requestData.start_date,
        end_date: requestData.end_date,
        days: workDays,
        leave_type: requestData.leave_type,
        reason: requestData.reason || null,
        status: 'pending',
        submitted_date: new Date().toISOString().split('T')[0]
      };

      console.log('�� Service: Inserting leave request data:', insertData);

      const { data, error } = await this.supabase
        .from('leave_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Service: Database error creating leave request:', error);
        throw new Error(error.message || 'Failed to create leave request in database');
      }

      console.log('✅ Service: Leave request created successfully:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Service: Error in createLeaveRequest:', error);
      throw error;
    }
  }

  async updateLeaveRequest(requestId: string, updateData: any) {
    try {
      console.log('🔄 Service: Updating leave request', { requestId });

      const { data, error } = await this.supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('❌ Service: Error updating leave request:', error);
        throw new Error(error.message);
      }

      console.log('✅ Service: Leave request updated successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Service: Error in updateLeaveRequest:', error);
      throw error;
    }
  }

  async approveLeaveRequest(requestId: string, adminId: string) {
    try {
      console.log('✅ Service: Approving leave request', { requestId, adminId });

      const { data, error } = await this.supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('❌ Service: Error approving leave request:', error);
        throw new Error(error.message);
      }

      console.log('✅ Service: Leave request approved successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Service: Error in approveLeaveRequest:', error);
      throw error;
    }
  }

  async rejectLeaveRequest(requestId: string, adminId: string) {
    try {
      console.log('❌ Service: Rejecting leave request', { requestId, adminId });

      const { data, error } = await this.supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('❌ Service: Error rejecting leave request:', error);
        throw new Error(error.message);
      }

      console.log('✅ Service: Leave request rejected successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Service: Error in rejectLeaveRequest:', error);
      throw error;
    }
  }

  async getEmployeeLeaveBalance(employeeId: string, year?: number) {
    try {
      const targetYear = year || new Date().getFullYear();
      console.log('�� Service: Getting leave balance', { employeeId, targetYear });

      const { data, error } = await this.supabase
        .rpc('get_employee_leave_balance', {
          p_employee_id: employeeId,
          p_year: targetYear
        })
        .single();

      if (error) {
        console.error('❌ Service: Error getting leave balance:', error);
        throw new Error(error.message);
      }

      console.log('✅ Service: Leave balance retrieved');
      return data;
    } catch (error: any) {
      console.error('❌ Service: Error in getEmployeeLeaveBalance:', error);
      throw error;
    }
  }

  async getPendingLeaveRequestsCount() {
    try {
      console.log('📊 Service: Getting pending leave requests count');

      const { data, error } = await this.supabase
        .rpc('get_pending_leave_requests_count');

      if (error) {
        console.error('❌ Service: Error getting pending count:', error);
        throw new Error(error.message);
      }

      console.log('✅ Service: Pending count retrieved:', data);
      return data || 0;
    } catch (error: any) {
      console.error('❌ Service: Error in getPendingLeaveRequestsCount:', error);
      throw error;
    }
  }

  async getLeaveStats(options?: { year?: number }) {
    try {
      const year = options?.year || new Date().getFullYear();
      console.log('�� Service: Getting leave stats', { year });

      const { data, error } = await this.supabase
        .rpc('get_leave_stats', { p_year: year })
        .single();

      if (error) {
        console.error('❌ Service: Error getting leave stats:', error);
        throw new Error(error.message);
      }

      console.log('✅ Service: Leave stats retrieved');
      return data;
    } catch (error: any) {
      console.error('❌ Service: Error in getLeaveStats:', error);
      throw error;
    }
  }
}

export const leaveRequestService = new LeaveRequestService();
