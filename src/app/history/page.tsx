'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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

interface OrderStatus {
  label: string;
  color: string;
}

interface OrderStatusMap {
  [key: string]: OrderStatus;
}

const ORDER_STATUS: OrderStatusMap = {
  PENDING: {
    label: 'Chờ xác nhận',
    color: 'warning'
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: 'info'
  },
  SHIPPING: {
    label: 'Đang giao hàng',
    color: 'primary'
  },
  DELIVERED: {
    label: 'Đã giao hàng',
    color: 'success'
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'destructive'
  }
};

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  date: Date;
  total: number;
  status: keyof typeof ORDER_STATUS;
  items: OrderItem[];
}

const orders: Order[] = [
  {
    id: 'ORD001',
    date: new Date('2024-02-15'),
    total: 1250000,
    status: 'DELIVERED',
    items: [
      { name: 'Áo thun nam', quantity: 2 },
      { name: 'Quần jean', quantity: 1 }
    ]
  },
  {
    id: 'ORD002',
    date: new Date('2024-02-18'),
    total: 890000,
    status: 'SHIPPING',
    items: [
      { name: 'Giày thể thao', quantity: 1 }
    ]
  },
];

export default function OrderHistory() {
  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>Trang chủ</li>
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
                    <h3 className="text-2xl font-bold mt-2">
                      {orders.filter(order => order.status === 'DELIVERED').length}
                    </h3>
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
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(orders.reduce((acc, order) => acc + order.total, 0))}
                    </h3>
                  </div>
                  <DollarSign className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Package className="h-6 w-6 text-blue-600" />
                    Lịch sử đơn hàng
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Xem lại tất cả đơn hàng bạn đã đặt
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Mã đơn hàng</TableHead>
                    <TableHead className="font-semibold">Ngày đặt</TableHead>
                    <TableHead className="font-semibold">Sản phẩm</TableHead>
                    <TableHead className="font-semibold">Tổng tiền</TableHead>
                    <TableHead className="font-semibold">Trạng thái</TableHead>
                    <TableHead className="font-semibold">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{formatDate(order.date)}</TableCell>
                      <TableCell>
                        <ul className="space-y-1">
                          {order.items.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                              {item.name}
                              <span className="text-sm text-gray-500">x{item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(order.total)}
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
                        <Link href={`/orders/${order.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
