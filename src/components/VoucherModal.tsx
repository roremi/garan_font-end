import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Voucher } from '@/types/voucher';

interface VoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (voucher: any) => void;
    voucher?: Voucher;
    mode: 'add' | 'edit';
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ isOpen, onClose, onSubmit, voucher, mode }) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const timeNow = now.toTimeString().split(' ')[0].slice(0, 5); // HH:mm

  const [formData, setFormData] = useState<Omit<Voucher, 'id'>>({
    code: '',
    description: '',
    type: 'Fixed',
    discountValue: 0,
    discountPercent: undefined,
    maximumDiscount: undefined,
    minimumOrderValue: 0,
    applyToShipping: false,
    expirationDate: `${today}T${timeNow}`,
    status: 'Active',
  });

  useEffect(() => {
    if (voucher && mode === 'edit') {
      const { id, ...rest } = voucher;
      setFormData(rest);
    } else {
      setFormData({
        code: '',
        description: '',
        type: 'Fixed',
        discountValue: 0,
        discountPercent: undefined,
        maximumDiscount: undefined,
        minimumOrderValue: 0,
        applyToShipping: false,
        expirationDate: `${today}T${timeNow}`,
        status: 'Active',
      });
    }
  }, [voucher, mode]);

  const parseCurrencyInput = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned) : '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const val = type === 'checkbox' ? target.checked : value;

    if (name === 'type') {
      const newType = value;
      setFormData(prev => ({
        ...prev,
        type: newType,
        applyToShipping: newType === 'Shipping'
      }));
      return;
    }

    if (["discountValue", "discountPercent", "maximumDiscount", "minimumOrderValue"].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: parseCurrencyInput(val as string)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: val
      }));
    }
  };

  const formatCurrency = (value: number | string | undefined) => {
    if (!value || isNaN(Number(value))) return '';
    return Number(value).toLocaleString('vi-VN');
  };

  const handleSubmit = () => {
    if (mode === 'edit' && voucher?.id) {
      onSubmit({ ...formData, id: voucher.id });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Thêm voucher' : 'Sửa voucher'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block">
            Mã Voucher
            <Input name="code" placeholder="Mã" value={formData.code} onChange={handleChange} />
          </label>

          <label className="block">
            Mô tả
            <Input name="description" placeholder="Mô tả" value={formData.description} onChange={handleChange} />
          </label>

          <label className="block">
            Loại giảm giá
            <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="Fixed">Cố định</option>
              <option value="Percent">Phần trăm</option>
              <option value="Shipping">Miễn phí ship</option>
            </select>
          </label>

          {formData.type === 'Fixed' && (
            <label className="block">
              Giá trị giảm (VNĐ)
              <Input name="discountValue" placeholder="Giảm cố định" value={formatCurrency(formData.discountValue)} onChange={handleChange} />
            </label>
          )}

          {formData.type === 'Percent' && (
            <>
              <label className="block">
                Phần trăm giảm (%)
                <Input name="discountPercent" placeholder="% Giảm" value={formData.discountPercent || ''} onChange={handleChange} />
              </label>
              <label className="block">
                Giảm tối đa (VNĐ)
                <Input name="maximumDiscount" placeholder="Giảm tối đa" value={formatCurrency(formData.maximumDiscount)} onChange={handleChange} />
              </label>
            </>
          )}

          {formData.type === 'Shipping' && (
            <label className="block">
              Phí ship tối đa được giảm (VNĐ)
              <Input name="maximumDiscount" placeholder="Tối đa giảm phí ship" value={formatCurrency(formData.maximumDiscount)} onChange={handleChange} />
            </label>
          )}

          <label className="block">
            Giá trị đơn tối thiểu (VNĐ)
            <Input name="minimumOrderValue" placeholder="Đơn tối thiểu" value={formatCurrency(formData.minimumOrderValue)} onChange={handleChange} />
          </label>

          {formData.type === 'Shipping' && (
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="applyToShipping" checked={formData.applyToShipping} onChange={handleChange} />
              <span>Áp dụng cho phí ship</span>
            </label>
          )}

          <label className="block">
            Hết hạn lúc
            <Input name="expirationDate" type="datetime-local" value={formData.expirationDate} onChange={handleChange} />
          </label>

          <label className="block">
            Trạng thái
            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="Active">Hiển thị</option>
              <option value="Inactive">Ẩn</option>
            </select>
          </label>

          <Button onClick={handleSubmit} className="w-full">Lưu</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
