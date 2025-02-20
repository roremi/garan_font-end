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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Product } from '@/types/product';
import { Category } from '@/types/Category';
import { api } from '@/services/api';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => void;
  product?: Product;
  mode: 'add' | 'edit';
}

export function ProductModal({ isOpen, onClose, onSubmit, product, mode }: ProductModalProps) {

  const getImageUrl = (filePath: string) => {
    if (!filePath) return '';
    return `${process.env.NEXT_PUBLIC_API_URL}/${filePath}`;
  };
  // State Management
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    imageId: null,
    categoryId: undefined,
    isAvailable: true,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { toast } = useToast();

  // Fetch categories when modal opens
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen) return;
      
      try {
        setCategoryLoading(true);
        const categoriesData = await api.getCategories();
        setCategories(categoriesData);
        
        // Auto-select first category if none selected
        if (!formData.categoryId && categoriesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            categoryId: categoriesData[0].id
          }));
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách danh mục",
          variant: "destructive",
        });
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, [isOpen]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (mode === 'add') {
      setFormData({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        imageId: null,
        categoryId: categories.length > 0 ? categories[0].id : undefined,
        isAvailable: true,
      });
    } else if (product && mode === 'edit') {
      setFormData({
        ...product,
        price: Number(product.price)
      });
    }
  }, [product, mode, isOpen, categories]);

  // Image Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageLoading(true);
      const response = await api.uploadImage(file);
      
      // Sử dụng filePath thay vì fileName
      const imageUrl = getImageUrl(response.filePath);

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

  // Form Handlers
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const newPrice = parseFloat(rawValue);
    setFormData(prev => ({
      ...prev,
      price: isNaN(newPrice) ? 0 : newPrice
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn danh mục",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const submitData = {
        ...formData,
        price: Number(formData.price),
        categoryId: Number(formData.categoryId)
      };
      await onSubmit(submitData);
      onClose();
      toast({
        title: "Thành công",
        description: mode === 'add' ? "Thêm sản phẩm thành công" : "Cập nhật sản phẩm thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên sản phẩm"
              required
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Nhập mô tả sản phẩm"
              rows={3}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Giá</Label>
            <Input
              id="price"
              type="text"
              value={formData.price?.toLocaleString('vi-VN')}
              onChange={handlePriceChange}
              placeholder="Nhập giá sản phẩm"
              required
            />
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Danh mục</Label>
            <Select
              value={formData.categoryId?.toString()}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))
              }
              disabled={categoryLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categoryLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang tải...
                    </div>
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isAvailable}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isAvailable: checked }))
              }
              id="availability"
            />
            <Label htmlFor="availability">Còn hàng</Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || categoryLoading || !formData.categoryId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {mode === 'add' ? 'Đang thêm...' : 'Đang cập nhật...'}
                </>
              ) : (
                mode === 'add' ? 'Thêm' : 'Cập nhật'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
