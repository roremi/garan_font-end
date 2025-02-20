'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import {authService} from '@/services/auth.service'
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
import { Package, Eye, Calendar, Box, DollarSign } from "lucide-react";
import { Order } from '@/types/order';

interface OrderStatus {
  label: string;
  color: string;
}

interface OrderStatusMap {
  [key: number]: OrderStatus;
}

const ORDER_STATUS: OrderStatusMap = {
  0: {
    label: 'Chờ xác nhận',
    color: 'warning'
  },
  1: {
    label: 'Đang giao hàng',
    color: 'info'
  },
  2: {
    label: 'Đã giao hàng',
    color: 'primary'
  },
  3: {
    label: 'Đã hủy',
    color: 'danger'
  }
};

export default function OrderHistory() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);


  
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
      if (!isAuthenticated || !user) {  // Check both isAuthenticated and user
        return; // Don't fetch if not authenticated or user is null
      }
    try {
      const userResponse = await authService.getUserByEmail(user.email);
      const userId = userResponse.id;
      // const orderCode = generateOrderCode();
      setLoading(true);
      const data = await api.getOrdersbyUser(userId); // Sử dụng userId của người dùng đăng nhập
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
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

  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);

  const handleViewOrder = async (order: Order) => {
    try {
      const details = await api.getOrderDetails(order.id);
      setOrderDetails(details);
      setViewOrder(order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải chi tiết đơn hàng",
      });
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      await api.confirmOrder(orderId, 3); // 3 là trạng thái đã hủy
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

  if (!isAuthenticated) {
    return null; // hoặc hiển thị một loading spinner
  }

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              {orders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Chưa có đơn hàng nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold">Mã đơn hàng</TableHead>
                      <TableHead className="font-semibold">Ngày đặt</TableHead>
                      <TableHead className="font-semibold">Tổng tiền</TableHead>
                      <TableHead className="font-semibold">Trạng thái</TableHead>
                      <TableHead className="font-semibold">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-medium">#{order.id}</TableCell>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Chi tiết đơn hàng #{viewOrder.id}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Ngày đặt</p>
                <p className="font-medium">
                  {formatDate(viewOrder.createAt)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Ghi chú</p>
                <p className="font-medium">{viewOrder.note || 'Không có ghi chú'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Địa chỉ</p>
                <p className="font-medium">{viewOrder.address}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-3">Các món đã đặt</h3>
              {orderDetails.map((item) => (
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
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="font-medium">Tổng tiền</span>
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(viewOrder.total)}
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