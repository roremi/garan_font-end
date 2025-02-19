// app/admin/orders/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Filter } from 'lucide-react';
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

// Định nghĩa interface
interface OrderDetail {
  id: number;
  price: number;
  quantity: number;
  createAt: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface Order {
  id: number;
  idUser: number;
  email: string;
  status: number;
  note: string;
  total: number;
  createAt: string;
  nameCustomer: string;
  address: string;
  paymentMethod: string;
  details?: OrderDetail[];
}

const statusColors = {
  0: 'bg-yellow-100 text-yellow-800',
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-red-100 text-red-800',
};

const statusNames = {
  0: 'Chờ xử lý',
  1: 'Đã phê duyệt',
  2: 'Hoàn thành',
  3: 'Đã hủy',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);
  const calculateTotal = (details: OrderDetail[]) => {
    return details.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  const fetchOrders = async () => {
    try {
      const data = await api.getAllOrders();
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách đơn hàng",
      });
    }
  };

  // Fetch order details when viewing an order
  const handleViewOrder = async (order: Order) => {
    try {
      const details = await api.getOrderDetails(order.id);
      setViewOrder({ ...order, details });
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải chi tiết đơn hàng",
      });
    }
  };

  // Handle order status update
  const handleUpdateStatus = async (orderId: number, newStatus: number) => {
    try {
      await api.confirmOrder(orderId, newStatus);
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái đơn hàng",
      });
      fetchOrders(); // Refresh orders list
      setViewOrder(null); // Close modal
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng",
      });
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (selectedStatus !== 'all' && order.status !== parseInt(selectedStatus)) return false;
    
    if (selectedDate !== 'all') {
      const orderDate = new Date(order.createAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (selectedDate) {
        case 'today':
          // Lọc đơn hàng trong ngày hôm nay
          return orderDate.toDateString() === today.toDateString();
          
        case 'week':
          // Lọc đơn hàng trong tuần này (từ Chủ nhật đến Thứ 7)
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          firstDayOfWeek.setHours(0, 0, 0, 0);
          
          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          lastDayOfWeek.setHours(23, 59, 59, 999);
          
          return orderDate >= firstDayOfWeek && orderDate <= lastDayOfWeek;
          
        case 'month':
          // Lọc đơn hàng trong tháng này
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          lastDayOfMonth.setHours(23, 59, 59, 999);
          
          return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
      }
    }
    return true;
  });

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
              <SelectItem value="1">Đã phê duyệt</SelectItem>
              <SelectItem value="2">Hoàn thành</SelectItem>
              <SelectItem value="3">Đã hủy</SelectItem>
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
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
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

      {/* Order Detail Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Chi tiết đơn hàng #{viewOrder.id}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Khách hàng</p>
                <p className="font-medium">{viewOrder.nameCustomer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày đặt</p>
                <p className="font-medium">
                  {new Date(viewOrder.createAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Ghi chú</p>
                <p className="font-medium">{viewOrder.note || 'Không có ghi chú'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Địa chỉ</p>
                <p className="font-medium">{viewOrder.address}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-3">Các món đã đặt</h3>
              {viewOrder.details?.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.price.toLocaleString('vi-VN')}đ x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-medium">Tổng tiền</span>
                <span className="text-xl font-bold text-orange-600">
                  {calculateTotal(viewOrder.details || []).toLocaleString('vi-VN')}đ
                </span>
              </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setViewOrder(null)}
              >
                Đóng
              </Button>
              {viewOrder.status === 0 && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus(viewOrder.id, 3)}
                  >
                    Hủy đơn
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(viewOrder.id, 1)}
                  >
                    Phê duyệt
                  </Button>
                </>
              )}
              {viewOrder.status === 1 && (
                <Button
                  onClick={() => handleUpdateStatus(viewOrder.id, 2)}
                >
                  Hoàn thành
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
