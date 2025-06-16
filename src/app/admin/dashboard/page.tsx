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

interface OrderStatus {
  status: number;
  count: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
const STATUS_COLORS: Record<number, string> = {
  0: '#3b82f6', // Chờ xác nhận - xanh dương
  1: '#facc15', // Đã phê duyệt - vàng
  2: '#10b981', // Hoàn thành - xanh lá
  3: '#ef4444', // Hủy - đỏ
};

function getStatusLabel(status: number): string {
  switch (status) {
    case 0:
      return 'Chờ xác nhận';
    case 1:
      return 'Đã phê duyệt';
    case 2:
      return 'Hoàn thành';
    case 3:
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Date Filters */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Tổng doanh thu" value={`${summary.totalRevenue.toLocaleString()}đ`} icon={DollarSign} color="text-green-600" />
        <SummaryCard title="Tổng đơn hàng" value={summary.totalOrders} icon={ShoppingBag} color="text-blue-600" />
      </div>

      {/* Doanh thu theo ngày */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Doanh thu theo ngày</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
  content={({ active, payload, label }) => {
    if (active && payload && payload.length && payload[0].value !== undefined) {
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '10px',
          }}
        >
          <p>{`Ngày: ${label}`}</p>
          <p>{`Tổng tiền: ${payload[0].value.toLocaleString()}đ`}</p>
        </div>
      );
    }
    return null;
  }}
/>

              <Line type="monotone" dataKey="totalRevenue" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ sản phẩm bán chạy */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Sản phẩm bán chạy</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bestSellers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value: number) => [`${value} lượt`, 'Số lượng']} />
              <Bar dataKey="totalQuantity">
                {bestSellers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ trạng thái đơn hàng */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Trạng thái đơn hàng</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="count"
                data={orderStatusStats}
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${getStatusLabel(name)} (${(percent * 100).toFixed(0)}%)`}
              >
                {orderStatusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip
                formatter={(value: number, name: any, props: any) =>
                  [`${value} đơn`, getStatusLabel(props.payload.status)]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
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
