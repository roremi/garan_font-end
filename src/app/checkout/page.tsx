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
import { Loader2, Plus, Ticket } from "lucide-react";
import { api } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
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
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated, isLoading } = useAuth();
  const subtotal = cart?.subtotal ?? 0;
  const cartItems = cart?.cartItems || [];
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  // Phần 4.1: State mới cho tính năng nhập mã voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [showVoucherInput, setShowVoucherInput] = useState(false);
  
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
    if (!isLoading && !isAuthenticated) {
      toast.error(`Vui lòng đăng nhập!`);
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
        toast.error(`Không thể tải lại vị trí mặc định!`);
      }
    } finally {
      setIsLoadingAddress(false);
    }
  }, [user?.id, toast]);

  // Phần 7: Tải địa chỉ mặc định khi component mount
  useEffect(() => {
    refreshDefaultAddress();
  }, [refreshDefaultAddress]);

  // Phần 8.1: Hàm xử lý thêm voucher bằng mã code - ĐÃ SỬA
  const handleAddVoucherByCode = async () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã voucher!');
      return;
    }

    if (!user?.id) {
      toast.error('Vui lòng đăng nhập để sử dụng voucher!');
      return;
    }

    setIsAddingVoucher(true);
    try {
      // ✅ SỬA: Gọi API với voucherCode thay vì voucherId
      await api.saveUserVoucher(user.id, undefined, voucherCode.trim());
      toast.success('Thêm voucher thành công! Bạn có thể chọn voucher trong danh sách.');
      setVoucherCode('');
      setShowVoucherInput(false);
      // Optionally refresh voucher list in VoucherSelector component
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể thêm voucher. Vui lòng kiểm tra lại mã voucher.';
      toast.error(errorMessage);
      console.error('Lỗi khi thêm voucher:', error);
    } finally {
      setIsAddingVoucher(false);
    }
  };

  //Phần 9: Hàm tính phí vận chuyển
  const calculateShippingFeeByAddress = useCallback(async (
    userId: number,
    addressId: number,
    subtotal: number,
    idVoucherDiscount?: string,
    idVoucherShipping?: string
  ) => {
    try {
      const response = await api.calculateShippingFeeByAddress(
        userId,
        addressId,
        subtotal,
        idVoucherDiscount,
        idVoucherShipping
      );
      setFinalShippingFee(response.final_shipping_fee || response.shipping_fee || 0);
      setShippingDiscount(response.shipping_discount || 0);
      setFinalSubtotal(response.final_subtotal || subtotal);
      setDiscountAmount(response.discount_amount || 0);
      setTotalAmount(response.total || (response.final_subtotal + response.final_shipping_fee));
      if (response.discount_voucher_error) {
        toast.error(`Lỗi Voucher giảm giá!`);
      }
      if (response.shipping_voucher_error) {
        toast.error(`Lỗi Voucher vận chuyển!`);
      }
    } catch (error) {
      console.error('Lỗi khi tính phí vận chuyển:', error);
      setFinalShippingFee(0);
      setShippingDiscount(0);
      setFinalSubtotal(subtotal);
      setDiscountAmount(0);
      setTotalAmount(subtotal);
      toast.error(`Không thể tính phí vận chuyển!`);
    }
  }, [toast]);

  // Phần 10: Tính phí vận chuyển khi địa chỉ hoặc voucher thay đổi
  useEffect(() => {
    if (defaultAddress && user?.id) {
      calculateShippingFeeByAddress(
        user.id,
        defaultAddress.id,
        subtotal,
        idVoucherDiscount,
        idVoucherShipping
      );
    }
  }, [defaultAddress, user?.id, subtotal, idVoucherDiscount, idVoucherShipping, calculateShippingFeeByAddress]);

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
    if (isSubmitting) return; // ⛔ Đã submit thì không cho ấn nữa
    setIsSubmitting(true); // ✅ Đánh dấu đang xử lý
    if (!isAuthenticated || !user) {
      toast.error(`Vui lòng đăng nhập để tiếp tục thanh toán!`);
      setIsSubmitting(false);
      return;
    }
    if (!defaultAddress) {
      toast.error(`Vui lòng chọn địa chỉ nhận hàng!`);
      setIsSubmitting(false);
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
        clearCart();
      } else {
        clearCart();
        toast.success(`Cảm ơn bạn đã đặt hàng`);
        router.push('/');
      }
    } catch (error: any) {
      const rawMessage = error?.message || "Có lỗi xảy ra khi đặt hàng";

      if (rawMessage.includes("chưa thanh toán")) {
        toast.error(`Vui lòng kiểm tra đơn hàng gần nhất đã hoàn thành chưa!`);
        setTimeout(() => {
          router.push("/");
        }, 3000);
        return;
      }
      toast.error(rawMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phần 14: Render giao diện người dùng
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-sm">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // hoặc để trống vì đã redirect ở useEffect
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
                    
                    {/* Phần mới: Chọn và thêm Voucher */}
                    <div className="mb-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="block">Chọn Voucher</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVoucherInput(!showVoucherInput)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Thêm mã voucher
                        </Button>
                      </div>
                      
                      {/* Form nhập mã voucher */}
                      {showVoucherInput && (
                        <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-orange-600" />
                            <Label className="font-medium">Nhập mã voucher</Label>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nhập mã voucher..."
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                              className="flex-1"
                              disabled={isAddingVoucher}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddVoucherByCode();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={handleAddVoucherByCode}
                              disabled={isAddingVoucher || !voucherCode.trim()}
                              className="px-6"
                            >
                              {isAddingVoucher ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Đang thêm...
                                </>
                              ) : (
                                'Thêm'
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">
                            Nhập mã voucher để thêm vào tài khoản của bạn
                          </p>
                        </div>
                      )}
                      
                      {/* Component chọn voucher hiện tại */}
                      <VoucherSelector
                        subtotal={subtotal}
                        onSelect={(voucher) => {
                          setSelectedVoucher(voucher);
                          toast.success(voucher.discount?.description || voucher.shipping?.description || "Đã áp dụng voucher");
                        }}
                        onIdChange={({ idVoucherDiscount, idVoucherShipping }) => {
                          setIdVoucherDiscount(idVoucherDiscount);
                          setIdVoucherShipping(idVoucherShipping);
                        }}
                      />
                      
                      {/* Hiển thị voucher đã chọn */}
                      {selectedVoucher.discount && (
                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4" />
                            <span>Voucher giảm giá: <strong>{selectedVoucher.discount.code}</strong></span>
                          </div>
                          <p className="mt-1">{selectedVoucher.discount.description}</p>
                        </div>
                      )}
                      {selectedVoucher.shipping && (
                        <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4" />
                            <span>Voucher vận chuyển: <strong>{selectedVoucher.shipping.code}</strong></span>
                          </div>
                          <p className="mt-1">{selectedVoucher.shipping.description}</p>
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
                  <Button type="submit" className="w-full mt-6" disabled={isLoadingAddress || !defaultAddress || isSubmitting}>
                    {isSubmitting ? (
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