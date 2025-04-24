// CheckoutPage.tsx – hỗ trợ dùng GP trừ tiền
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { api } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserAddress } from '@/types/useraddress';
import VoucherSelector from "@/components/VoucherSelector";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserAddressList from '@/components/UserAddressList';
import { OrderCreateRequest } from '@/types/order';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const subtotal = cart?.subtotal ?? 0;
  const cartItems = cart?.cartItems || [];

  const [defaultAddress, setDefaultAddress] = useState<UserAddress | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  const [finalSubtotal, setFinalSubtotal] = useState(subtotal);
  const [finalShippingFee, setFinalShippingFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingDiscount, setShippingDiscount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(subtotal);

  const [userPoints, setUserPoints] = useState(0);
  const [usedGP, setUsedGP] = useState(0);

  const [selectedVoucher, setSelectedVoucher] = useState<{ discount?: any; shipping?: any }>({});
  const [idVoucherDiscount, setIdVoucherDiscount] = useState<string | undefined>(undefined);
  const [idVoucherShipping, setIdVoucherShipping] = useState<string | undefined>(undefined);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    address: user?.address || '',
    note: '',
    paymentMethod: 'COD'
  });

  const gpDiscountAmount = (usedGP / 100) * 10000;

  const handleUseGP = (e: ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value) || 0;
    const maxGP = Math.floor(userPoints / 100) * 100;
    value = Math.min(value, maxGP);
    value = Math.floor(value / 100) * 100;
    setUsedGP(value);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast({ variant: "destructive", title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để tiếp tục." });
      router.push('/auth/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user?.id) {
      api.getUserPoints(user.id).then((res) => setUserPoints(res.points));
    }
  }, [user?.id]);

  const refreshDefaultAddress = useCallback(async () => {
    if (!user?.id) return;
    try {
      const allAddresses: UserAddress[] = await api.getUserAddress(user.id);
      const defaultAddr = allAddresses.find((addr: UserAddress) => addr.isDefault);
      setDefaultAddress(defaultAddr || null);
      setSelectedAddressId(defaultAddr?.id || null);
      if (defaultAddr) {
        const fullAddress = `${defaultAddr.detail}, ${defaultAddr.wardName}, ${defaultAddr.districtName}, ${defaultAddr.provinceName}`;
        setFormData(prev => ({ ...prev, address: fullAddress }));
      }
    } catch (err) {
      console.error("Không thể lấy địa chỉ mặc định", err);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [user?.id]);

  useEffect(() => { refreshDefaultAddress(); }, [refreshDefaultAddress]);

  useEffect(() => {
    if (defaultAddress && user?.id) {
      api.getShippingFeeByAddress(user.id, defaultAddress.id, subtotal, idVoucherDiscount, idVoucherShipping)
        .then((res) => {
          setFinalShippingFee(res.final_shipping_fee || 0);
          setShippingDiscount(res.shipping_discount || 0);
          setFinalSubtotal(res.final_subtotal || subtotal);
          setDiscountAmount(res.discount_amount || 0);
          setTotalAmount((res.final_subtotal + res.final_shipping_fee - gpDiscountAmount) || subtotal);
        })
        .catch(err => console.error(err));
    }
  }, [defaultAddress, idVoucherDiscount, idVoucherShipping, subtotal, gpDiscountAmount]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!defaultAddress || !user) return;
    try {
      await api.useGiftPoints(user.id, usedGP);
      const orderRequest: OrderCreateRequest = {
        nameCustomer: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        note: formData.note,
        paymentMethod: formData.paymentMethod,
        cartItems: cartItems.map(item => ({ id: item.itemId, quantity: item.quantity, type: item.itemType.toLowerCase() })),
        totalAmount: totalAmount,
        shippingFee: finalShippingFee,
        idVoucherDiscount: idVoucherDiscount ? parseInt(idVoucherDiscount) : undefined,
        idVoucherShipping: idVoucherShipping ? parseInt(idVoucherShipping) : undefined
      };
      const res = await api.createOrder(orderRequest);
      if (formData.paymentMethod === 'BANKING') {
        const vietQRUrl = `https://img.vietqr.io/image/mbbank-0565251240-compact2.jpg?amount=${totalAmount}&addInfo=GARANCUCTAC${res.data.id}&accountName=TRAN%20TAN%20KHAI`;
        router.push(`/payment?orderId=${res.data.id}&qrCode=${encodeURIComponent(vietQRUrl)}&amount=${totalAmount}`);
      } else {
        clearCart();
        toast({ title: "Đặt hàng thành công", description: "Cảm ơn bạn đã đặt hàng!" });
        router.push('/');
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Có lỗi khi đặt hàng" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 pt-24">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <Input name="fullName" placeholder="Họ và tên" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
              <Input name="phone" placeholder="Số điện thoại" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
              <Textarea name="note" placeholder="Ghi chú" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
              <div>
                <Label htmlFor="usedGP">Dùng GP để giảm giá (100GP = 10.000đ)</Label>
                <Input id="usedGP" type="number" value={usedGP} onChange={handleUseGP} min={0} step={100} max={userPoints} />
                <p className="text-sm text-gray-500">Bạn đang có {userPoints} GP</p>
              </div>
              <VoucherSelector
                subtotal={subtotal}
                onSelect={setSelectedVoucher}
                onIdChange={({ idVoucherDiscount, idVoucherShipping }) => {
                  setIdVoucherDiscount(idVoucherDiscount);
                  setIdVoucherShipping(idVoucherShipping);
                }}
              />
             <RadioGroup defaultValue="COD" name="paymentMethod" onValueChange={val => setFormData({ ...formData, paymentMethod: val })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod">Thanh toán COD</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BANKING" id="banking" />
                  <Label htmlFor="banking">Chuyển khoản</Label>
                </div>
              </RadioGroup>
              <Button type="submit" className="w-full mt-4">Đặt hàng</Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow h-fit">
              <h2 className="text-xl font-semibold mb-4">Đơn hàng của bạn</h2>
              <div className="space-y-2 pt-4">
                <div className="flex justify-between"><span>Tạm tính</span><span>{subtotal.toLocaleString('vi-VN')}₫</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{discountAmount.toLocaleString('vi-VN')}₫</span></div>}
                <div className="flex justify-between"><span>Phí vận chuyển</span><span>{finalShippingFee.toLocaleString('vi-VN')}₫</span></div>
                {shippingDiscount > 0 && <div className="flex justify-between text-green-600"><span>Giảm phí vận chuyển</span><span>-{shippingDiscount.toLocaleString('vi-VN')}₫</span></div>}
                {usedGP > 0 && <div className="flex justify-between text-green-600"><span>Giảm từ GP ({usedGP})</span><span>-{gpDiscountAmount.toLocaleString('vi-VN')}₫</span></div>}
                <div className="flex justify-between font-bold border-t pt-2"><span>Tổng cộng</span><span className="text-orange-600">{totalAmount.toLocaleString('vi-VN')}₫</span></div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
