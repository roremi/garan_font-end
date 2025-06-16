"use client";

// Phần 1: Import các thư viện và components cần thiết
import React, { useState, useEffect, useCallback } from 'react';
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
import { authService } from '@/services/auth.service';
import { OrderCreateRequest } from '@/types/order';
import { CartItem } from '@/types/cart';
import { Voucher } from '@/types/voucher';
import { UserAddress } from '@/types/useraddress';
import VoucherSelector from "@/components/VoucherSelector";
import UserAddressList from '@/components/UserAddressList';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { de } from 'date-fns/locale';

// Phần 2: Component chính để xử lý trang thanh toán
export default function CheckoutPage() {
  // Phần 3: Khởi tạo các hook và context
  const router = useRouter();
  const { toast } = useToast();
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const subtotal = cart?.subtotal ?? 0;
  const cartItems = cart?.cartItems || [];

  // Phần 4: Quản lý state cho địa chỉ, phí vận chuyển, voucher và form
  const [defaultAddress, setDefaultAddress] = useState<UserAddress | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [finalSubtotal, setFinalSubtotal] = useState(subtotal);
  const [finalShippingFee, setFinalShippingFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingDiscount, setShippingDiscount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(subtotal);
  const [selectedVoucher, setSelectedVoucher] = useState<{ discount?: Voucher; shipping?: Voucher }>({});
  const [idVoucherDiscount, setIdVoucherDiscount] = useState<string | undefined>();
  const [idVoucherShipping, setIdVoucherShipping] = useState<string | undefined>();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    address: '',
    note: '',
    paymentMethod: 'COD'
  });

  // Phần 5: Kiểm tra đăng nhập và chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để tiếp tục thanh toán",
      });
      router.push('/auth/login');
    }
  }, [isAuthenticated, router, toast]);

  // Phần 6: Hàm tải địa chỉ mặc định
  const refreshDefaultAddress = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingAddress(false);
      return;
    }
    setIsLoadingAddress(true);
    try {
      const allAddresses = await authService.getUserFormattedAddresses(user.id);
      const defaultAddr = allAddresses.find((addr: UserAddress) => addr.isDefault);
      setDefaultAddress(defaultAddr || null);
      setSelectedAddressId(defaultAddr?.id || null);
      if (defaultAddr) {
        const fullAddress = `${defaultAddr.detail}, ${defaultAddr.wardName}, ${defaultAddr.districtName}, ${defaultAddr.provinceName}`;
        setFormData(prev => ({ ...prev, address: fullAddress }));
      } else {
        setShowAddressDialog(true);
      }
    } catch (err: any) {
      const rawMessage = err?.message || err?.toString?.();
      if (rawMessage?.includes("Người dùng chưa có địa chỉ nào")) {
        setDefaultAddress(null);
        setSelectedAddressId(null);
        setShowAddressDialog(true);
      } else {
        console.error("Không thể lấy địa chỉ mặc định", err);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải lại địa chỉ mặc định",
        });
      }
    } finally {
      setIsLoadingAddress(false);
    }
  }, [user?.id, toast]);

  // Phần 7: Tải địa chỉ mặc định khi component mount
  useEffect(() => {
    refreshDefaultAddress();
  }, [refreshDefaultAddress]);

  // Phần 8: Tính tiền ship
  useEffect(() => {
  const fetchDistance = async () => {
    if (defaultAddress && user?.id && defaultAddress.latitude && defaultAddress.longitude) {
      try {
        const result = await api.calculateShippingFee(
          user.id,
          defaultAddress.latitude,
          defaultAddress.longitude
        );
        setDistanceKm(result.distanceKm);
        setFinalShippingFee(result.shippingFee);
        setTotalAmount(subtotal + result.shippingFee - discountAmount);
      } catch (error) {
        console.error("Lỗi khi tính phí vận chuyển:", error);
        setDistanceKm(null);
        setFinalShippingFee(0);
        setTotalAmount(subtotal);
      }
    }
  };
  fetchDistance();
}, [defaultAddress, user?.id, subtotal, discountAmount]);


  // Phần 9: Hàm tính phí vận chuyển
  // const calculateShippingFeeByAddress = useCallback(async (
  //   userId: number,
  //   addressId: number,
  //   subtotal: number,
  //   idVoucherDiscount?: string,
  //   idVoucherShipping?: string
  // ) => {
  //   try {
  //     const response = await api.getShippingFeeByAddress(
  //       userId,
  //       addressId,
  //       subtotal,
  //       idVoucherDiscount,
  //       idVoucherShipping
  //     );
  //     setFinalShippingFee(response.final_shipping_fee || response.shipping_fee || 0);
  //     setShippingDiscount(response.shipping_discount || 0);
  //     setFinalSubtotal(response.final_subtotal || subtotal);
  //     setDiscountAmount(response.discount_amount || 0);
  //     setTotalAmount(response.total || (response.final_subtotal + response.final_shipping_fee));
  //     if (response.discount_voucher_error) {
  //       toast({
  //         variant: "destructive",
  //         title: "Lỗi Voucher Giảm Giá",
  //         description: response.discount_voucher_error,
  //       });
  //     }
  //     if (response.shipping_voucher_error) {
  //       toast({
  //         variant: "destructive",
  //         title: "Lỗi Voucher Vận Chuyển",
  //         description: response.shipping_voucher_error,
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Lỗi khi tính phí vận chuyển:', error);
  //     setFinalShippingFee(0);
  //     setShippingDiscount(0);
  //     setFinalSubtotal(subtotal);
  //     setDiscountAmount(0);
  //     setTotalAmount(subtotal);
  //     toast({
  //       variant: "destructive",
  //       title: "Lỗi",
  //       description: "Không thể tính phí vận chuyển",
  //     });
  //   }
  // }, [toast]);

  // // Phần 10: Tính phí vận chuyển khi địa chỉ hoặc voucher thay đổi
  // useEffect(() => {
  //   if (defaultAddress && user?.id) {
  //     calculateShippingFeeByAddress(
  //       user.id,
  //       defaultAddress.id,
  //       subtotal,
  //       idVoucherDiscount,
  //       idVoucherShipping
  //     );
  //   }
  // }, [defaultAddress, user?.id, subtotal, idVoucherDiscount, idVoucherShipping, calculateShippingFeeByAddress]);

  // Phần 11: Xử lý sự kiện thay đổi input trong form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Phần 12: Hàm render tóm tắt đơn hàng
  const renderOrderSummary = () => (
    <div className="space-y-2 pt-4">
      <div className="flex justify-between">
        <span>Tạm tính</span>
        <span>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(subtotal)}
        </span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Giảm giá (Voucher)</span>
          <span>
            - {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(discountAmount)}
          </span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Phí vận chuyển</span>
        <span>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(finalShippingFee)}
        </span>
      </div>
      {shippingDiscount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Giảm phí vận chuyển (Voucher)</span>
          <span>
            - {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(shippingDiscount)}
          </span>
        </div>
      )}
      {distanceKm !== null && (
        <div className="text-sm text-gray-600">
          Khoảng cách từ cửa hàng: <strong>{distanceKm} km</strong>
        </div>
      )}
      <div className="flex justify-between font-bold pt-4 border-t">
        <span>Tổng cộng</span>
        <span className="text-orange-600">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(totalAmount)}
        </span>
      </div>
    </div>
  );

  // Phần 13: Xử lý submit form đặt hàng
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast({
        variant: "destructive",
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để tiếp tục thanh toán",
      });
      return;
    }
    if (!defaultAddress) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn địa chỉ nhận hàng",
      });
      return;
    }
    try {
      const orderRequest: OrderCreateRequest = {
        nameCustomer: formData.fullName,
        phone: formData.phone,
        email: formData.email, 
        address: formData.address,
        note: formData.note,
        paymentMethod: formData.paymentMethod,
        cartItems: cartItems.map(item => ({
          id: item.itemId,
          quantity: item.quantity,
          type: item.itemType.toLowerCase()
        })),
        totalAmount: totalAmount,
        shippingFee: finalShippingFee,
        latitude: defaultAddress.latitude,
        longitude: defaultAddress.longitude,
        idVoucherDiscount: idVoucherDiscount ? parseInt(idVoucherDiscount) : undefined,
        idVoucherShipping: idVoucherShipping ? parseInt(idVoucherShipping) : undefined
      };
      const response = await api.createOrder(orderRequest);
      if (formData.paymentMethod === 'BANKING') {
        const vietQRUrl = `https://img.vietqr.io/image/mbbank-0565251240-compact2.jpg?amount=${totalAmount}&addInfo=GARANCUCTAC${response.data.id}&accountName=TRAN%20TAN%20KHAI`;
        router.push(`/payment?orderId=${response.data.id}&qrCode=${encodeURIComponent(vietQRUrl)}&amount=${totalAmount}`);
      } else {
        clearCart();
        toast({
          title: "Đặt hàng thành công",
          description: "Cảm ơn bạn đã đặt hàng!",
        });
        router.push('/');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi đặt hàng",
      });
    }
  };

  // Phần 14: Render giao diện người dùng
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 pt-24">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Giỏ hàng trống</h2>
              <p className="text-gray-600 mb-6">
                Bạn chưa có sản phẩm nào trong giỏ hàng
              </p>
              <Link href="/menu">
                <Button>Tiếp tục mua sắm</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Họ và tên</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="note">Ghi chú</Label>
                      <Textarea
                        id="note"
                        name="note"
                        value={formData.note}
                        onChange={handleInputChange}
                        placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                      />
                    </div>
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium text-gray-700 mb-1 inline-block">
                        Địa chỉ nhận hàng
                      </Label>
                      {isLoadingAddress ? (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                          <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                          <p className="text-sm text-gray-500">Đang tải địa chỉ...</p>
                        </div>
                      ) : defaultAddress ? (
                        <div className="p-3 bg-orange-50 rounded-md border border-orange-300">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{defaultAddress.detail}</p>
                              <p className="text-sm text-gray-700">
                                {defaultAddress.wardName}, {defaultAddress.districtName}, {defaultAddress.provinceName}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="link"
                              className="text-blue-600 p-0 h-auto"
                              onClick={() => setShowAddressDialog(true)}
                            >
                              Thay đổi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-red-500">Chưa có địa chỉ nhận hàng</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddressDialog(true)}
                          >
                            Chọn địa chỉ
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mb-6">
                      <Label className="block mb-2">Chọn Voucher</Label>
                      <VoucherSelector
                        subtotal={subtotal}
                        onSelect={(voucher) => {
                          setSelectedVoucher(voucher);
                          toast({
                            title: "Đã chọn voucher",
                            description: voucher.discount?.description || voucher.shipping?.description || "Đã áp dụng voucher",
                          });
                        }}
                        onIdChange={({ idVoucherDiscount, idVoucherShipping }) => {
                          setIdVoucherDiscount(idVoucherDiscount);
                          setIdVoucherShipping(idVoucherShipping);
                        }}
                      />
                      {selectedVoucher.discount && (
                        <div className="text-sm text-green-700">
                          Đã chọn: <strong>{selectedVoucher.discount.code}</strong> - {selectedVoucher.discount.description}
                        </div>
                      )}
                      {selectedVoucher.shipping && (
                        <div className="text-sm text-green-700">
                          Đã chọn: <strong>{selectedVoucher.shipping.code}</strong> - {selectedVoucher.shipping.description}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Phương thức thanh toán</Label>
                      <RadioGroup
                        defaultValue="COD"
                        name="paymentMethod"
                        className="mt-2"
                        onValueChange={(value) =>
                          setFormData(prev => ({ ...prev, paymentMethod: value }))
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="COD" id="cod" />
                          <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="BANKING" id="banking" />
                          <Label htmlFor="banking">Chuyển khoản ngân hàng</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-6" disabled={isLoadingAddress || !defaultAddress}>
                    {isLoadingAddress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Đặt hàng"
                    )}
                  </Button>
                </form>
              </div>
              <div className="bg-white p-6 rounded-lg shadow h-fit">
                <h2 className="text-xl font-semibold mb-4">Đơn hàng của bạn</h2>
                <div className="space-y-4">
                  {cartItems.map((item: CartItem) => (
                    <div key={`${item.itemType}-${item.itemId}`} className="flex space-x-4 border-b pb-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                        <p className="font-medium text-orange-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {renderOrderSummary()}
                  <div className="mt-6">
                    <Link href="/giohang">
                      <Button variant="outline" className="w-full">
                        Quay lại giỏ hàng
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {showAddressDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow max-h-[90vh] overflow-y-auto w-[600px]">
            <h2 className="text-lg font-bold mb-4">Địa Chỉ Của Tôi</h2>
            {user && (
              <UserAddressList
                userId={user.id}
                isSelecting={true}
                selectedAddressId={defaultAddress?.id}
                onSelectAddress={(addr) => {
                  setDefaultAddress(addr);
                  setSelectedAddressId(addr.id);
                  setShowAddressDialog(false);
                  const fullAddress = `${addr.detail}, ${addr.wardName}, ${addr.districtName}, ${addr.provinceName}`;
                  setFormData(prev => ({ ...prev, address: fullAddress }));
                  if (user?.id) {
                    // calculateShippingFeeByAddress(
                    //   user.id,
                    //   addr.id,
                    //   subtotal,
                    //   idVoucherDiscount,
                    //   idVoucherShipping
                    // );
                  }
                }}
                onRefresh={refreshDefaultAddress}
              />
            )}
            <div className="flex justify-end mt-4">
              <Button
                type="button"
                onClick={() => setShowAddressDialog(false)}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}