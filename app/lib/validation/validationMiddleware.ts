import { NextRequest, NextResponse } from 'next/server';
import { credentialValidator } from './credentialValidator';
import { userDataValidator } from './userDataValidator';
import { leaveRequestValidator } from './leaveRequestValidator';
import { validationService, ValidationContext } from './validationService';

export interface ValidationMiddlewareOptions {
  operationType: 'login' | 'user_create' | 'user_update' | 'leave_create' | 'leave_update';
  requireAuth?: boolean;
  adminOnly?: boolean;
  skipRateLimit?: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: 'admin' | 'employee';
    email: string;
  };
}

// Validation middleware for API routes
export function withValidation(options: ValidationMiddlewareOptions) {
  return function middleware(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async function(req: AuthenticatedRequest): Promise<NextResponse> {
      try {
        // Parse request data
        const data = req.method === 'GET' ? 
          Object.fromEntries(new URL(req.url).searchParams.entries()) :
          await req.json();

        // Build validation context
        const context: ValidationContext = {
          userId: req.user?.id,
          userRole: req.user?.role,
          operation: getOperationType(req.method),
          skipRateLimit: options.skipRateLimit || false
        };

        // Run validation
        const validationResult = await validationService.validateOperation(
          options.operationType,
          data,
          context
        );

        // Handle validation failure
        if (!validationResult.canProceed) {
          const response = {
            success: false,
            validation: {
              errors: validationResult.errors,
              warnings: validationResult.warnings,
              securityIssues: validationResult.securityIssues
            },
            message: 'Validation failed'
          };

          return NextResponse.json(response, { status: 400 });
        }

        // Handle confirmation required
        if (validationResult.requiresConfirmation) {
          // Check if confirmation was provided
          const confirmationProvided = data.confirmValidationWarnings === true;
          
          if (!confirmationProvided) {
            return NextResponse.json({
              success: false,
              requiresConfirmation: true,
              confirmationMessage: validationResult.confirmationMessage,
              validation: {
                warnings: validationResult.warnings,
                securityIssues: validationResult.securityIssues
              }
            }, { status: 409 }); // 409 Conflict for confirmation required
          }
        }

        // Add validation info to request
        (req as any).validationResult = validationResult;

        // Proceed to actual handler
        return await handler(req);

      } catch (error: any) {
        console.error('Validation middleware error:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Internal validation error',
            message: error.message 
          },
          { status: 500 }
        );
      }
    };
  };
}

// Enhanced error response formatter
export function formatValidationResponse(
  success: boolean,
  data?: any,
  validationResult?: any,
  message?: string
): any {
  const response: any = {
    success,
    data,
    message,
    timestamp: new Date().toISOString()
  };

  if (validationResult) {
    response.validation = {
      errors: validationResult.errors || {},
      warnings: validationResult.warnings || [],
      securityIssues: validationResult.securityIssues || []
    };

    if (validationResult.requiresConfirmation) {
      response.requiresConfirmation = true;
      response.confirmationMessage = validationResult.confirmationMessage;
    }
  }

  return response;
}

// Helper to extract operation type from HTTP method
function getOperationType(method: string): 'create' | 'update' | 'delete' {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'create';
  }
}

// Validation wrapper for client-side operations
export async function validateClientOperation(
  operationType: 'login' | 'user_create' | 'user_update' | 'leave_create' | 'leave_update',
  data: any,
  userContext?: { id: string; role: 'admin' | 'employee' }
): Promise<{
  canProceed: boolean;
  errors: Record<string, string>;
  warnings: string[];
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}> {
  const context: ValidationContext = {
    userId: userContext?.id,
    userRole: userContext?.role,
    operation: 'create', // Default for client validation
    skipRateLimit: true // Client-side validation shouldn't trigger rate limits
  };

  const result = await validationService.validateOperation(operationType, data, context);

  return {
    canProceed: result.canProceed,
    errors: result.errors,
    warnings: result.warnings,
    requiresConfirmation: result.requiresConfirmation,
    confirmationMessage: result.confirmationMessage
  };
}

// Security headers helper
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export { credentialValidator, userDataValidator, leaveRequestValidator, validationService };