"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

const URL_API = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5001/";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { authService } from '@/services/auth.service';
import { api } from '@/services/api';

const GOOGLE_CLIENT_ID = '323366452251-9ue1mht4lmpefbctivuusovsbtsv6cse.apps.googleusercontent.com'; // 👉 đưa vào biến env nếu cần

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string | number;
  avatar?: string;
  is2FAEnabled?: boolean;
  nameid?: string;    // Thêm nameid từ JWT
  userId?: string
}

interface TwoFactorStatusDto {
  isEnabled: boolean;
  email: string;
}

interface SetupTwoFactorResponseDto {
  qrCodeUrl: string;
  secretKey: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: Omit<User, 'id'> & { id?: number }) => void;
  logout: () => void;
  permissions: string[];
  updateProfile: (data: Partial<User>) => Promise<void>;
  getTwoFactorStatus: () => Promise<TwoFactorStatusDto>;
  setupTwoFactor: () => Promise<SetupTwoFactorResponseDto>;
  verifyTwoFactor: (code: string) => Promise<void>;
  disableTwoFactor: () => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  
  
useEffect(() => {
  const fetchPermissions = async () => {
    if (user) {
      const res = await api.getUserPermissions(user.id);
      setPermissions(res.permissions || []);
    }
  };
  fetchPermissions();
}, [user]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (userData: Omit<User, 'id'> & { id?: number }) => {
    const userWithId: User = {
      ...userData,
      id: userData.id,
    } as User;
    
    setUser(userWithId);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userWithId));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('app_token');
    localStorage.removeItem('adminToken');
  };
  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await fetch(`${URL_API}api/User/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
  
      const data = await response.json();
  
      if (data.token) {
        // ✅ Lưu token ngay trước khi gọi getProfile
        localStorage.setItem('app_token', data.token);
  
        const userProfile = await authService.getProfile();
        login(userProfile);
      } else {
        throw new Error(data.message || "Không lấy được token từ Google login");
      }
    } catch (err) {
      console.error("Google login error", err);
      throw err;
    }
  };
  
  const updateProfile = async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem('app_token')?.replace(/^"(.*)"$/, '$1');
      const response = await fetch(URL_API+'api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(prevUser => ({
        ...prevUser!,
        ...updatedUser
      }));
      localStorage.setItem('user', JSON.stringify({
        ...user,
        ...updatedUser
      }));
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  };

  const getTwoFactorStatus = async (): Promise<TwoFactorStatusDto> => {
    try {
      const token = localStorage.getItem('app_token')?.replace(/^"(.*)"$/, '$1');
      const response = await fetch(`${URL_API}/api/TwoFactor/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get 2FA status');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Failed to get 2FA status');
    }
  };

  const setupTwoFactor = async (): Promise<SetupTwoFactorResponseDto> => {
    try {
      const token = localStorage.getItem('app_token')?.replace(/^"(.*)"$/, '$1');
      const response = await fetch(`${URL_API}/api/TwoFactor/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to setup 2FA');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Failed to setup 2FA');
    }
  };

  const verifyTwoFactor = async (code: string): Promise<void> => {
    try {
      const token = localStorage.getItem('app_token')?.replace(/^"(.*)"$/, '$1');
      const response = await fetch(`${URL_API}api/TwoFactor/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      setUser(prev => prev ? { ...prev, is2FAEnabled: true } : null);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        is2FAEnabled: true
      }));
    } catch (error) {
      throw new Error('Failed to verify 2FA code');
    }
  };

  const disableTwoFactor = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('app_token')?.replace(/^"(.*)"$/, '$1');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:5001'}/api/TwoFactor/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      setUser(prev => prev ? { ...prev, is2FAEnabled: false } : null);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        is2FAEnabled: false
      }));
    } catch (error) {
      throw new Error('Failed to disable 2FA');
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AuthContext.Provider 
      value={{ 
        user, 
        permissions,
        isLoading, 
        isAuthenticated,
        login, 
        logout,
        updateProfile,
        getTwoFactorStatus,
        setupTwoFactor,
        verifyTwoFactor,
        loginWithGoogle,
        disableTwoFactor
      }}
    >
      {children}
    </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};