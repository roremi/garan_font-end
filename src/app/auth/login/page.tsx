'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowLeft, Facebook, Github } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const { loginWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await authService.login({
        email: data.email,
        password: data.password
      });

      if (response.requiresTwoFactor) {
        setUserId(response.userId!);
        setShowTwoFactor(true);
        toast.info('Vui lòng nhập mã xác thực 2FA');
      } else if (response.token) {
        if (data.rememberMe) {
          localStorage.setItem('rememberedEmail', data.email);
        }

        const userProfile = await authService.getProfile();
        login({
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          fullName: userProfile.fullName,
          phoneNumber: userProfile.phoneNumber,
          role: Number(userProfile.role)
        });

        toast.success('Đăng nhập thành công!');
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại');
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
        const userProfile = await authService.getProfile();
        login({
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          fullName: userProfile.fullName,
          phoneNumber: userProfile.phoneNumber,
          role: Number(userProfile.role)
        });

        toast.success('Xác thực 2FA thành công!');
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Xác thực 2FA thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`Đăng nhập bằng ${provider} đang được phát triển`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay về trang chủ
        </Link>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          {showTwoFactor ? 'Xác thực hai lớp' : 'Đăng nhập vào tài khoản'}
        </h2>
        {!showTwoFactor && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Hoặc{' '}
            <Link href="/auth/register" className="font-medium text-orange-600 hover:text-orange-500">
              đăng ký tài khoản mới
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        {showTwoFactor ? (
              <div className="space-y-6">
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

                <form onSubmit={handleTwoFactorSubmit} className="mt-8 space-y-6">
                  <div className="space-y-2">
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
                          // Chỉ cho phép nhập số
                          if (/^\d*$/.test(value)) {
                            // Cập nhật giá trị mới
                            const newCode = [...twoFactorCode];
                            newCode[index] = value;
                            const updatedCode = newCode.join('');
                            setTwoFactorCode(updatedCode);
                            
                            // Auto focus next input
                            if (value && index < 5) {
                              const inputs = (e.target as HTMLInputElement).parentElement?.querySelectorAll('input');
                              if (inputs && inputs[index + 1]) {
                                inputs[index + 1].focus();
                              }
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace
                          if (e.key === 'Backspace' && !twoFactorCode[index] && index > 0) {
                            const inputs = (e.target as HTMLInputElement).parentElement?.querySelectorAll('input');
                            if (inputs && inputs[index - 1]) {
                              inputs[index - 1].focus();
                            }
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text');
                          const numbers = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
                          setTwoFactorCode(numbers);
                          
                          // Focus vào ô cuối cùng sau khi paste
                          if (numbers.length === 6) {
                            const inputs = (e.target as HTMLInputElement).parentElement?.querySelectorAll('input');
                            if (inputs && inputs[5]) {
                              inputs[5].focus();
                            }
                          }
                        }}
                      />
                    ))}

                      </div>
                    </div>
                    <p className="text-sm text-center text-gray-500">
                      Mã sẽ hết hạn sau 5 phút
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading || twoFactorCode.length !== 6}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Đang xác thực...
                        </div>
                      ) : (
                        'Xác nhận'
                      )}
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
                  </div>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        Gặp sự cố?
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      className="text-sm font-medium text-orange-600 hover:text-orange-500"
                      onClick={() => toast.info('Tính năng đang được phát triển')}
                    >
                      Yêu cầu mã mới
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <>
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      className={`block w-full pl-10 sm:text-sm rounded-md focus:ring-orange-500 focus:border-orange-500 p-2.5 border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mật khẩu
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('password')}
                      type="password"
                      className={`block w-full pl-10 sm:text-sm rounded-md focus:ring-orange-500 focus:border-orange-500 p-2.5 border ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      {...register('rememberMe')}
                      type="checkbox"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Ghi nhớ đăng nhập
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link 
                      href="/auth/forgot-password" 
                      className="font-medium text-orange-600 hover:text-orange-500"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                </div>

                <div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <GoogleLogin
  onSuccess={(credentialResponse) => {
    if (credentialResponse.credential) {
      loginWithGoogle(credentialResponse.credential)
        .then(() => {
          toast.success("Đăng nhập Google thành công");
          router.push("/");
        })
        .catch(() => toast.error("Đăng nhập Google thất bại"));
    }
  }}
  onError={() => toast.error("Google login thất bại")}
/>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
