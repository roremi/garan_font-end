// src/app/auth/forgot-password/page.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Hàm đếm ngược để gửi lại OTP
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Hàm gửi mã OTP
  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setIsSendingOTP(true);
  
    try {
      if (!email) {
        throw new Error('Vui lòng nhập email');
      }
      console.log('Sending verification email:', email);
      const response = await authService.sendVerificationEmailForForgotpassword(email);
      console.log('Response:', response);
  
      if (response.success) {
        setShowOtpInput(true);
        startCountdown();
        toast.success(response.message || 'Mã xác thực đã được gửi đến email của bạn!');
      } else {
        throw new Error(response.message || 'Gửi mã xác thực thất bại');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsSendingOTP(false);
    }
  };
  
  // Hàm xác thực OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      if (!email || !otp) {
        throw new Error('Vui lòng nhập đầy đủ thông tin');
      }
  
      console.log('Verifying OTP and requesting password reset:', { email, otp });
      const response = await authService.verifyEmailOTP(email, otp);
      console.log('Response:', response);
  
      if (response.success) {
        toast.success(response.message || 'Xác thực thành công và mật khẩu mới đã được gửi!');
        // Chuyển về trang đăng nhập sau 2 giây
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        throw new Error(response.message || 'Xác thực thất bại');
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Quên mật khẩu</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {!showOtpInput ? (
          // Form nhập email
          <form onSubmit={handleSendOTP} className="space-y-6">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  required
                  disabled={isSendingOTP}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Nhập email đã đăng ký để nhận mã xác thực.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSendingOTP}
            >
              {isSendingOTP ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi mã xác thực'
              )}
            </Button>
          </form>
        ) : (
          // Form nhập OTP
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã xác thực
              </label>
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhập mã xác thực 6 số"
                maxLength={6}
                required
                disabled={isLoading}
                className="text-center text-lg tracking-widest"
              />
              <p className="mt-2 text-sm text-gray-500">
                Vui lòng kiểm tra email và nhập mã xác thực 6 số.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  'Xác thực'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSendOTP()}
                disabled={countdown > 0 || isSendingOTP}
              >
                {countdown > 0 ? (
                  `Gửi lại mã sau ${countdown}s`
                ) : isSendingOTP ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi lại mã'
                )}
              </Button>
            </div>
          </form>
        )}
        
        <div className="text-center space-y-2 mt-6">
          <Link 
            href="/auth/login" 
            className="text-sm text-blue-600 hover:text-blue-800 block"
          >
            Quay lại đăng nhập
          </Link>
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-gray-900 block"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
