"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const DELIVERY_FEE = 0;
const FREE_SHIPPING_THRESHOLD = 200000;
const DELIVERY_RADIUS = 5; // km

export default function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState('');

  // Tính toán giá trị đơn hàng
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
  const discount = 0; // TODO: Implement promo code logic
  const total = subtotal + deliveryFee - discount;

  // Xử lý áp dụng mã giảm giá
  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập mã giảm giá",
      });
      return;
    }

    // TODO: Implement promo code validation
    toast({
      variant: "destructive",
      title: "Không thành công",
      description: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold mb-8">Giỏ hàng của bạn</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Danh sách món */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                {items.length === 0 ? (
                  <div className="p-8 text-center">
                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Giỏ hàng trống
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Hãy thêm một vài món ngon vào giỏ hàng của bạn
                    </p>
                    <Link href="/menu">
                      <Button>
                        Xem thực đơn
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {items.map((item) => (
                       <li key={`${item.type}-${item.id}`} className="p-6">
                        <div className="flex items-center">
                          {/* Hình ảnh món */}
                          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No image</span>
                              </div>
                            )}
                          </div>

                          {/* Thông tin món */}
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="text-base font-medium text-gray-900">
                                  {item.name}
                                </h3>
                              </div>
                              <p className="text-base font-medium text-gray-900">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(item.price)}
                              </p>
                            </div>

                            {/* Số lượng và xóa */}
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center border rounded-md">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1, item.type)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="px-4 py-1 text-center min-w-[40px]">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, item.type)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeFromCart(item.id, item.type)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
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
              <div className="bg-white rounded-lg shadow p-6 sticky top-24">
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
                    <Button 
                      variant="outline"
                      onClick={handleApplyPromo}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>

                {/* Chi tiết thanh toán */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-base">
                    <span>Tạm tính</span>
                    <span>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span>Phí giao hàng</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-600">Chưa tính phí ship</span>
                      ) : (
                        new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(deliveryFee)
                      )}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-base text-green-600">
                      <span>Giảm giá</span>
                      <span>
                        -{new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-medium border-t pt-3">
                    <span>Tổng cộng</span>
                    <span className="text-orange-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(total)}
                    </span>
                  </div>
                </div>

                {/* Nút đặt hàng */}
                <Link href={items.length > 0 ? '/checkout' : '#'}>
                  <Button 
                    className="w-full mt-6"
                    size="lg"
                    disabled={items.length === 0}
                  >
                    Tiến hành đặt hàng
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                {/* Chính sách */}
                <div className="mt-6 text-sm text-gray-500">
                  <p className="mb-2">
                    Bằng cách đặt hàng, bạn đồng ý với 
                    <Link href="/terms" className="text-primary hover:underline ml-1">
                      Điều khoản dịch vụ
                    </Link>
                  </p>
                  <p>
                    Giao hàng miễn phí cho đơn hàng từ {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(FREE_SHIPPING_THRESHOLD)} trong phạm vi {DELIVERY_RADIUS}km
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}