'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/services/api';
import { Product } from '@/types/product';
import { Category } from '@/types/Category';
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast";
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, productsData] = await Promise.all([
          api.getCategories(),
          api.getProducts()
        ]);
        
        setCategories(categoriesData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "Tất cả" || 
      categories.find(cat => cat.id === product.categoryId)?.name === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!product.isAvailable) {
      toast({
        variant: "destructive",
        title: "Không thể thêm vào giỏ hàng",
        description: "Sản phẩm hiện không còn hàng",
      });
      return;
    }

    addToCart({
      ...product,
      quantity: 1
    });

    toast({
      title: "Thêm vào giỏ hàng thành công",
      description: `Đã thêm ${product.name} vào giỏ hàng`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-4">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
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
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Thực đơn</h1>
            <p className="mt-2 text-gray-600">Khám phá các món ăn đặc sắc của chúng tôi</p>
          </div>
        </div>

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
                placeholder="Tìm kiếm món ăn..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link 
                href={`/products/${product.id}`} 
                key={product.id}
                className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(product.price)}
                    </span>
                    <Button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={!product.isAvailable}
                    >
                      {product.isAvailable ? 'Thêm vào giỏ' : 'Hết hàng'}
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="container mx-auto px-4 py-12 text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-semibold text-gray-900">Không tìm thấy sản phẩm</h3>
              <p className="mt-2 text-gray-600">
                Không có sản phẩm nào phù hợp với tiêu chí tìm kiếm của bạn.
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
