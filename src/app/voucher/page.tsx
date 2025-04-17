'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Voucher } from '@/types/voucher';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function UserVoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<string[]>([]);
  const { user } = useAuth();

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
      console.error('Lỗi khi lưu voucher:', error);
    }
  };

  const renderVouchers = (type: string) => {
    const filtered = vouchers.filter(v => v.type === type);
    if (filtered.length === 0) return <p className="text-sm text-gray-500">Không có voucher</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => (
          <div
            key={v.id}
            className="border border-orange-200 bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-orange-700 mb-1">{v.code}</h3>
            <p className="text-sm text-gray-600 mb-2">{v.description}</p>
            <p className="text-sm font-medium text-gray-800">
              {/* {v.type === 'Fixed' && `Giảm ${v.discountValue?.toLocaleString()}đ`}
              {v.type === 'Percent' && `Giảm ${v.discountPercent}% (tối đa ${v.maximumDiscount?.toLocaleString()}đ)`}
              {v.type === 'Shipping' && `Giảm phí ship tối đa ${v.maximumDiscount?.toLocaleString()}đ`} */}
            </p>
            <p className="text-sm text-gray-500 mb-3">HSD: {new Date(v.expirationDate).toLocaleString('vi-VN')}</p>
            <Button
              className={cn("w-full text-white", savedVouchers.includes(v.id) ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600')}
              disabled={savedVouchers.includes(v.id)}
              onClick={() => handleSave(v.id)}
            >
              {savedVouchers.includes(v.id) ? 'Đã lưu' : 'Lưu ngay'}
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-orange-50">
      <Header />
      <main className="flex-grow p-6 space-y-10">
        <h1 className="text-3xl font-bold text-orange-600 text-center">Ưu đãi dành riêng cho bạn</h1>

        <div>
          <h2 className="text-xl font-semibold text-orange-500 mb-2">Voucher Giảm giá cố định</h2>
          {renderVouchers('Fixed')}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-orange-500 mb-2">Voucher Giảm phần trăm</h2>
          {renderVouchers('Percent')}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-orange-500 mb-2">Voucher Miễn phí vận chuyển</h2>
          {renderVouchers('Shipping')}
        </div>
      </main>
      <Footer />
    </div>
  );
}
