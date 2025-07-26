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
  "permission_view_product",
  "permission_view_admin_page",
  "permission_view_history_order",
  "permission_manager_chat",
  "permission_view_dashboard",
  "permission_view_voucher",
  "permission_update_voucher",
  "permission_create_voucher",
  "permission_delete_voucher",
  "permission_view_allprofile",
  "permission_update_profile",
  "permission_delete_user",
  "permission_delete_shipper",
  "permission_update_shipper",
  "permission_create_shipper",
  "permission_view_order",
  "permission_view_combo",
  "permission_update_combo",
  "permission_delete_combo",
  "permission_view_comboproduct",
  "permission_create_comboproduct",
  "permission_update_comboproduct",
  "permission_delete_comboproduct",
  "permission_delete_category",
  "permission_create_category",
  "permission_put_category",
  "permission_update_category",
];
const PRESET_PERMISSIONS: Record<string, string[]> = {
  "Kế toán": [
    "permission_view_admin_page",
    "permission_view_dashboard",
    "permission_view_history_order",
    "permission_view_product",
    "permission_view_voucher",
  ],
  "Thu ngân": [
    "permission_view_order",
    "permission_update_order",
    "permission_view_product",
    "permission_view_voucher",
  ],
  "Phục vụ": [
    "permission_view_order",
    "permission_update_order",
    "permission_view_product",
    "permission_view_combo",
  ],
  "Quản lý nhân sự": [
    "permission_view_allprofile",
    "permission_update_profile",
    "permission_delete_user",
    "permission_create_shipper",
    "permission_update_shipper",
    "permission_delete_shipper",
  ],
};

export default function UserPermissionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const applyPreset = (role: string) => {
    const permissions = PRESET_PERMISSIONS[role] || [];
    setSelectedPermissions(permissions);
  };
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
      const filteredUsers = allUsers.filter(u => {
      const role = Number(u.role);
      return role !== 0 && role !== 2;
    });
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
const getGroupedPermissions = () => {
  const groups: Record<string, any> = {};

  ALL_PERMISSIONS.forEach((perm) => {
    const parts = perm.split('_');
    const action = parts[1]; // view, update, delete, create, etc.
    const entity = parts.slice(2).join('_'); // product, shipper, etc.

    if (!groups[entity]) {
      groups[entity] = { entity, perms: {} };
    }

    if (['view'].includes(action)) groups[entity].perms.view = perm;
    else if (['update', 'put'].includes(action)) groups[entity].perms.update = perm;
    else if (['manager'].includes(action)) groups[entity].perms.update = perm;
    else if (['delete'].includes(action)) groups[entity].perms.delete = perm;
    else if (['create'].includes(action)) groups[entity].perms.create = perm;
  });

  // Sort alphabetically by entity name
  return Object.values(groups).sort((a: any, b: any) => a.entity.localeCompare(b.entity));
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
<DialogContent className="max-w-6xl">
  <DialogHeader>
    <DialogTitle>Cấp quyền cho {selectedUser?.username}</DialogTitle>
  </DialogHeader>

  <div className="flex flex-wrap gap-2 mb-4">
    {Object.keys(PRESET_PERMISSIONS).map(role => (
      <Button
        key={role}
        variant="outline"
        onClick={() => applyPreset(role)}
      >
        Chọn quyền {role}
      </Button>
    ))}
  </div>

  <div className="overflow-x-auto mt-4">
    <table className="w-full text-sm border font-mono">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="p-2">Thực thể</th>
          <th className="p-2 text-left">View</th>
          <th className="p-2 text-left">Update</th>
          <th className="p-2 text-left">Delete</th>
          <th className="p-2 text-left">Create</th>
        </tr>
      </thead>
      <tbody>
        {getGroupedPermissions().map(({ entity, perms }) => (
          <tr key={entity} className="border-t">
            <td className="p-2 font-semibold capitalize">{entity.replace(/_/g, ' ')}</td>
            {['view', 'update', 'delete', 'create'].map((action) => {
              const fullPerm = perms[action];
              return (
                <td key={action} className="p-2 align-top">
                  {fullPerm ? (
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={fullPerm}
                        checked={selectedPermissions.includes(fullPerm)}
                        onCheckedChange={() => togglePermission(fullPerm)}
                      />
                      <label
                        htmlFor={fullPerm}
                        className="text-xs text-muted-foreground break-all font-mono"
                      >
                        {fullPerm}
                      </label>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
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
