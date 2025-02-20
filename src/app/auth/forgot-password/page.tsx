'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
      toast.success('Mật khẩu mới đã được gửi đến email của bạn!');
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi yêu cầu khôi phục mật khẩu');
      toast.error(error.message || 'Có lỗi xảy ra khi yêu cầu khôi phục mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Quên mật khẩu</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
            </div>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full mt-4"
            >
              Quay lại đăng nhập
            </Button>
          </div>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Nhập email đã đăng ký của bạn và chúng tôi sẽ gửi mật khẩu mới qua email.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
            </Button>
            
            <div className="text-center space-y-2">
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 block">
                Quay lại đăng nhập
              </Link>
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 block">
                Quay về trang chủ
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
