export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
  securityWarnings?: string[];
}

export interface PasswordStrengthResult {
  score: number; // 0-4
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
    noCommon: boolean;
  };
}

class CredentialValidator {
  private commonPasswords = new Set([
    'password', '123456', 'password123', 'admin', 'qwerty', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'hello', 'freedom',
    'whatever', 'qazwsx', 'trustno1', 'jordan', 'harley', 'robert'
  ]);

  private commonEmailDomains = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'
  ]);

  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email?.trim()) {
      return { isValid: false, error: 'Email este obligatoriu' };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Formatul email-ului nu este valid' };
    }

    // Check for suspicious patterns
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      return { isValid: false, error: 'Email-ul conține caractere nevalide' };
    }

    // Check email length
    if (email.length > 254) {
      return { isValid: false, error: 'Email-ul este prea lung (maxim 254 caractere)' };
    }

    const [localPart, domain] = email.split('@');
    if (localPart.length > 64) {
      return { isValid: false, error: 'Partea locală a email-ului este prea lungă' };
    }

    return { isValid: true };
  }

  validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password) {
      return { isValid: false, error: 'Parola este obligatorie' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Parola trebuie să aibă minimum 8 caractere' };
    }

    if (password.length > 128) {
      return { isValid: false, error: 'Parola este prea lungă (maxim 128 caractere)' };
    }

    return { isValid: true };
  }

  getPasswordStrength(password: string): PasswordStrengthResult {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommon: !this.commonPasswords.has(password.toLowerCase())
    };

    const satisfiedCount = Object.values(requirements).filter(Boolean).length;
    let score = Math.min(satisfiedCount, 4);
    
    // Penalize very short passwords
    if (password.length < 6) score = Math.max(score - 2, 0);
    if (password.length < 4) score = 0;

    // Bonus for length
    if (password.length >= 12) score = Math.min(score + 1, 4);

    const strengthMap = {
      0: 'very-weak' as const,
      1: 'weak' as const,
      2: 'fair' as const,
      3: 'good' as const,
      4: 'strong' as const
    };

    const feedback: string[] = [];
    if (!requirements.length) feedback.push('Folosește cel puțin 8 caractere');
    if (!requirements.lowercase) feedback.push('Adaugă litere mici');
    if (!requirements.uppercase) feedback.push('Adaugă litere mari');
    if (!requirements.numbers) feedback.push('Adaugă numere');
    if (!requirements.symbols) feedback.push('Adaugă simboluri (!@#$%^&*)');
    if (!requirements.noCommon) feedback.push('Evită parolele comune');

    return {
      score,
      strength: strengthMap[score],
      feedback,
      requirements
    };
  }

  validateLoginCredentials(credentials: LoginCredentials): CredentialValidationResult {
    const errors: CredentialValidationResult['errors'] = {};
    const securityWarnings: string[] = [];

    // Validate email
    const emailValidation = this.validateEmail(credentials.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    // Validate password
    const passwordValidation = this.validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
    }

    // Security warnings
    if (credentials.email && this.commonEmailDomains.has(credentials.email.split('@')[1])) {
      securityWarnings.push('Folosești un domeniu email public');
    }

    if (credentials.password && this.commonPasswords.has(credentials.password.toLowerCase())) {
      securityWarnings.push('Parola este foarte comună și nesigură');
    }

    // Check for email in password (security risk)
    if (credentials.email && credentials.password?.toLowerCase().includes(credentials.email.split('@')[0].toLowerCase())) {
      securityWarnings.push('Parola conține părți din email');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined
    };
  }

  // Rate limiting helpers
  private rateLimitStore = new Map<string, { attempts: number; lastAttempt: number }>();

  checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 900000): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const record = this.rateLimitStore.get(identifier);

    if (!record) {
      this.rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
      return { allowed: true };
    }

    // Reset if window expired
    if (now - record.lastAttempt > windowMs) {
      this.rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
      return { allowed: true };
    }

    // Check if limit exceeded
    if (record.attempts >= maxAttempts) {
      return { 
        allowed: false, 
        resetTime: record.lastAttempt + windowMs 
      };
    }

    // Increment attempts
    record.attempts++;
    record.lastAttempt = now;
    this.rateLimitStore.set(identifier, record);

    return { allowed: true };
  }

  clearRateLimit(identifier: string): void {
    this.rateLimitStore.delete(identifier);
  }
}

export const credentialValidator = new CredentialValidator();

export default credentialValidator;