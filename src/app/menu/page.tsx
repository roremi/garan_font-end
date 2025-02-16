'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Dữ liệu mẫu cho danh mục
const categories = [
  "Tất cả",
  "Gà rán",
  "Combo",
  "Burger",
  "Đồ ăn kèm",
  "Đồ uống",
];

// Dữ liệu mẫu cho sản phẩm
const products = [
  {
    id: 1,
    name: "Gà rán sốt cay",
    category: "Gà rán",
    price: 89000,
    image: "/images/spicy-chicken.jpg",
    description: "Gà rán sốt cay Hàn Quốc"
  },
  {
    id: 2,
    name: "Combo gia đình",
    category: "Combo",
    price: 259000,
    image: "/images/family-combo.jpg",
    description: "6 miếng gà + 3 khoai tây + 3 nước"
  },
  {
    id: 3,
    name: "Burger Gà Giòn",
    category: "Burger",
    price: 45000,
    image: "/images/chicken-burger.jpg",
    description: "Burger với gà rán giòn"
  },
  {
    id: 4,
    name: "Khoai tây chiên",
    category: "Đồ ăn kèm",
    price: 25000,
    image: "/images/french-fries.jpg",
    description: "Khoai tây chiên giòn"
  },
  {
    id: 5,
    name: "Coca Cola",
    category: "Đồ uống",
    price: 15000,
    image: "/images/coca-cola.jpg",
    description: "Coca Cola lon 330ml"
  },
  // Thêm nhiều sản phẩm khác...
];

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "Tất cả" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-16">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Thực đơn</h1>
            <p className="mt-2 text-gray-600">Khám phá các món ăn đặc sắc của chúng tôi</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Search */}
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

        {/* Product Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    Hình ảnh sản phẩm
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-600">
                      {product.price.toLocaleString()}đ
                    </span>
                    <Button>
                      Thêm vào giỏ
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
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
