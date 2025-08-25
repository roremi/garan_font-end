"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Package, ArrowRight, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CategoryModal } from "@/components/CategoryModal";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/services/api";
import { Category } from "@/types/Category";
import { Product } from "@/types/product";

const CategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsWithoutCategory, setProductsWithoutCategory] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isManageProductsOpen, setIsManageProductsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCategoryProducts, setSelectedCategoryProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadProducts(),
        loadProductsWithoutCategory()
      ]);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      throw error;
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      throw error;
    }
  };

  const loadProductsWithoutCategory = async () => {
    try {
      const data = await api.getProductsWithoutCategory();
      setProductsWithoutCategory(data);
    } catch (error) {
      console.error("Error loading products without category:", error);
      throw error;
    }
  };

  const handleAddCategory = async (categoryData: Partial<Category>) => {
    try {
      await api.addCategory({
        name: categoryData.name!,
        description: categoryData.description || "",
      });

      await loadData();
      setIsModalOpen(false);

      toast({
        title: "Thành công",
        description: "Thêm danh mục mới thành công",
      });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể thêm danh mục",
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
      });
      
      await loadData();
      setIsModalOpen(false);
      
      toast({
        title: "Thành công",
        description: "Cập nhật danh mục thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật danh mục",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const category = categories.find(c => c.id === id);
    const productCount = getCategoryProductCount(id);
    
    const confirmMessage = productCount > 0 
      ? `Bạn có chắc chắn muốn xóa danh mục này? ${productCount} sản phẩm sẽ không còn thuộc danh mục nào.`
      : "Bạn có chắc chắn muốn xóa danh mục này?";

    if (window.confirm(confirmMessage)) {
      try {
        const result = await api.deleteCategory(id);
        await loadData();
        toast({
          title: "Thành công", 
          description: `${result.message}. Số sản phẩm bị ảnh hưởng: ${result.affectedProductsCount}`,
        });
      } catch (error) {
        toast({
          title: "Lỗi",
          description: error instanceof Error ? error.message : "Không thể xóa danh mục",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewCategoryProducts = async (category: Category) => {
    try {
      setLoading(true);
      const categoryProducts = await api.getProductsByCategory(category.id);
      setSelectedCategory(category);
      setSelectedCategoryProducts(categoryProducts);
      setIsManageProductsOpen(true);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lấy danh sách sản phẩm",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductToCategory = async () => {
    if (!selectedProductId || !selectedCategory) return;

    try {
      const result = await api.addProductToCategory(selectedCategory.id, parseInt(selectedProductId));
      await loadData();
      
      // Refresh category products
      const updatedProducts = await api.getProductsByCategory(selectedCategory.id);
      setSelectedCategoryProducts(updatedProducts);

      toast({
        title: "Thành công",
        description: result.message,
      });
      setSelectedProductId("");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể thêm sản phẩm vào danh mục",
        variant: "destructive",
      });
    }
  };

  const handleRemoveProductFromCategory = async (productId: number) => {
    try {
      const result = await api.removeProductFromCategory(productId);
      await loadData();
      
      // Refresh category products
      if (selectedCategory) {
        const updatedProducts = await api.getProductsByCategory(selectedCategory.id);
        setSelectedCategoryProducts(updatedProducts);
      }

      toast({
        title: "Thành công",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa sản phẩm khỏi danh mục",
        variant: "destructive",
      });
    }
  };

  const handleMoveProduct = async () => {
    if (!selectedProductId || !targetCategoryId) return;

    try {
      const result = await api.moveProductToCategory(parseInt(selectedProductId), parseInt(targetCategoryId));
      await loadData();
      
      toast({
        title: "Thành công",
        description: result.message,
      });
      setSelectedProductId("");
      setTargetCategoryId("");
      setIsProductModalOpen(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể chuyển sản phẩm",
        variant: "destructive",
      });
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

  const getCategoryProductCount = (categoryId: number): number => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return "Chưa phân loại";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Không xác định";
  };

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh mục sản phẩm và phân loại sản phẩm
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsProductModalOpen(true)}
            disabled={products.length === 0}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Chuyển sản phẩm
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="h-5 w-5 mr-2" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng danh mục</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sản phẩm có danh mục</p>
              <p className="text-2xl font-bold">{products.filter(p => p.categoryId !== null).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sản phẩm chưa phân loại</p>
              <p className="text-2xl font-bold">{productsWithoutCategory.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Danh sách danh mục</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Số sản phẩm</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Chưa có danh mục nào
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getCategoryProductCount(category.id)} sản phẩm
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCategoryProducts(category)}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Sản phẩm
                      </Button>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Products without category */}
      {productsWithoutCategory.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-orange-800">
              Sản phẩm chưa được phân loại ({productsWithoutCategory.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {productsWithoutCategory.map((product) => (
              <div key={product.id} className="bg-white p-3 rounded border">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-600">ID: {product.id}</p>
                <p className="text-sm text-gray-600">Giá: {product.price.toLocaleString()}đ</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory || undefined}
        onSubmit={modalMode === "add" ? handleAddCategory : handleEditCategory}
        mode={modalMode}
      />

      {/* Move Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển sản phẩm sang danh mục khác</DialogTitle>
            <DialogDescription>
              Chọn sản phẩm và danh mục đích để thực hiện chuyển đổi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chọn sản phẩm:</label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Chọn sản phẩm --" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} (ID: {product.id}) - {getCategoryName(product.categoryId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Chuyển đến danh mục:</label>
              <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Chọn danh mục đích --" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductModalOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleMoveProduct}
              disabled={!selectedProductId || !targetCategoryId}
            >
              Chuyển sản phẩm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Category Products Modal */}
      <Dialog open={isManageProductsOpen} onOpenChange={setIsManageProductsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Quản lý sản phẩm - {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>
              Thêm hoặc xóa sản phẩm khỏi danh mục này
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add Product to Category */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Thêm sản phẩm vào danh mục</h4>
              {productsWithoutCategory.length > 0 ? (
                <div className="flex gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="-- Chọn sản phẩm chưa có danh mục --" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsWithoutCategory.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} (ID: {product.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddProductToCategory}
                    disabled={!selectedProductId}
                  >
                    Thêm vào danh mục
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Không có sản phẩm nào chưa được phân loại</p>
              )}
            </div>

            {/* Current Products in Category */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">
                Sản phẩm trong danh mục ({selectedCategoryProducts.length})
              </h4>
              {selectedCategoryProducts.length === 0 ? (
                <p className="text-gray-500">Chưa có sản phẩm nào trong danh mục này</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedCategoryProducts.map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          ID: {product.id} - Giá: {product.price.toLocaleString()}đ
                          {!product.isAvailable && <span className="text-red-500"> (Không có sẵn)</span>}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProductFromCategory(product.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Xóa khỏi danh mục
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsManageProductsOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryPage;