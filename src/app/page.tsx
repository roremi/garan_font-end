'use client';

import React from 'react';
import Link from 'next/link';

import { ShoppingCart, User, Search, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-orange-600">Cục Tác Chicken</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-orange-600">Trang chủ</a>
              <a href="/menu" className="text-gray-700 hover:text-orange-600">Thực đơn</a>
              <a href="/about" className="text-gray-700 hover:text-orange-600">Về chúng tôi</a>
              <a href="/contact" className="text-gray-700 hover:text-orange-600">Liên hệ</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Link href="/auth/login">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link >
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4">
              <nav className="flex flex-col space-y-4">
                <a href="/" className="text-gray-700 hover:text-orange-600">Trang chủ</a>
                <a href="/menu" className="text-gray-700 hover:text-orange-600">Thực đơn</a>
                <a href="/about" className="text-gray-700 hover:text-orange-600">Về chúng tôi</a>
                <a href="/contact" className="text-gray-700 hover:text-orange-600">Liên hệ</a>
                <div className="flex space-x-4">
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-16">
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                Gà rán ngon nhất thành phố
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Thưởng thức hương vị độc đáo của gà rán giòn rụm, được chế biến từ công thức bí mật của chúng tôi.
              </p>
              <Button className="text-lg" size="lg">
                Đặt hàng ngay
              </Button>
            </div>
            <div className="relative h-[400px] bg-gray-100 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Hình ảnh gà rán
              </div>
            </div>
          </div>
        </section>

        {/* Promotional Banners */}
        <section className="bg-orange-50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2">Combo gia đình</h3>
                <p className="text-gray-600 mb-4">Tiết kiệm 25% với combo dành cho 4 người</p>
                <Button variant="outline">Xem thêm</Button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2">Khuyến mãi sinh viên</h3>
                <p className="text-gray-600 mb-4">Giảm 15% khi show thẻ sinh viên</p>
                <Button variant="outline">Xem thêm</Button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-2">Đặt hàng nhóm</h3>
                <p className="text-gray-600 mb-4">Ưu đãi đặc biệt cho đơn hàng trên 1 triệu</p>
                <Button variant="outline">Xem thêm</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Món ăn nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">Hình ảnh món ăn</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2">Gà rán sốt cay</h3>
                    <p className="text-gray-600 mb-4">89.000đ</p>
                    <Button className="w-full">Thêm vào giỏ</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Cục tác Chicken</h3>
              <p className="text-gray-400">Thương hiệu gà rán số 1 Việt Nam</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Liên hệ</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  <span>1900 1234</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  <span>info@crispychicken.vn</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Theo dõi chúng tôi</h4>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Twitter className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Đăng ký nhận tin</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white w-full"
                />
                <Button>Gửi</Button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CrispyChicken. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}