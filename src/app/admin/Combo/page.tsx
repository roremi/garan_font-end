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
import { ComboModal } from '@/components/ComboModal';
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/services/api';

import { Combo, ComboProduct } from '@/types/combo';
import { ComboCategory } from '@/types/ComboCategory';

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categories, setCategories] = useState<ComboCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const { toast } = useToast();

  useEffect(() => {
    loadCombos();
    loadCategories();
  }, []);

  const loadCombos = async () => {
    try {
      const data = await api.getCombos();
      setCombos(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách combo",
        variant: "destructive",
      });
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getComboCategories();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách danh mục combo",
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Không có danh mục";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Không tìm thấy";
  };

  const handleAddCombo = async (comboData: Partial<Combo>, selectedProducts: ComboProduct[]) => {
    try {
      // Thêm combo mới
      const newCombo = await api.addCombo(comboData as Omit<Combo, 'id'>);
      
      // Thêm các sản phẩm vào combo
      for (const product of selectedProducts) {
        await api.addComboProduct({
          ...product,
          comboId: newCombo.id
        });
      }
  
      loadCombos();
      toast({
        title: "Thành công",
        description: "Thêm combo mới thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm combo",
        variant: "destructive",
      });
    }
  };
  
  const handleEditCombo = async (comboData: Partial<Combo>, selectedProducts: ComboProduct[]) => {
    if (!selectedCombo) return;
    try {
      // Cập nhật thông tin combo
      const updatedCombo = {
        id: selectedCombo.id,
        name: comboData.name,
        description: comboData.description,
        price: comboData.price,
        imageUrl: comboData.imageUrl,
        isAvailable: comboData.isAvailable,
        categoryId: comboData.categoryId
      };
  
      await api.updateCombo(selectedCombo.id, updatedCombo as Combo);
  
      // Xóa tất cả combo products cũ
      const existingProducts = await api.getComboProductsByComboId(selectedCombo.id);
      for (const product of existingProducts) {
        await api.deleteComboProduct(selectedCombo.id, product.productId);
      }
  
      // Thêm lại các combo products mới
      for (const product of selectedProducts) {
        const comboProduct = {
          comboId: selectedCombo.id,
          productId: product.productId,
          quantity: product.quantity,
          productName: product.productName
        };
        await api.addComboProduct(comboProduct);
      }
  
      await loadCombos(); // Tải lại danh sách combo
      setIsModalOpen(false);
      toast({
        title: "Thành công",
        description: "Cập nhật combo thành công",
      });
    } catch (error) {
      console.error('Error updating combo:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật combo",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteCombo = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa combo này?')) {
      try {
        await api.deleteCombo(id);
        loadCombos();
        toast({
          title: "Thành công",
          description: "Xóa combo thành công",
        });
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể xóa combo",
          variant: "destructive",
        });
      }
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedCombo(null);
    setIsModalOpen(true);
  };

  const openEditModal = (combo: Combo) => {
    setModalMode('edit');
    setSelectedCombo(combo);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Combo</h1>
        <Button onClick={openAddModal}>
          <Plus className="h-5 w-5 mr-2" />
          Thêm Combo
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên Combo</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combos.map((combo) => (
              <TableRow key={combo.id}>
                <TableCell>{combo.id}</TableCell>
                <TableCell>{combo.name}</TableCell>
                <TableCell>{combo.description}</TableCell>
                <TableCell>{combo.price.toLocaleString()}đ</TableCell>
                <TableCell>
                  {combo.isAvailable ? 'Đang bán' : 'Ngừng bán'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => openEditModal(combo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDeleteCombo(combo.id)}
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

      <ComboModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        combo={selectedCombo || undefined}
        onSubmit={modalMode === 'add' ? handleAddCombo : handleEditCombo}
        mode={modalMode}
      />
    </div>
  );
}
