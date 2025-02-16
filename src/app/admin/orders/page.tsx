'use client';

import React, { useState } from 'react';
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

// Dữ liệu mẫu
const orders = [
  {
    id: '#ORD001',
    customer: 'Nguyễn Văn A',
    date: '2024-02-17',
    total: 235000,
    status: 'pending',
    items: [
      { name: 'Gà rán sốt cay', quantity: 2 },
      { name: 'Khoai tây chiên', quantity: 1 }
    ]
  },
  {
    id: '#ORD002',
    customer: 'Trần Thị B',
    date: '2024-02-17',
    total: 185000,
    status: 'processing',
    items: [
      { name: 'Combo gia đình', quantity: 1 }
    ]
  },
  // Thêm đơn hàng khác...
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusNames = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [viewOrder, setViewOrder] = useState<any>(null);

  const filteredOrders = orders.filter(order => {
    if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;
    if (selectedDate !== 'all') {
      // Thêm logic lọc theo ngày ở đây
      return true;
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
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="processing">Đang xử lý</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
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
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>{order.total.toLocaleString()}đ</TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-sm ${statusColors[order.status as keyof typeof statusColors]}`}>
                    {statusNames[order.status as keyof typeof statusNames]}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewOrder(order)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Chi tiết đơn hàng {viewOrder.id}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Khách hàng</p>
                <p className="font-medium">{viewOrder.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày đặt</p>
                <p className="font-medium">{viewOrder.date}</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-3">Các món đã đặt</h3>
              {viewOrder.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between py-2 border-b last:border-0">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="font-medium">Tổng tiền</span>
              <span className="text-xl font-bold">{viewOrder.total.toLocaleString()}đ</span>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setViewOrder(null)}
              >
                Đóng
              </Button>
              <Button>
                Cập nhật trạng thái
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
