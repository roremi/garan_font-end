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
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Driver } from '@/types/driver';
import { authService } from '@/services/auth.service';

interface EditFormData {
  fullName?: string;
  phoneNumber?: string;
  vehiclePlate?: string;
  isAvailable?: boolean;
}

interface CreateFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  vehiclePlate: string;
}

export default function ShipperManagement() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [shippers, setShippers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipper, setSelectedShipper] = useState<Driver | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingShipperId, setEditingShipperId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateFormData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    vehiclePlate: ''
  });

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
    
    fetchShippers();
  }, [user, router]);

  const fetchShippers = async () => {
    try {
      setIsLoading(true);
      const allShippers = await authService.getAllShippers();
      setShippers(allShippers);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách tài xế');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShipper = async (shipperId: number) => {
    try {
      await authService.deleteShipper(shipperId);
      setShippers(shippers.filter(s => s.id !== shipperId));
      toast.success('Xóa tài xế thành công');
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa tài xế');
    }
  };

  const confirmDelete = (shipper: Driver) => {
    setSelectedShipper(shipper);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (shipper: Driver) => {
    setEditingShipperId(shipper.id);
    setEditFormData({
      fullName: shipper.fullName,
      phoneNumber: shipper.phoneNumber,
      vehiclePlate: shipper.driverInfo?.vehiclePlate,
      isAvailable: shipper.driverInfo?.isAvailableShipper
    });
  };

  const handleCancelEdit = () => {
    setEditingShipperId(null);
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
    if (!editingShipperId) return;

    try {
      setIsSaving(true);
      const updateData = {
        fullName: editFormData.fullName || '',
        phoneNumber: editFormData.phoneNumber || '',
        vehiclePlate: editFormData.vehiclePlate || '',
        isAvailable: editFormData.isAvailable ?? true
      };

      await authService.updateShipper(editingShipperId, updateData);
      
      setShippers(shippers.map(s =>
        s.id === editingShipperId ? {
          ...s,
          fullName: updateData.fullName,
          phoneNumber: updateData.phoneNumber,
          driverInfo: {
            ...s.driverInfo!,
            vehiclePlate: updateData.vehiclePlate,
            isAvailableShipper: updateData.isAvailable
          }
        } : s
      ));

      toast.success('Cập nhật thông tin tài xế thành công');
      setEditingShipperId(null);
      setEditFormData({});
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật thông tin tài xế');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: value
    });
  };

  const handleCreateShipper = async () => {
    try {
      await authService.createShipper(createFormData);
      toast.success('Tạo tài xế thành công');
      setIsCreateDialogOpen(false);
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        vehiclePlate: ''
      });
      fetchShippers();
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo tài xế');
    }
  };

  const filteredShippers = shippers.filter(shipper =>
    shipper.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipper.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipper.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý tài xế</h1>
          <p className="text-gray-600">Quản lý tất cả tài xế trong hệ thống</p>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm tài xế..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm tài xế mới
        </Button>
      </div>

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
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Biển số xe</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Điểm đánh giá</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShippers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Không tìm thấy tài xế nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredShippers.map((shipper) => (
                  <TableRow key={shipper.id}>
                    <TableCell>{shipper.id}</TableCell>
                    <TableCell>{shipper.username}</TableCell>
                    <TableCell>{shipper.email}</TableCell>
                    <TableCell>
                      {editingShipperId === shipper.id ? (
                        <Input
                          name="fullName"
                          value={editFormData.fullName || ''}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      ) : (
                        shipper.fullName
                      )}
                    </TableCell>
                    <TableCell>
                      {editingShipperId === shipper.id ? (
                        <Input
                          name="phoneNumber"
                          value={editFormData.phoneNumber || ''}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      ) : (
                        shipper.phoneNumber
                      )}
                    </TableCell>
                    <TableCell>
                      {editingShipperId === shipper.id ? (
                        <Input
                          name="vehiclePlate"
                          value={editFormData.vehiclePlate || ''}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      ) : (
                        shipper.driverInfo?.vehiclePlate
                      )}
                    </TableCell>
                    <TableCell>
                      {editingShipperId === shipper.id ? (
                        <Select
                          value={editFormData.isAvailable !== undefined ? String(editFormData.isAvailable) : undefined}
                          onValueChange={(value) => handleSelectChange('isAvailable', value === 'true')}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sẵn sàng</SelectItem>
                            <SelectItem value="false">Không sẵn sàng</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        shipper.driverInfo?.isAvailableShipper ? (
                          <span className="inline-flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-700">Sẵn sàng</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-red-700">Không sẵn sàng</span>
                          </span>
                        )
                      )}
                    </TableCell>
                    <TableCell>{shipper.driverInfo?.feedbackRating.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      {editingShipperId === shipper.id ? (
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
                            onClick={() => handleEditClick(shipper)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => confirmDelete(shipper)}
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
      {isDeleteDialogOpen && selectedShipper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Xác nhận xóa tài xế</h3>
            <p className="mb-6">
              Bạn có chắc chắn muốn xóa tài xế <strong>{selectedShipper.fullName}</strong> ({selectedShipper.email})?
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
                onClick={() => handleDeleteShipper(selectedShipper.id)}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create shipper dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tài xế mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="username" className="text-right">Tên người dùng</label>
              <Input
                id="username"
                name="username"
                value={createFormData.username}
                onChange={handleCreateInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                value={createFormData.email}
                onChange={handleCreateInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="password" className="text-right">Mật khẩu</label>
              <Input
                id="password"
                name="password"
                type="password"
                value={createFormData.password}
                onChange={handleCreateInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="fullName" className="text-right">Họ tên</label>
              <Input
                id="fullName"
                name="fullName"
                value={createFormData.fullName}
                onChange={handleCreateInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="phoneNumber" className="text-right">Số điện thoại</label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={createFormData.phoneNumber}
                onChange={handleCreateInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="vehiclePlate" className="text-right">Biển số xe</label>
              <Input
                id="vehiclePlate"
                name="vehiclePlate"
                value={createFormData.vehiclePlate}
                onChange={handleCreateInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateShipper}>Tạo tài xế</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}