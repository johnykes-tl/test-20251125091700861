import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface UserDataValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  duplicates?: {
    email?: string;
    phone?: string;
    name?: string;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  join_date: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

class UserDataValidator {
  private supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Basic field validation
  validateName(name: string): { isValid: boolean; error?: string } {
    if (!name?.trim()) {
      return { isValid: false, error: 'Numele este obligatoriu' };
    }

    if (name.trim().length < 2) {
      return { isValid: false, error: 'Numele trebuie să aibă cel puțin 2 caractere' };
    }

    if (name.length > 100) {
      return { isValid: false, error: 'Numele este prea lung (maxim 100 caractere)' };
    }

    // Check for invalid characters
    const nameRegex = /^[a-zA-ZăâîșțĂÂÎȘȚ\s\-\.\']+$/;
    if (!nameRegex.test(name)) {
      return { isValid: false, error: 'Numele conține caractere nevalide' };
    }

    // Check for suspicious patterns
    if (/\d/.test(name)) {
      return { isValid: false, error: 'Numele nu poate conține cifre' };
    }

    return { isValid: true };
  }

  validatePhone(phone: string): { isValid: boolean; error?: string; warning?: string } {
    if (!phone?.trim()) {
      return { isValid: true }; // Phone is optional
    }

    // Remove common formatting
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

    // Check Romanian phone number patterns
    const romanianMobileRegex = /^(\+40|0040|40|0)?7[0-9]{8}$/;
    const romanianLandlineRegex = /^(\+40|0040|40|0)?[23][0-9]{8}$/;
    const internationalRegex = /^(\+[1-9]\d{1,14})$/;

    const isRomanianMobile = romanianMobileRegex.test(cleanPhone);
    const isRomanianLandline = romanianLandlineRegex.test(cleanPhone);
    const isInternational = internationalRegex.test(cleanPhone);

    if (!isRomanianMobile && !isRomanianLandline && !isInternational) {
      return { 
        isValid: false, 
        error: 'Numărul de telefon nu este într-un format valid' 
      };
    }

    let warning;
    if (isInternational && !cleanPhone.startsWith('+40')) {
      warning = 'Număr internațional detectat - verifică dacă este corect';
    }

    return { isValid: true, warning };
  }

  validateDepartment(department: string): { isValid: boolean; error?: string } {
    if (!department?.trim()) {
      return { isValid: false, error: 'Departamentul este obligatoriu' };
    }

    if (department.length > 50) {
      return { isValid: false, error: 'Numele departamentului este prea lung' };
    }

    return { isValid: true };
  }

  validatePosition(position: string): { isValid: boolean; error?: string } {
    if (!position?.trim()) {
      return { isValid: false, error: 'Poziția este obligatorie' };
    }

    if (position.length > 100) {
      return { isValid: false, error: 'Numele poziției este prea lung' };
    }

    return { isValid: true };
  }

  validateJoinDate(joinDate: string): { isValid: boolean; error?: string } {
    if (!joinDate) {
      return { isValid: false, error: 'Data angajării este obligatorie' };
    }

    const date = new Date(joinDate);
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Data angajării nu este validă' };
    }

    if (date > now) {
      return { isValid: false, error: 'Data angajării nu poate fi în viitor' };
    }

    // Company founding date - adjust as needed
    const companyFounded = new Date('2020-01-01');
    if (date < companyFounded) {
      return { isValid: false, error: 'Data angajării nu poate fi înainte de înființarea companiei' };
    }

    return { isValid: true };
  }

  // Check for duplicate data
  async checkDuplicateEmail(email: string, excludeUserId?: string): Promise<{ isDuplicate: boolean; existingUser?: any }> {
    try {
      let query = this.supabaseAdmin
        .from('employees')
        .select('id, name, email, is_active')
        .eq('email', email.toLowerCase().trim());

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking duplicate email:', error);
        return { isDuplicate: false };
      }

      if (data && data.length > 0) {
        return { 
          isDuplicate: true, 
          existingUser: data[0] 
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Exception checking duplicate email:', error);
      return { isDuplicate: false };
    }
  }

  async checkDuplicatePhone(phone: string, excludeUserId?: string): Promise<{ isDuplicate: boolean; existingUser?: any }> {
    if (!phone?.trim()) {
      return { isDuplicate: false };
    }

    try {
      // Normalize phone number for comparison
      const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '');

      let query = this.supabaseAdmin
        .from('employees')
        .select('id, name, phone, is_active')
        .eq('phone', normalizedPhone);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking duplicate phone:', error);
        return { isDuplicate: false };
      }

      if (data && data.length > 0) {
        return { 
          isDuplicate: true, 
          existingUser: data[0] 
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Exception checking duplicate phone:', error);
      return { isDuplicate: false };
    }
  }

  async checkSimilarNames(name: string, excludeUserId?: string): Promise<{ hasSimilar: boolean; similarUsers?: any[] }> {
    try {
      const normalizedName = name.toLowerCase().trim();
      
      let query = this.supabaseAdmin
        .from('employees')
        .select('id, name, email, department')
        .ilike('name', `%${normalizedName}%`);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking similar names:', error);
        return { hasSimilar: false };
      }

      if (data && data.length > 0) {
        return { 
          hasSimilar: true, 
          similarUsers: data 
        };
      }

      return { hasSimilar: false };
    } catch (error) {
      console.error('Exception checking similar names:', error);
      return { hasSimilar: false };
    }
  }

  // Comprehensive user data validation
  async validateUserData(userData: CreateUserData | UpdateUserData, isUpdate: boolean = false): Promise<UserDataValidationResult> {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];
    const duplicates: Record<string, string> = {};

    // Basic field validation
    const nameValidation = this.validateName(userData.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error!;
    }

    const emailValidation = this.validateEmail(userData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!;
    }

    const phoneValidation = this.validatePhone(userData.phone || '');
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error!;
    } else if (phoneValidation.warning) {
      warnings.push(phoneValidation.warning);
    }

    const departmentValidation = this.validateDepartment(userData.department);
    if (!departmentValidation.isValid) {
      errors.department = departmentValidation.error!;
    }

    const positionValidation = this.validatePosition(userData.position);
    if (!positionValidation.isValid) {
      errors.position = positionValidation.error!;
    }

    const joinDateValidation = this.validateJoinDate(userData.join_date);
    if (!joinDateValidation.isValid) {
      errors.join_date = joinDateValidation.error!;
    }

    // Skip duplicate checks if basic validation failed
    if (Object.keys(errors).length > 0) {
      return {
        isValid: false,
        errors,
        warnings
      };
    }

    // Check for duplicates
    const excludeId = isUpdate ? (userData as UpdateUserData).id : undefined;

    const [emailDuplicateCheck, phoneDuplicateCheck, similarNamesCheck] = await Promise.all([
      this.checkDuplicateEmail(userData.email, excludeId),
      this.checkDuplicatePhone(userData.phone || '', excludeId),
      this.checkSimilarNames(userData.name, excludeId)
    ]);

    if (emailDuplicateCheck.isDuplicate) {
      const existingUser = emailDuplicateCheck.existingUser;
      errors.email = `Email-ul este deja folosit de ${existingUser.name}${existingUser.is_active ? '' : ' (cont inactiv)'}`;
      duplicates.email = existingUser.id;
    }

    if (phoneDuplicateCheck.isDuplicate) {
      const existingUser = phoneDuplicateCheck.existingUser;
      errors.phone = `Telefonul este deja folosit de ${existingUser.name}${existingUser.is_active ? '' : ' (cont inactiv)'}`;
      duplicates.phone = existingUser.id;
    }

    if (similarNamesCheck.hasSimilar && similarNamesCheck.similarUsers) {
      const similarNames = similarNamesCheck.similarUsers.map(u => u.name).join(', ');
      warnings.push(`Există angajați cu nume similare: ${similarNames}`);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      duplicates: Object.keys(duplicates).length > 0 ? duplicates : undefined
    };
  }

  // Bulk validation for employee imports
  async validateBulkUserData(usersData: CreateUserData[]): Promise<{
    validUsers: CreateUserData[];
    invalidUsers: Array<{ data: CreateUserData; errors: Record<string, string> }>;
    duplicateGroups: Array<{ field: string; value: string; users: CreateUserData[] }>;
  }> {
    const validUsers: CreateUserData[] = [];
    const invalidUsers: Array<{ data: CreateUserData; errors: Record<string, string> }> = [];
    const emailGroups = new Map<string, CreateUserData[]>();
    const phoneGroups = new Map<string, CreateUserData[]>();

    // First pass: validate individual records and group duplicates
    for (const userData of usersData) {
      const validation = await this.validateUserData(userData);
      
      if (validation.isValid) {
        validUsers.push(userData);
      } else {
        invalidUsers.push({
          data: userData,
          errors: validation.errors
        });
      }

      // Group potential duplicates
      const email = userData.email.toLowerCase().trim();
      if (!emailGroups.has(email)) {
        emailGroups.set(email, []);
      }
      emailGroups.get(email)!.push(userData);

      if (userData.phone) {
        const phone = userData.phone.replace(/[\s\-\(\)\.]/g, '');
        if (!phoneGroups.has(phone)) {
          phoneGroups.set(phone, []);
        }
        phoneGroups.get(phone)!.push(userData);
      }
    }

    // Find duplicate groups
    const duplicateGroups: Array<{ field: string; value: string; users: CreateUserData[] }> = [];

    emailGroups.forEach((users, email) => {
      if (users.length > 1) {
        duplicateGroups.push({ field: 'email', value: email, users });
      }
    });

    phoneGroups.forEach((users, phone) => {
      if (users.length > 1) {
        duplicateGroups.push({ field: 'phone', value: phone, users });
      }
    });

    return {
      validUsers,
      invalidUsers,
      duplicateGroups
    };
  }
}

export const userDataValidator = new UserDataValidator();

export default userDataValidator;