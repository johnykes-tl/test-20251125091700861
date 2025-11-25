export interface SystemSetting {
  id?: number;
  key: string;
  value: string;
  setting_type: 'string' | 'boolean' | 'integer' | 'time';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSystemSettingData {
  key: string;
  value: string;
  setting_type: 'string' | 'boolean' | 'integer' | 'time';
  description?: string;
}

export interface UpdateSystemSettingData {
  value?: string;
  setting_type?: 'string' | 'boolean' | 'integer' | 'time';
  description?: string;
}

export interface TimesheetOption {
  id: number;
  title: string;
  key: string;
  employee_text: string;
  display_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTimesheetOptionData {
  title: string;
  key: string;
  employee_text: string;
  display_order?: number;
  active?: boolean;
}

export interface UpdateTimesheetOptionData {
  title?: string;
  key?: string;
  employee_text?: string;
  display_order?: number;
  active?: boolean;
}

// Additional type definitions for settings service
export type SettingType = 'string' | 'boolean' | 'integer' | 'time';

export interface BooleanSetting extends SystemSetting {
  setting_type: 'boolean';
  value: 'true' | 'false';
}

export interface IntegerSetting extends SystemSetting {
  setting_type: 'integer';
  value: string; // stored as string but represents integer
}

export interface TimeSetting extends SystemSetting {
  setting_type: 'time';
  value: string; // HH:MM format
}

export interface StringSetting extends SystemSetting {
  setting_type: 'string';
  value: string;
}

export type AllSystemSettings = BooleanSetting | IntegerSetting | TimeSetting | StringSetting;

export interface SettingValidationResult {
  valid: boolean;
  error?: string;
  formattedValue?: any;
}

// Settings group interfaces for better organization
export interface PontajSettings {
  pontaj_cutoff_time: string;
  allow_weekend_pontaj: boolean;
  require_daily_notes: boolean;
}

export interface LeaveSettings {
  auto_approve_leave: boolean;
  max_leave_days_per_year: number;
}

export interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
}

export interface SecuritySettings {
  password_min_length: number;
  require_password_change: boolean;
  session_timeout: number;
  two_factor_auth: boolean;
  allow_remote_access: boolean;
}

// Default system settings configuration
export const DEFAULT_SYSTEM_SETTINGS: CreateSystemSettingData[] = [
  {
    key: 'pontaj_cutoff_time',
    value: '22:00',
    setting_type: 'time',
    description: 'Ora limită pentru completarea pontajului'
  },
  {
    key: 'allow_weekend_pontaj',
    value: 'false',
    setting_type: 'boolean',
    description: 'Permite pontaj în weekend'
  },
  {
    key: 'require_daily_notes',
    value: 'false',
    setting_type: 'boolean',
    description: 'Note zilnice obligatorii'
  },
  {
    key: 'auto_approve_leave',
    value: 'false',
    setting_type: 'boolean',
    description: 'Aprobare automată concedii'
  },
  {
    key: 'max_leave_days_per_year',
    value: '25',
    setting_type: 'integer',
    description: 'Zile concediu maxime pe an'
  },
  {
    key: 'email_notifications',
    value: 'true',
    setting_type: 'boolean',
    description: 'Notificări email'
  },
  {
    key: 'sms_notifications',
    value: 'false',
    setting_type: 'boolean',
    description: 'Notificări SMS'
  },
  {
    key: 'password_min_length',
    value: '8',
    setting_type: 'integer',
    description: 'Lungime minimă parolă'
  },
  {
    key: 'require_password_change',
    value: 'false',
    setting_type: 'boolean',
    description: 'Schimbare parolă obligatorie'
  },
  {
    key: 'session_timeout',
    value: '480',
    setting_type: 'integer',
    description: 'Timeout sesiune (minute)'
  },
  {
    key: 'two_factor_auth',
    value: 'false',
    setting_type: 'boolean',
    description: 'Autentificare cu doi factori'
  },
  {
    key: 'allow_remote_access',
    value: 'true',
    setting_type: 'boolean',
    description: 'Acces remote'
  }
];

// Default timesheet options configuration
export const DEFAULT_TIMESHEET_OPTIONS: CreateTimesheetOptionData[] = [
  {
    title: 'Prezență',
    key: 'present',
    employee_text: 'Am fost prezent în această zi',
    display_order: 1,
    active: true
  },
  {
    title: 'Update PR',
    key: 'update_pr',
    employee_text: 'Am actualizat PR-ul astăzi',
    display_order: 2,
    active: true
  },
  {
    title: 'Lucru de acasă',
    key: 'work_from_home',
    employee_text: 'Am lucrat de acasă',
    display_order: 3,
    active: true
  }
];

// Settings validation utilities
export const validateSettingValue = (key: string, value: string, type: 'string' | 'boolean' | 'integer' | 'time'): boolean => {
  switch (type) {
    case 'boolean':
      return value === 'true' || value === 'false';
    case 'integer':
      return !isNaN(parseInt(value)) && parseInt(value) >= 0;
    case 'time':
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
    case 'string':
    default:
      return typeof value === 'string' && value.length > 0;
  }
};

export const formatSettingValue = (value: string, type: 'string' | 'boolean' | 'integer' | 'time'): any => {
  switch (type) {
    case 'boolean':
      return value === 'true';
    case 'integer':
      return parseInt(value);
    case 'time':
    case 'string':
    default:
      return value;
  }
};