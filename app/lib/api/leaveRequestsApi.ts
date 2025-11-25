// Enhanced Leave Requests API Client
class LeaveRequestsApiClient {
  private baseUrl = '/api/leave-requests';

  async getLeaveRequestsWithEmployees() {
    try {
      console.log('🚀 API Client: Loading leave requests with employees');
      const response = await fetch(`${this.baseUrl}?with_employee_data=true`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load leave requests');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('❌ API Client: Error loading leave requests with employees:', error);
      throw error;
    }
  }

  async getEmployeeLeaveRequests(employeeId: string) {
    try {
      console.log('🚀 API Client: Loading employee leave requests', { employeeId });
      const response = await fetch(`${this.baseUrl}?employee_id=${employeeId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load employee leave requests');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('❌ API Client: Error loading employee leave requests:', error);
      throw error;
    }
  }

  async getEmployeeLeaveBalance(employeeId: string, year?: number) {
    try {
      console.log('🚀 API Client: Loading employee leave balance', { employeeId, year });
      
      const url = year 
        ? `/api/leave-requests/balance?employee_id=${employeeId}&year=${year}`
        : `/api/leave-requests/balance?employee_id=${employeeId}`;
        
      const response = await fetch(url);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load leave balance');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('❌ API Client: Error loading leave balance:', error);
      throw error;
    }
  }

  async getPendingLeaveRequestsCount() {
    try {
      console.log('🚀 API Client: Loading pending leave requests count');
      const response = await fetch('/api/leave-requests/pending-count');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load pending count');
      }
      
      return result.data.count;
    } catch (error: any) {
      console.error('❌ API Client: Error loading pending count:', error);
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
      console.log('🚀 API Client: Creating leave request', { 
        employee_id: requestData.employee_id,
        start_date: requestData.start_date,
        end_date: requestData.end_date,
        leave_type: requestData.leave_type
      });

      // Validate required fields
      if (!requestData.employee_id) {
        throw new Error('Employee ID is required');
      }
      if (!requestData.start_date) {
        throw new Error('Start date is required');
      }
      if (!requestData.end_date) {
        throw new Error('End date is required');
      }
      if (!requestData.leave_type) {
        throw new Error('Leave type is required');
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: requestData.employee_id,
          start_date: requestData.start_date,
          end_date: requestData.end_date,
          leave_type: requestData.leave_type,
          reason: requestData.reason || null
        }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create leave request');
      }

      console.log('✅ API Client: Leave request created successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ API Client: Error creating leave request:', error);
      throw error;
    }
  }

  async updateLeaveRequest(requestId: string, updateData: {
    start_date?: string;
    end_date?: string;
    leave_type?: string;
    reason?: string;
  }) {
    try {
      console.log('🚀 API Client: Updating leave request', { requestId });

      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const response = await fetch(`${this.baseUrl}?id=${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update leave request');
      }

      console.log('✅ API Client: Leave request updated successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ API Client: Error updating leave request:', error);
      throw error;
    }
  }

  async approveLeaveRequest(requestId: string, adminId: string) {
    try {
      console.log('🚀 API Client: Approving leave request', { requestId, adminId });

      if (!requestId || !adminId) {
        throw new Error('Request ID and Admin ID are required');
      }

      const response = await fetch(`${this.baseUrl}?id=${requestId}&action=approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_id: adminId }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve leave request');
      }

      console.log('✅ API Client: Leave request approved successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ API Client: Error approving leave request:', error);
      throw error;
    }
  }

  async rejectLeaveRequest(requestId: string, adminId: string) {
    try {
      console.log('🚀 API Client: Rejecting leave request', { requestId, adminId });

      if (!requestId || !adminId) {
        throw new Error('Request ID and Admin ID are required');
      }

      const response = await fetch(`${this.baseUrl}?id=${requestId}&action=reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_id: adminId }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject leave request');
      }

      console.log('✅ API Client: Leave request rejected successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ API Client: Error rejecting leave request:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leaveRequestsApi = new LeaveRequestsApiClient();
