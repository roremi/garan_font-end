'use client';

import React, { useState, useEffect } from 'react';
import { Mail, TrendingUp, Eye, Gift, Users, BarChart3, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  status: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

interface CampaignOverview {
  totalCampaigns: number;
  draftCampaigns: number;
  scheduledCampaigns: number;
  sentCampaigns: number;
  totalEmailsSent: number;
  totalOpens: number;
  totalClicks: number;
  totalRedemptions: number;
  openRate: number;
  clickRate: number;
  redemptionRate: number;
  recentCampaigns: EmailCampaign[];
  segmentStats: Array<{
    segment: string;
    userCount: number;
    campaignCount: number;
  }>;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}

const campaignStatusColors = {
  Draft: 'bg-gray-100 text-gray-800',
  Scheduled: 'bg-yellow-100 text-yellow-800',
  Sent: 'bg-green-100 text-green-800',
};

const campaignStatusNames = {
  Draft: 'Nháp',
  Scheduled: 'Đã lên lịch',
  Sent: 'Đã gửi',
};

export default function DashboardComponent() {
  const [campaignOverview, setCampaignOverview] = useState<CampaignOverview | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewResponse, activitiesResponse] = await Promise.all([
        api.getCampaignOverview(),
        api.getRecentActivities()
      ]);

      if (overviewResponse.success) {
        setCampaignOverview(overviewResponse.data);
      }

      if (activitiesResponse.success) {
        setRecentActivities(activitiesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard"
      });
    }
    setLoading(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email opened':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'voucher redeemed':
        return <Gift className="h-4 w-4 text-green-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!campaignOverview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không thể tải dữ liệu dashboard</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard Marketing Email</h2>
        <Button onClick={fetchDashboardData} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Campaign</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignOverview.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Nháp: {campaignOverview.draftCampaigns} | Đã gửi: {campaignOverview.sentCampaigns}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email đã gửi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignOverview.totalEmailsSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Đã mở: {campaignOverview.totalOpens.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ mở</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignOverview.openRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Click: {campaignOverview.clickRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voucher đã dùng</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignOverview.totalRedemptions}</div>
            <p className="text-xs text-muted-foreground">
              Tỷ lệ: {campaignOverview.redemptionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign gần đây */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignOverview.recentCampaigns.length === 0 ? (
                <p className="text-center text-gray-500">Không có campaign nào</p>
              ) : (
                campaignOverview.recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          campaignStatusColors[campaign.status as keyof typeof campaignStatusColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaignStatusNames[campaign.status as keyof typeof campaignStatusNames] || campaign.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(campaign.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{campaign.sentCount.toLocaleString()} gửi</p>
                      <p className="text-xs text-gray-500">
                        {campaign.openCount} mở | {campaign.clickCount} click
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hoạt động gần đây */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <p className="text-center text-gray-500">Không có hoạt động nào</p>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className="mt-1">
                      {activity.icon ? (
                        <span className="text-lg">{activity.icon}</span>
                      ) : (
                        getActivityIcon(activity.type)
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.type}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thống kê theo phân đoạn */}
      {campaignOverview.segmentStats && campaignOverview.segmentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo phân đoạn khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {campaignOverview.segmentStats.map((stat, index) => (
                <div key={index} className="p-4 border rounded-lg text-center">
                  <h3 className="font-semibold text-lg">{stat.segment}</h3>
                  <div className="mt-2">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">{stat.userCount} người dùng</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">{stat.campaignCount} campaign</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}