"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  enable2FA: () => Promise<{ qrCode: string }>;
  disable2FA: () => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
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

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
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

      return updatedUser;
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  };

  const enable2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/2fa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to enable 2FA');
      }

      const { qrCode } = await response.json();
      return { qrCode };
    } catch (error) {
      throw new Error('Failed to enable 2FA');
    }
  };

  const disable2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/2fa/disable', {
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

  const verify2FA = async (code: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/2fa/verify', {
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

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated, // Thêm isAuthenticated vào value
        login, 
        logout,
        updateProfile,
        enable2FA,
        disable2FA,
        verify2FA
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