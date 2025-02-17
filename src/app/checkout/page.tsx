"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from '@/contexts/CartContext';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const SHIPPING_FEE = 30000;

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    paymentMethod: 'COD'
  });

  // Tính tổng tiền
  const subtotal = items.reduce((sum, item) => 
    sum + item.price * item.quantity, 0
  );
  const total = subtotal + (items.length > 0 ? SHIPPING_FEE : 0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra giỏ hàng có trống không
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Giỏ hàng của bạn đang trống",
      });
      return;
    }

    // Validate form
    if (!formData.fullName || !formData.phone || !formData.email || !formData.address) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    try {
      // TODO: Gửi đơn hàng lên server
      const order = {
        ...formData,
        items,
        subtotal,
        shippingFee: SHIPPING_FEE,
        total,
        orderDate: new Date().toISOString()
      };

      console.log('Order details:', order);
      
      // Clear cart sau khi đặt hàng thành công
      clearCart();
      
      toast({
        title: "Đặt hàng thành công",
        description: "Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ sớm nhất!",
      });

      // Chuyển về trang chủ
      router.push('/');
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại sau.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8 pt-24">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>
          
          {items.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Giỏ hàng trống</h2>
              <p className="text-gray-600 mb-6">
                Bạn chưa có sản phẩm nào trong giỏ hàng
              </p>
              <Link href="/menu">
                <Button>
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </div>
          ) : (
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
                        placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
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
                  {items.map((item) => (
                    <div key={item.id} className="flex space-x-4 border-b pb-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                        <p className="font-medium text-orange-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(item.price * item.quantity)}
                        </p>
                      </div>
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
                      <span className="text-orange-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(total)}
                      </span>
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}