import { credentialValidator } from './credentialValidator';
import { userDataValidator } from './userDataValidator';
import { leaveRequestValidator } from './leaveRequestValidator';

export interface ValidationContext {
  userId?: string;
  userRole?: 'admin' | 'employee';
  operation: 'create' | 'update' | 'delete';
  skipRateLimit?: boolean;
}

export interface ComprehensiveValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  securityIssues: string[];
  canProceed: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

class ValidationService {
  // Central validation orchestrator
  async validateOperation(
    operationType: 'login' | 'user_create' | 'user_update' | 'leave_create' | 'leave_update',
    data: any,
    context: ValidationContext
  ): Promise<ComprehensiveValidationResult> {
    const result: ComprehensiveValidationResult = {
      isValid: false,
      errors: {},
      warnings: [],
      securityIssues: [],
      canProceed: false
    };

    try {
      switch (operationType) {
        case 'login':
          return await this.validateLogin(data, context);
        
        case 'user_create':
          return await this.validateUserCreation(data, context);
        
        case 'user_update':
          return await this.validateUserUpdate(data, context);
        
        case 'leave_create':
          return await this.validateLeaveCreation(data, context);
        
        case 'leave_update':
          return await this.validateLeaveUpdate(data, context);
        
        default:
          result.errors.operation = 'Tip de operație necunoscut';
          return result;
      }
    } catch (error: any) {
      console.error('Validation service error:', error);
      result.errors.system = 'Eroare de sistem la validare';
      return result;
    }
  }

  private async validateLogin(credentials: any, context: ValidationContext): Promise<ComprehensiveValidationResult> {
    const result: ComprehensiveValidationResult = {
      isValid: false,
      errors: {},
      warnings: [],
      securityIssues: [],
      canProceed: false
    };

    // Rate limiting check
    if (!context.skipRateLimit) {
      const rateLimitCheck = credentialValidator.checkRateLimit(
        credentials.email || 'anonymous',
        5, // max attempts
        900000 // 15 minutes
      );

      if (!rateLimitCheck.allowed) {
        const resetTime = rateLimitCheck.resetTime ? new Date(rateLimitCheck.resetTime) : null;
        result.errors.rateLimit = `Prea multe încercări. Încearcă din nou la ${resetTime?.toLocaleTimeString('ro-RO')}`;
        return result;
      }
    }

    // Validate credentials
    const credentialValidation = credentialValidator.validateLoginCredentials(credentials);
    result.errors = { ...result.errors, ...credentialValidation.errors };
    
    if (credentialValidation.securityWarnings) {
      result.securityIssues.push(...credentialValidation.securityWarnings);
    }

    result.isValid = credentialValidation.isValid;
    result.canProceed = credentialValidation.isValid;

    return result;
  }

  private async validateUserCreation(userData: any, context: ValidationContext): Promise<ComprehensiveValidationResult> {
    const result: ComprehensiveValidationResult = {
      isValid: false,
      errors: {},
      warnings: [],
      securityIssues: [],
      canProceed: false
    };

    // Validate user data
    const validation = await userDataValidator.validateUserData(userData, false);
    result.errors = { ...result.errors, ...validation.errors };
    result.warnings.push(...validation.warnings);

    // Check for security issues
    if (validation.duplicates) {
      Object.entries(validation.duplicates).forEach(([field, userId]) => {
        result.securityIssues.push(`Duplicate ${field} detected (User ID: ${userId})`);
      });
    }

    // Password validation if creating account
    if (userData.create_user_account && userData.password) {
      const passwordStrength = credentialValidator.getPasswordStrength(userData.password);
      
      if (passwordStrength.score < 2) {
        result.errors.password = 'Parola este prea slabă. ' + passwordStrength.feedback.join(', ');
      } else if (passwordStrength.score < 3) {
        result.warnings.push('Parola ar putea fi mai sigură: ' + passwordStrength.feedback.join(', '));
      }
    }

    result.isValid = Object.keys(result.errors).length === 0;
    result.canProceed = result.isValid;

    // Require confirmation for warnings
    if (result.warnings.length > 0 && result.isValid) {
      result.requiresConfirmation = true;
      result.confirmationMessage = `Avertismente detectate: ${result.warnings.join('; ')}. Continui?`;
    }

    return result;
  }

