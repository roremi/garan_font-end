'use client';

import React, { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ShippingConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export default function ShippingPage() {
  const [configs, setConfigs] = useState<ShippingConfig[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (Number(user.role) !== 0) {
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền truy cập trang cấu hình phí ship",
        variant: "destructive",
      });
      router.push('/');
      return;
    }

    loadConfigs();
  }, [user]);

  const loadConfigs = async () => {
    try {
      const data = await api.getShippingConfigs();
      setConfigs(data);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setNewValue(currentValue);
  };
  const cancelEdit = () => {
    setEditingKey(null);
    setNewValue('');
  };

  

  const handleSave = async (key: string) => {
    try {
      await api.updateShippingConfig(key, newValue);
      toast({
        title: "Thành công",
        description: "Cập nhật cấu hình thành công",
      });
      setEditingKey(null);
      loadConfigs();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    }
  };
  

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Cấu hình phí vận chuyển</h1>
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.id}>
                <TableCell>{config.id}</TableCell>
                <TableCell>{config.key}</TableCell>
                <TableCell>
                  {editingKey === config.key ? (
                    <input
                      className="border px-2 py-1 rounded w-full"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  ) : (
                    config.value
                  )}
                </TableCell>
                <TableCell>{config.description || '-'}</TableCell>
                <TableCell>
                    {editingKey === config.key ? (
                        <div className="flex space-x-2">
                        <Button onClick={() => handleSave(config.key)}>Lưu</Button>
                        <Button variant="outline" onClick={cancelEdit}>Hủy</Button>
                        </div>
                    ) : (
                        <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(config.key, config.value)}
                        >
                        <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
