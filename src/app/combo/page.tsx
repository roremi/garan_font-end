'use client';
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast";
import { useCart } from '@/contexts/CartContext';
import { Combo, ComboProduct } from '@/types/combo';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';

export default function CombosPage() {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [comboProducts, setComboProducts] = useState<ComboProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getCombos();
        console.log('Combos data:', response); // Để debug
        setCombos(response);
      } catch (error) {
        console.error('Error fetching combos:', error);
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

  // Lọc combo theo tên
  const filteredCombos = combos.filter(combo =>
    combo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lấy sản phẩm của combo
  const getComboProducts = (comboId: number) => {
    return comboProducts.filter(cp => cp.comboId === comboId);
  };

  const handleAddToCart = (combo: Combo) => {
    if (!combo.isAvailable) {
      toast({
        variant: "destructive",
        title: "Không thể thêm vào giỏ hàng",
        description: "Combo này hiện không khả dụng",
      });
      return;
    }
  
    addToCart({
      id: combo.id,
      name: combo.name,
      price: combo.price,
      imageUrl: combo.imageUrl,
      quantity: 1,
      type: 'combo'
    });
  
    toast({
      title: "Thêm vào giỏ hàng thành công",
      description: `Đã thêm ${combo.name} vào giỏ hàng`,
    });
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
        <div className="bg-orange-600 text-white">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-4">Combo Ưu Đãi</h1>
            <p className="text-xl opacity-90">Tiết kiệm hơn với các combo đặc biệt của chúng tôi</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="container mx-auto px-4 py-6">
          <div className="relative w-full md:w-96 mx-auto">
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

        {/* Combos Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCombos.map((combo) => (
              <div key={combo.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={combo.imageUrl || '/images/default-combo.jpg'}
                    alt={combo.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{combo.name}</h3>
                  <p className="text-gray-600 mb-4">{combo.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    {combo.comboProducts && combo.comboProducts.map((product, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{product.quantity}x {product.productName}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-orange-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(combo.price)}
                    </span>
                  </div>

                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={!combo.isAvailable}
                    onClick={() => handleAddToCart(combo)}
                  >
                    {combo.isAvailable ? 'Đặt ngay' : 'Không khả dụng'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}