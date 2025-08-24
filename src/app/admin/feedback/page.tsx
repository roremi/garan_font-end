'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Filter, 
  Trash2, 
  Eye,
  MessageSquare,
  TrendingUp,
  Users,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  FileText,
  ZoomIn,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from '@/services/api';
import { toast } from 'sonner';

interface FeedbackItem {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  product: {
    id: number;
    name: string;
    image: string;
  };
  user: {
    id: number;
    username: string;
    fullName: string;
  };
}

interface ComplaintItem {
  id: number;
  orderId: number;
  title: string;
  description: string;
  imageUrl?: string;
  status: number;
  statusText: string;
  createAt: string;
  processedAt?: string;
  adminResponse?: string;
  canUpdate: boolean;
  order: {
    id: number;
    total: number;
    createAt: string;
    nameCustomer: string;
    phone: string;
    address: string;
    status: number;
    paymentMethod: string;
  };
}

interface Statistics {
  // Feedback stats
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  topRatedProducts: Array<{
    productId: number;
    productName: string;
    averageRating: number;
    totalFeedbacks: number;
  }>;
  // Complaint stats
  totalComplaints: number;
  pendingComplaints: number;
  processingComplaints: number;
  statusBreakdown: Array<{ status: number; count: number; statusText: string }>;
}

