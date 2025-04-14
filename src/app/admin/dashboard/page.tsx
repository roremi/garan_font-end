'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { chatService, ChatRoomStatus } from '@/services/chatService';

const salesData = [
  { name: 'T2', sales: 4000 },
  { name: 'T3', sales: 3000 },
  { name: 'T4', sales: 2000 },
  { name: 'T5', sales: 2780 },
  { name: 'T6', sales: 1890 },
  { name: 'T7', sales: 2390 },
  { name: 'CN', sales: 3490 },
];

const stats = [
  {
    title: 'Tổng doanh thu',
    value: '120.5M',
    icon: DollarSign,
    trend: '+12.5%',
    color: 'text-green-600'
  },
  {
    title: 'Đơn hàng',
    value: '1,429',
    icon: ShoppingBag,
    trend: '+5.7%',
    color: 'text-blue-600'
  },
  {
    title: 'Khách hàng',
    value: '9,242',
    icon: Users,
    trend: '+2.1%',
    color: 'text-purple-600'
  },
  {
    title: 'Tăng trưởng',
    value: '23.1%',
    icon: TrendingUp,
    trend: '+4.3%',
    color: 'text-orange-600'
  },
];

export default function Dashboard() {
  const [chatStats, setChatStats] = useState({
    total: 0,
    pending: 0,
    success: 0,
    closed: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatStats = async () => {
      try {
        const rooms = await chatService.getRooms();
        setChatStats({
          total: rooms.length,
          pending: rooms.filter(r => r.status === ChatRoomStatus.Pending).length,
          success: rooms.filter(r => r.status === ChatRoomStatus.Success).length,
          closed: rooms.filter(r => r.status === ChatRoomStatus.Closed).length
        });
      } catch (error) {
        console.error('Error fetching chat stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatStats();
  }, []);

  const chatStatsData = [
    {
      title: 'Tổng tin nhắn',
      value: chatStats.total,
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Đang chờ',
      value: chatStats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Đã trả lời',
      value: chatStats.success,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Đã đóng',
      value: chatStats.closed,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                <p className={`text-sm ${stat.color} mt-1`}>
                  {stat.trend} so với tuần trước
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Stats */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Thống kê tin nhắn</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chatStatsData.map((stat, index) => (
            <div
              key={index}
              className="border rounded-lg p-4"
            >
              <div className="flex items-center space-x-4">
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <h3 className="text-xl font-bold">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Doanh số bán hàng</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
