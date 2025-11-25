// Authentication related types
export interface UserProfile {
  id: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'employee';
}

export interface AuthResponse {
  user: AuthUser;
  role: 'admin' | 'employee';
}

export interface SignInCredentials {
  email: string;
  password: string;
}