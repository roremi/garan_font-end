export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  username: string;
}

export interface TwoFactorValidateRequest {
  userId: number;
  code: string;
}

export interface TwoFactorValidationResponse {
  token: string;
  requiresTwoFactor: boolean;
  userId: number;
  message: string;
}
export interface EmailVerificationRequest {
  email: string;
}


export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  role: string | number;
  avatar?: string;
  is2FAEnabled?: boolean;
}

export interface AuthResponse {
  token?: string;
  requiresTwoFactor: boolean;
  userId?: number;
  message?: string;
}
