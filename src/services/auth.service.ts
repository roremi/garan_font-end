import { LoginData, RegisterData, UserProfile, AuthResponse, TwoFactorValidateRequest, TwoFactorValidationResponse } from '@/types/auth';
import { storage } from '@/utils/storage';
import axios from 'axios';
import { EmailVerificationRequest, VerifyOTPRequest, ApiResponse, VerifyEmailOTPRequest } from '@/types/auth';
import { Driver } from '@/types/driver';

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
  async sendVerificationEmailForRegistration(email: string): Promise<ApiResponse> {
    try {
      const data: EmailVerificationRequest = { email };
      
      const response = await axios.post<ApiResponse>(
        `${API_URL}/User/verify-email/send/register`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
  
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Gửi mã xác thực thất bại');
    } catch (error: any) {
      // Xử lý lỗi từ Axios
      if (axios.isAxiosError(error)) {
        // Lấy message từ response error
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message;
        throw new Error(errorMessage);
      }
      throw error; // Throw lại error nếu không phải AxiosError
    }
  }
  
  async sendVerificationEmailForForgotpassword(email: string): Promise<ApiResponse> {
    try {
      const data: EmailVerificationRequest = { email };
      
      const response = await axios.post<ApiResponse>(
        `${API_URL}/User/verify-email/forgot-password`, // Endpoint mới cho đăng ký
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
  
      console.log('Send verification email response:', response.data);
  
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Gửi mã xác thực thất bại');
    } catch (error: any) {
      console.error('Send verification email error:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw new Error('Có lỗi xảy ra khi gửi mã xác thực');
    }
  }
  async verifyEmailForRegistration(email: string, otp: string): Promise<ApiResponse> {
    try {
      const data: VerifyEmailOTPRequest = { email, otp };
      
      const response = await axios.post<ApiResponse>(
        `${API_URL}/User/verify-email/verify`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
  
      console.log('Verify email response:', response.data);
  
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Xác thực email thất bại');
    } catch (error: any) {
      console.error('Verify email error:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw new Error('Có lỗi xảy ra khi xác thực email');
    }
  }
  async verifyEmailOTP(email: string, otp: string): Promise<ApiResponse> {
    try {
      // 1. Xác thực OTP
      const verifyResponse = await axios.post<ApiResponse>(
        `${API_URL}/User/verify-email/verify`,
        { email, otp },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
  
      console.log('Verify OTP response:', verifyResponse.data);
  
      // Nếu xác thực OTP thành công
      if (verifyResponse.data && verifyResponse.data.success) {
        // 2. Gọi API forgot password để gửi mật khẩu mới
        const forgotResponse = await axios.post<ApiResponse>(
          `${API_URL}/User/forgot-password`,
          { email },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );

        console.log('Forgot password response:', forgotResponse.data);

        // Nếu cả hai bước đều thành công
        if (forgotResponse.status === 200) {
          return {
            success: true,
            message: forgotResponse.data.message || 'Xác thực thành công và mật khẩu mới đã được gửi đến email của bạn'
          };
        }

        throw new Error(forgotResponse.data?.message || 'Gửi mật khẩu mới thất bại');
      }

      throw new Error(verifyResponse.data?.message || 'Xác thực mã OTP thất bại');
    } catch (error: any) {
      console.error('Verify OTP or forgot password error:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw new Error('Có lỗi xảy ra trong quá trình xử lý');
    }
  }
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await axios.post<ApiResponse>(
        `${API_URL}/User/forgot-password`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
  
      // Log response để debug
      console.log('Forgot password raw response:', response);
      console.log('Forgot password response data:', response.data);
  
      // Nếu status 200, coi như thành công dù response.data.success có thể undefined
      if (response.status === 200) {
        return {
          success: true,
          message: response.data.message || 'Mật khẩu mới đã được gửi đến email của bạn'
        };
      }
  
      // Nếu có response.data nhưng không thành công
      return {
        success: false,
        message: response.data.message || 'Đặt lại mật khẩu thất bại'
      };
  
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Xử lý lỗi từ API
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData) {
          return {
            success: false,
            message: responseData.message || 'Đặt lại mật khẩu thất bại'
          };
        }
      }
      
      // Lỗi khác
      return {
        success: false,
        message: 'Có lỗi xảy ra khi đặt lại mật khẩu'
      };
    }
  }
  async sendVerificationEmail(email: string): Promise<ApiResponse> {
    try {
      const data: EmailVerificationRequest = { email };
      
      const response = await axios.post<ApiResponse>(
        `${API_URL}/User/verify-email/forgot-password`,  // Endpoint gửi OTP cho quên mật khẩu
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
  
      console.log('Send verification email response:', response.data);
  
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Gửi mã xác thực thất bại');
    } catch (error: any) {
      console.error('Send verification email error:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw new Error('Có lỗi xảy ra khi gửi mã xác thực');
    }
  }
  async updateUserProfile(id: number, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const token = storage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      
      // Kiểm tra người dùng hiện tại có quyền admin không
      const currentUser = await this.getProfile();

    
      // Đảm bảo role là chuỗi
    
      const response = await fetch(`${API_URL}/User/updateforcustomer/${id}`, {
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

  
  async getUserFormattedAddresses(userId: number): Promise<any> {
    try {      
      const token = storage.getItem('token');
      if (!token) {
        console.error('Token not found');
        throw new Error('Không tìm thấy token');
      }
      
      // Đảm bảo URL đúng với cấu hình backend
      // Lưu ý: URL đúng là /api/UserAddress/by-user/{userId}
      const url = `${API_URL}/UserAddress/by-user/${userId}`;      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 404) {
          console.log('No addresses found or endpoint not found');
          return []; // Trả về mảng rỗng thay vì lỗi
        }
        
        throw new Error(errorText || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      throw error;
    }
  }

  // Thêm vào class AuthService
async addUserAddress(userId: number, addressData: any): Promise<any> {
  try {
    const token = storage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token');
    }

    const response = await fetch(`${API_URL}/UserAddress/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Đảm bảo gửi kèm cookie nếu cần
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Thêm địa chỉ thất bại');
    }

    return await response.json();
  } catch (error) {
    console.error('Lỗi khi thêm địa chỉ:', error);
    throw error;
  }
}


// Cập nhật trong class AuthService
async updateUserAddress(userId: number, addressId: number, addressData: any): Promise<any> {
  try {
    const token = storage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token');
    }

    const response = await fetch(`${API_URL}/UserAddress/${userId}/${addressId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Đảm bảo gửi kèm cookie nếu cần
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Cập nhật địa chỉ thất bại');
    }

    return await response.json();
  } catch (error) {
    console.error('Lỗi khi cập nhật địa chỉ:', error);
    throw error;
  }
}

  
  // Trong authService hoặc file api.ts
  async setDefaultAddress(userId: number, addressId: number): Promise<any> {
    try {
      const token = storage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token');
      }
      const response = await fetch(`${API_URL}/UserAddress/set-default/${userId}/${addressId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Đảm bảo gửi kèm cookie nếu cần
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to set default address");
      }

      return response.json();
    } catch (error) {
      console.error('Lỗi khi thiết lập địa chỉ mặc định:', error);
      throw error;
    }
  }

 // Trong authService hoặc api.ts
async deleteUserAddress(userId: number, addressId: number): Promise<any> {
  try {
    const token = storage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token');
    }
    const response = await fetch(`${API_URL}/UserAddress/${userId}/${addressId}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Đảm bảo gửi kèm cookie nếu cần
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to delete address");
    }

    return response.json();
  } catch (error) {
    console.error('Lỗi khi xóa địa chỉ:', error);
    throw error;
  }
}

//driver
// Lấy danh sách shipper
async getAllShippers(): Promise<Driver[]> {
  const token = storage.getItem('token');
  const response = await fetch(`${API_URL}/User/shippers`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

// Tạo shipper mới
async createShipper(data: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  vehiclePlate: string;
}): Promise<any> {
  const token = storage.getItem('token');
  const response = await fetch(`${API_URL}/User/shippers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

// Cập nhật thông tin shipper
async updateShipper(id: number, data: {
  fullName: string;
  phoneNumber: string;
  vehiclePlate: string;
  isAvailable: boolean;
}): Promise<any> {
  const token = storage.getItem('token');
  const response = await fetch(`${API_URL}/User/shippers/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

// Xoá tài xế
async deleteShipper(id: number): Promise<any> {
  const token = storage.getItem('token');
  const response = await fetch(`${API_URL}/User/shippers/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error(await response.text());
  return await response.text();
}

 

  logout(): void {
    storage.removeItem('token');
    storage.removeItem('adminToken');
    storage.removeItem('app_token');
  }

  isAuthenticated(): boolean {
    return !!storage.getItem('token');
  }

  getToken(): string | null {
    return storage.getItem('token');
  }
}

export const authService = new AuthService();
