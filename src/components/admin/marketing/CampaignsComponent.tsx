'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, Plus, Edit, Trash2, Play, Pause, Send, Calendar, 
  Zap, Bot, TrendingUp, Clock, CheckCircle, AlertCircle, Mail, Gift
} from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";

// Tooltip Component
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

// Badge component đơn giản
const Badge = ({ children, variant = "default", className = "" }: { 
  children: React.ReactNode; 
  variant?: "default" | "secondary" | "outline"; 
  className?: string;
}) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-200 text-gray-700"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Interfaces theo đúng API format
interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  content: string;
  targetSegment: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  sentCount: number;
  createdAt: string;
  updatedAt: string;
  trackings: CampaignTracking[];
}

interface CampaignTracking {
  id: number;
  campaignId: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  voucherCode: string;
  opened: boolean;
  clicked: boolean;
  redeemed: boolean;
  openedAt?: string;
  clickedAt?: string;
  redeemedAt?: string;
}

interface CreateCampaignRequest {
  name: string;
  subject: string;
  content: string;
  targetSegment: string;
}

interface CampaignStatistics {
  totalCampaigns: number;
  draftCampaigns: number;
  scheduledCampaigns: number;
  sentCampaigns: number;
  totalEmailsSent: number;
  totalOpens: number;
  totalClicks: number;
  totalVouchersRedeemed: number;
  openRate: number;
  clickRate: number;
  redemptionRate: number;
}

