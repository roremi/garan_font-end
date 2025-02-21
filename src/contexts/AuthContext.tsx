"use client"
const URL_API = "http://localhost:5001/";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  role: string | number;
  avatar?: string;
  is2FAEnabled?: boolean;
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
  updateProfile: (data: Partial<User>) => Promise<void>;
  getTwoFactorStatus: () => Promise<TwoFactorStatusDto>;
  setupTwoFactor: () => Promise<SetupTwoFactorResponseDto>;
  verifyTwoFactor: (code: string) => Promise<void>;
  disableTwoFactor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      id: userData.id ?? Date.now(),
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
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem('token')?.replace(/^"(.*)"$/, '$1');
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
      const response = await fetch('https://localhost:5001/api/TwoFactor/status', {
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
      const response = await fetch('https://localhost:5001/api/TwoFactor/setup', {
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
      const response = await fetch('https://localhost:5001/api/TwoFactor/verify', {
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
      const response = await fetch('https://localhost:5001/api/TwoFactor/disable', {
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
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated,
        login, 
        logout,
        updateProfile,
        getTwoFactorStatus,
        setupTwoFactor,
        verifyTwoFactor,
        disableTwoFactor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};