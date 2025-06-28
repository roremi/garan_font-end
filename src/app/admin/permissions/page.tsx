'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ALL_PERMISSIONS = [
  "permission_delete_product",
  "permission_update_product",
  "permission_view_orders"
];

export default function UserPermissionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user || Number(user.role) !== 0) {
      toast({ title: 'Không có quyền truy cập', variant: 'destructive' });
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await api.getAllUserProfiles();
      const filteredUsers = allUsers.filter(u => Number(u.role) !== 0); // loại admin
      setUsers(filteredUsers);
    } catch (err: any) {
      toast({ title: 'Lỗi tải danh sách user', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openPermissionDialog = async (user: any) => {
    try {
      setSelectedUser(user);
      setDialogOpen(true);
      const data = await api.getUserPermissions(user.id);
      setSelectedPermissions(data.permissions);
    } catch (err: any) {
      toast({ title: 'Lỗi tải quyền', description: err.message, variant: 'destructive' });
    }
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      await api.assignPermissionsToUser(selectedUser.id, selectedPermissions);
      toast({ title: 'Đã cập nhật quyền thành công' });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Lỗi khi cập nhật quyền', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="p-6 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Danh sách người dùng</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className="border rounded-lg p-4 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold">{user.fullName || user.username}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">SĐT: {user.phoneNumber}</p>
            </div>
            <Button className="mt-4" onClick={() => openPermissionDialog(user)}>
              Cấp quyền
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cấp quyền cho {selectedUser?.username}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {ALL_PERMISSIONS.map((perm) => (
              <div key={perm} className="flex items-center space-x-3">
                <Checkbox
                  id={perm}
                  checked={selectedPermissions.includes(perm)}
                  onCheckedChange={() => togglePermission(perm)}
                />
                <label htmlFor={perm} className="text-sm">{perm}</label>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-6">
            <Button onClick={savePermissions}>Lưu quyền</Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
