"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!formData.email || !formData.password) {
        setError('Vui lòng nhập đầy đủ email và mật khẩu');
        return;
      }
  
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });
  
      if (response.requiresTwoFactor) {
        setUserId(response.userId!);
        setShowTwoFactor(true);
        toast.info('Vui lòng nhập mã xác thực 2FA');
      } else if (response.token) {
        await handleLoginSuccess();
      }
    } catch (error: any) {
      setError(error.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !twoFactorCode) return;

    try {
      setIsLoading(true);
      const response = await authService.validateTwoFactor({
        userId,
        code: twoFactorCode
      });

      if (response.token) {
        await handleLoginSuccess();
      }
    } catch (error: any) {
      setError(error.message || 'Xác thực 2FA thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async () => {
  try {
    const userProfile = await authService.getProfile();

    // Gọi API lấy quyền
    const token = localStorage.getItem('app_token')?.replace(/^"(.*)"$/, '$1');
    const res = await fetch(`http://localhost:5000/api/admin/user-permissions/${userProfile.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    const userPermissions = data.permissions || [];

    // ✅ Điều kiện cho phép vào Admin:
    // - Là Admin role (role === 0)
    // - Hoặc có ít nhất 1 quyền
    if (Number(userProfile.role) === 0 || userPermissions.length > 0) {
      login({
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        fullName: userProfile.fullName,
        phoneNumber: userProfile.phoneNumber,
        role: Number(userProfile.role)
      });

      toast.success('Đăng nhập Admin thành công!');
      localStorage.setItem('adminToken', 'dummy-token');
      router.push('/admin/dashboard');
    } else {
      authService.logout();
      setError('Tài khoản không có quyền vào trang Admin');
    }
  } catch (error: any) {
    setError('Không thể lấy thông tin người dùng hoặc quyền');
  }
};


  const focusNextInput = (currentInput: HTMLInputElement, index: number) => {
    const parent = currentInput.parentElement;
    if (parent) {
      const inputs = parent.querySelectorAll<HTMLInputElement>('input[type="text"]');
      if (inputs[index + 1]) {
        inputs[index + 1].focus();
      }
    }
  };

  const focusPrevInput = (currentInput: HTMLInputElement, index: number) => {
    const parent = currentInput.parentElement;
    if (parent) {
      const inputs = parent.querySelectorAll<HTMLInputElement>('input[type="text"]');
      if (index > 0 && inputs[index - 1]) {
        inputs[index - 1].focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Đăng nhập Admin</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showTwoFactor ? (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                  <Lock className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Xác thực hai lớp (2FA)
                </h3>
                <p className="text-sm text-gray-500">
                  Vui lòng nhập mã xác thực từ ứng dụng authenticator của bạn
                </p>
              </div>

              <div className="flex justify-center">
                <div className="flex space-x-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      className="w-12 h-12 text-center text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={twoFactorCode[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          const newCode = [...twoFactorCode];
                          newCode[index] = value;
                          const updatedCode = newCode.join('');
                          setTwoFactorCode(updatedCode);
                          
                          if (value && index < 5) {
                            focusNextInput(e.target as HTMLInputElement, index);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !twoFactorCode[index]) {
                          focusPrevInput(e.target as HTMLInputElement, index);
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text');
                        const numbers = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
                        setTwoFactorCode(numbers);
                        
                        // Focus the last input after pasting
                        if (numbers.length === 6) {
                          const parent = (e.target as HTMLInputElement).parentElement;
                          if (parent) {
                            const inputs = parent.querySelectorAll<HTMLInputElement>('input[type="text"]');
                            if (inputs[5]) {
                              inputs[5].focus();
                            }
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || twoFactorCode.length !== 6}
            >
              {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowTwoFactor(false);
                setTwoFactorCode('');
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại đăng nhập
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
            
            <div className="text-center mt-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Quay về trang chủ
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}