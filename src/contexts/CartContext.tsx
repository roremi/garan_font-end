// contexts/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart, CartItem } from '@/types/cart';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';
import { useToast } from "@/components/ui/use-toast";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (itemType: 'Product' | 'Combo', itemId: number, quantity: number) => Promise<void>;
  updateCartItem: (cartItemId: number, quantity: number) => Promise<void>;
  removeCartItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Tải giỏ hàng khi người dùng đăng nhập
  useEffect(() => {
    const loadCart = async () => {
      if (isAuthenticated) {
        try {
          setLoading(true);
          const cartData = await api.getCart();
          setCart(cartData);
        } catch (error) {
          console.error('Lỗi khi tải giỏ hàng:', error);
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể tải giỏ hàng",
          });
        } finally {
          setLoading(false);
        }
      } else {
        setCart(null);
        setLoading(false);
      }
    };

    loadCart();
  }, [isAuthenticated]);

  const addToCart = async (itemType: 'Product' | 'Combo', itemId: number, quantity: number) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để thêm vào giỏ hàng",
      });
      return;
    }

    try {
      const updatedCart = await api.addToCart(itemType, itemId, quantity);
      setCart(updatedCart);
      toast({
        title: "Thành công",
        description: "Đã thêm vào giỏ hàng",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể thêm vào giỏ hàng",
      });
    }
  };

  const updateCartItem = async (cartItemId: number, quantity: number) => {
    try {
      const updatedCart = await api.updateCartItem(cartItemId, quantity);
      setCart(updatedCart);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật giỏ hàng",
      });
    }
  };

  const removeCartItem = async (cartItemId: number) => {
    try {
      await api.removeCartItem(cartItemId);
      setCart(prev => prev ? {
        ...prev,
        cartItems: prev.cartItems.filter(item => item.id !== cartItemId)
      } : null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa sản phẩm khỏi giỏ hàng",
      });
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      setCart(prev => prev ? { ...prev, cartItems: [] } : null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa giỏ hàng",
      });
    }
  };

  const totalItems = cart?.cartItems.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalAmount = cart?.cartItems.reduce((sum, item) => sum + item.totalPrice, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      totalItems,
      totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