  private async validateUserUpdate(userData: any, context: ValidationContext): Promise<ComprehensiveValidationResult> {
    const result: ComprehensiveValidationResult = {
      isValid: false,
      errors: {},
      warnings: [],
      securityIssues: [],
      canProceed: false
    };

    // Validate user data
    const validation = await userDataValidator.validateUserData(userData, true);
    result.errors = { ...result.errors, ...validation.errors };
    result.warnings.push(...validation.warnings);

    result.isValid = Object.keys(result.errors).length === 0;
    result.canProceed = result.isValid;

    return result;
  }

  private async validateLeaveCreation(leaveData: any, context: ValidationContext): Promise<ComprehensiveValidationResult> {
    const result: ComprehensiveValidationResult = {
      isValid: false,
      errors: {},
      warnings: [],
      securityIssues: [],
      canProceed: false
    };

    // Comprehensive leave validation
    const validation = await leaveRequestValidator.validateLeaveRequest(leaveData);
    result.errors = { ...result.errors, ...validation.errors };
    result.warnings.push(...validation.warnings);

    // Security checks for abuse patterns
    if (validation.conflicts?.tooFrequent && validation.conflicts.tooFrequent.length >= 3) {
      result.securityIssues.push('Pattern de cereri frecvente detectat - posibilă abuzare');
    }

    result.isValid = Object.keys(result.errors).length === 0;
    result.canProceed = result.isValid;

    // Require confirmation for significant warnings
    const significantWarnings = result.warnings.filter(w => 
      w.includes('Pattern') || w.includes('frecvente') || w.includes('consecutive')
    );

    if (significantWarnings.length > 0 && result.isValid) {
      result.requiresConfirmation = true;
      result.confirmationMessage = `Avertismente importante: ${significantWarnings.join('; ')}. Continui crearea cererii?`;
    }

    return result;
  }

  private async validateLeaveUpdate(leaveData: any, context: ValidationContext): Promise<ComprehensiveValidationResult> {
    const result: ComprehensiveValidationResult = {
      isValid: false,
      errors: {},
      warnings: [],
      securityIssues: [],
      canProceed: false
    };

    // Similar to creation but with update context
    const validation = await leaveRequestValidator.validateLeaveRequest(leaveData, leaveData.id);
    result.errors = { ...result.errors, ...validation.errors };
    result.warnings.push(...validation.warnings);

    result.isValid = Object.keys(result.errors).length === 0;
    result.canProceed = result.isValid;

    return result;
  }

  // Utility method to clear rate limits (for successful logins)
  clearUserRateLimit(identifier: string): void {
    credentialValidator.clearRateLimit(identifier);
  }

  // Get validation rules for frontend forms
  getValidationRules(formType: 'login' | 'employee' | 'leave'): Record<string, any> {
    switch (formType) {
      case 'login':
        return {
          email: {
            required: true,
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            maxLength: 254
          },
          password: {
            required: true,
            minLength: 8,
            maxLength: 128
          }
        };

      case 'employee':
        return {
          name: {
            required: true,
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-zA-ZăâîșțĂÂÎȘȚ\s\-\.\']+$/
          },
          email: {
            required: true,
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            maxLength: 254
          },
          phone: {
            required: false,
            pattern: /^(\+40|0040|40|0)?[23]?[0-9]{8,9}$/
          },
          department: {
            required: true,
            maxLength: 50
          },
          position: {
            required: true,
            maxLength: 100
          }
        };

      case 'leave':
        return {
          start_date: {
            required: true,
            custom: (value: string) => {
              const date = new Date(value);
              const now = new Date();
              if (date < now) return 'Data nu poate fi în trecut';
              return null;
            }
          },
          end_date: {
            required: true,
            custom: (value: string, formData: any) => {
              const start = new Date(formData.start_date);
              const end = new Date(value);
              if (end < start) return 'Data de sfârșit trebuie să fie după data de început';
              return null;
            }
          },
          leave_type: {
            required: true,
            enum: ['vacation', 'medical', 'personal', 'maternity', 'paternity', 'unpaid']
          }
        };

      default:
        return {};
    }
  }
}

export const validationService = new ValidationService();