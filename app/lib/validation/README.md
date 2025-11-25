# Comprehensive Validation System

This validation system provides multi-layer validation for login credentials, user data, and leave requests with advanced security features.

## Architecture

### Core Components

1. **credentialValidator.ts** - Login and password validation
2. **userDataValidator.ts** - Employee data and duplicate checking  
3. **leaveRequestValidator.ts** - Leave request business rules and conflicts
4. **validationService.ts** - Central orchestrator for all validation
5. **validationMiddleware.ts** - API route middleware integration

### UI Components

1. **ValidationAlert.tsx** - Display validation errors, warnings, and security issues
2. **ConfirmationDialog.tsx** - Handle confirmation workflows
3. **PasswordStrengthIndicator.tsx** - Real-time password strength feedback

### Hooks

1. **useAdvancedValidation.ts** - Enhanced form validation with async support
2. **validationHooks.ts** - Real-time validation and conflict checking

## Features

### 🔐 Security Features
- Rate limiting for login attempts
- Password strength validation
- Common password detection
- Suspicious pattern detection
- Security warning system

### 📧 Duplicate Detection
- Email duplicate checking
- Phone number duplicate checking
- Similar name detection
- Cross-reference with inactive users

### 📅 Leave Request Validation
- Overlapping request detection
- Work days calculation (excludes weekends)
- Leave balance checking
- Frequency abuse detection
- Business rules enforcement

### ⚡ Real-time Validation
- Debounced field validation
- Live duplicate checking
- Instant feedback on form fields
- Background conflict checking

## Usage Examples

### Basic Form Validation
```tsx
import { useAdvancedValidation } from '../lib/hooks/useAdvancedValidation';
import ValidationAlert from '../components/validation/ValidationAlert';

function MyForm() {
  const {
    data,
    errors,
    validationState,
    handleChange,
    validateAll
  } = useAdvancedValidation(initialData, validationRules, {
    operationType: 'user_create',
    enableAsyncValidation: true
  });

  return (
    <form>
      <ValidationAlert
        errors={errors}
        warnings={validationState.warnings}
        securityIssues={validationState.securityIssues}
      />
      {/* Form fields */}
    </form>
  );
}
```

### Real-time Duplicate Checking
```tsx
import { useRealTimeValidation } from '../lib/validation/validationHooks';

function EmailField({ value, onChange }) {
  const { isValidating, validationResult } = useRealTimeValidation(
    'email',
    value,
    'email'
  );

  return (
    <div>
      <input value={value} onChange={onChange} />
      {isValidating && <span>Checking...</span>}
      {validationResult?.error && (
        <span className="text-red-600">{validationResult.error}</span>
      )}
    </div>
  );
}
```

### Leave Conflict Validation
```tsx
import { useLeaveConflictValidation } from '../lib/validation/validationHooks';

function LeaveDateFields({ employeeId, startDate, endDate }) {
  const { isChecking, conflicts } = useLeaveConflictValidation(
    employeeId,
    startDate,
    endDate
  );

  return (
    <div>
      {/* Date inputs */}
      {conflicts?.hasConflicts && (
        <div className="text-red-600">
          Conflicts detected with existing requests
        </div>
      )}
    </div>
  );
}
```

### API Route Integration
```tsx
import { withValidation } from '../lib/validation/validationMiddleware';

const handleCreateEmployee = async (request) => {
  // Validation is automatically handled by middleware
  const employeeData = await request.json();
  const result = await employeeService.createEmployee(employeeData);
  return NextResponse.json({ success: true, data: result });
};

export const POST = withValidation({
  operationType: 'user_create',
  requireAuth: true,
  adminOnly: true
})(handleCreateEmployee);
```

## Validation Rules

### Password Requirements
- Minimum 8 characters
- Must contain uppercase letters
- Must contain lowercase letters  
- Must contain numbers
- Must contain special characters
- Cannot be common passwords
- Strength scoring (0-4)

### Email Validation
- RFC 5322 compliant format
- Domain validation
- Length limits (254 chars max)
- Duplicate checking against database

### Leave Request Rules
- Work days only (excludes weekends)
- Maximum 30 days per request
- No overlapping with existing approved/pending requests
- Balance checking against annual allowance
- Frequency abuse detection
- Business rules per leave type

### User Data Rules
- Name: 2-100 characters, letters only
- Phone: Romanian/international format validation
- Department/Position: Required with length limits
- Join date: Cannot be future, within company founding date

## Error Handling

### Error Categories
1. **Validation Errors**: Critical issues that prevent submission
2. **Warnings**: Issues that require user attention but don't block
3. **Security Issues**: Potential security concerns requiring confirmation

### Response Format
```json
{
  "success": true/false,
  "data": {...},
  "validation": {
    "errors": {...},
    "warnings": [...],
    "securityIssues": [...]
  },
  "requiresConfirmation": true/false,
  "confirmationMessage": "..."
}
```

## Configuration

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Rate Limiting Configuration
- Login attempts: 5 per 15 minutes per email
- Duplicate checks: No limits (read-only)
- Leave validation: 10 per minute per user

## Security Considerations

1. **Rate Limiting**: Prevents brute force attacks
2. **Input Sanitization**: All inputs are validated and sanitized
3. **SQL Injection Prevention**: Uses parameterized queries
4. **Password Security**: Strong requirements and common password blocking
5. **Audit Trail**: All validation results are logged
6. **Confirmation Workflows**: Suspicious patterns require explicit confirmation

## Testing

Run validation tests:
```bash
npm run test:validation
```

Test individual validators:
```javascript
// In browser console
import { credentialValidator } from './lib/validation/credentialValidator';
credentialValidator.getPasswordStrength('mypassword123');
```