'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Filter,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from '@/services/api';

// Types - Updated to match API response
interface SegmentationRule {
  id: number;
  segmentName: string;
  description: string;
  priority: number;
  isActive: boolean;
  minTotalSpent: number | null;
  maxTotalSpent: number | null;
  minOrderCount: number | null;
  maxOrderCount: number | null;
  maxDaysSinceLastOrder: number | null;
  minDaysSinceLastOrder: number | null;
  minOrdersLast3Months: number | null;
  minOrdersLast6Months: number | null;
  minOrdersLast12Months: number | null;
  minAverageOrderValue: number | null;
  maxAverageOrderValue: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface RuleFormData {
  segmentName: string;
  description: string;
  priority: number;
  isActive: boolean;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  minOrderCount?: number;
  maxOrderCount?: number;
  maxDaysSinceLastOrder?: number;
  minDaysSinceLastOrder?: number;
  minOrdersLast3Months?: number;
  minOrdersLast6Months?: number;
  minOrdersLast12Months?: number;
  minAverageOrderValue?: number;
  maxAverageOrderValue?: number;
}

// API format interface
interface ApiRuleData {
  name: string;
  segmentType: string;
  conditions: {
    minTotalSpent?: number;
    maxTotalSpent?: number;
    minOrderCount?: number;
    maxOrderCount?: number;
    maxDaysSinceLastOrder?: number;
    minDaysSinceLastOrder?: number;
    minOrdersLast3Months?: number;
    minOrdersLast6Months?: number;
    minOrdersLast12Months?: number;
    minAverageOrderValue?: number;
    maxAverageOrderValue?: number;
  };
  priority: number;
  isActive: boolean;
}

const SEGMENT_TYPES = [
  { value: 'VIP', label: 'VIP', color: 'bg-purple-100 text-purple-800' },
  { value: 'Loyal', label: 'Loyal', color: 'bg-blue-100 text-blue-800' },
  { value: 'Regular', label: 'Regular', color: 'bg-green-100 text-green-800' },
  { value: 'New', label: 'New', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'At Risk', label: 'At Risk', color: 'bg-red-100 text-red-800' },
  { value: 'Lost', label: 'Lost', color: 'bg-orange-100 text-orange-800' }
];

export default function RulesComponent() {
  const [rules, setRules] = useState<SegmentationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<SegmentationRule | null>(null);
  const [viewingRule, setViewingRule] = useState<SegmentationRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    segmentName: '',
    description: '',
    priority: 1,
    isActive: true
  });

  // Convert form data to API format
  const convertToApiFormat = (formData: RuleFormData): ApiRuleData => {
    return {
      name: formData.segmentName,
      segmentType: formData.segmentName, // or different logic if needed
      conditions: {
        minTotalSpent: formData.minTotalSpent,
        maxTotalSpent: formData.maxTotalSpent,
        minOrderCount: formData.minOrderCount,
        maxOrderCount: formData.maxOrderCount,
        maxDaysSinceLastOrder: formData.maxDaysSinceLastOrder,
        minDaysSinceLastOrder: formData.minDaysSinceLastOrder,
        minOrdersLast3Months: formData.minOrdersLast3Months,
        minOrdersLast6Months: formData.minOrdersLast6Months,
        minOrdersLast12Months: formData.minOrdersLast12Months,
        minAverageOrderValue: formData.minAverageOrderValue,
        maxAverageOrderValue: formData.maxAverageOrderValue,
      },
      priority: formData.priority,
      isActive: formData.isActive
    };
  };

  // Load rules
  const loadRules = async () => {
    try {
      const response = await api.getSegmentationRules();
      if (response.success) {
        setRules(response.data || []);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách quy tắc",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      toast({
        title: "Lỗi",
        description: "Lỗi kết nối khi tải dữ liệu",
        variant: "destructive"
      });
    }
  };

  // Create rule
  const handleCreate = async () => {
    try {
      const apiData = convertToApiFormat(formData);
      const response = await api.createSegmentationRule(apiData);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Tạo quy tắc phân khúc thành công"
        });
        setShowCreateDialog(false);
        resetForm();
        await loadRules();
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo quy tắc phân khúc",
        variant: "destructive"
      });
    }
  };

  // Update rule
  const handleUpdate = async () => {
    if (!editingRule) return;
    
    try {
      const apiData = convertToApiFormat(formData);
      const response = await api.updateSegmentationRule(editingRule.id, apiData);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Cập nhật quy tắc phân khúc thành công"
        });
        setShowEditDialog(false);
        setEditingRule(null);
        resetForm();
        await loadRules();
      }
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quy tắc phân khúc",
        variant: "destructive"
      });
    }
  };

  // Delete rule
  const handleDelete = async (id: number) => {
    try {
      const response = await api.deleteSegmentationRule(id);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Xóa quy tắc phân khúc thành công"
        });
        await loadRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa quy tắc phân khúc",
        variant: "destructive"
      });
    }
  };

  // Toggle rule status
  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.toggleSegmentationRuleStatus(id);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Thay đổi trạng thái quy tắc thành công"
        });
        await loadRules();
      }
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái quy tắc",
        variant: "destructive"
      });
    }
  };

  // Seed default rules
  const handleSeedDefault = async () => {
    try {
      const response = await api.seedDefaultSegmentationRules();
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Tạo quy tắc mặc định thành công"
        });
        await loadRules();
      }
    } catch (error) {
      console.error('Error seeding default rules:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo quy tắc mặc định",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      segmentName: '',
      description: '',
      priority: 1,
      isActive: true
    });
  };

  // Open edit dialog
  const openEditDialog = (rule: SegmentationRule) => {
    setEditingRule(rule);
    setFormData({
      segmentName: rule.segmentName || '',
      description: rule.description || '',
      priority: rule.priority || 1,
      isActive: rule.isActive ?? true,
      minTotalSpent: rule.minTotalSpent || undefined,
      maxTotalSpent: rule.maxTotalSpent || undefined,
      minOrderCount: rule.minOrderCount || undefined,
      maxOrderCount: rule.maxOrderCount || undefined,
      maxDaysSinceLastOrder: rule.maxDaysSinceLastOrder || undefined,
      minDaysSinceLastOrder: rule.minDaysSinceLastOrder || undefined,
      minOrdersLast3Months: rule.minOrdersLast3Months || undefined,
      minOrdersLast6Months: rule.minOrdersLast6Months || undefined,
      minOrdersLast12Months: rule.minOrdersLast12Months || undefined,
      minAverageOrderValue: rule.minAverageOrderValue || undefined,
      maxAverageOrderValue: rule.maxAverageOrderValue || undefined,
    });
    setShowEditDialog(true);
  };

  // Open view dialog
  const openViewDialog = (rule: SegmentationRule) => {
    setViewingRule(rule);
    setShowViewDialog(true);
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

  // Get segment color
  const getSegmentColor = (segment: string) => {
    const segmentInfo = SEGMENT_TYPES.find(s => s.value === segment);
    return segmentInfo?.color || 'bg-gray-100 text-gray-800';
  };

  // Filter rules
  const filteredRules = rules.filter(rule => {
    if (!rule) return false;
    
    const ruleSegmentName = rule.segmentName || '';
    const ruleDescription = rule.description || '';
    const matchesSearch = ruleSegmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ruleDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSegment = selectedSegment === 'all' || rule.segmentName === selectedSegment;
    
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && rule.isActive) ||
                         (selectedStatus === 'inactive' && !rule.isActive);
    
    return matchesSearch && matchesSegment && matchesStatus;
  });

  // Sort rules by priority
  const sortedRules = [...filteredRules].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadRules();
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
            <h2 className="text-2xl font-bold">Quy tắc phân khúc</h2>
            <p className="text-gray-600">Quản lý quy tắc tự động phân khúc khách hàng</p>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleSeedDefault}
                  disabled={rules.length > 0}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Tạo mặc định
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tạo bộ quy tắc phân khúc mặc định</p>
              </TooltipContent>
            </Tooltip>
            
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm quy tắc
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng quy tắc</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {rules.filter(r => r && r.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {rules.length > 0 ? ((rules.filter(r => r && r.isActive).length / rules.length) * 100).toFixed(1) : 0}% tổng số
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tạm dừng</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {rules.filter(r => r && !r.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {rules.length > 0 ? ((rules.filter(r => r && !r.isActive).length / rules.length) * 100).toFixed(1) : 0}% tổng số
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Tìm kiếm quy tắc</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Tìm theo tên hoặc mô tả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Label>Lọc theo phân khúc</Label>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phân khúc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phân khúc</SelectItem>
                    {SEGMENT_TYPES.map(segment => (
                      <SelectItem key={segment.value} value={segment.value}>
                        {segment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Label>Lọc theo trạng thái</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách quy tắc phân khúc</CardTitle>
            <CardDescription>
              Hiển thị {sortedRules.length} / {rules.length} quy tắc
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên phân khúc</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Độ ưu tiên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Người tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Không tìm thấy quy tắc nào</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setShowCreateDialog(true)}
                          >
                            Tạo quy tắc đầu tiên
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={getSegmentColor(rule.segmentName)}
                            >
                              {rule.segmentName || 'Chưa xác định'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={rule.description}>
                            {rule.description || 'Không có mô tả'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{rule.priority || 0}</span>
                            {rule.priority === 1 && (
                              <ArrowUp className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.isActive ?? false}
                              onCheckedChange={() => handleToggleStatus(rule.id)}
                            />
                            <span className={rule.isActive ? 'text-green-600' : 'text-orange-600'}>
                              {rule.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {rule.createdAt ? formatDate(rule.createdAt) : 'Không có'}
                        </TableCell>
                        <TableCell>
                          {rule.createdBy || 'Không xác định'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openViewDialog(rule)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Xem chi tiết</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(rule)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Chỉnh sửa</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa quy tắc "{rule.segmentName || 'này'}"? 
                                    Hành động này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(rule.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo quy tắc phân khúc mới</DialogTitle>
              <DialogDescription>
                Tạo quy tắc để tự động phân loại khách hàng vào các phân khúc
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="segmentName">Tên phân khúc</Label>
                  <Select value={formData.segmentName} onValueChange={(value) => setFormData({...formData, segmentName: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phân khúc" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENT_TYPES.map(segment => (
                        <SelectItem key={segment.value} value={segment.value}>
                          {segment.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Độ ưu tiên</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
                  />
                  <p className="text-xs text-gray-500">Số nhỏ hơn có độ ưu tiên cao hơn</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Nhập mô tả cho quy tắc phân khúc"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Total Spent Conditions */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện tổng chi tiêu</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minTotalSpent">Tổng chi tiêu tối thiểu (VND)</Label>
                    <Input
                      id="minTotalSpent"
                      type="number"
                      placeholder="0"
                      value={formData.minTotalSpent || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minTotalSpent: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTotalSpent">Tổng chi tiêu tối đa (VND)</Label>
                    <Input
                      id="maxTotalSpent"
                      type="number"
                      placeholder="Không giới hạn"
                      value={formData.maxTotalSpent || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        maxTotalSpent: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Order Count Conditions */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện số đơn hàng</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minOrderCount">Số đơn hàng tối thiểu</Label>
                    <Input
                      id="minOrderCount"
                      type="number"
                      placeholder="0"
                      value={formData.minOrderCount || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minOrderCount: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxOrderCount">Số đơn hàng tối đa</Label>
                    <Input
                      id="maxOrderCount"
                      type="number"
                      placeholder="Không giới hạn"
                      value={formData.maxOrderCount || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        maxOrderCount: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Last Order Days Conditions */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện ngày từ đơn hàng cuối</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minDaysSinceLastOrder">Tối thiểu (ngày)</Label>
                    <Input
                      id="minDaysSinceLastOrder"
                      type="number"
                      placeholder="0"
                      value={formData.minDaysSinceLastOrder || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minDaysSinceLastOrder: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDaysSinceLastOrder">Tối đa (ngày)</Label>
                    <Input
                      id="maxDaysSinceLastOrder"
                      type="number"
                      placeholder="Không giới hạn"
                      value={formData.maxDaysSinceLastOrder || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        maxDaysSinceLastOrder: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Time Period Orders */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện đơn hàng theo thời gian</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minOrdersLast3Months">Đơn hàng 3 tháng qua (tối thiểu)</Label>
                    <Input
                      id="minOrdersLast3Months"
                      type="number"
                      placeholder="0"
                      value={formData.minOrdersLast3Months || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minOrdersLast3Months: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minOrdersLast6Months">Đơn hàng 6 tháng qua (tối thiểu)</Label>
                    <Input
                      id="minOrdersLast6Months"
                      type="number"
                      placeholder="0"
                      value={formData.minOrdersLast6Months || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minOrdersLast6Months: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minOrdersLast12Months">Đơn hàng 12 tháng qua (tối thiểu)</Label>
                    <Input
                      id="minOrdersLast12Months"
                      type="number"
                      placeholder="0"
                      value={formData.minOrdersLast12Months || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minOrdersLast12Months: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện giá trị đơn hàng trung bình</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minAverageOrderValue">Giá trị TB tối thiểu (VND)</Label>
                    <Input
                      id="minAverageOrderValue"
                      type="number"
                      placeholder="0"
                      value={formData.minAverageOrderValue || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minAverageOrderValue: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAverageOrderValue">Giá trị TB tối đa (VND)</Label>
                    <Input
                      id="maxAverageOrderValue"
                      type="number"
                      placeholder="Không giới hạn"
                      value={formData.maxAverageOrderValue || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        maxAverageOrderValue: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="isActive">Trạng thái</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="isActive">
                    {formData.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                Hủy
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!formData.segmentName || !formData.description}
              >
                Tạo quy tắc
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa quy tắc phân khúc</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin quy tắc phân khúc
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-segmentName">Tên phân khúc</Label>
                  <Select value={formData.segmentName} onValueChange={(value) => setFormData({...formData, segmentName: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phân khúc" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENT_TYPES.map(segment => (
                        <SelectItem key={segment.value} value={segment.value}>
                          {segment.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Độ ưu tiên</Label>
                  <Input
                    id="edit-priority"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
                  />
                  <p className="text-xs text-gray-500">Số nhỏ hơn có độ ưu tiên cao hơn</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Nhập mô tả cho quy tắc phân khúc"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Total Spent Conditions */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện tổng chi tiêu</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-minTotalSpent">Tổng chi tiêu tối thiểu (VND)</Label>
                    <Input
                      id="edit-minTotalSpent"
                      type="number"
                      placeholder="0"
                      value={formData.minTotalSpent || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minTotalSpent: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxTotalSpent">Tổng chi tiêu tối đa (VND)</Label>
                    <Input
                      id="edit-maxTotalSpent"
                      type="number"
                      placeholder="Không giới hạn"
                      value={formData.maxTotalSpent || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        maxTotalSpent: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Order Count Conditions */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện số đơn hàng</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-minOrderCount">Số đơn hàng tối thiểu</Label>
                    <Input
                      id="edit-minOrderCount"
                      type="number"
                      placeholder="0"
                      value={formData.minOrderCount || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minOrderCount: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxOrderCount">Số đơn hàng tối đa</Label>
                    <Input
                      id="edit-maxOrderCount"
                      type="number"
                      placeholder="Không giới hạn"
                      value={formData.maxOrderCount || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        maxOrderCount: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Last Order Days Conditions */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện ngày từ đơn hàng cuối</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-minDaysSinceLastOrder">Tối thiểu (ngày)</Label>
                    <Input
                      id="edit-minDaysSinceLastOrder"
                      type="number"
                      placeholder="0"
                      value={formData.minDaysSinceLastOrder || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minDaysSinceLastOrder: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxDaysSinceLastOrder">Tối đa (ngày)</Label>
                    <Input
                      id="edit-maxDaysSinceLastOrder"
                      type="number"
                      placeholder="Không giới hạn"
                      value={formData.maxDaysSinceLastOrder || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        maxDaysSinceLastOrder: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Time Period Orders */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện đơn hàng theo thời gian</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-minOrdersLast3Months">Đơn hàng 3 tháng qua (tối thiểu)</Label>
                    <Input
                      id="edit-minOrdersLast3Months"
                      type="number"
                      placeholder="0"
                      value={formData.minOrdersLast3Months || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minOrdersLast3Months: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-minOrdersLast6Months">Đơn hàng 6 tháng qua (tối thiểu)</Label>
                    <Input
                      id="edit-minOrdersLast6Months"
                      type="number"
                      placeholder="0"
                      value={formData.minOrdersLast6Months || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minOrdersLast6Months: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-minOrdersLast12Months">Đơn hàng 12 tháng qua (tối thiểu)</Label>
                    <Input
                      id="edit-minOrdersLast12Months"
                      type="number"
                      placeholder="0"
                      value={formData.minOrdersLast12Months || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minOrdersLast12Months: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Điều kiện giá trị đơn hàng trung bình</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-minAverageOrderValue">Giá trị TB tối thiểu (VND)</Label>
                    <Input
                      id="edit-minAverageOrderValue"
                      type="number"
                      placeholder="0"
                      value={formData.minAverageOrderValue || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        minAverageOrderValue: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxAverageOrderValue">Giá trị TB tối đa (VND)</Label>
                    <Input
                      id="edit-maxAverageOrderValue"
                      type="number"
                      placeholder="Không giới hạn"
                      value={formData.maxAverageOrderValue || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        maxAverageOrderValue: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="edit-isActive">Trạng thái</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="edit-isActive">
                    {formData.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setEditingRule(null);
                resetForm();
              }}>
                Hủy
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={!formData.segmentName || !formData.description}
              >
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết quy tắc phân khúc</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về quy tắc "{viewingRule?.segmentName || 'Không có tên'}"
              </DialogDescription>
            </DialogHeader>
            
            {viewingRule && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tên phân khúc</Label>
                    <div className="mt-1">
                      <Badge 
                        variant="secondary" 
                        className={getSegmentColor(viewingRule.segmentName)}
                      >
                        {viewingRule.segmentName || 'Chưa xác định'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Độ ưu tiên</Label>
                    <p className="text-sm text-gray-600 mt-1">{viewingRule.priority || 0}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Mô tả</Label>
                  <p className="text-sm text-gray-600 mt-1">{viewingRule.description || 'Không có mô tả'}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Điều kiện phân khúc</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* Total Spent */}
                      {(viewingRule.minTotalSpent !== null || viewingRule.maxTotalSpent !== null) && (
                        <div className="col-span-2">
                          <h4 className="font-semibold mb-2">Tổng chi tiêu:</h4>
                          <div className="grid grid-cols-2 gap-2 ml-4">
                            {viewingRule.minTotalSpent !== null && (
                              <div>
                                <span className="font-medium">Tối thiểu:</span>
                                <span className="ml-2">{formatCurrency(viewingRule.minTotalSpent)}</span>
                              </div>
                            )}
                            {viewingRule.maxTotalSpent !== null && (
                              <div>
                                <span className="font-medium">Tối đa:</span>
                                <span className="ml-2">{formatCurrency(viewingRule.maxTotalSpent)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Count */}
                      {(viewingRule.minOrderCount !== null || viewingRule.maxOrderCount !== null) && (
                        <div className="col-span-2">
                          <h4 className="font-semibold mb-2">Số đơn hàng:</h4>
                          <div className="grid grid-cols-2 gap-2 ml-4">
                            {viewingRule.minOrderCount !== null && (
                              <div>
                                <span className="font-medium">Tối thiểu:</span>
                                <span className="ml-2">{viewingRule.minOrderCount}</span>
                              </div>
                            )}
                            {viewingRule.maxOrderCount !== null && (
                              <div>
                                <span className="font-medium">Tối đa:</span>
                                <span className="ml-2">{viewingRule.maxOrderCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Days Since Last Order */}
                      {(viewingRule.minDaysSinceLastOrder !== null || viewingRule.maxDaysSinceLastOrder !== null) && (
                        <div className="col-span-2">
                          <h4 className="font-semibold mb-2">Ngày từ đơn hàng cuối:</h4>
                          <div className="grid grid-cols-2 gap-2 ml-4">
                            {viewingRule.minDaysSinceLastOrder !== null && (
                              <div>
                                <span className="font-medium">Tối thiểu:</span>
                                <span className="ml-2">{viewingRule.minDaysSinceLastOrder} ngày</span>
                              </div>
                            )}
                            {viewingRule.maxDaysSinceLastOrder !== null && (
                              <div>
                                <span className="font-medium">Tối đa:</span>
                                <span className="ml-2">{viewingRule.maxDaysSinceLastOrder} ngày</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Time Period Orders */}
                      {(viewingRule.minOrdersLast3Months !== null || viewingRule.minOrdersLast6Months !== null || viewingRule.minOrdersLast12Months !== null) && (
                        <div className="col-span-2">
                          <h4 className="font-semibold mb-2">Đơn hàng theo thời gian:</h4>
                          <div className="grid grid-cols-3 gap-2 ml-4">
                            {viewingRule.minOrdersLast3Months !== null && (
                              <div>
                                <span className="font-medium">3 tháng:</span>
                                <span className="ml-2">{viewingRule.minOrdersLast3Months}</span>
                              </div>
                            )}
                            {viewingRule.minOrdersLast6Months !== null && (
                              <div>
                                <span className="font-medium">6 tháng:</span>
                                <span className="ml-2">{viewingRule.minOrdersLast6Months}</span>
                              </div>
                            )}
                            {viewingRule.minOrdersLast12Months !== null && (
                              <div>
                                <span className="font-medium">12 tháng:</span>
                                <span className="ml-2">{viewingRule.minOrdersLast12Months}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Average Order Value */}
                      {(viewingRule.minAverageOrderValue !== null || viewingRule.maxAverageOrderValue !== null) && (
                        <div className="col-span-2">
                          <h4 className="font-semibold mb-2">Giá trị đơn hàng trung bình:</h4>
                          <div className="grid grid-cols-2 gap-2 ml-4">
                            {viewingRule.minAverageOrderValue !== null && (
                              <div>
                                <span className="font-medium">Tối thiểu:</span>
                                <span className="ml-2">{formatCurrency(viewingRule.minAverageOrderValue)}</span>
                              </div>
                            )}
                            {viewingRule.maxAverageOrderValue !== null && (
                              <div>
                                <span className="font-medium">Tối đa:</span>
                                <span className="ml-2">{formatCurrency(viewingRule.maxAverageOrderValue)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Trạng thái</Label>
                    <div className="mt-1">
                      <Badge variant={viewingRule.isActive ? "default" : "secondary"}>
                        {viewingRule.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Người tạo</Label>
                    <p className="text-sm text-gray-600 mt-1">{viewingRule.createdBy || 'Không xác định'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Ngày tạo</Label>
                    <p className="text-sm text-gray-600 mt-1">
                                          {viewingRule.createdAt ? formatDate(viewingRule.createdAt) : 'Không có'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Cập nhật lần cuối</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {viewingRule.updatedAt ? formatDate(viewingRule.updatedAt) : 'Không có'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Đóng
              </Button>
              {viewingRule && (
                <Button onClick={() => {
                  setShowViewDialog(false);
                  openEditDialog(viewingRule);
                }}>
                  Chỉnh sửa
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}