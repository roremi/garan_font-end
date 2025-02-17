'use client';

import React, { useState } from 'react';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';// Dữ liệu mẫu
const initialCartItems = [
  {
    id: 1,
    name: 'Gà Rán Sốt Cay',
    price: 89000,
    quantity: 2,
    image: '/images/spicy-chicken.jpg',
    options: ['Cay vừa', 'Thêm phô mai'],
  },
  {
    id: 2,
    name: 'Khoai Tây Chiên (L)',
    price: 39000,
    quantity: 1,
    image: '/images/french-fries.jpg',
    options: ['Size L'],
  },
  // Thêm các món khác...
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [promoCode, setPromoCode] = useState('');

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 15000;
  const discount = 0; // Tính giảm giá nếu có mã
  const total = subtotal + deliveryFee - discount;

  return (
    
    <div className="min-h-screen bg-gray-50 py-8">
        <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-8">Giỏ hàng của bạn</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách món */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {cartItems.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Giỏ hàng trống</p>
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.href = '/menu'}
                  >
                    Tiếp tục mua hàng
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <li key={item.id} className="p-6">
                      <div className="flex items-center">
                        {/* Hình ảnh món */}
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>

                        {/* Thông tin món */}
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-base font-medium text-gray-900">
                                {item.name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {item.options.join(' • ')}
                              </p>
                            </div>
                            <p className="text-base font-medium text-gray-900">
                              {item.price.toLocaleString()}đ
                            </p>
                          </div>

                          {/* Số lượng và xóa */}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center border rounded-md">
                              <button
                                className="p-2"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-4 py-2 text-center min-w-[40px]">
                                {item.quantity}
                              </span>
                              <button
                                className="p-2"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              className="text-red-500 hover:text-red-600"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Tổng đơn hàng */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-medium mb-4">Tổng đơn hàng</h2>

              {/* Mã giảm giá */}
              <div className="mb-4">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Nhập mã giảm giá"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button variant="outline">
                    Áp dụng
                  </Button>
                </div>
              </div>

              {/* Chi tiết thanh toán */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-base">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-base">
                  <span>Phí giao hàng</span>
                  <span>{deliveryFee.toLocaleString()}đ</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-base text-green-600">
                    <span>Giảm giá</span>
                    <span>-{discount.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-medium border-t pt-3">
                  <span>Tổng cộng</span>
                  <span>{total.toLocaleString()}đ</span>
                </div>
              </div>

              {/* Nút đặt hàng */}
              <Button 
                className="w-full mt-6"
                size="lg"
                disabled={cartItems.length === 0}
                onClick={() => window.location.href = '/checkout'}
              >
                Tiến hành đặt hàng
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* Chính sách */}
              <div className="mt-6 text-sm text-gray-500">
                <p className="mb-2">
                  Bằng cách đặt hàng, bạn đồng ý với 
                  <a href="/terms" className="text-primary ml-1">
                    Điều khoản dịch vụ
                  </a>
                </p>
                <p>
                  Giao hàng miễn phí cho đơn hàng từ 200.000đ trong phạm vi 5km
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
    
  );
}
