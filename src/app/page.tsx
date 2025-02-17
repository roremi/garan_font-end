'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

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
              {[
                {
                  name: "Gà rán sốt cay",
                  price: "89.000đ",
                  image: "/images/spicy-chicken.jpg"
                },
                {
                  name: "Gà rán phô mai",
                  price: "99.000đ",
                  image: "/images/cheese-chicken.jpg"
                },
                {
                  name: "Combo gà sốt BBQ",
                  price: "159.000đ",
                  image: "/images/bbq-chicken.jpg"
                },
                {
                  name: "Gà không xương",
                  price: "79.000đ",
                  image: "/images/boneless-chicken.jpg"
                }
              ].map((product, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">Hình ảnh món ăn</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4">{product.price}</p>
                    <Button className="w-full">Thêm vào giỏ</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-orange-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Tại sao chọn chúng tôi?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Giao hàng nhanh</h3>
                <p className="text-gray-600">Giao hàng trong vòng 30 phút</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Chất lượng đảm bảo</h3>
                <p className="text-gray-600">Nguyên liệu tươi ngon hàng ngày</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Phục vụ 24/7</h3>
                <p className="text-gray-600">Sẵn sàng phục vụ mọi lúc</p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Đăng ký nhận thông tin</h2>
              <p className="text-gray-600 mb-8">
                Nhận ngay ưu đãi 50.000đ cho đơn hàng đầu tiên khi đăng ký nhận bản tin của chúng tôi
              </p>
              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500"
                />
                <Button>Đăng ký</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
