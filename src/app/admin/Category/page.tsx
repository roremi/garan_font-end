"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryModal } from "@/components/CategoryModal";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";
import { Category } from "@/types/Category";

const CategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách danh mục",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async (categoryData: Partial<Category>) => {
    try {
      await api.addCategory({
        name: categoryData.name!,
        description: categoryData.description || "",
      });

      await loadCategories();

      toast({
        title: "Thành công",
        description: "Thêm danh mục mới thành công",
      });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Không thể thêm danh mục",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (categoryData: Partial<Category>) => {
    if (!selectedCategory) return;
    try {
      await api.updateCategory(selectedCategory.id, {
        ...selectedCategory,
        ...categoryData,
      } as Category);
      loadCategories();
      toast({
        title: "Thành công",
        description: "Cập nhật danh mục thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật danh mục",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await api.deleteCategory(id);
        loadCategories();
        toast({
          title: "Thành công",
          description: "Xóa danh mục thành công",
        });
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể xóa danh mục",
          variant: "destructive",
        });
      }
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <Button onClick={openAddModal}>
          <Plus className="h-5 w-5 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditModal(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id)}
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

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory || undefined}
        onSubmit={modalMode === "add" ? handleAddCategory : handleEditCategory}
        mode={modalMode}
      />
    </div>
  );
};

export default CategoryPage;
