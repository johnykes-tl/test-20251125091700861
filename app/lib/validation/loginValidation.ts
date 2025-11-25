export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginValidationResult {
  isValid: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}

export interface LoginAttemptResult {
  success: boolean;
  error?: string;
  errorType?: 'validation' | 'credentials' | 'network' | 'server';
  user?: any;
}

export class LoginValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly MIN_PASSWORD_LENGTH = 1; // Relaxed for existing accounts

  /**
   * Validate login form data on client-side
   */
  static validateCredentials(credentials: LoginCredentials): LoginValidationResult {
    const errors: LoginValidationResult['errors'] = {};

    // Email validation
    if (!credentials.email?.trim()) {
      errors.email = 'Email-ul este obligatoriu';
    } else if (!this.EMAIL_REGEX.test(credentials.email.trim())) {
      errors.email = 'Email-ul nu este valid';
    }

    // Password validation  
    if (!credentials.password?.trim()) {
      errors.password = 'Parola este obligatorie';
    } else if (credentials.password.length < this.MIN_PASSWORD_LENGTH) {
      errors.password = `Parola trebuie să aibă cel puțin ${this.MIN_PASSWORD_LENGTH} caractere`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Enhanced error message mapping for auth errors
   */
  static mapAuthError(error: any): LoginValidationResult {
    const errors: LoginValidationResult['errors'] = {};

    const errorMessage = error?.message?.toLowerCase() || '';
    
    if (errorMessage.includes('invalid') && errorMessage.includes('credentials')) {
      errors.general = 'Email sau parolă incorectă. Verifică datele introduse.';
    } else if (errorMessage.includes('email') && errorMessage.includes('not confirmed')) {
      errors.general = 'Contul nu a fost confirmat. Verifică email-ul pentru linkul de confirmare.';
    } else if (errorMessage.includes('too many requests')) {
      errors.general = 'Prea multe încercări de conectare. Încearcă din nou peste câteva minute.';
    } else if (errorMessage.includes('user not found')) {
      errors.general = 'Nu există un cont cu acest email. Verifică adresa de email.';
    } else if (errorMessage.includes('wrong password')) {
      errors.password = 'Parolă incorectă. Încearcă din nou.';
    } else if (errorMessage.includes('invalid email')) {
      errors.email = 'Format de email invalid.';
    } else if (errorMessage.includes('signup disabled')) {
      errors.general = 'Înregistrarea nu este permisă momentan.';
    } else if (errorMessage.includes('connection') || errorMessage.includes('network')) {
      errors.general = 'Problemă de conexiune. Verifică conexiunea la internet.';
    } else {
      // Generic fallback for unknown errors
      errors.general = 'Eroare de autentificare. Încearcă din nou sau contactează administratorul.';
    }

    return {
      isValid: false,
      errors
    };
  }

  /**
   * Check if error is retryable (network/timeout vs credentials)
   */
  static isRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    const retryablePatterns = [
      'connection',
      'network',
      'timeout',
      'unavailable',
      'service temporarily',
      'too many requests'
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Get suggested action for error recovery
   */
  static getSuggestedAction(error: any): string {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (errorMessage.includes('invalid') && errorMessage.includes('credentials')) {
      return 'Verifică că email-ul și parola sunt corecte';
    } else if (errorMessage.includes('too many requests')) {
      return 'Așteaptă 5-10 minute înainte de o nouă încercare';
    } else if (errorMessage.includes('connection') || errorMessage.includes('network')) {
      return 'Verifică conexiunea la internet și încearcă din nou';
    } else if (errorMessage.includes('user not found')) {
      return 'Verifică email-ul sau contactează administratorul pentru crearea contului';
    } else {
      return 'Încearcă din nou sau contactează suportul tehnic';
    }
  }
}

export default LoginValidator;