import { LoginData, RegisterData, UserProfile, AuthResponse, TwoFactorValidateRequest, TwoFactorValidationResponse } from '@/types/auth';
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
      
      // Chỉ lưu token nếu không yêu cầu 2FA
      if (result.token && !result.requiresTwoFactor) {
        storage.setItem('token', result.token);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  
  async adminUpdateUser(id: number, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const token = storage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      
      // Kiểm tra người dùng hiện tại có quyền admin không
      const currentUser = await this.getProfile();
      if (Number(currentUser.role) !== 0) {
        throw new Error('Chỉ admin mới có quyền cập nhật thông tin người dùng');
      }
    
      // Đảm bảo role là chuỗi
      if (data.role && typeof data.role !== 'string') {
        data.role = String(data.role);
      }
    
      const response = await fetch(`${API_URL}/User/update/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Thêm dòng này để gửi kèm credentials (cookie, v.v.)
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
  
  async getProfile(): Promise<UserProfile> {
    try {
      const token = storage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
  
      const response = await fetch(`${API_URL}/User/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include'
      });

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
  // Admin login function - reuses the regular login but checks for admin role
  async adminLogin(data: LoginData): Promise<UserProfile> {
    try {
      // Use the regular login API
      const loginResult = await this.login(data);
      
      // Check if login was successful
      if (!loginResult.token) {
        throw new Error('Đăng nhập thất bại');
      }
      
      // Get user profile to check role
      const profile = await this.getProfile();
      
      // Check if user is admin (role === 0)
      if (Number(profile.role) !== 0) {
        // If not admin, remove token and throw error
        this.logout();
        throw new Error('Tài khoản không có quyền admin');
      }
      
      return profile;
    } catch (error) {
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
  async validateTwoFactor(data: TwoFactorValidateRequest): Promise<TwoFactorValidationResponse> {
    try {
      const response = await fetch(`${API_URL}/TwoFactor/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Thêm dòng này nếu bạn sử dụng cookies
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Xác thực 2FA thất bại');
      }
  
      const result = await response.json();
      
      // Lưu token sau khi xác thực 2FA thành công
      if (result.token) {
        storage.setItem('token', result.token);
      }
      
      return result;
    } catch (error) {
      console.error('2FA Validation Error:', error);
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

  async getUserByEmail(email: string): Promise<UserProfile> {
    try {
      const token = storage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa đăng nhập!');
      }

      const response = await fetch(`${API_URL}/User/${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text(); // Lấy nội dung lỗi từ server
        throw new Error(errorText || 'Lấy thông tin người dùng thất bại'); 
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user by email:", error); // Log lỗi ra console để dễ debug
      throw error; // Ném lỗi lên để component xử lý
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
