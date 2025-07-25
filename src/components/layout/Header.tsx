import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Search, Menu, X, Trash2, LogOut, History, UserCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cart, totalItems, totalAmount, removeCartItem, updateCartItem } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/giohang');
  };

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công');
    router.push('/');
  };
  
  const showCartDropdown = isAuthenticated && 
    isCartOpen && 
    cart !== null && 
    Array.isArray(cart.cartItems) && 
    cart.cartItems.length > 0;

  const UserDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.fullName} 
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {user ? (
          <>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">Xin chào, {user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/history')}>
              <History className="mr-2 h-4 w-4" />
              <span>Lịch sử đơn hàng</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => router.push('/auth/login')}>
              <User className="mr-2 h-4 w-4" />
              <span>Đăng nhập</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/auth/register')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Đăng ký</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <img 
              src="images/logo.png" 
              alt="Cục Tác Chicken" 
              className="h-14 w-auto"
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-orange-600">Trang chủ</Link>
            <Link href="/menu" className="text-gray-700 hover:text-orange-600">Thực đơn</Link>
            <Link href="/combo" className="text-gray-700 hover:text-orange-600">Combo</Link>
            <Link href="/voucher" className="text-gray-700 hover:text-orange-600">Voucher</Link>
            <Link href="/about" className="text-gray-700 hover:text-orange-600">Về chúng tôi</Link>
            <Link href="/contact" className="text-gray-700 hover:text-orange-600">Liên hệ</Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            
            <UserDropdown />
            
            {/* Giỏ hàng với Dropdown */}
            <div className="relative"
                 onMouseEnter={() => setIsCartOpen(true)}
                 onMouseLeave={() => setIsCartOpen(false)}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={handleCartClick}
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>

              {/* Dropdown giỏ hàng */}
              {showCartDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100">
                  <div className="p-4">
                    <h3 className="text-lg font-medium mb-4">Giỏ hàng</h3>
                    
                    <div className="space-y-4 max-h-60 overflow-auto">
                    {cart.cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-16 w-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{item.name}</h4>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-2">
                                <button
                                  className="text-gray-500 hover:text-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCartItem(item.id, item.quantity - 1);
                                  }}
                                >
                                  -
                                </button>
                                <span className="text-sm">{item.quantity}</span>
                                <button
                                  className="text-gray-500 hover:text-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCartItem(item.id, item.quantity + 1);
                                  }}
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-medium">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(item.price)}
                              </span>
                              <button
                                className="text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCartItem(item.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t mt-4 pt-4">
                      <div className="flex justify-between font-medium">
                        <span>Tổng cộng:</span>
                        <span>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(totalAmount)}
                        </span>
                      </div>
                      <Button 
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push('/giohang');
                          setIsCartOpen(false);
                        }}
                      >
                        Xem giỏ hàng
                      </Button>
                    </div>
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
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <div className="px-2">
                      <p className="text-sm font-medium">Xin chào, {user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link href="/profile" className="text-gray-700 hover:text-orange-600">
                      Hồ sơ cá nhân
                    </Link>
                    <Link href="/history" className="text-gray-700 hover:text-orange-600">
                      Lịch sử đơn hàng
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>
                      Đăng xuất
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-4">
                    <Link href="/auth/login">
                      <Button variant="ghost">Đăng nhập</Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button variant="ghost">Đăng ký</Button>
                    </Link>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={handleCartClick}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
