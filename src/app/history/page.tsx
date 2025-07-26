// Phần 1: Import các thư viện và component cần thiết
'use client';
import dynamic from "next/dynamic";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Eye, Calendar, Box, DollarSign, Truck } from "lucide-react";
import { Order } from '@/types/order';

// Phần 2: Định nghĩa interface và cấu hình trạng thái đơn hàng
interface OrderStatus {
  label: string;
  color: string;
}

interface OrderStatusMap {
  [key: number]: OrderStatus;
}

const ORDER_STATUS: OrderStatusMap = {
  0: { label: 'Chờ xác nhận', color: 'warning' },
  1: { label: 'Chờ giao hàng', color: 'blue' },
  2: { label: 'Đang giao hàng', color: 'info' },
  3: { label: 'Hoàn thành', color: 'success' },
  4: { label: 'Đã hủy', color: 'destructive' },
};

// Phần 3: Component chính OrderHistory
export default function OrderHistory() {
  // Khai báo state và hooks
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const Maptracking = dynamic(() => import('@/components/Maptracking'), { ssr: false });

  // Phần 4: useEffect để kiểm tra xác thực và điều hướng
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }

  }, [isAuthenticated, router]);

  // Phần 5: useEffect để lấy danh sách đơn hàng
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  // Phần 6: useEffect để lọc đơn hàng theo tab
  useEffect(() => {
    // Filter orders based on active tab
    if (activeTab === 'all') {
      setFilteredOrders(orders);
    } else {
      const status = parseInt(activeTab);
      setFilteredOrders(orders.filter(order => order.status === status));
    }
  }, [activeTab, orders]);

  // Phần 7: Hàm lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    if (!isAuthenticated || !user) {
      return;
    }
    try {
      setLoading(true);
      const userResponse = await authService.getUserByEmail(user.email);
      const userId = userResponse.id;
      const data = await api.getOrdersbyUser(userId);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải lịch sử đơn hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Phần 8: Các hàm hỗ trợ định dạng
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateTotalSpent = () => {
    return orders.reduce((acc, order) => acc + (order.total || 0), 0);
  };

  const getDeliveredOrdersCount = () => {
    return orders.filter(order => order.status === 2).length;
  };

  const getPendingOrdersCount = () => {
    return orders.filter(order => order.status === 0).length;
  };

  // Phần 9: Hàm xử lý xem chi tiết đơn hàng
  const handleViewOrder = async (order: Order) => {
    try {
      setLoadingDetails(true);
      setViewOrder(order);
      const response = await api.getOrderDetails(order.id);
      if (response.status === 200) {
        setOrderDetails(response.data);
      } else {
        throw new Error("Failed to fetch order details");
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải chi tiết đơn hàng",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Phần 10: Hàm xử lý hủy đơn hàng
  const handleCancelOrder = async (orderId: number) => {
    try {
      await api.CancelOrderbyUser(orderId); // 3 là trạng thái đã hủy
      toast({
        title: "Thành công",
        description: "Đã hủy đơn hàng",
      });
      fetchOrders(); // Refresh danh sách đơn hàng
      setViewOrder(null); // Đóng modal
    } catch (error) {
      console.error('Error canceling order:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể hủy đơn hàng",
      });
    }
  };

  // Phần 11: Render giao diện khi chưa xác thực
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


  // Phần 12: Render giao diện khi đang tải
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Đang tải dữ liệu...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Phần 13: Render giao diện chính
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-gray-700">
                  Trang chủ
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2">/</span>
                <span className="font-medium text-gray-900">Lịch sử đơn hàng</span>
              </li>
            </ol>
          </nav>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">Tổng đơn hàng</p>
                    <h3 className="text-2xl font-bold mt-2">{orders.length}</h3>
                  </div>
                  <Box className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">Đơn chờ xác nhận</p>
                    <h3 className="text-2xl font-bold mt-2">{getPendingOrdersCount()}</h3>
                  </div>
                  <Truck className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">Đơn thành công</p>
                    <h3 className="text-2xl font-bold mt-2">{getDeliveredOrdersCount()}</h3>
                  </div>
                  <Calendar className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">Tổng chi tiêu</p>
                    <h3 className="text-2xl font-bold mt-2">
                      {formatCurrency(calculateTotalSpent())}
                    </h3>
                  </div>
                  <DollarSign className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Package className="h-6 w-6 text-blue-600" />
                    Lịch sử đơn hàng
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Xem lại tất cả đơn hàng đã đặt
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Tabs for filtering orders by status */}
                <div className="sticky top-0 z-10 bg-white border-b mb-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="overflow-x-auto scrollbar-hide">
                    <TabsList className="flex w-full min-w-max border-b">
                      <TabsTrigger value="all" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Tất cả</TabsTrigger>
                      <TabsTrigger value="0" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Chờ xác nhận</TabsTrigger>
                      <TabsTrigger value="1" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Chờ giao hàng</TabsTrigger>
                      <TabsTrigger value="2" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Đang giao hàng</TabsTrigger>
                      <TabsTrigger value="3" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Đã hoàn thành</TabsTrigger>
                      <TabsTrigger value="4" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Đã hủy</TabsTrigger>

                    </TabsList>
                  </Tabs>
                </div>
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Chưa có đơn hàng nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold">STT</TableHead>
                      <TableHead className="font-semibold">Ngày đặt</TableHead>
                      <TableHead className="font-semibold">Tổng tiền</TableHead>
                      <TableHead className="font-semibold">Trạng thái</TableHead>
                      <TableHead className="font-semibold">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order, index) => (
                      <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>{formatDate(order.createAt)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={ORDER_STATUS[order.status].color as any}
                            className="font-medium"
                          >
                            {ORDER_STATUS[order.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
      {viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng</h2>
              <Button variant="outline" size="sm" onClick={() => setViewOrder(null)}>
                ✕
              </Button>
            </div>

            {/* Thông tin khách hàng */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Khách hàng</p>
                <p className="font-medium">{viewOrder.nameCustomer}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium">{viewOrder.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{viewOrder.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Ngày đặt</p>
                <p className="font-medium">
                  {formatDate(viewOrder.createAt)}
                </p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="font-medium">{viewOrder.address}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-sm text-gray-500">Ghi chú</p>
                <p className="font-medium">{viewOrder.note || "Không có ghi chú"}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                <p className="font-medium">{viewOrder.paymentMethod}</p>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Sản phẩm</th>
                    <th className="px-4 py-2 text-right">Đơn giá</th>
                    <th className="px-4 py-2 text-right">Số lượng</th>
                    <th className="px-4 py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingDetails ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center">
                        Đang tải chi tiết đơn hàng...
                      </td>
                    </tr>
                  ) : orderDetails && orderDetails.length > 0 ? (
                    orderDetails.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.imageUrl || '/placeholder-image.jpg'} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                              }}
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">
                                {item.type === 'product' ? 'Sản phẩm' : 'Combo'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center">
                        Không có dữ liệu chi tiết đơn hàng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tổng cộng và trạng thái */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Trạng thái đơn hàng</p>
                <Badge 
                  variant={ORDER_STATUS[viewOrder.status].color as any}
                  className="px-3 py-1 text-sm"
                >
                  {ORDER_STATUS[viewOrder.status].label}
                </Badge>
              </div>
              <div className="text-right space-y-1">
                <div className="flex justify-between gap-8">
                  <p className="text-sm text-gray-500">Tạm tính:</p>
                  <p className="font-medium">
                    {formatCurrency((viewOrder.total || 0) - (viewOrder.shippingFee || 0))}
                  </p>
                </div>
                <div className="flex justify-between gap-8">
                  <p className="text-sm text-gray-500">Phí vận chuyển:</p>
                  <p className="font-medium">
                    {formatCurrency(viewOrder.shippingFee || 0)}
                  </p>
                </div>
                <div className="flex justify-between gap-8 border-t pt-2 mt-2">
                  <p className="text-sm text-gray-700">Tổng tiền:</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(viewOrder.total)}
                  </p>
                </div>
              </div>
            </div>
            {/* BẢN ĐỒ theo dõi tài xế - chỉ hiển thị nếu đơn đang được giao và có driver */}
      {viewOrder.status === 2 && viewOrder.driverId && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Theo dõi tài xế</h3>
          <div className="rounded border overflow-hidden" style={{ height: "400px" }}>
            <Maptracking
              key={viewOrder.id}
              orderId={viewOrder.id}
              destination={viewOrder.address}
            />
          </div>
        </div>
      )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              {/* Nút Đóng luôn hiển thị */}
              <Button
                variant="outline"
                onClick={() => setViewOrder(null)}
              >
                Đóng
              </Button>

              {/* Nút Thanh toán lại - chỉ khi chưa thanh toán, status = 0, phương thức banking */}
              {viewOrder.status === 0 && !viewOrder.isPaid && viewOrder.paymentMethod === 'BANKING' && (
                <Button
                  variant="default"
                  onClick={() => {
                    const vietQRUrl = `https://img.vietqr.io/image/mbbank-0565251240-compact2.jpg?amount=${viewOrder.total}&addInfo=GARANCUCTAC${viewOrder.id}&accountName=TRAN%20TAN%20KHAI`;
                    router.push(`/payment?orderId=${viewOrder.id}&qrCode=${encodeURIComponent(vietQRUrl)}&amount=${viewOrder.total}`);
                  }}
                >
                  Thanh toán lại
                </Button>
              )}

              {/* Nút Hủy đơn - chỉ khi chưa thanh toán và chờ xác nhận */}
              {viewOrder.status === 0 && !viewOrder.isPaid && (
                <Button
                  variant="destructive"
                  onClick={() => handleCancelOrder(viewOrder.id)}
                >
                  Hủy đơn
                </Button>
              )}
            </div>


          </div>
        </div>
      )}
    </div>
  );
}