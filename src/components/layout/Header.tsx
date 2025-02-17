'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search, Menu, X, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Dữ liệu mẫu cho giỏ hàng
const cartItems = [
  {
    id: 1,
    name: 'Gà Rán Sốt Cay',
    price: 89000,
    quantity: 2,
    image: '/images/spicy-chicken.jpg',
  },
  {
    id: 2,
    name: 'Khoai Tây Chiên (L)',
    price: 39000,
    quantity: 1,
    image: '/images/french-fries.jpg',
  },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <header className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-xl font-bold text-orange-600">Cục Tác Chicken</h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-orange-600">Trang chủ</Link>
            <Link href="/menu" className="text-gray-700 hover:text-orange-600">Thực đơn</Link>
            <Link href="/about" className="text-gray-700 hover:text-orange-600">Về chúng tôi</Link>
            <Link href="/contact" className="text-gray-700 hover:text-orange-600">Liên hệ</Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Link href="/auth/login">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            
            {/* Giỏ hàng với Dropdown */}
            <div className="relative"
                 onMouseEnter={() => setIsCartOpen(true)}
                 onMouseLeave={() => setIsCartOpen(false)}>
              <Link href="/giaohang">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Dropdown giỏ hàng */}
              {isCartOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100">
                  <div className="p-4">
                    <h3 className="text-lg font-medium mb-4">Giỏ hàng</h3>
                    
                    {cartItems.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Giỏ hàng trống</p>
                    ) : (
                      <>
                        <div className="space-y-4 max-h-60 overflow-auto">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-16 w-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="text-sm font-medium">{item.name}</h4>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-sm text-gray-600">
                                    SL: {item.quantity}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {item.price.toLocaleString()}đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t mt-4 pt-4">
                          <div className="flex justify-between font-medium">
                            <span>Tổng cộng:</span>
                            <span>{subtotal.toLocaleString()}đ</span>
                          </div>
                          <Link href="/cart">
                            <Button className="w-full mt-4">
                              Xem giỏ hàng
                            </Button>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
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
              <Link href="/" className="text-gray-700 hover:text-orange-600">Trang chủ</Link>
              <Link href="/menu" className="text-gray-700 hover:text-orange-600">Thực đơn</Link>
              <Link href="/about" className="text-gray-700 hover:text-orange-600">Về chúng tôi</Link>
              <Link href="/contact" className="text-gray-700 hover:text-orange-600">Liên hệ</Link>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
                <Link href="/auth/login">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
