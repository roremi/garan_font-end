'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast";
import { useCart } from '@/contexts/CartContext';
import { Combo, ComboProduct } from '@/types/combo';
import { ComboCategory } from '@/types/ComboCategory';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';

export default function CombosPage() {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categories, setCategories] = useState<ComboCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [combosData, categoriesData] = await Promise.all([
          api.getCombos(),
          api.getComboCategories()
        ]);
        
        console.log("Fetched combos:", combosData);
        console.log("Fetched categories:", categoriesData);
        
        setCombos(combosData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải dữ liệu combo. Vui lòng thử lại sau.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Lọc combo theo tên và danh mục
  const filteredCombos = useMemo(() => {
    return combos.filter(combo => {
      // Kiểm tra xem combo có thông tin category không
      const comboCategory = combo.category?.name || 
                           (combo.categoryId ? categories.find(cat => cat.id === combo.categoryId)?.name : null);
      
      const matchesCategory = selectedCategory === "Tất cả" || comboCategory === selectedCategory;
      const matchesSearch = combo.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [combos, categories, selectedCategory, searchQuery]);

  const getCategoryName = (combo: Combo) => {
    // Lấy tên danh mục từ đối tượng category hoặc từ categoryId
    if (combo.category?.name) {
      return combo.category.name;
    }
    
    if (combo.categoryId) {
      const category = categories.find(cat => cat.id === combo.categoryId);
      return category?.name || "Không tìm thấy";
    }
    
    return "Không có danh mục";
  };

  const handleAddToCart = async (combo: Combo) => {
    if (!combo.isAvailable) {
      toast({
        variant: "destructive",
        title: "Không thể thêm vào giỏ hàng",
        description: "Combo này hiện không khả dụng",
      });
      return;
    }
  
    try {
      await addToCart('Combo', combo.id, 1);
      toast({
        title: "Thêm vào giỏ hàng thành công",
        description: `Đã thêm ${combo.name} vào giỏ hàng`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể thêm vào giỏ hàng",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Combo thực đơn</h1>
            <p className="mt-2 text-gray-600">Tiết kiệm hơn với các combo đặc biệt của chúng tôi</p>
          </div>
        </div>
        {/* Debug info - Xóa sau khi debug xong
        <div className="container mx-auto px-4 py-2 text-xs text-gray-500">
          <p>Danh mục đã chọn: {selectedCategory}</p>
          <p>Số lượng combo: {combos.length}</p>
          <p>Số lượng combo đã lọc: {filteredCombos.length}</p>
        </div> */}

        {/* Categories and Search Section */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "Tất cả" ? "default" : "outline"}
                onClick={() => setSelectedCategory("Tất cả")}
              >
                Tất cả
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm combo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Combos Grid */}
        <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
  {filteredCombos.map((combo) => (
    <div key={combo.id} className="bg-white rounded-2xl shadow p-4 flex flex-col h-full">
      
      {/* Ảnh combo giữ tỉ lệ và không méo */}
      <div className="relative w-full aspect-[4/3] mb-4 rounded-lg overflow-hidden">
        <Image
          src={combo.imageUrl || '/images/default-combo.jpg'}
          alt={combo.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Tiêu đề & Giá */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-gray-900">{combo.name}</h3>
        <p className="text-sm font-semibold text-gray-900">
          {combo.price.toLocaleString()}đ
        </p>
      </div>

      {/* Mô tả sản phẩm dạng rút gọn */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {combo.comboProducts?.map(p => `${p.quantity} ${p.productName}`).join(" + ")}
      </p>

      {/* Nút Thêm */}
      <Button
        className="mt-auto w-full bg-black text-white hover:bg-zinc-800 rounded-full py-2"
        onClick={() => handleAddToCart(combo)}
        disabled={!combo.isAvailable}
      >
        {combo.isAvailable ? 'Thêm' : 'Không khả dụng'}
      </Button>
    </div>
  ))}
</div>

        </div>

        {/* No Results Message */}
        {filteredCombos.length === 0 && (
          <div className="container mx-auto px-4 py-12 text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-semibold text-gray-900">Không tìm thấy combo</h3>
              <p className="mt-2 text-gray-600">
                Không có combo nào phù hợp với tiêu chí tìm kiếm của bạn.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setSelectedCategory("Tất cả");
                  setSearchQuery("");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
