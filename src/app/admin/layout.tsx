'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard'
  },
  {
    title: 'Quản lý sản phẩm',
    icon: ShoppingBag,
    path: '/admin/products'
  },
  {
    title: 'Quản lý đơn hàng',
    icon: ShoppingBag,
    path: '/admin/orders'
  },
  {
    title: 'Quản lý người dùng',
    icon: Users,
    path: '/admin/users'
  },
  {
    title: 'Cài đặt',
    icon: Settings,
    path: '/admin/settings'
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Kiểm tra xác thực
    const token = localStorage.getItem('adminToken');
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (pathname === '/admin/login') {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen transition-transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-800 w-64">
          <div className="flex items-center justify-between text-white mb-6">
            <span className="text-xl font-bold">Admin Panel</span>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Button
                  variant={pathname === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => router.push(item.path)}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.title}
                </Button>
              </li>
            ))}
            
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Đăng xuất
              </Button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <div className={`p-4 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
        <div className="mb-4 md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
