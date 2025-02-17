import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Product } from '@/types/product';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => void;
  product?: Product;
  mode: 'add' | 'edit';
}

export function ProductModal({ isOpen, onClose, onSubmit, product, mode }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    categoryId: 1,
    isAvailable: true,
  });

  useEffect(() => {
    if (mode === 'add') {
      setFormData({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        categoryId: 1,
        isAvailable: true,
      });
    } else if (product && mode === 'edit') {
      setFormData({
        ...product,
        price: Number(product.price)
      });
    }
  }, [product, mode, isOpen]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Loại bỏ dấu phẩy và ký tự không phải số
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const newPrice = parseFloat(rawValue);
    setFormData(prev => ({
      ...prev,
      price: isNaN(newPrice) ? 0 : newPrice
    }));
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      price: Number(formData.price),
      categoryId: Number(formData.categoryId)
    };
    onSubmit(submitData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="price">Giá</Label>
            <Input
            id="price"
            type="text" // Đổi từ number sang text để xử lý format
            value={formData.price?.toLocaleString('vi-VN')}
            onChange={handlePriceChange}
            required
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">URL Hình ảnh</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="categoryId">ID Danh mục</Label>
            <Input
              id="categoryId"
              type="number"
              min="1"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isAvailable}
              onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
            />
            <Label>Còn hàng</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              {mode === 'add' ? 'Thêm' : 'Cập nhật'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
