'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Menu, X, FolderOpen,
  Bell, Search, User, MessageCircle, TicketPercent, Layers, Boxes, Edit2Icon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import { useSignalR } from '@/hooks/useSignalR';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', requiredPermission: 'permission_view_dashboard' },
  { title: 'Quản lý sản phẩm', icon: ShoppingBag, path: '/admin/products', requiredPermission: 'permission_view_product' },
  { title: 'Quản lý danh mục', icon: FolderOpen, path: '/admin/Category', requiredPermission: 'permission_view_category' },
  { title: 'Quản lý nhóm Combo', icon: Layers, path: '/admin/ComboCategory', requiredPermission: 'permission_view_combocategory' },
  { title: 'Quản lý Combo', icon: FolderOpen, path: '/admin/Combo', requiredPermission: 'permission_view_combo' },
  { title: 'Quản lý đơn hàng', icon: ShoppingBag, path: '/admin/orders', requiredPermission: 'permission_view_order' },
  { title: 'Quản lý voucher', icon: TicketPercent, path: '/admin/Voucher', requiredPermission: 'permission_view_voucher' },
  { title: 'Quản lý shipping', icon: TicketPercent, path: '/admin/Shipping', requiredPermission: 'permission_view_shipping' },
  { title: 'Quản lý người dùng', icon: Users, path: '/admin/users', requiredPermission: 'permission_view_allprofile' },
  { title: 'Quản lý quyền', icon: Edit2Icon, path: '/admin/permissions', requiredPermission: 'permission_view_admin_page' },
  { title: 'Quản lý Driver', icon: Users, path: '/admin/driver', requiredPermission: 'permission_view_driver' },
  { title: 'Quản lý tin nhắn', icon: MessageCircle, path: '/admin/chat', requiredPermission: 'permission_manager_chat' },
  { title: 'Marketing', icon: Boxes, path: '/admin/maketting', requiredPermission: 'permission_view_admin_page' }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { permissions, user } = useAuth();
  const [notifications, setNotifications] = useState<{ message: string; time: string }[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { onNewOrder } = useSignalR(user?.id || 0, user?.fullName || '');
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  // ✅ Bật âm thanh khi user có tương tác đầu tiên
  useEffect(() => {
    const enableSound = () => {
      setIsSoundEnabled(true);
      document.removeEventListener('click', enableSound);
    };
    document.addEventListener('click', enableSound);
    return () => document.removeEventListener('click', enableSound);
  }, []);

  // ✅ Kiểm tra token và điều hướng login nếu chưa đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // ✅ Đăng ký lắng nghe sự kiện đơn hàng mới từ SignalR
  useEffect(() => {
    const unsubscribe = onNewOrder((order) => {
      const newNotification = {
        message: `Đơn hàng mới từ ${order.nameCustomer} - Tổng: ${order.total.toLocaleString('vi-VN')}đ`,
        time: new Date().toLocaleTimeString()
      };
      setNotifications(prev => [newNotification, ...prev]);

      if (isSoundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err: unknown) =>
          console.error('Không thể phát âm thanh:', err)
        );
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [onNewOrder, isSoundEnabled]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const canView = (perm: string) => permissions.includes(perm);
  if (!isAuthenticated) return null;
  if (pathname === '/admin/login') return children;

  const visibleMenuItems =
    user && Number(user.role) === 0
      ? menuItems
      : menuItems.filter(item => canView(item.requiredPermission));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen bg-white border-r w-64 shadow-sm transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-full px-4 py-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xl font-bold">Admin Panel</span>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-4">
            {visibleMenuItems.map(item => (
              <Button
                key={item.path}
                variant={pathname === item.path ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => router.push(item.path)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.title}
              </Button>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <Button variant="ghost" className="w-full justify-start text-red-500" onClick={handleLogout}>
              <LogOut className="h-5 w-5 mr-3" /> Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`${isSidebarOpen ? 'md:ml-64' : ''}`}>
        <header className="bg-white border-b sticky top-0 z-30 flex justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Input placeholder="Tìm kiếm..." className="w-[300px]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-4">
            {/* Thông báo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px] max-h-[400px] overflow-auto">
                <DropdownMenuLabel>Thông báo mới</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm p-2">Không có thông báo</p>
                ) : (
                  notifications.map((n, i) => (
                          <DropdownMenuItem
                            key={i}
                            className="cursor-pointer"
                            onClick={() => {
                              router.push('/admin/orders');
                              setTimeout(() => {
                                window.location.reload();
                              }, 300); // Delay nhẹ để đảm bảo điều hướng xong mới reload
                            }}
                          >
                            <div>
                              <p>{n.message}</p>
                              <span className="text-xs text-gray-400">{n.time}</span>
                            </div>
                          </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatar.png" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.fullName || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" /> Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Cài đặt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {/* ✅ Audio preload */}
      <audio ref={audioRef} src="/sounds/noffitication.mp3" preload="auto" />
    </div>
  );
}
