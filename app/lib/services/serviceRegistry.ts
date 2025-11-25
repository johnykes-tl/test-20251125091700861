// Service registry to switch between direct and backend services
import { employeeService as directEmployeeService } from './employeeService';
import { backendEmployeeService } from './backendEmployeeService';
import { leaveRequestService as directLeaveRequestService } from './leaveRequestService';
import { backendLeaveRequestService } from './backendLeaveRequestService';
import { timesheetService as directTimesheetService } from './timesheetService';
import { backendTimesheetService } from './backendTimesheetService';
import { testsService as directTestsService } from './testsService';
import { backendTestsService } from './backendTestsService';
import { testAssignmentsService as directTestAssignmentsService } from './testAssignmentsService';
import { backendTestAssignmentsService } from './backendTestAssignmentsService';
import { dashboardService as directDashboardService } from './dashboardService';
import { backendDashboardService } from './backendDashboardService';
import { simpleSettingsService as directSettingsService } from './simpleSettingsService';
import { backendSettingsService } from './backendSettingsService';

// Configuration flag - switch between direct and backend
const USE_BACKEND_SERVICES = true; // Set to true to use backend APIs

// Service registry that automatically switches based on configuration
export const employeeService = USE_BACKEND_SERVICES ? backendEmployeeService : directEmployeeService;
export const leaveRequestService = USE_BACKEND_SERVICES ? backendLeaveRequestService : directLeaveRequestService;
export const timesheetService = USE_BACKEND_SERVICES ? backendTimesheetService : directTimesheetService;
export const testsService = USE_BACKEND_SERVICES ? backendTestsService : directTestsService;
export const testAssignmentsService = USE_BACKEND_SERVICES ? backendTestAssignmentsService : directTestAssignmentsService;
export const dashboardService = USE_BACKEND_SERVICES ? backendDashboardService : directDashboardService;
export const settingsService = USE_BACKEND_SERVICES ? backendSettingsService : directSettingsService;

// Export configuration for debugging
export const serviceConfig = {
  USE_BACKEND_SERVICES,
  currentMode: USE_BACKEND_SERVICES ? 'Backend API' : 'Direct Supabase',
  services: {
    employee: USE_BACKEND_SERVICES ? 'Backend' : 'Direct',
    leaveRequest: USE_BACKEND_SERVICES ? 'Backend' : 'Direct',
    timesheet: USE_BACKEND_SERVICES ? 'Backend' : 'Direct',
    tests: USE_BACKEND_SERVICES ? 'Backend' : 'Direct',
    testAssignments: USE_BACKEND_SERVICES ? 'Backend' : 'Direct',
    dashboard: USE_BACKEND_SERVICES ? 'Backend' : 'Direct',
    settings: USE_BACKEND_SERVICES ? 'Backend' : 'Direct'
  }
};

console.log('🔧 Service Registry Configuration:', serviceConfig);