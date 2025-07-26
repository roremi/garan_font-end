'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp
} from 'lucide-react';
import { api } from '@/services/api';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import InventoryPanel from "@/components/InventoryPanel";

interface OrderStatus {
  status: number;
  count: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
const STATUS_COLORS: Record<number, string> = {
  0: '#3b82f6', // Chờ xác nhận - xanh dương
  1: '#facc15', // Đã phê duyệt - vàng
  2: '#10b981', 
  3: '#10b981', 
  4: '#ef4444', // Hủy - đỏ

};

function getStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return 'Chờ xác nhận';
    case 1:
      return 'Chờ giao hàng';
    case 2:
      return 'Đang giao hàng';
    case 3:
      return 'Đã hoàn thành';
    case 4:
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
}

export default function Dashboard() {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 9 * 86400000));
  const [toDate, setToDate] = useState(new Date());
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [orderStatusStats, setOrderStatusStats] = useState<OrderStatus[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0 });
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryTitle, setInventoryTitle] = useState('');
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [inventoryColumns, setInventoryColumns] = useState<{ label: string; key: string }[]>([]);
  const [inventoryType, setInventoryType] = useState<'revenue' | 'bestsellers' | 'status' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);




  useEffect(() => {
    loadDashboardData();
  }, [fromDate, toDate]);

  const loadDashboardData = async () => {
    try {
      const fromStr = format(fromDate, 'yyyy-MM-dd');
      const toStr = format(toDate, 'yyyy-MM-dd');

      const [revenue, sellers, statuses] = await Promise.all([
        api.getDailyRevenue(fromStr, toStr),
        api.getBestSellingProducts(fromStr, toStr),
        api.getOrderStatusStatistics(fromStr, toStr)
      ]);

      setDailyRevenue(revenue);
      setBestSellers(sellers);
      setOrderStatusStats(statuses);

      const totalRevenue = revenue.reduce((sum: number, r: { totalRevenue: number }) => sum + r.totalRevenue, 0);
      const totalOrders = statuses.reduce((sum: number, s: { count: number }) => sum + s.count, 0);
      setSummary({ totalRevenue, totalOrders });
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard:', error);
    }
  };
  const handleOpenRevenueInventory = async () => {
    try {
      const fromStr = format(fromDate, 'yyyy-MM-dd');
      const toStr = format(toDate, 'yyyy-MM-dd');
      const data = await api.getDailyRevenueTable(fromStr, toStr);

      setInventoryTitle('Bảng kiểm kê doanh thu theo ngày');
      setInventoryColumns([
        { label: 'Ngày', key: 'date' },
        { label: 'Số đơn hàng', key: 'orderCount' },
        { label: 'Tổng doanh thu', key: 'totalRevenue' }
      ]);
      setInventoryData(data);
      setShowInventory(true);
    } catch (error) {
      console.error('Lỗi khi mở kiểm kê doanh thu:', error);
    }
  };
  // Hàm mở bảng kiểm kê sản phẩm bán chạy
  const handleOpenBestSellersInventory = async () => {
    try {
      const fromStr = format(fromDate, 'yyyy-MM-dd');
      const toStr = format(toDate, 'yyyy-MM-dd');
      const data = await api.getBestSellersTable(fromStr, toStr);

      setInventoryTitle('Bảng kiểm kê sản phẩm bán chạy');
      setInventoryColumns([
        { label: 'Ngày', key: 'date' },
        { label: 'Tên sản phẩm', key: 'name' },
        { label: 'Số lượng đã bán', key: 'totalQuantity' },
        { label: 'Loại', key: 'type' }
      ]);
      setInventoryData(data);
      setShowInventory(true);
      setInventoryType('bestsellers');
    } catch (error) {
      console.error('Lỗi khi mở kiểm kê sản phẩm:', error);
    }
  };

  const handleViewOrderDetailFromInventory = async (row: any) => {
  try {
    setSelectedOrder(row);
    const res = await api.getOrderDetails(row.id); // gọi đúng API
    if (res.status === 200) {
      setOrderDetails(res.data);
    } else {
      setOrderDetails([]);
    }
  } catch (err) {
    console.error("Lỗi lấy chi tiết đơn:", err);
    setOrderDetails([]);
  }
};

 const handleOpenOrderStatusInventory = async () => {
  try {
    const fromStr = format(fromDate, 'yyyy-MM-dd');
    const toStr = format(toDate, 'yyyy-MM-dd');
    const raw = await api.getOrderStatusTable(fromStr, toStr); // danh sách đơn chi tiết

    const data = raw.map((o: any) => ({
      id: o.id,
      date: o.date,
      customer: o.customerName,
      statusLabel: getStatusLabel(o.status),
      total: o.total?.toLocaleString() + 'đ',
      address: o.address,
      driver: o.driverName || '—'
    }));

    setInventoryTitle('Chi tiết đơn hàng');
    setInventoryColumns([
      { label: 'Mã đơn', key: 'id' },
      { label: 'Thời gian', key: 'date' },
      { label: 'Khách hàng', key: 'customer' },
      { label: 'Trạng thái', key: 'statusLabel' },
      { label: 'Tổng tiền', key: 'total' },
      { label: 'Địa chỉ', key: 'address' },
      { label: 'Tài xế', key: 'driver' }
    ]);
    setInventoryData(data);
    setShowInventory(true);
  } catch (err) {
    console.error('Lỗi khi mở chi tiết đơn hàng:', err);
  }
};




  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Tổng doanh thu" value={`${summary.totalRevenue.toLocaleString()}đ`} icon={DollarSign} color="text-green-600" />
        <SummaryCard title="Tổng đơn hàng" value={summary.totalOrders} icon={ShoppingBag} color="text-blue-600" />
      </div>

      {/* Date Filters */}
      <div className="w-full flex justify-end mt-2">
        <div className="flex items-center gap-4">
          <DatePicker
            selected={fromDate}
            onChange={(date) => date && setFromDate(date)}
            dateFormat="yyyy-MM-dd"
            className="border px-2 py-1 rounded"
          />
          <span>to</span>
          <DatePicker
            selected={toDate}
            onChange={(date) => date && setToDate(date)}
            dateFormat="yyyy-MM-dd"
            className="border px-2 py-1 rounded"
          />
        </div>
      </div>

      {/* HÀNG 1: Doanh thu theo ngày (full width) */}
      {/* KHỐI 1: Doanh thu theo ngày */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Doanh thu theo ngày</h2>
        </div>
        <button
        onClick={handleOpenRevenueInventory}
        className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Kiểm kê
        </button>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Tổng tiền']} />
              <Line type="monotone" dataKey="totalRevenue" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* HÀNG 2: Best sellers + Order status 70:30 */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* 70% */}
        <div className="col-span-1 lg:col-span-7 bg-white rounded-lg p-6 shadow-sm h-[350px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sản phẩm bán chạy</h2>
            <button
              onClick={handleOpenBestSellersInventory}
              className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Kiểm kê
            </button>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={bestSellers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value: number) => [`${value} lượt`, 'Số lượng']} />
              <Bar dataKey="totalQuantity" barSize={70}>
                {bestSellers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 30% */}
        <div className="col-span-1 lg:col-span-3 bg-white rounded-lg p-6 shadow-sm h-[350px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Trạng thái đơn hàng</h2>
            <button
              onClick={handleOpenOrderStatusInventory}
              className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Kiểm kê
            </button>
          </div>

          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                dataKey="count"
                data={orderStatusStats}
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }) => `${getStatusLabel(name)} (${(percent * 100).toFixed(0)}%)`}
              >
                {orderStatusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name, props) => [
                  `${value} đơn`,
                  getStatusLabel(props.payload.status),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
        {showInventory && (
        <InventoryPanel
          title={inventoryTitle}
          data={inventoryData}
          columns={inventoryColumns}
          onClose={() => setShowInventory(false)}
          onViewDetail={handleViewOrderDetailFromInventory} // <- THÊM DÒNG NÀY
        />
        )}
        {selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Chi tiết đơn hàng #{selectedOrder.id}</h2>
        <button
          onClick={() => setSelectedOrder(null)}
          className="text-gray-600 hover:text-red-600"
        >
          ✕
        </button>
      </div>
      <div className="mb-4 space-y-1">
        <p><strong>Khách hàng:</strong> {selectedOrder.customer}</p>
        <p><strong>Trạng thái:</strong> {selectedOrder.statusLabel}</p>
        <p><strong>Địa chỉ:</strong> {selectedOrder.address}</p>
        <p><strong>Tài xế:</strong> {selectedOrder.driver}</p>
      </div>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Tên</th>
            <th className="border px-2 py-1">Số lượng</th>
            <th className="border px-2 py-1">Giá</th>
            {/* <th className="border px-2 py-1">Tổng</th> */}
          </tr>
        </thead>
        <tbody>
          {orderDetails.map((item) => (
            <tr key={item.id}>
              <td className="border px-2 py-1">{item.name}</td>
              <td className="border px-2 py-1">{item.quantity}</td>
              <td className="border px-2 py-1">{item.price.toLocaleString('vi-VN')}đ</td>
              {/* <td className="border px-2 py-1">
                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
              </td> */}
            </tr>
          ))}
          {orderDetails.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-3 text-gray-400">
                Không có chi tiết đơn hàng
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}


