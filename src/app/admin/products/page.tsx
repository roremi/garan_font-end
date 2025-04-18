'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductModal } from '@/components/ProductModal';
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/services/api';
import { Product } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  // Kiểm tra quyền Admin khi component mount
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (Number(user.role) !== 0) { // 0 là role Admin
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền truy cập trang quản lý sản phẩm",
        variant: "destructive",
      });
      router.push('/');
      return;
    }

    loadProducts();
  }, [user, router]);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách sản phẩm",
        variant: "destructive",
      });
    }
  };

  const handleAddProduct = async (productData: Partial<Product>) => {
    try {
      if (!user || Number(user.role) !== 0) {
        toast({
          title: "Không có quyền",
          description: "Bạn không có quyền thêm sản phẩm",
          variant: "destructive",
        });
        return;
      }

      await api.addProduct(productData as Omit<Product, 'id'>);
      loadProducts();
      setIsModalOpen(false);
      toast({
        title: "Thành công",
        description: "Thêm sản phẩm mới thành công",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm sản phẩm",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = async (productData: Partial<Product>) => {
    if (!selectedProduct) return;
    try {
      if (!user || Number(user.role) !== 0) {
        toast({
          title: "Không có quyền",
          description: "Bạn không có quyền sửa sản phẩm",
          variant: "destructive",
        });
        return;
      }

      await api.updateProduct(selectedProduct.id, {
        ...selectedProduct,
        ...productData,
      } as Product);
      loadProducts();
      setIsModalOpen(false);
      toast({
        title: "Thành công",
        description: "Cập nhật sản phẩm thành công",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật sản phẩm",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      if (!user || Number(user.role) !== 0) {
        toast({
          title: "Không có quyền",
          description: "Bạn không có quyền xóa sản phẩm",
          variant: "destructive",
        });
        return;
      }

      if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        await api.deleteProduct(id);
        loadProducts();
        toast({
          title: "Thành công",
          description: "Xóa sản phẩm thành công",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa sản phẩm",
        variant: "destructive",
      });
    }
  };

  const openAddModal = () => {
    if (!user || Number(user.role) !== 0) {
      toast({
        title: "Không có quyền",
        description: "Bạn không có quyền thêm sản phẩm",
        variant: "destructive",
      });
      return;
    }
    setModalMode('add');
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (!user || Number(user.role) !== 0) {
      toast({
        title: "Không có quyền",
        description: "Bạn không có quyền sửa sản phẩm",
        variant: "destructive",
      });
      return;
    }
    setModalMode('edit');
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Nếu không phải admin, không hiển thị gì cả
  if (!user || Number(user.role) !== 0) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <Button onClick={openAddModal}>
          <Plus className="h-5 w-5 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>{product.price.toLocaleString()}đ</TableCell>
                <TableCell>
                  {product.isAvailable ? 'Còn hàng' : 'Hết hàng'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => openEditModal(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct || undefined}
        onSubmit={modalMode === 'add' ? handleAddProduct : handleEditProduct}
        mode={modalMode}
      />
    </div>
  );
}
