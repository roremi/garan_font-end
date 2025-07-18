'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/services/api';
import { Product } from '@/types/product';
import { Category } from '@/types/Category';
import Image from 'next/image';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

// Components
const ProductSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-48 bg-gray-200 rounded-lg"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="flex gap-2">
      <div className="h-10 bg-gray-200 rounded flex-1"></div>
      <div className="h-10 bg-gray-200 rounded flex-1"></div>
    </div>
  </div>
);

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onNavigate: (id: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onNavigate }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-all">
    <div 
      className="cursor-pointer"
      onClick={() => onNavigate(product.id)}
    >
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Hình ảnh không có sẵn
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold">Hết hàng</span>
          </div>
        )}
      </div>
    </div>
    <div className="p-4">
      <h3 
        className="font-bold mb-2 hover:text-orange-600 transition-colors cursor-pointer"
        onClick={() => onNavigate(product.id)}
      >
        {product.name}
      </h3>
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
        {product.description}
      </p>
      <p className="text-orange-600 font-bold mb-4">
        {new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(product.price)}
      </p>
      <div className="flex gap-2">
        <Button 
          className="flex-1"
          variant="outline"
          onClick={() => onNavigate(product.id)}
        >
          Chi tiết
        </Button>
        <Button 
          className="flex-1"
          disabled={!product.isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            product.isAvailable && onAddToCart(product);
          }}
        >
          {product.isAvailable ? 'Thêm vào giỏ' : 'Hết hàng'}
        </Button>
      </div>
    </div>
  </div>
);

export default function MenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
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
        toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.', {
          description: 'Lỗi',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === "Tất cả" || 
        categories.find(cat => cat.id === product.categoryId)?.name === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, categories, selectedCategory, searchQuery]);

  const handleAddToCart = (product: Product) => {
    if (!authService.isAuthenticated()) {
      toast.error('Yêu cầu khách hàng đăng nhập', {
        description: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
      });
      return;
    }

    if (!product.isAvailable) {
      toast.error('Không thể thêm vào giỏ hàng', {
        description: 'Sản phẩm hiện không còn hàng',
      });
      return;
    }
  
    addToCart("Product", product.id, 1);
  
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`, {
      description: 'Thêm vào giỏ hàng thành công',
    });
  };

  const handleNavigateToProduct = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
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
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onNavigate={handleNavigateToProduct}
              />
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