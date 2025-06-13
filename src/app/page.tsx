'use client';

import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/config/constants';
import { Product } from '@/types/product';
import { useRouter } from 'next/navigation'; 
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';
import { Combo } from '@/types/combo';
import { ComboCategory } from '@/types/ComboCategory';
import { authService } from '@/services/auth.service';

export default function HomePage() {
  const router = useRouter();
  const { products, isLoading, error, refetch } = useProducts();
  const [email, setEmail] = useState('');
  const { addToCart } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categories, setCategories] = useState<ComboCategory[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(true);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Đăng ký nhận tin thành công với email: ${email}`);
    setEmail('');
  };

  const handleSlideChange = (index: number) => {
    if (!products) return;
    setCurrentSlide(index);
  };

  const totalSlides = products ? Math.ceil(products.length / 4) : 0;

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setLoadingCombos(true);
        const [combosData, categoriesData] = await Promise.all([
          api.getCombos(),
          api.getComboCategories(),
        ]);
        setCombos(combosData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching combos:', error);
        toast.error('Không thể tải dữ liệu combo. Vui lòng thử lại sau.', {
          description: 'Lỗi',
        });
      } finally {
        setLoadingCombos(false);
      }
    };

    fetchCombos();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (products && products.length > 0) {
        setCurrentSlide((current) => (current + 1) % totalSlides);
      }
    }, 5000);
  
    return () => clearInterval(interval);
  }, [products, totalSlides]);

  const handleAddToCart = (product: Product) => {
    if (!authService.isAuthenticated()) {
      toast.error('Yêu cầu khách hàng đăng nhập', {
        description: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
      });
      return;
    }

    if (!product.isAvailable) {
      toast.error('Không thể thêm vào giỏ hàng', {
        description: 'Sản phẩm hiện không còn hàng',
      });
      return;
    }

    addToCart("Product", product.id, 1);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`, {
      description: 'Thêm vào giỏ hàng thành công',
    });
  };

  const handleAddComboToCart = async (combo: Combo) => {
    if (!authService.isAuthenticated()) {
      toast.error('Yêu cầu khách hàng đăng nhập', {
        description: 'Vui lòng đăng nhập để thêm combo vào giỏ hàng.',
      });
      return;
    }

    if (!combo.isAvailable) {
      toast.error('Không thể thêm vào giỏ hàng', {
        description: 'Combo này hiện không khả dụng',
      });
      return;
    }

    try {
      await addToCart('Combo', combo.id, 1);
      toast.success(`Đã thêm ${combo.name} vào giỏ hàng`, {
        description: 'Thêm vào giỏ hàng thành công',
      });
    } catch (error: any) {
      toast.error(error.message || 'Không thể thêm vào giỏ hàng', {
        description: 'Lỗi',
      });
    }
  };

  const handleNavigateToProduct = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  const getCategoryName = (combo: Combo) => {
    if (combo.category?.name) {
      return combo.category.name;
    }
    
    if (combo.categoryId) {
      const category = categories.find(cat => cat.id === combo.categoryId);
      return category?.name || "Không tìm thấy";
    }
    
    return "Không có danh mục";
  };

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
              <Link href="/menu">
                <Button className="text-lg" size="lg">
                  Đặt hàng ngay
                </Button>
              </Link>
            </div>
            <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src="/images/hero-chicken.jpg"
                alt="Gà rán"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* Promotional Banners */}
        <section className="bg-gradient-to-b from-orange-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Combo hấp dẫn</h2>
              <p className="text-gray-600">Khám phá các combo hấp dẫn</p>
            </div>

            {/* Featured Combos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {loadingCombos ? (
                <div className="col-span-3 text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Đang tải combo...</p>
                </div>
              ) : combos.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-gray-600">
                  <p>Không có combo nào để hiển thị.</p>
                </div>
              ) : (
                combos.slice(0, 3).map((combo) => (
                  <div key={combo.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col">
                    <div className="relative w-full aspect-[4/3]">
                      <Image
                        src={combo.imageUrl || '/images/default-combo.jpg'}
                        alt={combo.name}
                        fill
                        className="object-cover rounded-t-2xl"
                      />
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold mb-2 text-gray-900">{combo.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{combo.description}</p>

                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(combo.price)}
                        </span>
                      </div>

                      <Button 
                        className="mt-4 w-full bg-black hover:bg-zinc-800 text-white"
                        disabled={!combo.isAvailable}
                        onClick={() => handleAddComboToCart(combo)}
                      >
                        {combo.isAvailable ? 'Đặt ngay' : 'Không khả dụng'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Món ăn nổi bật</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <Button className="mt-4" onClick={refetch}>
                  Thử lại
                </Button>
              </div>
            ) : (
              <div className="relative max-w-6xl mx-auto">
                <div 
                  ref={slideRef}
                  className="overflow-hidden"
                >
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ 
                      width: `${Math.ceil(products.length / 4) * 100}%`,
                      transform: `translateX(-${currentSlide * (100 / Math.ceil(products.length / 4))}%)`
                    }}
                  >
                    {Array.from({ length: Math.ceil(products.length / 4) }).map((_, slideIndex) => (
                      <div key={slideIndex} className="w-full flex gap-6">
                        {products.slice(slideIndex * 4, (slideIndex + 1) * 4).map((product) => (
                          <div 
                            key={product.id} 
                            className="w-1/4 flex-shrink-0 bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-all"
                          >
                            <div 
                              className="cursor-pointer"
                              onClick={() => handleNavigateToProduct(product.id)}
                            >
                              <div className="h-40 bg-gray-100 relative overflow-hidden">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    Hình ảnh không có sẵn
                                  </div>
                                )}
                                {!product.isAvailable && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <span className="text-white font-bold">Hết hàng</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="p-3">
                              <h3 
                                className="font-bold text-sm mb-1 hover:text-orange-600 transition-colors cursor-pointer"
                                onClick={() => handleNavigateToProduct(product.id)}
                              >
                                {product.name}
                              </h3>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {product.description}
                              </p>
                              <p className="text-orange-600 font-bold text-sm mb-3">
                                {formatPrice(product.price)}
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 text-xs py-1"
                                  variant="outline"
                                  onClick={() => handleNavigateToProduct(product.id)}
                                >
                                  Chi tiết
                                </Button>
                                <Button 
                                  className="flex-1 text-xs py-1"
                                  disabled={!product.isAvailable}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                  }}
                                >
                                  {product.isAvailable ? 'Thêm vào giỏ' : 'Hết hàng'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <button
                  onClick={() => {
                    const prev = currentSlide === 0 ? Math.ceil(products.length / 4) - 1 : currentSlide - 1;
                    handleSlideChange(prev);
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => {
                    const next = (currentSlide + 1) % Math.ceil(products.length / 4);
                    handleSlideChange(next);
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Radio buttons for navigation */}
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: Math.ceil(products.length / 4) }).map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                      onClick={() => handleSlideChange(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-orange-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tại sao chọn chúng tôi?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Chúng tôi tự hào mang đến cho khách hàng những trải nghiệm ẩm thực tuyệt vời nhất với 
                chất lượng và dịch vụ hàng đầu
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg 
                    className="w-8 h-8 text-orange-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Chất lượng đảm bảo</h3>
                <p className="text-gray-600">
                  Nguyên liệu tươi ngon, được chọn lọc kỹ càng và chế biến theo quy trình nghiêm ngặt
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg 
                    className="w-8 h-8 text-orange-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Giao hàng nhanh chóng</h3>
                <p className="text-gray-600">
                  Cam kết giao hàng trong vòng 30 phút để đảm bảo món ăn nóng hổi khi đến tay bạn
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg 
                    className="w-8 h-8 text-orange-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Giá cả hợp lý</h3>
                <p className="text-gray-600">
                  Mức giá cạnh tranh cùng nhiều ưu đãi hấp dẫn cho khách hàng thân thiết
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg 
                    className="w-8 h-8 text-orange-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Dịch vụ tận tâm</h3>
                <p className="text-gray-600">
                  Đội ngũ nhân viên chuyên nghiệp, thân thiện, sẵn sàng phục vụ 24/7
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">20+</div>
                  <p className="text-gray-600">Chi nhánh trên toàn quốc</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">50K+</div>
                  <p className="text-gray-600">Khách hàng hài lòng</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">4.8/5</div>
                  <p className="text-gray-600">Đánh giá trung bình</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <p className="text-lg text-gray-600 mb-6">
                Trải nghiệm ngay dịch vụ của chúng tôi và cảm nhận sự khác biệt
              </p>
              <Link href="/menu">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                  Đặt hàng ngay
                </Button>
              </Link>
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
              <form onSubmit={handleSubscribe} className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-orange-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit">Đăng ký</Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}