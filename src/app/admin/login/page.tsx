'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Kiểm tra email và password có được nhập không
      if (!formData.email || !formData.password) {
        setError('Vui lòng nhập đầy đủ email và mật khẩu');
        setIsLoading(false); // Reset trạng thái loading
        return;
      }
  
      // Call the existing login service
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });
  
      if (response.token) {
        try {
          // Fetch user profile to check role
          const userProfile = await authService.getProfile();
          
          // Check if user is admin (role == 0)
          if (Number(userProfile.role) === 0) {
            // Login the admin user
            login({
              id: userProfile.id,
              username: userProfile.username,
              email: userProfile.email,
              fullName: userProfile.fullName,
              phoneNumber: userProfile.phoneNumber,
              address: userProfile.address,
              role: Number(userProfile.role)
            });
            
            toast.success('Đăng nhập Admin thành công!');
            localStorage.setItem('adminToken', 'dummy-token');
            router.push('/admin/dashboard');
          } else {
            // Not an admin, log them out and show error
            authService.logout();
            setError('Tài khoản không có quyền admin');
            setIsLoading(false); // Reset trạng thái loading
          }
        } catch (profileError: any) {
          setError('Không thể lấy thông tin người dùng');
          setIsLoading(false); // Reset trạng thái loading
        }
      }
    } catch (error: any) {
      setError(error.message || 'Đăng nhập thất bại');
      setIsLoading(false); // Reset trạng thái loading
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
      </div>
    </div>
  );
}