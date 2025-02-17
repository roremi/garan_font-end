'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon, ShoppingCart, ArrowLeft } from 'lucide-react';
import { api } from '@/services/api';
import { Product } from '@/types/product';
import { formatPrice } from '@/config/constants';
import { useToast } from "@/components/ui/use-toast";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ProductDetail() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productId = params?.id;
        
        if (!productId) {
          throw new Error('ID sản phẩm không tồn tại');
        }

        const id = Number(productId);
        if (isNaN(id) || id <= 0) {
          throw new Error('ID sản phẩm không hợp lệ');
        }

        const data = await api.getProductById(id);
        if (!data) {
          throw new Error('Không tìm thấy sản phẩm');
        }
        
        setProduct(data);
        setError(null);

      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin sản phẩm');
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: err.message || "Không thể tải thông tin sản phẩm",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params, toast]);

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    if (type === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!product.isAvailable) {
      toast({
        variant: "destructive",
        title: "Không thể thêm vào giỏ hàng",
        description: "Sản phẩm hiện không có sẵn",
      });
      return;
    }

    // Thêm logic xử lý giỏ hàng ở đây
    toast({
      title: "Thêm vào giỏ hàng thành công",
      description: `Đã thêm ${quantity} ${product.name} vào giỏ hàng`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Quay lại
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4">
        <div className="pt-24">
          <Button
            variant="ghost"
            className="mb-6 hover:bg-gray-100"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          {product && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={product.imageUrl || '/images/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.name}
                </h1>
                
                <p className="text-gray-600">
                  {product.description}
                </p>

                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(product.price)}
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Số lượng:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity <= 1}
                      className="h-10 w-10"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange('increase')}
                      className="h-10 w-10"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full md:w-auto"
                  size="lg"
                  disabled={!product.isAvailable}
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.isAvailable ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                </Button>

                <div className="text-sm">
                  <span className="font-semibold">Trạng thái: </span>
                  <span className={product.isAvailable ? 'text-green-600' : 'text-red-600'}>
                    {product.isAvailable ? 'Còn hàng' : 'Hết hàng'}
                  </span>
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
