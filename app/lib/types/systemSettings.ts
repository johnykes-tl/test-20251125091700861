export interface SystemSetting {
  key: string;
  value: string;
  setting_type: 'string' | 'boolean' | 'integer' | 'float' | 'time';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SystemSettingsGroup {
  pontaj: {
    pontajCutoffTime: string;
    allowWeekendPontaj: boolean;
    requireDailyNotes: boolean;
  };
  concedii: {
    autoApproveLeave: boolean;
    maxLeaveDaysPerYear: number;
  };
  notificari: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  securitate: {
    passwordMinLength: number;
    requirePasswordChange: boolean;
    sessionTimeout: number;
    twoFactorAuth: boolean;
    allowRemoteAccess: boolean;
  };
}

export interface SettingsFormData {
  [key: string]: string | number | boolean;
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SettingsUpdateResult {
  success: boolean;
  updatedSettings?: SystemSettingsGroup;
  error?: string;
}