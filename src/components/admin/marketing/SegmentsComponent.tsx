'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  RefreshCw, 
  Eye, 
  BarChart3, 
  UserCheck, 
  UserX, 
  Search,
  Calendar,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from '@/services/api';

// Types
interface CustomerSegment {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  segment: string;
  assignedAt: string;
  lastOrderDate?: string;
  totalSpent: number;
  orderCount: number;
}

interface SegmentStats {
  totalUsers: number;
  totalSegmented: number;
  notSegmented: number;
  updatedAt: string;
  segmentBreakdown: Array<{
    segment: string;
    count: number;
  }>;
}

interface CustomerSegmentPreview {
  userId: number;
  userName: string;
  userEmail: string;
  currentSegment?: string;
  predictedSegment: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string;
  segmentChanged: boolean;
}

export default function SegmentsComponent() {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [stats, setStats] = useState<SegmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [previewData, setPreviewData] = useState<CustomerSegmentPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Segment colors mapping
  const getSegmentColor = (segment: string) => {
    const colors: { [key: string]: string } = {
      'VIP': 'bg-purple-100 text-purple-800',
      'Loyal': 'bg-blue-100 text-blue-800',
      'Regular': 'bg-green-100 text-green-800',
      'New': 'bg-yellow-100 text-yellow-800',
      'Inactive': 'bg-gray-100 text-gray-800',
      'At Risk': 'bg-red-100 text-red-800'
    };
    return colors[segment] || 'bg-gray-100 text-gray-800';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Load segments data
  const loadSegments = async () => {
    try {
      const result = await api.getCustomerSegments();
      setSegments(result.data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu phân khúc khách hàng",
        variant: "destructive"
      });
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const result = await api.getSegmentationStats();
      setStats(result.data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thống kê phân khúc",
        variant: "destructive"
      });
    }
  };

  // Auto update all segments
  const handleAutoUpdateAll = async () => {
    setUpdating(true);
    try {
      await api.autoUpdateAllSegments();
      toast({
        title: "Thành công",
        description: "Cập nhật tự động phân khúc khách hàng thành công"
      });
      await loadSegments();
      await loadStats();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật phân khúc khách hàng",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Preview all segments
  const handlePreviewAll = async () => {
    setPreviewLoading(true);
    try {
      const result = await api.previewAllSegments();
      setPreviewData(result.data);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải preview dữ liệu",
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Filter segments
  const filteredSegments = segments.filter(segment => {
    const matchesSearch = segment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         segment.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = selectedSegment === 'all' || segment.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  // Get unique segments for filter
  const uniqueSegments = [...new Set(segments.map(s => s.segment))];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadSegments(), loadStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Phân khúc khách hàng</h2>
            <p className="text-gray-600">Quản lý và phân tích phân khúc khách hàng</p>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handlePreviewAll}
                  disabled={previewLoading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Xem trước thay đổi phân khúc</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleAutoUpdateAll}
                  disabled={updating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                  {updating ? 'Đang cập nhật...' : 'Cập nhật tự động'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cập nhật tự động tất cả phân khúc khách hàng</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng khách hàng</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đã phân khúc</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSegmented.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.totalSegmented / stats.totalUsers) * 100).toFixed(1)}% tổng số
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chưa phân khúc</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.notSegmented.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.notSegmented / stats.totalUsers) * 100).toFixed(1)}% tổng số
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cập nhật lần cuối</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{formatDate(stats.updatedAt)}</div>
                <p className="text-xs text-muted-foreground">
                  {new Date(stats.updatedAt).toLocaleTimeString('vi-VN')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Segment Distribution */}
        {stats && stats.segmentBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Phân bố phân khúc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.segmentBreakdown.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className={`rounded-lg p-4 ${getSegmentColor(item.segment)}`}>
                      <div className="text-2xl font-bold">{item.count}</div>
                      <div className="text-sm font-medium">{item.segment}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Tìm kiếm khách hàng</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Label htmlFor="segment-filter">Lọc theo phân khúc</Label>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phân khúc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phân khúc</SelectItem>
                    {uniqueSegments.map(segment => (
                      <SelectItem key={segment} value={segment}>
                        {segment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Segments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách phân khúc khách hàng</CardTitle>
            <CardDescription>
              Hiển thị {filteredSegments.length} / {segments.length} khách hàng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phân khúc</TableHead>
                    <TableHead className="text-right">Tổng chi tiêu</TableHead>
                    <TableHead className="text-right">Số đơn hàng</TableHead>
                    <TableHead>Đơn hàng cuối</TableHead>
                    <TableHead>Ngày phân loại</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSegments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Không tìm thấy khách hàng nào</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSegments.map((segment) => (
                      <TableRow key={segment.id}>
                        <TableCell className="font-medium">
                          {segment.userName}
                        </TableCell>
                        <TableCell>{segment.userEmail}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={getSegmentColor(segment.segment)}
                          >
                            {segment.segment}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(segment.totalSpent)}
                        </TableCell>
                        <TableCell className="text-right">
                          {segment.orderCount}
                        </TableCell>
                        <TableCell>
                          {segment.lastOrderDate ? formatDate(segment.lastOrderDate) : 'Chưa có'}
                        </TableCell>
                        <TableCell>
                          {formatDate(segment.assignedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview thay đổi phân khúc</DialogTitle>
              <DialogDescription>
                Xem trước những thay đổi sẽ được áp dụng khi cập nhật phân khúc
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {previewData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có thay đổi nào</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Phân khúc hiện tại</TableHead>
                        <TableHead>Phân khúc dự đoán</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Tổng chi tiêu</TableHead>
                        <TableHead className="text-right">Số đơn hàng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((preview) => (
                        <TableRow key={preview.userId}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{preview.userName}</div>
                              <div className="text-sm text-gray-500">{preview.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {preview.currentSegment ? (
                              <Badge 
                                variant="secondary" 
                                className={getSegmentColor(preview.currentSegment)}
                              >
                                {preview.currentSegment}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">Chưa có</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={getSegmentColor(preview.predictedSegment)}
                            >
                              {preview.predictedSegment}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {preview.segmentChanged ? (
                              <Badge variant="default" className="bg-orange-100 text-orange-800">
                                Thay đổi
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Không đổi
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(preview.totalSpent)}
                          </TableCell>
                          <TableCell className="text-right">
                            {preview.orderCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Đóng
              </Button>
              <Button onClick={async () => {
                setShowPreview(false);
                await handleAutoUpdateAll();
              }}>
                Áp dụng thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}