interface AIPreviewResponse {
  campaign: {
    id: number;
    name: string;
    targetSegment: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  current: {
    subject: string;
    content: string;
    contentLength: number;
    hasSubject: boolean;
    hasContent: boolean;
  };
  aiSuggestion: {
    subject: string;
    content: string;
    contentLength: number;
    estimatedReadTime: string;
    sampleVoucherInfo: string;
    isRealAI: boolean;
    fallbackDetected: boolean;
  };
  analysis: {
    subjectImproved: boolean;
    contentImproved: boolean;
    improvementScore: number;
    expectedOpenRateIncrease: string;
    expectedClickRateIncrease: string;
  };
  aiFeatures: string[];
  timestamp: string;
}

const statusColors = {
  Draft: 'bg-gray-100 text-gray-800',
  Scheduled: 'bg-yellow-100 text-yellow-800',
  Sent: 'bg-green-100 text-green-800',
};

const statusNames = {
  Draft: 'Nháp',
  Scheduled: 'Đã lên lịch',
  Sent: 'Đã gửi'
};

export default function CampaignsComponent() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [statistics, setStatistics] = useState<CampaignStatistics | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [viewCampaign, setViewCampaign] = useState<EmailCampaign | null>(null);
  const [editCampaign, setEditCampaign] = useState<EmailCampaign | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState<EmailCampaign | null>(null);
  const [showAIPreview, setShowAIPreview] = useState<EmailCampaign | null>(null);
  const [aiPreviewData, setAIPreviewData] = useState<AIPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [aiStatus, setAIStatus] = useState<{ available: boolean; checked: boolean }>({ available: false, checked: false });
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: '',
    subject: '',
    content: '',
    targetSegment: 'VIP'
  });

  const [scheduleData, setScheduleData] = useState({
    scheduleTime: ''
  });

  // Helper functions to calculate stats from trackings
  const getOpenCount = (trackings: CampaignTracking[]) => {
    return trackings.filter(t => t.opened).length;
  };

  const getClickCount = (trackings: CampaignTracking[]) => {
    return trackings.filter(t => t.clicked).length;
  };

  const getRedemptionCount = (trackings: CampaignTracking[]) => {
    return trackings.filter(t => t.redeemed).length;
  };

  useEffect(() => {
    fetchCampaigns();
    fetchStatistics();
    checkAIStatus();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await api.getAdminCampaigns();
      if (response.success) {
        setCampaigns(response.data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách campaigns",
      });
    }
    setLoading(false);
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.getCampaignStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const checkAIStatus = async () => {
    try {
      const response = await api.getCampaignAIStatus();
      if (response.success) {
        setAIStatus({ available: response.data.aiEnabled || false, checked: true });
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAIStatus({ available: false, checked: true });
    }
  };

  const handleCreateCampaign = async () => {
    setActionLoading({ create: true });
    try {
      const response = await api.createAdminCampaign(formData);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã tạo campaign mới",
        });
        fetchCampaigns();
        setShowCreateForm(false);
        setFormData({ name: '', subject: '', content: '', targetSegment: 'VIP' });
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể tạo campaign",
      });
    }
    setActionLoading({ create: false });
  };

  const handleUpdateCampaign = async () => {
    if (!editCampaign) return;

    setActionLoading({ [`update-${editCampaign.id}`]: true });
    try {
      const response = await api.updateAdminCampaign(editCampaign.id, formData);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật campaign",
        });
        fetchCampaigns();
        setEditCampaign(null);
      }
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật campaign",
      });
    }
    setActionLoading({ [`update-${editCampaign.id}`]: false });
  };

  const handleDeleteCampaign = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa campaign "${name}"?`)) return;

    setActionLoading({ [`delete-${id}`]: true });
    try {
      const response = await api.deleteAdminCampaign(id);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa campaign",
        });
        fetchCampaigns();
      }
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể xóa campaign",
      });
    }
    setActionLoading({ [`delete-${id}`]: false });
  };

  const handleSendCampaign = async (id: number, useAI: boolean = false) => {
    const actionKey = useAI ? `send-ai-${id}` : `send-${id}`;
    setActionLoading({ [actionKey]: true });

    try {
      const response = useAI 
        ? await api.sendCampaignWithAI(id)
        : await api.sendCampaignNow(id);
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: useAI ? 
            `Campaign đã gửi với AI - ${response.data?.sentCount || 'N/A'} emails` :
            `Campaign đã gửi - ${response.data?.sentCount || 'N/A'} emails`,
        });
        fetchCampaigns();
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể gửi campaign",
      });
    }
    setActionLoading({ [actionKey]: false });
  };

  const handleScheduleCampaign = async () => {
    if (!showScheduleModal || !scheduleData.scheduleTime) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn thời gian gửi",
      });
      return;
    }

    setActionLoading({ [`schedule-${showScheduleModal.id}`]: true });
    try {
      const response = await api.scheduleCampaign(
        showScheduleModal.id, 
        new Date(scheduleData.scheduleTime).toISOString()
      );
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: response.message || "Đã lập lịch campaign thành công",
        });
        fetchCampaigns();
        setShowScheduleModal(null);
        setScheduleData({ scheduleTime: '' });
      }
    } catch (error: any) {
      console.error('Error scheduling campaign:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể lên lịch campaign",
      });
    }
    setActionLoading({ [`schedule-${showScheduleModal.id}`]: false });
  };

  const handleAIPreview = async (campaign: EmailCampaign) => {
    setActionLoading({ [`ai-preview-${campaign.id}`]: true });
    try {
      const response = await api.previewCampaignAI(campaign.id);
      
      if (response.success) {
        setAIPreviewData(response.data);
        setShowAIPreview(campaign);
        toast({
          title: "AI Preview",
          description: "AI đã tạo nội dung tối ưu cho campaign",
        });
      } else {
        toast({
          variant: "destructive",
          title: "AI không khả dụng",
          description: response.message,
        });
      }
    } catch (error: any) {
      console.error('Error getting AI preview:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo AI preview",
      });
    }
    setActionLoading({ [`ai-preview-${campaign.id}`]: false });
  };

  const handleOptimizeWithAI = async (id: number) => {
    setActionLoading({ [`optimize-${id}`]: true });
    try {
      const response = await api.optimizeCampaignWithAI(id);
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Campaign đã được tối ưu hóa với AI",
        });
        fetchCampaigns();
        setShowAIPreview(null);
      }
    } catch (error: any) {
      console.error('Error optimizing with AI:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể tối ưu với AI",
      });
    }
    setActionLoading({ [`optimize-${id}`]: false });
  };

  const handleViewTracking = async (campaign: EmailCampaign) => {
    // Sử dụng trực tiếp trackings từ campaign
    setViewCampaign(campaign);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (selectedStatus !== 'all' && campaign.status !== selectedStatus) return false;
    if (selectedSegment !== 'all' && campaign.targetSegment !== selectedSegment) return false;
    return true;
  });

  const calculateOpenRate = (openCount: number, sentCount: number) => {
    return sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : '0.0';
  };

  const calculateClickRate = (clickCount: number, sentCount: number) => {
    return sentCount > 0 ? ((clickCount / sentCount) * 100).toFixed(1) : '0.0';
  };

  // Hiện thị loading spinner
  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Quản lý Email Campaigns</h2>
        <div className="flex gap-4">
          {aiStatus.checked && (
            <Badge variant={aiStatus.available ? "default" : "secondary"} className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              AI {aiStatus.available ? 'Hoạt động' : 'Offline'}
            </Badge>
          )}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="Draft">Nháp</SelectItem>
              <SelectItem value="Scheduled">Đã lên lịch</SelectItem>
              <SelectItem value="Sent">Đã gửi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Phân đoạn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Campaign
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng Campaigns</p>
                  <p className="text-2xl font-bold">{statistics.totalCampaigns}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Email đã gửi</p>
                  <p className="text-2xl font-bold">{statistics.totalEmailsSent.toLocaleString()}</p>
                </div>
                <Send className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tỷ lệ mở</p>
                  <p className="text-2xl font-bold">{statistics.openRate.toFixed(1)}%</p>
                </div>
                <Eye className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Voucher đã dùng</p>
                  <p className="text-2xl font-bold">{statistics.totalVouchersRedeemed}</p>
                </div>
                <Gift className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Phân đoạn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Đã gửi</TableHead>
              <TableHead>Tỷ lệ mở</TableHead>
              <TableHead>Tỷ lệ click</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Đang tải...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Không có campaign nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => {
                const openCount = getOpenCount(campaign.trackings);
                const clickCount = getClickCount(campaign.trackings);
                
                return (
                  <TableRow key={campaign.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                          {campaign.subject || 'Chưa có subject'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.targetSegment}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={statusColors[campaign.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
                      >
                        {statusNames[campaign.status as keyof typeof statusNames] || campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-medium">{campaign.sentCount.toLocaleString()}</p>
                        {campaign.sentAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(campaign.sentAt).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-medium">{calculateOpenRate(openCount, campaign.sentCount)}%</p>
                        <p className="text-xs text-gray-500">{openCount} mở</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-medium">{calculateClickRate(clickCount, campaign.sentCount)}%</p>
                        <p className="text-xs text-gray-500">{clickCount} click</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(campaign.createdAt).toLocaleDateString('vi-VN')}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(campaign.createdAt).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip content="Xem chi tiết và tracking">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTracking(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        
                        {campaign.status === 'Draft' && (
                          <>
                            <Tooltip content="Chỉnh sửa campaign">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditCampaign(campaign);
                                  setFormData({
                                    name: campaign.name,
                                    subject: campaign.subject,
                                    content: campaign.content,
                                    targetSegment: campaign.targetSegment
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Tooltip>

                            {aiStatus.available && (
                              <>
                                <Tooltip content="Xem trước AI suggestions">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAIPreview(campaign)}
                                    disabled={actionLoading[`ai-preview-${campaign.id}`]}
                                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                  >
                                    {actionLoading[`ai-preview-${campaign.id}`] ? <LoadingSpinner /> : <Bot className="h-4 w-4" />}
                                  </Button>
                                </Tooltip>

                                <Tooltip content="Tối ưu hóa với AI">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOptimizeWithAI(campaign.id)}
                                    disabled={actionLoading[`optimize-${campaign.id}`]}
                                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                  >
                                    {actionLoading[`optimize-${campaign.id}`] ? <LoadingSpinner /> : <Zap className="h-4 w-4" />}
                                  </Button>
                                </Tooltip>
                              </>
                            )}

                            <Tooltip content="Lập lịch gửi">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowScheduleModal(campaign);
                                  setScheduleData({ scheduleTime: '' });
                                }}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </Tooltip>

                            <Tooltip content="Gửi ngay">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendCampaign(campaign.id, false)}
                                disabled={actionLoading[`send-${campaign.id}`]}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                {actionLoading[`send-${campaign.id}`] ? <LoadingSpinner /> : <Send className="h-4 w-4" />}
                              </Button>
                            </Tooltip>

                            {aiStatus.available && (
                              <Tooltip content="Gửi với AI enhancement">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendCampaign(campaign.id, true)}
                                  disabled={actionLoading[`send-ai-${campaign.id}`]}
                                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                >
                                  {actionLoading[`send-ai-${campaign.id}`] ? (
                                    <LoadingSpinner />
                                  ) : (
                                    <>
                                      <Bot className="h-3 w-3 mr-1" />
                                      <Send className="h-3 w-3" />
                                    </>
                                  )}
                                </Button>
                              </Tooltip>
                            )}

                            <Tooltip content="Xóa campaign">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                                disabled={actionLoading[`delete-${campaign.id}`]}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                {actionLoading[`delete-${campaign.id}`] ? <LoadingSpinner /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* AI Preview Modal */}
      {showAIPreview && aiPreviewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6 text-purple-600" />
                AI Preview: {aiPreviewData.campaign.name}
                {aiPreviewData.aiSuggestion.isRealAI && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    Real AI
                  </Badge>
                )}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowAIPreview(null)}>
                ✕
              </Button>
            </div>

            {/* Campaign Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Thông tin Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Phân đoạn:</p>
                    <p className="font-medium">{aiPreviewData.campaign.targetSegment}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Trạng thái:</p>
                    <p className="font-medium">{aiPreviewData.campaign.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Voucher Info:</p>
                    <p className="font-medium">{aiPreviewData.aiSuggestion.sampleVoucherInfo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Thời gian tạo:</p>
                    <p className="font-medium">{new Date(aiPreviewData.timestamp).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Current Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600 flex items-center justify-between">
                    Nội dung hiện tại
                    <div className="flex gap-2">
                      {aiPreviewData.current.hasSubject && (
                        <Badge variant="outline" className="text-xs">Có Subject</Badge>
                      )}
                      {aiPreviewData.current.hasContent && (
                        <Badge variant="outline" className="text-xs">Có Content</Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Subject:</p>
                    <p className="text-sm bg-gray-50 p-3 rounded border">
                      {aiPreviewData.current.subject || 'Chưa có subject'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Content ({aiPreviewData.current.contentLength} ký tự):</p>
                    <div className="text-sm bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
                      {aiPreviewData.current.content ? (
                        <div dangerouslySetInnerHTML={{ __html: aiPreviewData.current.content }} />
                      ) : (
                        <p className="text-gray-500">Chưa có content</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Suggestion */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-purple-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      AI Suggestion
                    </div>
                    {!aiPreviewData.aiSuggestion.fallbackDetected && (
                      <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                        Tối ưu hóa
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Subject tối ưu:</p>
                    <p className="text-sm bg-purple-50 p-3 rounded border font-medium">
                      {aiPreviewData.aiSuggestion.subject}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Content tối ưu ({aiPreviewData.aiSuggestion.contentLength} ký tự - {aiPreviewData.aiSuggestion.estimatedReadTime}):
                    </p>
                    <div className="text-sm bg-purple-50 p-3 rounded border max-h-40 overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: aiPreviewData.aiSuggestion.content.replace(/```html|```/g, '') }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Phân tích và Cải thiện</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Open Rate</p>
                    <p className="text-lg font-bold text-green-600">
                      +{aiPreviewData.analysis.expectedOpenRateIncrease}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Click Rate</p>
                    <p className="text-lg font-bold text-blue-600">
                      +{aiPreviewData.analysis.expectedClickRateIncrease}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border">
                    <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Improvement Score</p>
                    <p className="text-lg font-bold text-purple-600">
                      {aiPreviewData.analysis.improvementScore}/100
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Cải thiện:</p>
                    <div className="space-y-1">
                      {aiPreviewData.analysis.subjectImproved && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Subject được tối ưu hóa
                        </div>
                      )}
                      {aiPreviewData.analysis.contentImproved && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Content được cải thiện
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">AI Features:</p>
                    <div className="space-y-1">
                      {aiPreviewData.aiFeatures.slice(0, 3).map((feature, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-start gap-1">
                          <span>•</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAIPreview(null)}>
                Đóng
              </Button>
              <Button 
                onClick={() => handleOptimizeWithAI(showAIPreview.id)}
                disabled={actionLoading[`optimize-${showAIPreview.id}`]}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {actionLoading[`optimize-${showAIPreview.id}`] ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Đang áp dụng...</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Áp dụng AI Optimization
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editCampaign) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editCampaign ? 'Chỉnh sửa Campaign' : 'Tạo Campaign mới'}
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditCampaign(null);
                  setFormData({ name: '', subject: '', content: '', targetSegment: 'VIP' });
                }}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên Campaign <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="VD: Flash Sale Cuối Tuần"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phân đoạn khách hàng <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={formData.targetSegment} 
                  onValueChange={(value) => setFormData({...formData, targetSegment: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIP">VIP - Khách hàng VIP</SelectItem>
                    <SelectItem value="Regular">Regular - Khách hàng thường</SelectItem>
                    <SelectItem value="New">New - Khách hàng mới</SelectItem>
                    <SelectItem value="Inactive">Inactive - Khách hàng chưa hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject Email
                  {aiStatus.available && (
                    <span className="text-sm text-purple-600 ml-2">(AI có thể tối ưu)</span>
                  )}
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="VD: 🔥 Flash Sale 50% - Chỉ hôm nay!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nội dung Email (HTML)
                  {aiStatus.available && (
                    <span className="text-sm text-purple-600 ml-2">(AI có thể tối ưu)</span>
                  )}
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Nhập nội dung email (hỗ trợ HTML)..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {aiStatus.available && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">AI Assistant</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    AI có thể tự động tối ưu hóa subject và content để tăng open rate và click rate. 
                    Bạn có thể preview trước hoặc áp dụng trực tiếp sau khi tạo campaign.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditCampaign(null);
                  setFormData({ name: '', subject: '', content: '', targetSegment: 'VIP' });
                }}
              >
                Hủy
              </Button>
              <Button 
                onClick={editCampaign ? handleUpdateCampaign : handleCreateCampaign}
                disabled={!formData.name || !formData.targetSegment || actionLoading.create}
              >
                {actionLoading.create ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Đang tạo...</span>
                  </>
                ) : (
                  editCampaign ? 'Cập nhật' : 'Tạo Campaign'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Lập lịch gửi Campaign</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowScheduleModal(null);
                  setScheduleData({ scheduleTime: '' });
                }}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Campaign: {showScheduleModal.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Thời gian gửi <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={scheduleData.scheduleTime}
                  onChange={(e) => setScheduleData({...scheduleData, scheduleTime: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleModal(null);
                  setScheduleData({ scheduleTime: '' });
                }}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleScheduleCampaign}
                disabled={!scheduleData.scheduleTime || actionLoading[`schedule-${showScheduleModal.id}`]}
              >
                {actionLoading[`schedule-${showScheduleModal.id}`] ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Đang lập lịch...</span>
                  </>
                ) : (
                  'Lập lịch'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Campaign & Tracking Modal */}
      {viewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Chi tiết Campaign: {viewCampaign.name}</h2>
              <Button variant="outline" size="sm" onClick={() => setViewCampaign(null)}>
                ✕
              </Button>
            </div>

            {(() => {
              const openCount = getOpenCount(viewCampaign.trackings);
              const clickCount = getClickCount(viewCampaign.trackings);
              const redemptionCount = getRedemptionCount(viewCampaign.trackings);

              return (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Thông tin Campaign</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Tên</p>
                          <p className="font-medium">{viewCampaign.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Subject</p>
                          <p className="font-medium">{viewCampaign.subject}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phân đoạn</p>
                          <Badge variant="outline">{viewCampaign.targetSegment}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Trạng thái</p>
                          <Badge className={statusColors[viewCampaign.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                            {statusNames[viewCampaign.status as keyof typeof statusNames] || viewCampaign.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Thống kê gửi email</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{viewCampaign.sentCount.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Email đã gửi</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{openCount.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Đã mở ({calculateOpenRate(openCount, viewCampaign.sentCount)}%)</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{clickCount.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Đã click ({calculateClickRate(clickCount, viewCampaign.sentCount)}%)</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Thời gian</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Ngày tạo</p>
                          <p className="font-medium">{new Date(viewCampaign.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        {viewCampaign.scheduledAt && (
                          <div>
                            <p className="text-sm text-gray-500">Lên lịch</p>
                            <p className="font-medium">{new Date(viewCampaign.scheduledAt).toLocaleString('vi-VN')}</p>
                          </div>
                        )}
                        {viewCampaign.sentAt && (
                          <div>
                            <p className="text-sm text-gray-500">Đã gửi</p>
                            <p className="font-medium">{new Date(viewCampaign.sentAt).toLocaleString('vi-VN')}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Voucher đã dùng</p>
                          <p className="text-2xl font-bold text-purple-600">{redemptionCount}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Content Preview */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-sm">Nội dung Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: viewCampaign.content }} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tracking Data */}
                  {viewCampaign.trackings && viewCampaign.trackings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Chi tiết Tracking</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Voucher</TableHead>
                                <TableHead>Mở email</TableHead>
                                <TableHead>Click</TableHead>
                                <TableHead>Sử dụng voucher</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {viewCampaign.trackings.slice(0, 10).map((track) => (
                                <TableRow key={track.id}>
                                  <TableCell>{track.userId}</TableCell>
                                  <TableCell>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {track.voucherCode}
                                    </code>
                                  </TableCell>
                                  <TableCell>
                                    {track.opened ? (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-xs">
                                          {track.openedAt && new Date(track.openedAt).toLocaleString('vi-VN')}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">Chưa mở</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {track.clicked ? (
                                      <div className="flex items-center gap-1 text-blue-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-xs">
                                          {track.clickedAt && new Date(track.clickedAt).toLocaleString('vi-VN')}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">Chưa click</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {track.redeemed ? (
                                      <div className="flex items-center gap-1 text-purple-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-xs">
                                          {track.redeemedAt && new Date(track.redeemedAt).toLocaleString('vi-VN')}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">Chưa dùng</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {viewCampaign.trackings.length > 10 && (
                          <p className="text-sm text-gray-500 mt-2">
                            Hiển thị 10/{viewCampaign.trackings.length} records
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              );
            })()}

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setViewCampaign(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}