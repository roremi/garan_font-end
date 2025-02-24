'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  type: 'product' | 'combo'; // Đảm bảo type là bắt buộc
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (productId: number, type: 'product' | 'combo') => void;
  updateQuantity: (productId: number, quantity: number, type: 'product' | 'combo') => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: CartItem) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(
        item => item.id === product.id && item.type === product.type
      );
      
      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id && item.type === product.type
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }
      
      return [...currentItems, product];
    });
  };

  const removeFromCart = (productId: number, type: 'product' | 'combo') => {
    setItems(currentItems => 
      currentItems.filter(item => !(item.id === productId && item.type === type))
    );
  };


  const updateQuantity = (productId: number, quantity: number, type: 'product' | 'combo') => {
    if (quantity <= 0) {
      removeFromCart(productId, type);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId && item.type === type
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
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
