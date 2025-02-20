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

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  role: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface AuthResponse {
  token: string;
  user?: UserProfile;
}
