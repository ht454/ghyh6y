
export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  bio?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  notifications_enabled: boolean;
  favorite_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  games_played: number;
  questions_answered: number;
  correct_answers: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface PhoneVerification {
  id: string;
  user_id: string;
  phone_number: string;
  verification_code: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_info: {
    browser: string;
    os: string;
    device: string;
  };
  ip_address: string;
  last_active: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  preferences: UserPreferences | null;
  stats: UserStats | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface SignUpData {
  phone: string;
  password: string;
  full_name: string;
}

export interface SignInData {
  phone: string;
  password: string;
}

export interface VerifyPhoneData {
  phone: string;
  code: string;
}

export interface ResetPasswordData {
  phone: string;
  code: string;
  new_password: string;
}

export interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UpdatePreferencesData {
  theme?: 'light' | 'dark';
  language?: 'ar' | 'en';
  notifications_enabled?: boolean;
  favorite_categories?: string[];
}