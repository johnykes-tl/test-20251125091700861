import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface LeaveRequestData {
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: 'vacation' | 'medical' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
  reason?: string;
}

export interface LeaveValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  conflicts?: {
    overlapping: any[];
    consecutive: any[];
    tooFrequent: any[];
  };
  calculatedDays: number;
  remainingBalance: number;
}

export interface EmployeeLeaveBalance {
  total_days_per_year: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

class LeaveRequestValidator {
  private supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Calculate work days excluding weekends
  calculateWorkDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workDays = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday(0) or Saturday(6)
        workDays++;
      }
    }

    return workDays;
  }

  // Basic date validation
  validateDates(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    if (!startDate || !endDate) {
      return { isValid: false, error: 'Datele de început și sfârșit sunt obligatorii' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Datele introduse nu sunt valide' };
    }

    if (end < start) {
      return { isValid: false, error: 'Data de sfârșit trebuie să fie după data de început' };
    }

    // Check if dates are too far in the past (for new requests)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    if (start < thirtyDaysAgo) {
      return { isValid: false, error: 'Nu se pot crea cereri pentru date mai vechi de 30 de zile' };
    }

    // Check if dates are too far in the future
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);
    
    if (start > oneYearFromNow) {
      return { isValid: false, error: 'Nu se pot crea cereri pentru mai mult de un an în viitor' };
    }

    const workDays = this.calculateWorkDays(startDate, endDate);
    if (workDays === 0) {
      return { isValid: false, error: 'Perioada selectată nu conține zile lucrătoare' };
    }

    if (workDays > 30) {
      return { isValid: false, error: 'Cererea nu poate depăși 30 de zile lucrătoare' };
    }

    return { isValid: true };
  }

  // Check for overlapping leave requests
  async checkOverlappingRequests(employeeId: string, startDate: string, endDate: string, excludeRequestId?: string): Promise<{
    hasOverlaps: boolean;
    overlapping: any[];
    consecutive: any[];
  }> {
    try {
      let query = this.supabaseAdmin
        .from('leave_requests')
        .select('id, start_date, end_date, leave_type, status')
        .eq('employee_id', employeeId)
        .in('status', ['approved', 'pending']); // Don't check against rejected requests

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId);
      }

      const { data: existingRequests, error } = await query;

      if (error) {
        console.error('Error checking overlapping requests:', error);
        return { hasOverlaps: false, overlapping: [], consecutive: [] };
      }

      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate);
      const overlapping: any[] = [];
      const consecutive: any[] = [];

      existingRequests?.forEach(request => {
        const existingStart = new Date(request.start_date);
        const existingEnd = new Date(request.end_date);

        // Check for overlaps
        const isOverlapping = (
          (requestStart >= existingStart && requestStart <= existingEnd) ||
          (requestEnd >= existingStart && requestEnd <= existingEnd) ||
          (requestStart <= existingStart && requestEnd >= existingEnd)
        );

        if (isOverlapping) {
          overlapping.push(request);
          return;
        }

        // Check for consecutive requests (might be suspicious)
        const daysBetween = Math.abs((requestStart.getTime() - existingEnd.getTime()) / (1000 * 60 * 60 * 24));
        const daysBetweenReverse = Math.abs((existingStart.getTime() - requestEnd.getTime()) / (1000 * 60 * 60 * 24));

        if (daysBetween <= 3 || daysBetweenReverse <= 3) {
          consecutive.push(request);
        }
      });

      return {
        hasOverlaps: overlapping.length > 0,
        overlapping,
        consecutive
      };
    } catch (error) {
      console.error('Exception checking overlapping requests:', error);
      return { hasOverlaps: false, overlapping: [], consecutive: [] };
    }
  }

  // Check leave balance
  async getEmployeeLeaveBalance(employeeId: string, year?: number): Promise<EmployeeLeaveBalance | null> {
    try {
      const targetYear = year || new Date().getFullYear();
      
      const { data, error } = await this.supabaseAdmin
        .rpc('get_employee_leave_balance', {
          p_employee_id: employeeId,
          p_year: targetYear
        });

      if (error) {
        console.error('Error getting leave balance:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Exception getting leave balance:', error);
      return null;
    }
  }

  // Check for frequent leave requests (abuse detection)
  async checkLeaveFrequency(employeeId: string, startDate: string): Promise<{
    isFrequent: boolean;
    recentRequests: any[];
    warnings: string[];
  }> {
    try {
      const requestDate = new Date(startDate);
      const thirtyDaysAgo = new Date(requestDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentRequests, error } = await this.supabaseAdmin
        .from('leave_requests')
        .select('id, start_date, end_date, leave_type, status, days')
        .eq('employee_id', employeeId)
        .gte('start_date', thirtyDaysAgo.toISOString().split('T')[0])
        .in('status', ['approved', 'pending']);

      if (error) {
        console.error('Error checking leave frequency:', error);
        return { isFrequent: false, recentRequests: [], warnings: [] };
      }

      const warnings: string[] = [];
      const requestCount = recentRequests?.length || 0;
      const totalDays = recentRequests?.reduce((sum, req) => sum + req.days, 0) || 0;

      if (requestCount >= 3) {
        warnings.push(`${requestCount} cereri în ultimele 30 de zile`);
      }

      if (totalDays >= 10) {
        warnings.push(`${totalDays} zile solicitate în ultimele 30 de zile`);
      }

      // Check for pattern of Friday/Monday requests
      const fridayMondayRequests = recentRequests?.filter(req => {
        const start = new Date(req.start_date);
        const end = new Date(req.end_date);
        const startDay = start.getDay();
        const endDay = end.getDay();
        return (startDay === 1 && req.days <= 2) || (endDay === 5 && req.days <= 2); // Monday start or Friday end
      }) || [];

      if (fridayMondayRequests.length >= 2) {
        warnings.push('Pattern de cereri vineri/luni detectat');
      }

      return {
        isFrequent: warnings.length > 0,
        recentRequests: recentRequests || [],
        warnings
      };
    } catch (error) {
      console.error('Exception checking leave frequency:', error);
      return { isFrequent: false, recentRequests: [], warnings: [] };
    }
  }

  // Business rules validation
  validateLeaveType(leaveType: string, days: number, employeeData?: any): { isValid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];

    switch (leaveType) {
      case 'medical':
        if (days > 15) {
          warnings.push('Concediul medical de peste 15 zile necesită aprobare specială');
        }
        break;

      case 'vacation':
        if (days > 10) {
          warnings.push('Concediul de odihnă de peste 10 zile necesită planificare în avans');
        }
        break;

      case 'maternity':
      case 'paternity':
        // Gender-based validation could be added here if employee data includes gender
        if (days > 90) {
          return { isValid: false, error: 'Concediul maternal/paternal nu poate depăși 90 de zile' };
        }
        break;

      case 'unpaid':
        if (days > 30) {
          warnings.push('Concediul fără plată de peste 30 de zile necesită aprobare specială');
        }
        break;

      case 'personal':
        if (days > 5) {
          warnings.push('Concediul personal de peste 5 zile necesită justificare detaliată');
        }
        break;
    }

    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  // Comprehensive leave request validation
  async validateLeaveRequest(requestData: LeaveRequestData, excludeRequestId?: string): Promise<LeaveValidationResult> {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Basic date validation
    const dateValidation = this.validateDates(requestData.start_date, requestData.end_date);
    if (!dateValidation.isValid) {
      errors.dates = dateValidation.error!;
      return {
        isValid: false,
        errors,
        warnings,
        calculatedDays: 0,
        remainingBalance: 0
      };
    }

    const calculatedDays = this.calculateWorkDays(requestData.start_date, requestData.end_date);

    // Check overlapping requests
    const overlapCheck = await this.checkOverlappingRequests(
      requestData.employee_id, 
      requestData.start_date, 
      requestData.end_date, 
      excludeRequestId
    );

    if (overlapCheck.hasOverlaps) {
      const overlappingDates = overlapCheck.overlapping.map(req => 
        `${req.start_date} - ${req.end_date} (${req.leave_type}, ${req.status})`
      ).join('; ');
      errors.overlap = `Există suprapuneri cu cererile existente: ${overlappingDates}`;
    }

    if (overlapCheck.consecutive.length > 0) {
      warnings.push(`${overlapCheck.consecutive.length} cereri consecutive sau foarte apropiate detectate`);
    }

    // Check leave balance
    const balance = await this.getEmployeeLeaveBalance(requestData.employee_id);
    const remainingBalance = balance?.remaining_days || 0;

    if (balance && calculatedDays > remainingBalance) {
      errors.balance = `Nu ai suficiente zile disponibile. Ai ${remainingBalance} zile rămase, dar ceri ${calculatedDays} zile`;
    }

    // Check leave frequency
    const frequencyCheck = await this.checkLeaveFrequency(requestData.employee_id, requestData.start_date);
    if (frequencyCheck.isFrequent) {
      warnings.push(...frequencyCheck.warnings);
    }

    // Business rules validation
    const businessValidation = this.validateLeaveType(requestData.leave_type, calculatedDays);
    if (!businessValidation.isValid) {
      errors.business = businessValidation.error!;
    } else if (businessValidation.warnings) {
      warnings.push(...businessValidation.warnings);
    }

    // Special validation for reason field
    if (!requestData.reason?.trim() && ['personal', 'unpaid'].includes(requestData.leave_type)) {
      warnings.push(`Motivul este recomandat pentru tipul de concediu "${requestData.leave_type}"`);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      conflicts: overlapCheck.hasOverlaps || overlapCheck.consecutive.length > 0 ? {
        overlapping: overlapCheck.overlapping,
        consecutive: overlapCheck.consecutive,
        tooFrequent: frequencyCheck.recentRequests
      } : undefined,
      calculatedDays,
      remainingBalance
    };
  }

  // Batch validation for leave request imports
  async validateBulkLeaveRequests(requests: LeaveRequestData[]): Promise<{
    validRequests: LeaveRequestData[];
    invalidRequests: Array<{ data: LeaveRequestData; errors: Record<string, string> }>;
    globalConflicts: Array<{ type: string; requests: LeaveRequestData[]; message: string }>;
  }> {
    const validRequests: LeaveRequestData[] = [];
    const invalidRequests: Array<{ data: LeaveRequestData; errors: Record<string, string> }> = [];
    const globalConflicts: Array<{ type: string; requests: LeaveRequestData[]; message: string }> = [];

    // Group requests by employee
    const requestsByEmployee = new Map<string, LeaveRequestData[]>();
    requests.forEach(req => {
      if (!requestsByEmployee.has(req.employee_id)) {
        requestsByEmployee.set(req.employee_id, []);
      }
      requestsByEmployee.get(req.employee_id)!.push(req);
    });

    // Validate each employee's requests
    for (const [employeeId, employeeRequests] of requestsByEmployee) {
      // Sort by start date
      employeeRequests.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      for (let i = 0; i < employeeRequests.length; i++) {
        const request = employeeRequests[i];
        const validation = await this.validateLeaveRequest(request);

        if (validation.isValid) {
          validRequests.push(request);
        } else {
          invalidRequests.push({
            data: request,
            errors: validation.errors
          });
        }

        // Check for conflicts within this batch
        for (let j = i + 1; j < employeeRequests.length; j++) {
          const otherRequest = employeeRequests[j];
          const overlap = this.checkDateOverlap(
            request.start_date, request.end_date,
            otherRequest.start_date, otherRequest.end_date
          );

          if (overlap.hasOverlap) {
            globalConflicts.push({
              type: 'batch_overlap',
              requests: [request, otherRequest],
              message: `Cereri suprapuse pentru același angajat: ${request.start_date} - ${request.end_date} și ${otherRequest.start_date} - ${otherRequest.end_date}`
            });
          }
        }
      }
    }

    return {
      validRequests,
      invalidRequests,
      globalConflicts
    };
  }

  private checkDateOverlap(start1: string, end1: string, start2: string, end2: string): { hasOverlap: boolean } {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);

    const hasOverlap = (
      (s1 >= s2 && s1 <= e2) ||
      (e1 >= s2 && e1 <= e2) ||
      (s1 <= s2 && e1 >= e2)
    );

    return { hasOverlap };
  }

  // Quick validation for API endpoints
  async quickValidateLeaveRequest(requestData: LeaveRequestData): Promise<{ canProceed: boolean; criticalErrors: string[] }> {
    const criticalErrors: string[] = [];

    // Essential validations only
    const dateValidation = this.validateDates(requestData.start_date, requestData.end_date);
    if (!dateValidation.isValid) {
      criticalErrors.push(dateValidation.error!);
    }

    // Check for direct overlaps only
    const overlapCheck = await this.checkOverlappingRequests(
      requestData.employee_id,
      requestData.start_date,
      requestData.end_date
    );

    if (overlapCheck.hasOverlaps) {
      criticalErrors.push('Există suprapuneri cu cereri existente');
    }

    return {
      canProceed: criticalErrors.length === 0,
      criticalErrors
    };
  }
}

export const leaveRequestValidator = new LeaveRequestValidator();

export default leaveRequestValidator;