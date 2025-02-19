// services/auth.service.ts

import { LoginData, RegisterData, UserProfile, AuthResponse } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/User/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Đăng ký thất bại');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async login(data: LoginData, isAdmin: boolean = false): Promise<AuthResponse> {
    try {
      const endpoint = isAdmin ? 'admin-login' : 'customer-login';
      const response = await fetch(`${API_URL}/User/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Đăng nhập thất bại');
      }

      const result = await response.json();
      // Lưu token vào localStorage
      localStorage.setItem('token', result.token);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      const response = await fetch(`${API_URL}/User/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể lấy thông tin người dùng');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(id: number, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      const response = await fetch(`${API_URL}/User/update/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Cập nhật thông tin thất bại');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      const response = await fetch(`${API_URL}/User/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/User/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Yêu cầu khôi phục mật khẩu thất bại');
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      const response = await fetch(`${API_URL}/User/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Xóa người dùng thất bại');
      }
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService();
