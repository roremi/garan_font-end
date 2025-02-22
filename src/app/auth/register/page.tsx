'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, ArrowLeft, Facebook, Github, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  username: string;
  terms: boolean;
  emailVerificationCode: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  username?: string;
  terms?: string;
  emailVerificationCode?: string;
}
export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    username: '',
    terms: false,
    emailVerificationCode: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleSendVerificationCode = async () => {
    // Validate email trước khi gửi
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      setErrors(prev => ({
        ...prev,
        email: 'Email không hợp lệ'
      }));
      return;
    }
  
    try {
      setVerificationLoading(true);
      const response = await authService.sendVerificationEmailForRegistration(formData.email);
      
      if (response.success) {
        setIsEmailSent(true);
        toast.success(response.message || 'Mã xác thực đã được gửi đến email của bạn');
      } else {
        throw new Error(response.message || 'Không thể gửi mã xác thực');
      }
    } catch (error: any) {
      console.error('Send verification error:', error);
      
      // Xử lý hiển thị lỗi từ response
      if (error.response?.data) {
        // Lấy message từ response của backend
        const errorMessage = error.response.data.message || 'Không thể gửi mã xác thực';
        toast.error(errorMessage);
        // Có thể set error vào state nếu cần
        setErrors(prev => ({
          ...prev,
          email: errorMessage
        }));
      } else if (error instanceof Error) {
        // Nếu là lỗi thông thường
        toast.error(error.message);
        setErrors(prev => ({
          ...prev,
          email: error.message
        }));
      } else {
        // Trường hợp khác
        toast.error('Không thể gửi mã xác thực');
        setErrors(prev => ({
          ...prev,
          email: 'Không thể gửi mã xác thực'
        }));
      }
    } finally {
      setVerificationLoading(false);
    }
  };
  

  const handleVerifyEmail = async () => {
    if (!formData.emailVerificationCode || !formData.email) {
      toast.error('Vui lòng nhập mã xác thực');
      return;
    }
  
    try {
      const response = await fetch('https://localhost:5001/api/User/verify-email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.emailVerificationCode
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Xác thực email thất bại');
      }
  
      const data = await response.json();
      if (data.success) {
        setIsEmailVerified(true);
        toast.success(data.message || 'Email đã được xác thực thành công');
      } else {
        toast.error(data.message || 'Xác thực email thất bại');
      }
    } catch (error) {
      console.error('Verify email error:', error);
      toast.error(error instanceof Error ? error.message : 'Xác thực email thất bại');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!isEmailVerified) {
      newErrors.emailVerificationCode = 'Vui lòng xác thực email trước khi đăng ký';
    }
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    // Full name
    if (!formData.fullName) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }

    // Phone number (VN format)
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    // Address
    if (!formData.address) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    }

    // Terms
    if (!formData.terms) {
      newErrors.terms = 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin đăng ký');
      return;
    }

    try {
      setLoading(true);
      
      await authService.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        username: formData.email
      });
      
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/auth/login');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error instanceof Error ? error.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay về trang chủ
        </Link>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Đăng ký tài khoản mới
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Hoặc{' '}
          <Link href="/auth/login" className="font-medium text-orange-600 hover:text-orange-500">
            đăng nhập nếu đã có tài khoản
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Họ và tên
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`block w-full pl-10 sm:text-sm rounded-md p-2.5 border ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`block w-full pl-10 sm:text-sm rounded-md p-2.5 border ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="0123456789"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Địa chỉ
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className={`block w-full pl-10 sm:text-sm rounded-md p-2.5 border ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="Địa chỉ của bạn"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div>
  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
    Email
  </label>
  <div className="mt-1 relative rounded-md shadow-sm">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Mail className="h-5 w-5 text-gray-400" />
    </div>
    <input
      id="email"
      name="email"
      type="email"
      value={formData.email}
      onChange={handleChange}
      className={`block w-full pl-10 pr-24 sm:text-sm rounded-md p-2.5 border ${
        errors.email ? 'border-red-500' : 'border-gray-300'
      } focus:ring-orange-500 focus:border-orange-500`}
      placeholder="you@example.com"
    />
    <div className="absolute inset-y-0 right-0 flex items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mr-2"
        onClick={handleSendVerificationCode}
        disabled={verificationLoading || isEmailVerified}
      >
        {verificationLoading ? 'Đang gửi...' : 'Gửi mã'}
      </Button>
    </div>
  </div>
  {errors.email && (
    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
  )}
</div>

{isEmailSent && (
  <div>
    <label htmlFor="emailVerificationCode" className="block text-sm font-medium text-gray-700">
      Mã xác thực
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <input
        id="emailVerificationCode"
        name="emailVerificationCode"
        type="text"
        value={formData.emailVerificationCode}
        onChange={handleChange}
        className={`block w-full pr-24 sm:text-sm rounded-md p-2.5 border ${
          errors.emailVerificationCode ? 'border-red-500' : 'border-gray-300'
        } focus:ring-orange-500 focus:border-orange-500`}
        placeholder="Nhập mã xác thực"
      />
      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mr-2"
          onClick={handleVerifyEmail}
          disabled={verificationLoading || isEmailVerified}
        >
          {verificationLoading ? 'Đang xác thực...' : 'Xác thực'}
        </Button>
      </div>
    </div>
    {errors.emailVerificationCode && (
      <p className="mt-1 text-sm text-red-600">{errors.emailVerificationCode}</p>
    )}
    {isEmailVerified && (
      <p className="mt-1 text-sm text-green-600">Email đã được xác thực thành công</p>
    )}
  </div>
)}


            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 sm:text-sm rounded-md p-2.5 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 sm:text-sm rounded-md p-2.5 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                className={`h-4 w-4 focus:ring-orange-500 border-gray-300 rounded ${
                  errors.terms ? 'border-red-500' : ''
                }`}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Tôi đồng ý với{' '}
                <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                  điều khoản sử dụng
                </a>
                {' '}và{' '}
                <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                  chính sách bảo mật
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
            )}

            <div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc đăng ký với</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" type="button">
                <Facebook className="h-5 w-5 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" className="w-full" type="button">
                <Github className="h-5 w-5 mr-2" />
                Github
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
