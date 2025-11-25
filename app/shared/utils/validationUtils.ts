export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[0-9+\-\s()]+$/;

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email-ul este obligatoriu';
  if (!emailRegex.test(email)) return 'Email-ul nu este valid';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return 'Telefonul este obligatoriu';
  if (!phoneRegex.test(phone)) return 'Telefonul nu este valid';
  return null;
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} este obligatoriu`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number): string | null => {
  if (value.length < minLength) {
    return `Minimum ${minLength} caractere`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number): string | null => {
  if (value.length > maxLength) {
    return `Maximum ${maxLength} caractere`;
  }
  return null;
};

export const validateDateRange = (startDate: string, endDate: string): string | null => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) {
    return 'Data de sfârșit trebuie să fie după data de început';
  }
  return null;
};

export const validatePasswordStrength = (password: string): string | null => {
  if (password.length < 8) {
    return 'Parola trebuie să aibă minimum 8 caractere';
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Parola trebuie să conțină cel puțin o literă mică';
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Parola trebuie să conțină cel puțin o literă mare';
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return 'Parola trebuie să conțină cel puțin o cifră';
  }
  
  return null;
};