export default function FeedbackComplaintManagement() {
  // Common states
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('feedback');
  const pageSize = 10;

  // Feedback states
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<FeedbackItem[]>([]);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showDeleteFeedbackDialog, setShowDeleteFeedbackDialog] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  // Complaint states
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [totalComplaintPages, setTotalComplaintPages] = useState(1);
  const [totalComplaintCount, setTotalComplaintCount] = useState(0);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('1');
  const [adminResponse, setAdminResponse] = useState('');

  // Image viewer states
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState('');

  // Statistics
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  // Helper function to get full image URL
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.NEXT_PUBLIC_BACKEND_API || 'http://103.82.27.97:5000'}/${imagePath}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'feedback') {
      filterFeedbacks();
    } else {
      loadComplaints();
    }
  }, [feedbacks, searchTerm, ratingFilter, productFilter, statusFilter, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, ratingFilter, productFilter, statusFilter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load products và feedbacks song song
      const [productsData, feedbacksData] = await Promise.all([
        api.getProducts(), // Sửa từ getAllProducts thành getProducts
        api.getAllFeedbacksForAdmin()
      ]);

      // Load complaints và complaint statistics
      const [complaintsData, complaintStats] = await Promise.all([
        api.getAllComplaints({ page: 1, pageSize }),
        api.getComplaintStatisticsAdmin()
      ]);

      setProducts(productsData);
      setFeedbacks(feedbacksData);
      setComplaints(complaintsData.data);
      setTotalComplaintPages(complaintsData.pagination.totalPages);
      setTotalComplaintCount(complaintsData.pagination.totalCount);

      // Calculate combined statistics
      const calculatedFeedbackStats = calculateFeedbackStatistics(feedbacksData); // Đổi tên biến
      const combinedStats = {
        ...calculatedFeedbackStats,
        ...complaintStats
      };
      setStatistics(combinedStats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadComplaints = async () => {
    if (activeTab !== 'complaint') return;
    
    setLoading(true);
    try {
      const params: any = { page: currentPage, pageSize };
      if (statusFilter !== 'all') {
        params.status = parseInt(statusFilter);
      }

      const result = await api.getAllComplaints(params);
      setComplaints(result.data);
      setTotalComplaintPages(result.pagination.totalPages);
      setTotalComplaintCount(result.pagination.totalCount);
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Không thể tải danh sách khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  const calculateFeedbackStatistics = (feedbackData: FeedbackItem[]) => {
    const totalFeedbacks = feedbackData.length;
    const averageRating = totalFeedbacks > 0 
      ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
      : 0;

    const ratingDistribution: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = feedbackData.filter(f => f.rating === i).length;
    }

    const productStats: { [key: number]: { total: number; sum: number; name: string } } = {};
    
    feedbackData.forEach(feedback => {
      const productId = feedback.product.id;
      if (!productStats[productId]) {
        productStats[productId] = {
          total: 0,
          sum: 0,
          name: feedback.product.name
        };
      }
      productStats[productId].total++;
      productStats[productId].sum += feedback.rating;
    });

    const topRatedProducts = Object.entries(productStats)
      .filter(([_, stats]) => stats.total >= 2)
      .map(([productId, stats]) => ({
        productId: parseInt(productId),
        productName: stats.name,
        averageRating: stats.sum / stats.total,
        totalFeedbacks: stats.total
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    return {
      totalFeedbacks,
      averageRating,
      ratingDistribution,
      topRatedProducts
    };
  };

  const filterFeedbacks = () => {
    let filtered = [...feedbacks];

    if (searchTerm) {
      filtered = filtered.filter(feedback =>
        feedback.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ratingFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.rating === parseInt(ratingFilter));
    }

    if (productFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.product.id === parseInt(productFilter));
    }

    setFilteredFeedbacks(filtered);
  };

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      await api.deleteFeedback(feedbackToDelete);
      
      const updatedFeedbacks = feedbacks.filter(f => f.id !== feedbackToDelete);
      setFeedbacks(updatedFeedbacks);
      
      // Recalculate stats
      const updatedFeedbackStats = calculateFeedbackStatistics(updatedFeedbacks); // Đổi tên biến
      setStatistics(prev => prev ? { ...prev, ...updatedFeedbackStats } : null);
      
      toast.success('Đã xóa feedback thành công');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Không thể xóa feedback');
    } finally {
      setShowDeleteFeedbackDialog(false);
      setFeedbackToDelete(null);
    }
  };

  const handleProcessComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      await api.processComplaint(selectedComplaint.id, {
        status: parseInt(processStatus),
        adminResponse
      });

      // Reload complaints
      await loadComplaints();
      
      toast.success('Đã xử lý khiếu nại thành công');
      setShowProcessDialog(false);
      setSelectedComplaint(null);
      setAdminResponse('');
    } catch (error) {
      console.error('Error processing complaint:', error);
      toast.error('Không thể xử lý khiếu nại');
    }
  };

  const handleImageClick = (imageUrl: string) => {
    const fullUrl = getFullImageUrl(imageUrl);
    setViewerImageUrl(fullUrl);
    setShowImageViewer(true);
  };

  const getComplaintStatusBadge = (status: number, statusText: string) => {
    const variants: { [key: number]: string } = {
      0: 'destructive', // Chờ xử lý
      1: 'secondary', // Đang xử lý
      2: 'default', // Đã giải quyết
      3: 'outline' // Từ chối
    };

    return (
      <Badge variant={variants[status] as any}>
        {statusText}
      </Badge>
    );
  };

  const getComplaintStatusIcon = (status: number) => {
    switch (status) {
      case 0: return <Clock className="w-4 h-4 text-orange-500" />;
      case 1: return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case 2: return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 3: return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination for current tab
  const currentData = activeTab === 'feedback' ? filteredFeedbacks : complaints;
  const totalPages = activeTab === 'feedback' 
    ? Math.ceil(filteredFeedbacks.length / pageSize)
    : totalComplaintPages;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = activeTab === 'feedback'
    ? filteredFeedbacks.slice(startIndex, startIndex + pageSize)
    : complaints;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Feedback & Khiếu nại</h1>
              <p className="text-gray-600">Quản lý đánh giá và khiếu nại từ khách hàng</p>
            </div>
            <Button onClick={loadData} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalFeedbacks}</div>
                <p className="text-xs text-muted-foreground">Đánh giá sản phẩm</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đánh giá TB</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.averageRating.toFixed(1)}/5</div>
                <div className="flex items-center mt-1">
                  {renderStars(Math.round(statistics.averageRating))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Khiếu nại</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalComplaints}</div>
                <p className="text-xs text-muted-foreground">Khiếu nại đơn hàng</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.pendingComplaints}
                </div>
                <p className="text-xs text-muted-foreground">Cần xử lý ngay</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.processingComplaints}
                </div>
                <p className="text-xs text-muted-foreground">Đang giải quyết</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Feedback ({statistics?.totalFeedbacks || 0})
            </TabsTrigger>
            <TabsTrigger value="complaint" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Khiếu nại ({statistics?.totalComplaints || 0})
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {activeTab === 'feedback' ? (
                  <>
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Lọc theo sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Lọc theo đánh giá" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả đánh giá</SelectItem>
                        <SelectItem value="5">5 sao</SelectItem>
                        <SelectItem value="4">4 sao</SelectItem>
                        <SelectItem value="3">3 sao</SelectItem>
                        <SelectItem value="2">2 sao</SelectItem>
                        <SelectItem value="1">1 sao</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Lọc theo trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="0">Chờ xử lý</SelectItem>
                        <SelectItem value="1">Đang xử lý</SelectItem>
                        <SelectItem value="2">Đã giải quyết</SelectItem>
                        <SelectItem value="3">Từ chối</SelectItem>
                      </SelectContent>
                    </Select>
                    <div></div> {/* Empty div for spacing */}
                  </>
                )}

                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setRatingFilter('all');
                    setProductFilter('all');
                    setStatusFilter('all');
                  }}
                  variant="outline"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>
                  Danh sách Feedback ({filteredFeedbacks.length})
                  {filteredFeedbacks.length !== feedbacks.length && (
                    <span className="text-sm text-gray-500 font-normal">
                      / {feedbacks.length} tổng
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Đang tải...</p>
                  </div>
                ) : filteredFeedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Không tìm thấy feedback nào</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Đánh giá</TableHead>
                          <TableHead>Nội dung</TableHead>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((feedback: any) => (
                          <TableRow key={feedback.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(feedback.user.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{feedback.user.fullName}</p>
                                  <p className="text-xs text-gray-500">@{feedback.user.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img 
                                  src={getFullImageUrl(feedback.product.image)} 
                                  alt={feedback.product.name}
                                  className="w-10 h-10 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-product.png';
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-sm">{feedback.product.name}</p>
                                  <p className="text-xs text-gray-500">ID: {feedback.product.id}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {renderStars(feedback.rating)}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="text-sm line-clamp-2" title={feedback.comment}>
                                  {feedback.comment}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {formatDate(feedback.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedFeedback(feedback)}
                                  title="Xem chi tiết"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setFeedbackToDelete(feedback.id);
                                    setShowDeleteFeedbackDialog(true);
                                  }}
                                  title="Xóa feedback"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaint Tab */}
          <TabsContent value="complaint">
            <Card>
              <CardHeader>
                <CardTitle>
                  Danh sách Khiếu nại ({totalComplaintCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Đang tải...</p>
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Không tìm thấy khiếu nại nào</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Đơn hàng</TableHead>
                          <TableHead>Tiêu đề</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complaints.map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(complaint.order.nameCustomer)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{complaint.order.nameCustomer}</p>
                                  <p className="text-xs text-gray-500">{complaint.order.phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">#{complaint.orderId}</p>
                                <p className="text-xs text-gray-500">
                                  {complaint.order.total.toLocaleString('vi-VN')}đ
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="font-medium text-sm line-clamp-1" title={complaint.title}>
                                  {complaint.title}
                                </p>
                                <p className="text-xs text-gray-500 line-clamp-1" title={complaint.description}>
                                  {complaint.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getComplaintStatusIcon(complaint.status)}
                                {getComplaintStatusBadge(complaint.status, complaint.statusText)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {formatDate(complaint.createAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedComplaint(complaint)}
                                  title="Xem chi tiết"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {complaint.status === 0 || complaint.status === 1 ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedComplaint(complaint);
                                      setProcessStatus(complaint.status === 0 ? '1' : '2');
                                      setShowProcessDialog(true);
                                    }}
                                    title="Xử lý khiếu nại"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {activeTab === 'feedback' ? (
                  <>Hiển thị {startIndex + 1} - {Math.min(startIndex + pageSize, filteredFeedbacks.length)} trong {filteredFeedbacks.length} kết quả</>
                ) : (
                  <>Hiển thị {startIndex + 1} - {Math.min(startIndex + pageSize, totalComplaintCount)} trong {totalComplaintCount} kết quả</>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                    if (activeTab === 'complaint') {
                      loadComplaints();
                    }
                  }}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newPage = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(newPage);
                    if (activeTab === 'complaint') {
                      loadComplaints();
                    }
                  }}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Tabs>

        {/* Feedback Detail Modal */}
        {selectedFeedback && (
          <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Chi tiết Feedback</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {getInitials(selectedFeedback.user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedFeedback.user.fullName}</h3>
                    <p className="text-sm text-gray-600">@{selectedFeedback.user.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <img 
                    src={getFullImageUrl(selectedFeedback.product.image)} 
                    alt={selectedFeedback.product.name}
                    className="w-16 h-16 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.png';
                    }}
                  />
                  <div>
                    <h4 className="font-medium">{selectedFeedback.product.name}</h4>
                    <p className="text-sm text-gray-600">ID: {selectedFeedback.product.id}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Đánh giá:</label>
                  <div className="mt-1">
                    {renderStars(selectedFeedback.rating)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Nội dung:</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedFeedback.comment}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Thời gian:</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatDate(selectedFeedback.createdAt)}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Complaint Detail Modal */}
        {selectedComplaint && !showProcessDialog && (
          <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Chi tiết Khiếu nại #{selectedComplaint.id}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Tên:</strong> {selectedComplaint.order.nameCustomer}</p>
                      <p><strong>SĐT:</strong> {selectedComplaint.order.phone}</p>
                      <p><strong>Địa chỉ:</strong> {selectedComplaint.order.address}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Thông tin đơn hàng</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Mã đơn:</strong> #{selectedComplaint.orderId}</p>
                      <p><strong>Tổng tiền:</strong> {selectedComplaint.order.total.toLocaleString('vi-VN')}đ</p>
                      <p><strong>Thanh toán:</strong> {selectedComplaint.order.paymentMethod}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Nội dung khiếu nại</h4>
                  <div className="space-y-2">
                    <p><strong>Tiêu đề:</strong> {selectedComplaint.title}</p>
                    <div>
                      <strong>Mô tả:</strong>
                      <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                        {selectedComplaint.description}
                      </p>
                    </div>
                    {selectedComplaint.imageUrl && (
                      <div>
                        <strong>Hình ảnh minh chứng:</strong>
                        <div className="mt-2">
                          <div className="relative inline-block group">
                            <img 
                              src={getFullImageUrl(selectedComplaint.imageUrl)}
                              alt="Minh chứng khiếu nại"
                              className="max-w-[300px] max-h-[200px] w-auto h-auto rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleImageClick(selectedComplaint.imageUrl!)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-lg">
                              <div className="bg-white bg-opacity-90 rounded-full p-2">
                                <ZoomIn className="w-5 h-5 text-gray-700" />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Nhấp để xem ảnh gốc</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Trạng thái</h4>
                    <div className="flex items-center gap-2">
                      {getComplaintStatusIcon(selectedComplaint.status)}
                      {getComplaintStatusBadge(selectedComplaint.status, selectedComplaint.statusText)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Thời gian</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Tạo:</strong> {formatDate(selectedComplaint.createAt)}</p>
                      {selectedComplaint.processedAt && (
                        <p><strong>Xử lý:</strong> {formatDate(selectedComplaint.processedAt)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedComplaint.adminResponse && (
                  <div>
                    <h4 className="font-medium mb-2">Phản hồi của Admin</h4>
                    <p className="p-3 bg-blue-50 rounded-lg text-sm">
                      {selectedComplaint.adminResponse}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                {(selectedComplaint.status === 0 || selectedComplaint.status === 1) && (
                  <Button 
                    onClick={() => {
                      setProcessStatus(selectedComplaint.status === 0 ? '1' : '2');
                      setShowProcessDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Xử lý khiếu nại
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Image Viewer Modal */}
        <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
          <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
            <DialogHeader className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle>Xem ảnh gốc</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageViewer(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
              <img 
                src={viewerImageUrl}
                alt="Hình ảnh gốc"
                className="max-w-full max-h-full w-auto h-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Process Complaint Dialog */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xử lý Khiếu nại</DialogTitle>
              <DialogDescription>
                Cập nhật trạng thái và phản hồi cho khiếu nại
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Trạng thái mới</label>
                <Select value={processStatus} onValueChange={setProcessStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Đang xử lý</SelectItem>
                    <SelectItem value="2">Đã giải quyết</SelectItem>
                    <SelectItem value="3">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Phản hồi của Admin</label>
                <Textarea
                  placeholder="Nhập phản hồi cho khách hàng..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowProcessDialog(false);
                setAdminResponse('');
              }}>
                Hủy
              </Button>
              <Button onClick={handleProcessComplaint} disabled={!adminResponse.trim()}>
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Feedback Confirmation */}
        <AlertDialog open={showDeleteFeedbackDialog} onOpenChange={setShowDeleteFeedbackDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa feedback này không? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteFeedback} className="bg-red-600 hover:bg-red-700">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}