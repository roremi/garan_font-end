"use client"
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartItem } from '@/types/cart';

// const DELIVERY_FEE = 0;
// const FREE_SHIPPING_THRESHOLD = 200000;
// const DELIVERY_RADIUS = 5; // km

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

const CartItemComponent: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => (
  <li className="p-6">
    <div className="flex items-center">
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

      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.itemType}</p>
          </div>
          <p className="text-base font-medium text-gray-900">
            {formatCurrency(item.price)}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-4 py-1 text-center min-w-[40px]">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  </li>
);

const EmptyCart = () => (
  <div className="p-8 text-center">
    <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Giỏ hàng trống</h3>
    <p className="text-gray-500 mb-6">Hãy thêm một vài món ngon vào giỏ hàng của bạn</p>
    <Link href="/menu">
      <Button>Xem thực đơn</Button>
    </Link>
  </div>
);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export default function CartPage() {
  const { cart, updateCartItem, removeCartItem } = useCart();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState('');

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    try {
      await updateCartItem(itemId, newQuantity);
      toast({
        title: "Thành công",
        description: "Đã cập nhật số lượng",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật số lượng",
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeCartItem(itemId);
      toast({
        title: "Thành công",
        description: "Đã xóa sản phẩm khỏi giỏ hàng",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa sản phẩm",
      });
    }
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập mã giảm giá",
      });
      return;
    }

    toast({
      variant: "destructive",
      title: "Không thành công",
      description: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
    });
  };
  const { subtotal, total } = useMemo(() => ({
    subtotal: cart?.subtotal ?? 0, // Lấy từ API
    total: cart?.total ?? 0 // Lấy từ API
  }), [cart]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold mb-8">Giỏ hàng của bạn</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                {!cart || cart.cartItems.length === 0 ? (
                  <EmptyCart />
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {cart.cartItems.map((item) => (
                      <CartItemComponent
                        key={item.id}
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-lg font-medium mb-4">Tổng đơn hàng</h2>

                

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-base">
                    <span>Tạm tính</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {/* {discount > 0 && (
                    <div className="flex justify-between text-base text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )} */}
                  <div className="flex justify-between text-lg font-medium border-t pt-3">
                    <span>Tổng cộng</span>
                    <span className="text-orange-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <Link href={cart?.cartItems.length ? '/checkout' : '#'}>
                  <Button 
                    className="w-full mt-6"
                    size="lg"
                    disabled={!cart?.cartItems.length}
                  >
                    Tiến hành đặt hàng
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <div className="mt-6 text-sm text-gray-500">
                  <p className="mb-2">
                    Bằng cách đặt hàng, bạn đồng ý với
                    <Link href="/terms" className="text-primary hover:underline ml-1">
                      Điều khoản dịch vụ
                    </Link>
                  </p>
                    {/* <p>
                      Giao hàng miễn phí cho đơn hàng từ {formatCurrency(FREE_SHIPPING_THRESHOLD)} trong phạm vi {DELIVERY_RADIUS}km
                    </p> */}
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
