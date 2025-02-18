import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Loader2 } from 'lucide-react';
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
import { useToast } from "@/components/ui/use-toast";
import { Product } from '@/types/product';
import { api } from '@/services/api';

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
    imageId: null,
    categoryId: 1,
    isAvailable: true,
  });
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (mode === 'add') {
      setFormData({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        imageId: null,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageLoading(true);
      const response = await api.uploadImage(file);
      
      // Construct full image URL
      const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/${response.filePath}`;

      setFormData(prev => ({
        ...prev,
        imageUrl: imageUrl,
        imageId: response.id
      }));

      toast({
        title: "Thành công",
        description: "Tải ảnh lên thành công",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tải ảnh lên",
        variant: "destructive",
      });
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!formData.imageId) return;

    try {
      setImageLoading(true);
      await api.deleteImage(formData.imageId);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: '',
        imageId: null,
      }));

      toast({
        title: "Thành công",
        description: "Xóa ảnh thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa ảnh",
        variant: "destructive",
      });
    } finally {
      setImageLoading(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Hình ảnh</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 border rounded-lg overflow-hidden">
                {formData.imageUrl ? (
                  <>
                    <Image
                      src={formData.imageUrl}
                      alt="Product"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleDeleteImage}
                      disabled={imageLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100">
                    {imageLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageLoading}
              >
                {imageLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang tải...
                  </>
                ) : (
                  'Chọn ảnh'
                )}
              </Button>
            </div>
          </div>

          {/* Other form fields */}
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
              type="text"
              value={formData.price?.toLocaleString('vi-VN')}
              onChange={handlePriceChange}
              required
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
