"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { api } from '@/services/api';
import { authService } from '@/services/auth.service';
import { useCart } from '@/contexts/CartContext';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const generateOrderCode = () => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `DH${timestamp}${random}`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // States cho địa chỉ
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [shippingFee, setShippingFee] = useState(0);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');
  const [selectedWardName, setSelectedWardName] = useState<string>('');

  // Form data
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    address: user?.address || '',
    note: '',
    paymentMethod: 'COD'
  });

  // Kiểm tra đăng nhập
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

  // Tính toán giá tiền
  const subtotal = items.reduce((sum, item) => 
    sum + item.price * item.quantity, 0
  );
  const total = Math.round(subtotal + (items.length > 0 ? shippingFee : 0));

  // Fetch provinces khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        let response = await api.getProvince();
        if (Array.isArray(response['data'])) {
          // Tìm TP HCM trong danh sách
          const hcmCity = response['data'].find(province => 
            province.ProvinceName.includes('Hồ Chí Minh')
          );
          
          if (hcmCity) {
            setProvinces([hcmCity]); // Chỉ lưu TP HCM
            setSelectedProvince(hcmCity.ProvinceID); // Set mặc định là TP HCM
            setSelectedProvinceName('Thành phố Hồ Chí Minh');
            // Fetch districts của TP HCM luôn
            let districtResponse = await api.getDistricts(hcmCity.ProvinceID);
            if (Array.isArray(districtResponse['data'])) {
              setDistricts(districtResponse['data']);
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách tỉnh:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể lấy danh sách tỉnh thành",
        });
      }
    };
    
    fetchProvinces();
  }, []);

  // Tính phí ship
  const getShippingFee = async (districtId: number, wardCode: string) => {
    try {
      const params = {
        from_district_id: 1454,
        from_ward_code: "20308",
        to_district_id: districtId,
        to_ward_code: wardCode,
        service_id: 53320,
        weight: 20,
        length: 20,
        width: 20,
        height: 20
      };
  
      const response = await api.getShippingFee(params);
      if (response.shipping_fee) {
        setShippingFee(response.shipping_fee);
      }
    } catch (error) {
      console.error('Lỗi khi tính phí vận chuyển:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tính phí vận chuyển",
      });
      setShippingFee(0);
    }
  };

  // Handlers cho địa chỉ
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const districtId = parseInt(e.target.value);
      setSelectedDistrict(districtId);
      const selectedDist = districts.find(d => d.DistrictID === districtId);
      if (selectedDist) {
        setSelectedDistrictName(selectedDist.DistrictName);
      }
      let response = await api.getWards(districtId);
      if (Array.isArray(response['data'])) {
        setWards(response['data']);
        setSelectedWard('');
        setShippingFee(0);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách Phường/Xã:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lấy danh sách Phường/Xã",
      });
    }
  };

  const handleWardChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardCode = e.target.value;
    setSelectedWard(wardCode);
    const selectedW = wards.find(w => w.WardCode === wardCode);
    if (selectedW) {
      setSelectedWardName(selectedW.WardName);
    }
    if (selectedDistrict && wardCode) {
      await getShippingFee(selectedDistrict, wardCode);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit handler
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

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn đầy đủ địa chỉ",
      });
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn đặt hàng?')) {
      return;
    }
    
    try {
      const userResponse = await authService.getUserByEmail(user.email);
      const userId = userResponse.id;
      const orderCode = generateOrderCode();

      // Tạo địa chỉ đầy đủ
      const fullAddress = `${formData.address}, ${selectedWardName}, ${selectedDistrictName}, ${selectedProvinceName}`;

      const orderData = {
        idUser: userId,
        nameCustomer: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: fullAddress,
        note: formData.note,
        paymentMethod: formData.paymentMethod,
        orderCode: orderCode,
        createAt: new Date().toISOString(),
        status: 0,
        total: total,
        shippingFee: shippingFee
      };

      const orderResponse = await api.createOrder(orderData);

      if (!orderResponse.data || !orderResponse.data.id) {
        throw new Error('Không nhận được ID của đơn hàng');
      }

      const orderId = orderResponse.data.id;

      // Tạo order details
      // Xử lý từng item trong giỏ hàng
    for (const item of items) {
      const detailData = {
        orderId: orderId,
        quantity: item.quantity,
        price: item.price,
        createAt: new Date().toISOString()
      };

      if (item.type === 'combo') {
        // Nếu là combo
        await api.createOrderDetail({
          ...detailData,
          comboId: item.id,
          productId: null // Đảm bảo productId là null
        });
      } else {
        // Nếu là sản phẩm
        await api.createOrderDetail({
          ...detailData,
          productId: item.id,
          comboId: null // Đảm bảo comboId là null
        });
      }
    }

      if (formData.paymentMethod === 'BANKING') {
        const vietQRUrl = `https://img.vietqr.io/image/mbbank-0565251240-compact2.jpg?` + 
          `amount=${total}&` +
          `addInfo=${(`GARANCUCTAC${orderId}`)}&` +
          `accountName=${encodeURIComponent('TRAN TAN KHAI')}`;
      
        router.push(`/payment?orderId=${orderId}&qrCode=${encodeURIComponent(vietQRUrl)}&amount=${total}`);
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8 pt-24">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>
          
          {items.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Giỏ hàng trống</h2>
              <p className="text-gray-600 mb-6">
                Bạn chưa có sản phẩm nào trong giỏ hàng
              </p>
              <Link href="/menu">
                <Button>
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Section */}
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

                    <div className="space-y-4">
                      <div>
                        <Label>Địa chỉ</Label>
                        <Input
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Số nhà, tên đường"
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>

                      <div>
                        <Label>Tỉnh/Thành phố</Label>
                        <div className="relative">
                          <Input
                            value="Thành phố Hồ Chí Minh"
                            disabled
                            className="w-full p-2 border rounded bg-gray-50"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Quận - Huyện</Label>
                        <div className="relative">
                          <select 
                            className="w-full p-2 border rounded appearance-none bg-white"
                            value={selectedDistrict || ""}
                            onChange={handleDistrictChange}
                            required
                          >
                            <option value="">Chọn Quận/Huyện</option>
                            {districts.map((district) => (
                              <option key={district.DistrictID} value={district.DistrictID}>
                                {district.DistrictName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label>Phường - Xã</Label>
                        <div className="relative">
                          <select 
                            className="w-full p-2 border rounded appearance-none bg-white"
                            value={selectedWard}
                            onChange={handleWardChange}
                            required
                          >
                            <option value="">Chọn Phường/Xã</option>
                            {wards.map((ward) => (
                              <option key={ward.WardCode} value={ward.WardCode}>
                                {ward.WardName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
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

                  <Button type="submit" className="w-full mt-6">
                    Đặt hàng
                  </Button>
                </form>
              </div>

              {/* Order Summary Section */}
              <div className="bg-white p-6 rounded-lg shadow h-fit">
                <h2 className="text-xl font-semibold mb-4">Đơn hàng của bạn</h2>
                
                <div className="space-y-4">
                  {items.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="flex space-x-4 border-b pb-4">
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
                    
                    <div className="flex justify-between">
                      <span>Phí vận chuyển</span>
                      <span>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(shippingFee)}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold pt-4 border-t">
                      <span>Tổng cộng</span>
                      <span className="text-orange-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(total)}
                      </span>
                    </div>
                  </div>

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

      <Footer />
    </div>
  );
}
