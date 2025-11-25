import { api } from './apiClient';
import type { 
  LeaveRequest, 
  LeaveRequestWithEmployee,
  CreateLeaveRequestData, 
  UpdateLeaveRequestData, 
  EmployeeLeaveBalance,
  LeaveStats 
} from '../../lib/types/leaveRequest';

class BackendLeaveRequestService {
  // Get leave requests (with optional filters)
  async getLeaveRequests(options: { employee_id?: string } = {}): Promise<LeaveRequest[]> {
    const params: Record<string, string> = {};
    if (options.employee_id) {
      params.employee_id = options.employee_id;
    }

    const response = await api.get<LeaveRequest[]>('/api/leave-requests', params);
    return response.data || [];
  }

  // Get leave requests with employee data
  async getLeaveRequestsWithEmployeeData(): Promise<LeaveRequestWithEmployee[]> {
    const response = await api.get<LeaveRequestWithEmployee[]>('/api/leave-requests', {
      with_employee_data: 'true'
    });
    return response.data || [];
  }

  // Create leave request
  async createLeaveRequest(requestData: CreateLeaveRequestData): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>('/api/leave-requests', requestData);
    return response.data!;
  }

  // Update leave request
  async updateLeaveRequest(requestId: string, updateData: UpdateLeaveRequestData): Promise<LeaveRequest> {
    const response = await api.put<LeaveRequest>(`/api/leave-requests?id=${requestId}`, updateData);
    return response.data!;
  }

  // Approve leave request
  async approveLeaveRequest(requestId: string, adminId: string): Promise<LeaveRequest> {
    const response = await api.put<LeaveRequest>(
      `/api/leave-requests?id=${requestId}&action=approve`, 
      { admin_id: adminId }
    );
    return response.data!;
  }

  // Reject leave request
  async rejectLeaveRequest(requestId: string, adminId: string): Promise<LeaveRequest> {
    const response = await api.put<LeaveRequest>(
      `/api/leave-requests?id=${requestId}&action=reject`, 
      { admin_id: adminId }
    );
    return response.data!;
  }

  // Get employee leave balance
  async getEmployeeLeaveBalance(employeeId: string, year?: number): Promise<EmployeeLeaveBalance> {
    const params: Record<string, string> = {
      employee_id: employeeId
    };
    
    if (year) {
      params.year = year.toString();
    }

    const response = await api.get<EmployeeLeaveBalance>('/api/leave-requests/balance', params);
    return response.data!;
  }

  // Get pending leave requests count
  async getPendingLeaveRequestsCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/api/leave-requests/pending-count');
    return response.data?.count || 0;
  }

  // Get leave statistics for a year
  async getLeaveStats(options: { year?: number } = {}): Promise<LeaveStats> {
    // For now, calculate from all requests
    const allRequests = await this.getLeaveRequests();
    const year = options.year || new Date().getFullYear();
    
    const yearRequests = allRequests.filter(req => 
      new Date(req.start_date).getFullYear() === year
    );

    return {
      approved: yearRequests.filter(req => req.status === 'approved').length,
      pending: yearRequests.filter(req => req.status === 'pending').length,
      rejected: yearRequests.filter(req => req.status === 'rejected').length,
      total: yearRequests.length
    };
  }
}

export const backendLeaveRequestService = new BackendLeaveRequestService();