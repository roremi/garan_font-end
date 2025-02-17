'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Mock data for cart items
const mockCartItems = [
  {
    id: 1,
    name: "Sản phẩm mẫu 1",
    price: 250000,
    quantity: 2,
    image: "/product1.jpg"
  },
  {
    id: 2,
    name: "Sản phẩm mẫu 2",
    price: 300000,
    quantity: 1,
    image: "/product2.jpg"
  }
];

const SHIPPING_FEE = 30000;

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    paymentMethod: 'COD'
  });

  const subtotal = mockCartItems.reduce((sum, item) => 
    sum + item.price * item.quantity, 0
  );
  
  const total = subtotal + SHIPPING_FEE;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    console.log('Form submitted:', formData);
    console.log('Order total:', total);
    alert('Đặt hàng thành công!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Địa chỉ giao hàng</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="note">Ghi chú</Label>
                  <Textarea
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label>Phương thức thanh toán</Label>
                  <RadioGroup
                    defaultValue="COD"
                    name="paymentMethod"
                    className="mt-2"
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, paymentMethod: value }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="COD" id="cod" />
                      <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BANKING" id="banking" />
                      <Label htmlFor="banking">Chuyển khoản ngân hàng</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6">
                Đặt hàng
              </Button>
            </form>
          </div>

          {/* Order Summary Section */}
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-xl font-semibold mb-4">Đơn hàng của bạn</h2>
            
            <div className="space-y-4">
              {mockCartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                  </div>
                  <p className="font-medium">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(item.price * item.quantity)}
                  </p>
                </div>
              ))}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(subtotal)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(SHIPPING_FEE)}
                  </span>
                </div>

                <div className="flex justify-between font-bold pt-4 border-t">
                  <span>Tổng cộng</span>
                  <span>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/giohang">
                <Button variant="outline" className="w-full">
                  Quay lại giỏ hàng
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
