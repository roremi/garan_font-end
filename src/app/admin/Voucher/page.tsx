'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Voucher } from '@/types/voucher';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { VoucherModal } from '@/components/VoucherModal';

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (Number(user.role) !== 0) {
      toast({ title: 'Không có quyền', variant: 'destructive' });
      router.push('/');
    } else {
      loadVouchers();
    }
  }, [user]);

  const loadVouchers = async () => {
    try {
      const data = await api.getVouchers();
      setVouchers(data);
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    }
  };

  const handleAdd = async (voucher: Voucher | Omit<Voucher, 'id'>) => {
    const { id, ...data } = voucher as Voucher;
    await api.addVoucher(data);
    toast({ title: 'Đã thêm voucher' });
    setIsModalOpen(false);
    loadVouchers();
  };
  

  const handleEdit = async (voucher: Voucher) => {
    await api.updateVoucher(voucher.id, voucher);
    toast({ title: 'Đã cập nhật voucher' });
    setIsModalOpen(false);
    loadVouchers();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xác nhận xoá voucher này?')) {
      await api.deleteVoucher(id);
      toast({ title: 'Đã xoá voucher' });
      loadVouchers();
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedVoucher(null);
    setIsModalOpen(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setModalMode('edit');
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Voucher</h1>
        <Button onClick={openAddModal}><Plus className="h-5 w-5 mr-2" />Thêm voucher</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Mô tả</TableHead>
              {/* <TableHead>Giá trị</TableHead> */}
              <TableHead>HSD</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map(v => (
              <TableRow key={v.id}>
                <TableCell>{v.code}</TableCell>
                <TableCell>{v.type}</TableCell>
                <TableCell>{v.description}</TableCell>
                {/* <TableCell>{v.discountValue ?? `${v.discountPercent}%`}</TableCell> */}
                <TableCell>{new Date(v.expirationDate).toLocaleDateString()}</TableCell>
                <TableCell>{v.status}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditModal(v)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <VoucherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        voucher={selectedVoucher || undefined}
        onSubmit={modalMode === 'add' ? handleAdd : handleEdit}
        mode={modalMode}
      />
    </div>
  );
}
