import { 
  testAssignmentsService, 
  type AssignmentsByDate, 
  type EligibleEmployee 
} from './testAssignmentsService';
import type { 
  CreateAssignmentData, 
  UpdateAssignmentData 
} from '../types/tests'; // Corrected import

class OptimizedTestAssignmentsService {
  getAssignmentsByDate(date: string): Promise<AssignmentsByDate> {
    // For now, just pass through. Caching could be added here.
    return testAssignmentsService.getAssignmentsByDate(date);
  }

  getEligibleEmployees(): Promise<EligibleEmployee[]> {
    return testAssignmentsService.getEligibleEmployees();
  }

  createAssignment(data: CreateAssignmentData) {
    return testAssignmentsService.createAssignment(data);
  }

  updateAssignment(id: string, data: UpdateAssignmentData) {
    return testAssignmentsService.updateAssignment(id, data);
  }

  deleteAssignment(id: string) {
    return testAssignmentsService.deleteAssignment(id);
  }
}

export const optimizedTestAssignmentsService = new OptimizedTestAssignmentsService();