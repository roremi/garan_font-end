// Phần 1: Import các thư viện và component cần thiết
'use client';

import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import type { OrderResponse, OrderDetailResponse } from '@/types/order';
import { useSignalR } from "@/hooks/useSignalR"; // hoặc đường dẫn tương ứng

// Phần 2: Định nghĩa cấu hình màu sắc và tên trạng thái đơn hàng
const statusColors = {
  0: 'bg-yellow-100 text-yellow-800',
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-blue-100 text-purble-800',
  3: 'bg-green-100 text-green-800',
  4: 'bg-red-100 text-red-800',
};

const statusNames = {
  0: 'Chờ xử lý',
  1: 'Đang chờ giao hàng',
  2: 'Đang giao hàng',
  3: 'Hoàn thành',
  4: 'Đã hủy'
};

// Phần 3: Component chính OrdersPage
export default function OrdersPage() {
  // Khai báo state
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('today');
  const [viewOrder, setViewOrder] = useState<OrderResponse & { details?: OrderDetailResponse[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { toast } = useToast();
  const { onNewOrder } = useSignalR(0, "Admin"); // userId và userName tùy theo bạn setup

  // Phần 4: useEffect để lấy danh sách đơn hàng
  useEffect(() => {
    fetchOrders();
  const unsubscribe = onNewOrder((newOrder: OrderResponse) => {
    setOrders(prev => [newOrder, ...prev]);

    toast({
      title: "📦 Đơn hàng mới",
      description: `Khách hàng ${newOrder.nameCustomer} vừa đặt đơn hàng mới (${newOrder.phone})`,
    });
  });

  return unsubscribe;
  }, []);
  
  // Phần 5: Hàm lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    try {
      const response = await api.getAllOrders();
      if (response.status === 200) {
        setOrders(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách đơn hàng",
      });
      setLoading(false);
    }
  };

  // Phần 6: Hàm xử lý xem chi tiết đơn hàng
  const handleViewOrder = async (order: OrderResponse) => {
    try {
      setViewOrder({ ...order, details: [] }); // Hiển thị modal trước với dữ liệu rỗng
      setLoadingDetails(true);
      
      const response = await api.getOrderDetails(order.id);
      
      console.log('Order details response:', response); // Log để debug
      
      if (response.status === 200) {
        setViewOrder(prev => prev ? { ...prev, details: response.data } : null);
      } else {
        throw new Error('Failed to fetch order details');
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive",
        title: "Lỗi khi tải chi tiết đơn hàng",
        description: error.message || "Không thể tải chi tiết đơn hàng",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Phần 7: Hàm cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (orderId: number, newStatus: number) => {
    try {
      const response = await api.confirmOrder(orderId, newStatus);
      if (response.status === 200) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật trạng thái đơn hàng",
        });
        fetchOrders();
        setViewOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng",
      });
    }
  };
  const handleCancelOrder = async (orderId: number) => {
    try {
      const response = await api.CancelOrderbyInternalUser(orderId);
      if (response.status === 200) {
        toast({
          title: "Thành công",
          description: "Đã hủy đơn hàng",
        });
        fetchOrders();
        setViewOrder(null);
      }
    } catch (error) {
      console.error('Error cancel order status:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể hủy đơn hàng",
      });
    }
  };

  // Phần 8: Lọc đơn hàng theo trạng thái và ngày
  const filteredOrders = orders.filter(order => {
    if (selectedStatus !== 'all' && order.status !== parseInt(selectedStatus)) return false;
    
    if (selectedDate !== 'all') {
      const orderDate = new Date(order.createAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (selectedDate) {
        case 'today':
          return orderDate.toDateString() === today.toDateString();
          
        case 'week':
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          firstDayOfWeek.setHours(0, 0, 0, 0);
          
          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          lastDayOfWeek.setHours(23, 59, 59, 999);
          
          return orderDate >= firstDayOfWeek && orderDate <= lastDayOfWeek;
          
        case 'month':
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          lastDayOfMonth.setHours(23, 59, 59, 999);
          
          return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
      }
    }
    return true;
  });

  // Phần 9: Render giao diện chính
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        
        <div className="flex gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="0">Chờ xử lý</SelectItem>
              <SelectItem value="1">Chờ giao hàng</SelectItem>
              <SelectItem value="2">Đang giao hàng</SelectItem>
              <SelectItem value="3">Hoàn thành</SelectItem>
              <SelectItem value="4">Đã hủy</SelectItem>

            </SelectContent>
          </Select>

          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Không có đơn hàng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.nameCustomer}</TableCell>
                  <TableCell>
                    {new Date(order.createAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    {order.total.toLocaleString('vi-VN')}đ
                  </TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      statusColors[order.status as keyof typeof statusColors]
                    }`}>
                      {statusNames[order.status as keyof typeof statusNames]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng #{viewOrder.id}</h2>
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
                  {new Date(viewOrder.createAt).toLocaleString('vi-VN')}
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
                  ) : viewOrder.details && viewOrder.details.length > 0 ? (
                    viewOrder.details.map((item) => (
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
                          {item.price.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
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
                <span className={`px-3 py-1 rounded-full text-sm ${
                  statusColors[viewOrder.status as keyof typeof statusColors]
                }`}>
                  {statusNames[viewOrder.status as keyof typeof statusNames]}
                </span>
              </div>
              <div className="text-right space-y-1">
                <div className="flex justify-between gap-8">
                  <p className="text-sm text-gray-500">Tạm tính:</p>
                  <p className="font-medium">
                    {(viewOrder.total - (viewOrder.shippingFee || 0)).toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="flex justify-between gap-8">
                  <p className="text-sm text-gray-500">Phí vận chuyển:</p>
                  <p className="font-medium">
                    {(viewOrder.shippingFee || 0).toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="flex justify-between gap-8 border-t pt-2 mt-2">
                  <p className="text-sm text-gray-700">Tổng tiền:</p>
                  <p className="text-xl font-bold text-orange-600">
                    {viewOrder.total.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              {/* Nút đóng luôn có */}
              <Button
                variant="outline"
                onClick={() => setViewOrder(null)}
              >
                Đóng
              </Button>

              {/* Phê duyệt: chỉ khi đang chờ xử lý */}
              {viewOrder.status === 0 && (
                <Button onClick={() => handleUpdateStatus(viewOrder.id, 1)}>
                  Phê duyệt
                </Button>
              )}

              {/* Hủy đơn: chỉ cho phép khi trạng thái là 0 (chờ xử lý) hoặc 1 (chờ giao) */}
              {(viewOrder.status === 0 || viewOrder.status === 1) && (
                <Button
                  variant="destructive"
                  onClick={() => handleCancelOrder(viewOrder.id)}
                >
                  Hủy đơn
                </Button>
              )}

              {/* Hoàn thành: nếu đang giao thì hoàn thành (status 2 → 3) */}
              {viewOrder.status === 2 && (
                <Button onClick={() => handleUpdateStatus(viewOrder.id, 3)}>
                  Hoàn thành
                </Button>
              )}

              {/* Chuyển sang trạng thái đang giao (status 1 → 2) */}
              {viewOrder.status === 1 && (
                <Button onClick={() => handleUpdateStatus(viewOrder.id, 2)}>
                  Đang giao
                </Button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}