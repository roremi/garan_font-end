'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Voucher } from '@/types/voucher';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

export default function UserVoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<string[]>([]);
  const { user } = useAuth();

  type BannerProps = {
    src: string;
    alt: string;
  };
  
  const VoucherBanner = ({ src, alt }: BannerProps) => (
    <div className="w-full max-w-6xl mx-auto rounded-xl overflow-hidden mb-4">
      <div className="relative w-full" style={{ aspectRatio: '3 / 1' }}>
        <img
          src={src}
          alt={alt}
          className="absolute top-0 left-0 w-full h-full object-cover rounded-xl shadow"
        />
      </div>
    </div>
  );
  
  
  useEffect(() => {
    const fetchSavedVouchers = async () => {
      try {
        if (!user?.id) return;
        const saved = await api.getUserVouchers(user.id);
        setSavedVouchers(saved.map((v: Voucher) => v.id));
      } catch (error) {
        console.error(error);
      }
    };

    const fetchAllVouchers = async () => {
      try {
        const allVouchers = await api.getVouchersAvailable();
        const valid = allVouchers.filter((v: Voucher) => {
          const now = new Date();
          const expiration = new Date(v.expirationDate);
          return expiration > now;
        });
        setVouchers(valid);
      } catch (error) {
        console.error(error);
      }
    };

    if (user?.id) {
      fetchAllVouchers();
      fetchSavedVouchers();
    }
  }, [user]);

  const handleSave = async (voucherId: string) => {
    if (!user) return;
    try {
      await api.saveUserVoucher(user.id, voucherId);
      setSavedVouchers(prev => [...prev, voucherId]);
    } catch (error) {
      toast.error("Có thể bạn đã sử dụng voucher này rồi hoặc đã có lỗi khi lưu voucher")
    }
  };

  const renderVouchers = (type: string) => {
    const filtered = vouchers.filter(v => v.type === type);
    if (filtered.length === 0) return <p className="text-sm text-gray-500">Không có voucher</p>;
  
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(v => (
          <div key={v.id} className="bg-white rounded-2xl shadow-md flex overflow-hidden border border-gray-200 relative">
            {/* Răng cưa bên trái */}
            <div className="w-1.5 bg-white relative z-10">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-white rounded-full border border-gray-200 absolute left-[-6px]"
                  style={{ top: `${i * 14 + 10}px` }}
                />
              ))}
            </div>
  
            {/* Nội dung voucher */}
            <div className="flex-1 p-4 relative">
              <h3 className="text-lg font-bold text-black mb-1">
                {v.type === 'Fixed' && `Giảm ${v.discountValue?.toLocaleString()}đ`}
                {v.type === 'Percent' && `Giảm ${v.discountPercent}% (Tối đa ${v.maximumDiscount?.toLocaleString()}đ)`}
                {v.type === 'Shipping' && `Miễn phí vận chuyển (Tối đa ${v.maximumDiscount?.toLocaleString()}đ)`}
              </h3>
  
              <p className="text-sm text-gray-500 mb-1">Đơn tối thiểu: {v.minimumOrderValue?.toLocaleString()}đ</p>
              <p className="text-sm text-gray-500 mb-2">HSD: {new Date(v.expirationDate).toLocaleDateString('vi-VN')}</p>
  
              <div className="flex flex-col gap-2 mt-2">
                <span className="inline-block px-3 py-1 border border-orange-500 text-orange-500 text-xs rounded-full w-fit">
                  {v.description || "Áp dụng đơn hàng đủ điều kiện"}
                </span>
  
                {savedVouchers.includes(v.id) ? (
                  <Button
                    className="w-full bg-black text-white hover:bg-zinc-800 font-semibold rounded-full"
                    onClick={() => window.location.href = '/menu'}
                  >
                    Mua ngay
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-orange-500 text-white hover:bg-orange-600 font-semibold rounded-full"
                    onClick={() => handleSave(v.id)}
                  >
                    Lưu ngay
                  </Button>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f8f8]">

      <Header />
      <main className="flex-grow p-6 space-y-10">
        <h1 className="text-3xl font-bold text-orange-600 text-center">Ưu đãi dành riêng cho bạn</h1>

        <div>
        <VoucherBanner 
          src="https://thuvienmuasam.com/uploads/default/original/2X/1/1ae37050401d2baa4ed2fabfae2258dc01d83af3.jpeg" 
          alt="Voucher Giảm giá cố định" 
        />
        <div className="flex items-center justify-left gap-2 mb-6">
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-orange-600">Voucher Giảm giá cố định</h2>
        </div>

          {renderVouchers('Fixed')}
        </div>

        <div>
        <div className="flex items-center justify-left gap-2 mb-6">
        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a4 4 0 10-8 0v2m0 0H5a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-4z" />
        </svg>
        <h2 className="text-xl font-semibold text-orange-600">Voucher Giảm phần trăm</h2>
      </div>
      {renderVouchers('Percent')}
        </div>

        <div>
        <div className="flex items-center justify-left gap-2 mb-6">
        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h13v6m-2 0a2 2 0 100-4 2 2 0 000 4zm-10 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
        <h2 className="text-xl font-semibold text-orange-600">Voucher Miễn phí vận chuyển</h2>
      </div>
      {renderVouchers('Shipping')}
        </div>
      </main>
      <Footer />
    </div>
  );
}
