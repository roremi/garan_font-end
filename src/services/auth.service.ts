import { LoginData, RegisterData, UserProfile, AuthResponse } from '@/types/auth';
import { storage } from '@/utils/storage';

const API_URL = 'https://localhost:5001/api';

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

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/User/login`, {
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
      if (result.token) {
        storage.setItem('token', result.token);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const token = storage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
  
      const response = await fetch(`${API_URL}/User/profile`, {
        method: 'GET', // Thêm method rõ ràng
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // 'Origin': 'http://localhost:3000' // Thêm origin header
        },
        mode: 'cors', // Thêm CORS mode
        credentials: 'include' // Cho phép gửi credentials
      });
      //  console.log(token)
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Token không hợp lệ hoặc hết hạn');
          this.logout();
          throw new Error('Phiên đăng nhập đã hết hạn');
        }
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Không thể lấy thông tin người dùng');
      }
  
      return await response.json();
    } catch (error) {
      console.error('GetProfile Error:', error);
      throw error;
    }
  }
  

  async updateProfile(id: number, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const token = storage.getItem('token');
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
        const error = await response.text();
        throw new Error(error || 'Cập nhật thông tin thất bại');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      const token = storage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      const response = await fetch(`${API_URL}/User/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
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
      const token = storage.getItem('token');
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

  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const token = storage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      const response = await fetch(`${API_URL}/User/all-profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể lấy danh sách người dùng');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    storage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!storage.getItem('token');
  }

  getToken(): string | null {
    return storage.getItem('token');
  }
}

export const authService = new AuthService();
