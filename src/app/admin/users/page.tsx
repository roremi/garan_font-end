'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle,
  XCircle,
  UserPlus,
  LogOut,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/auth';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  role: string | number; 
  createdAt: string;
  isActive: boolean;
}

// Interface for edit form data that matches UserProfile expectations
interface EditFormData {
  username?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  role?: string; // Make sure role is string type to match UserProfile
  isActive?: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    if (!user) {
      router.push('/admin/login');
      return;
    }
    
    if (Number(user.role) !== 0) {
      toast.error('Bạn không có quyền truy cập trang Admin');
      router.push('/');
      return;
    }
    
    // Load all users
    fetchUsers();
  }, [user, router]);
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const allUsers = await authService.getAllProfiles();
      setUsers(allUsers as User[]);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    authService.logout();
    router.push('/admin/login');
  };
  
  const handleDeleteUser = async (userId: number) => {
    try {
      await authService.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Xóa người dùng thành công');
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa người dùng');
    }
  };
  
  const confirmDelete = (user: User) => {
    if (user.id === currentUserId) {
      toast.error('Không thể tự xóa tài khoản Admin!');
      return;
    }
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setEditFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: String(user.role), // Convert to string to match UserProfile
      isActive: user.isActive
    });
  };
  
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({});
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name: string, value: string | boolean) => {
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };
  
  const handleSaveChanges = async () => {
    if (!editingUserId) return;
    
    try {
      setIsSaving(true);
      
      // Chuẩn bị dữ liệu cập nhật (đảm bảo role là chuỗi)
      const updateData: Partial<UserProfile> = {
        ...editFormData,
        role: editFormData.role
      };
      
      // Gọi API cập nhật và lấy dữ liệu người dùng đã được cập nhật từ API
      const updatedUser = await authService.adminUpdateUser(editingUserId, updateData);
      
      // Cập nhật lại state users với dữ liệu mới trả về từ API
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                ...updatedUser,
                // Nếu cần, chuyển role thành số
                role: updatedUser.role ? Number(updatedUser.role) : u.role
              }
            : u
        )
      );
      
      toast.success('Cập nhật thông tin người dùng thành công');
      setEditingUserId(null);
      setEditFormData({});
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật thông tin người dùng');
    } finally {
      setIsSaving(false);
    }
  };
  
  
  // Get current user ID
  const currentUserId = user?.id || 0;
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
          <p className="text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </header>
      
      {/* Search and filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm người dùng mới
        </Button>
      </div>
      
      {/* Users table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">Đang tải...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tên người dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Không tìm thấy người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    
                    {/* Username cell */}
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Input 
                          name="username"
                          value={editFormData.username || ''}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      ) : (
                        user.username
                      )}
                    </TableCell>
                    
                    {/* Email cell */}
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Input 
                          name="email"
                          value={editFormData.email || ''}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      ) : (
                        user.email
                      )}
                    </TableCell>
                    
                    {/* Full name cell */}
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Input 
                          name="fullName"
                          value={editFormData.fullName || ''}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      ) : (
                        user.fullName
                      )}
                    </TableCell>
                    
                    {/* Role cell */}
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Select
                          value={editFormData.role}
                          onValueChange={(value) => handleSelectChange('role', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Admin</SelectItem>
                            <SelectItem value="1">Khách hàng</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        user.role === 0 ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Khách hàng
                          </span>
                        )
                      )}
                    </TableCell>
                    
                    {/* Status cell */}
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Select
                          value={editFormData.isActive !== undefined ? String(editFormData.isActive) : undefined}
                          onValueChange={(value) => handleSelectChange('isActive', value === 'true')}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Hoạt động</SelectItem>
                            <SelectItem value="false">Đã khóa</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        user.isActive ? (
                          <span className="inline-flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-700">Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-red-700">Đã khóa</span>
                          </span>
                        )
                      )}
                    </TableCell>
                    
                    {/* Created date cell - not editable */}
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    
                    {/* Action buttons cell */}
                    <TableCell className="text-right">
                      {editingUserId === user.id ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Đang lưu...' : <Save className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditClick(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => confirmDelete(user)}
                            disabled={user.id === currentUserId}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      {isDeleteDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Xác nhận xóa người dùng</h3>
            <p className="mb-6">
              Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.fullName}</strong> ({selectedUser.email})?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleDeleteUser(selectedUser.id)}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}