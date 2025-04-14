// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { UserProfile } from '@/types/auth';

// Định nghĩa interface cho tham số login
interface LoginParams {
  email: string;
  password: string;
  isAdmin?: boolean;
}

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const profile = await authService.getProfile();
        setUser(profile);
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string, isAdmin: boolean = false) => {
    try {
      // Tạo object params để truyền vào hàm login
      const loginParams: LoginParams = {
        email,
        password,
        isAdmin
      };
      
      const response = await authService.login(loginParams);
      const profile = await authService.getProfile();
      setUser(profile);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/auth/login');
  };

  return {
    user,
    loading,
    login,
    logout,
  };
};
