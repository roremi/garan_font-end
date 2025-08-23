'use client';
import dynamic from "next/dynamic";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  Eye, 
  Calendar, 
  Box, 
  DollarSign, 
  Truck, 
  AlertTriangle,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Plus,
  CheckCircle,
  Edit3,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Order } from '@/types/order';
import { ImageUploadResponse } from '@/types/image';

// ✅ Định nghĩa interfaces đầy đủ
interface OrderStatus {
  label: string;
  color: string;
}

interface OrderStatusMap {
  [key: number]: OrderStatus;
}

interface ComplaintFormData {
  title: string;
  description: string;
  imageUrls: string[];
}

interface SelectedImage {
  file: File;
  preview: string;
  id: string;
  uploadedUrl?: string;
  isUploading?: boolean;
  uploadError?: string;
}

interface ComplaintPayload {
  orderId: number;
  title: string;
  description: string;
  imageUrl?: string;
}

// ✅ Interface cho Complaint
interface Complaint {
  id: number;
  orderId: number;
  userId: number;
  title: string;
  description: string;
  imageUrl?: string;
  createAt: string;
  updateAt?: string;
  status: ComplaintStatus;
  adminResponse?: string;
  responseAt?: string;
  order?: Order;
}

// ✅ Enum cho ComplaintStatus
enum ComplaintStatus {
  Pending = 0,     // Chờ xử lý
  InProgress = 1,  // Đang xử lý
  Resolved = 2,    // Đã giải quyết
  Rejected = 3,    // Từ chối
  Cancelled = 4    // Đã hủy
}

// ✅ Map cho Complaint Status
const COMPLAINT_STATUS_MAP = {
  [ComplaintStatus.Pending]: { label: 'Chờ xử lý', color: 'warning', icon: Clock },
  [ComplaintStatus.InProgress]: { label: 'Đang xử lý', color: 'blue', icon: AlertCircle },
  [ComplaintStatus.Resolved]: { label: 'Đã giải quyết', color: 'success', icon: CheckCircle2 },
  [ComplaintStatus.Rejected]: { label: 'Từ chối', color: 'destructive', icon: XCircle },
  [ComplaintStatus.Cancelled]: { label: 'Đã hủy', color: 'secondary', icon: X },
};

const ORDER_STATUS: OrderStatusMap = {
  0: { label: 'Chờ xác nhận', color: 'warning' },
  1: { label: 'Chờ giao hàng', color: 'blue' },
  2: { label: 'Đang giao hàng', color: 'info' },
  3: { label: 'Hoàn thành', color: 'success' },
  4: { label: 'Đã hủy', color: 'destructive' },
};

export default function OrderHistory() {
  // Khai báo state và hooks
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // ✅ States cho khiếu nại
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintData, setComplaintData] = useState<ComplaintFormData>({
    title: '',
    description: '',
    imageUrls: []
  });
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintOrder, setComplaintOrder] = useState<Order | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // ✅ States cho danh sách khiếu nại
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [viewComplaint, setViewComplaint] = useState<Complaint | null>(null);
  const [showComplaintDetailModal, setShowComplaintDetailModal] = useState(false);

  const Maptracking = dynamic(() => import('@/components/Maptracking'), { ssr: false });

  // useEffect hooks
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router, isLoading]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
      fetchMyComplaints();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredOrders(orders);
    } else {
      const status = parseInt(activeTab);
      setFilteredOrders(orders.filter(order => order.status === status));
    }
  }, [activeTab, orders]);

  // ✅ Hàm lấy danh sách khiếu nại
  const fetchMyComplaints = async () => {
    try {
      const response = await api.getMyComplaints();
      if (response.status === 200) {
        setComplaints(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  // Hàm lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    if (!isAuthenticated || !user) {
      return;
    }
    try {
      setLoading(true);
      const userResponse = await authService.getUserByEmail(user.email);
      const userId = userResponse.id;
      const data = await api.getOrdersbyUser(userId);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải lịch sử đơn hàng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Các hàm hỗ trợ định dạng
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateTotalSpent = () => {
    return orders.reduce((acc, order) => acc + (order.total || 0), 0);
  };

  const getDeliveredOrdersCount = () => {
    return orders.filter(order => order.status === 3).length;
  };

  const getPendingOrdersCount = () => {
    return orders.filter(order => order.status === 0).length;
  };

  // Hàm xử lý xem chi tiết đơn hàng
  const handleViewOrder = async (order: Order) => {
    try {
      setLoadingDetails(true);
      setViewOrder(order);
      const response = await api.getOrderDetails(order.id);
      if (response.status === 200) {
        setOrderDetails(response.data);
      } else {
        throw new Error("Failed to fetch order details");
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải chi tiết đơn hàng",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Hàm xử lý hủy đơn hàng
  const handleCancelOrder = async (orderId: number) => {
    try {
      await api.CancelOrderbyUser(orderId);
      toast({
        title: "Thành công",
        description: "Đã hủy đơn hàng",
      });
      fetchOrders();
      setViewOrder(null);
    } catch (error) {
      console.error('Error canceling order:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể hủy đơn hàng",
      });
    }
  };

  // ✅ Hàm upload từng ảnh với filePath
  const uploadSingleImage = async (file: File, imageId: string): Promise<string> => {
    try {
      console.log(`🔄 Bắt đầu upload ảnh: ${file.name}`);
      
      const response: ImageUploadResponse = await api.uploadImage(file);
      console.log('📥 Response từ API upload:', response);
      
      let imageUrl: string | null = null;

      if (typeof response === 'string') {
        imageUrl = response;
      } else if (response && typeof response === 'object') {
        // ✅ PRIORITY: Lấy filePath trước
        if (response.filePath) {
          imageUrl = response.filePath;
        } else if (response.fileName) {
          imageUrl = response.fileName;
        } else {
          const possibleFields = ['url', 'data', 'imageUrl', 'path', 'src'];
          for (const field of possibleFields) {
            if ((response as any)[field] && typeof (response as any)[field] === 'string') {
              imageUrl = (response as any)[field];
              break;
            }
          }
        }
      }

      if (!imageUrl) {
        throw new Error('Không tìm thấy filePath trong response từ server');
      }

      console.log(`✅ Upload thành công, filePath: ${imageUrl}`);
      return imageUrl;
      
    } catch (error: any) {
      console.error(`❌ Lỗi upload ảnh ${file.name}:`, error);
      throw new Error(error.message || 'Không thể upload ảnh');
    }
  };

  // ✅ Hàm xử lý chọn và upload ảnh ngay lập tức
  const handleImageSelectAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    if (selectedImages.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Chỉ được phép upload tối đa 5 hình ảnh",
      });
      return;
    }

    const validFiles: File[] = [];
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: `File ${file.name} không phải là hình ảnh`,
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: `File ${file.name} vượt quá 5MB`,
        });
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      try {
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Không thể đọc file'));
          reader.readAsDataURL(file);
        });

        const newImage: SelectedImage = {
          file,
          preview,
          id: imageId,
          isUploading: true
        };

        setSelectedImages(prev => [...prev, newImage]);

        const uploadedUrl = await uploadSingleImage(file, imageId);

        setSelectedImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, uploadedUrl, isUploading: false }
            : img
        ));

        toast({
          title: "✅ Upload thành công",
          description: `Đã upload ${file.name}`,
        });

      } catch (error: any) {
        console.error('Lỗi xử lý ảnh:', error);
        
        setSelectedImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, isUploading: false, uploadError: error.message }
            : img
        ));

        toast({
          variant: "destructive",
          title: "❌ Lỗi upload",
          description: `Không thể upload ${file.name}: ${error.message}`,
        });
      }
    }

    event.target.value = '';
  };

  // Hàm xóa ảnh đã chọn
  const removeSelectedImage = (imageId: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  // ✅ Hàm xử lý tạo/cập nhật khiếu nại
  const handleComplaintSubmit = async () => {
    if (!complaintOrder) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không tìm thấy thông tin đơn hàng",
      });
      return;
    }

    // Validation
    if (!complaintData.title.trim() || complaintData.title.length < 10) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Tiêu đề phải có ít nhất 10 ký tự",
      });
      return;
    }

    if (!complaintData.description.trim() || complaintData.description.length < 20) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mô tả phải có ít nhất 20 ký tự",
      });
      return;
    }

    const uploadingImages = selectedImages.filter(img => img.isUploading);
    if (uploadingImages.length > 0) {
      toast({
        variant: "destructive",
        title: "Vui lòng đợi",
        description: `Còn ${uploadingImages.length} ảnh đang được upload...`,
      });
      return;
    }

    const failedImages = selectedImages.filter(img => img.uploadError);
    if (failedImages.length > 0) {
      toast({
        variant: "destructive",
        title: "Lỗi upload ảnh",
        description: "Vui lòng xóa các ảnh upload lỗi hoặc thử upload lại",
      });
      return;
    }

    try {
      setSubmittingComplaint(true);
      
      const uploadedImageUrls = selectedImages
        .filter(img => img.uploadedUrl && !img.uploadError)
        .map(img => img.uploadedUrl!);

      const complaintPayload = {
        title: complaintData.title.trim(),
        description: complaintData.description.trim(),
        imageUrl: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : undefined
      };

      let response;
      if (isEditMode && editingComplaint) {
        // ✅ Cập nhật khiếu nại
        console.log('📝 Cập nhật khiếu nại ID:', editingComplaint.id);
        response = await api.updateComplaint(editingComplaint.id, complaintPayload);
        toast({
          title: "✅ Thành công!",
          description: "Khiếu nại đã được cập nhật thành công.",
        });
      } else {
        // ✅ Tạo khiếu nại mới
        console.log('🚀 Tạo khiếu nại mới cho đơn hàng:', complaintOrder.id);
        const createPayload = { ...complaintPayload, orderId: complaintOrder.id };
        response = await api.createComplaint(createPayload);
        toast({
          title: "✅ Thành công!",
          description: "Khiếu nại đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.",
        });
      }

      console.log('📥 Response:', response);

      // Refresh data và đóng modal
      await fetchMyComplaints();
      resetComplaintForm();

    } catch (error: any) {
      console.error('❌ Lỗi khi xử lý khiếu nại:', error);
      
      let errorMessage = isEditMode ? "Không thể cập nhật khiếu nại" : "Không thể tạo khiếu nại";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: errorMessage,
      });
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // ✅ Hàm xóa khiếu nại
  const handleDeleteComplaint = async (complaintId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khiếu nại này?')) return;

    try {
      await api.deleteComplaint(complaintId);
      toast({
        title: "✅ Thành công",
        description: "Đã xóa khiếu nại",
      });
      await fetchMyComplaints();
      setShowComplaintDetailModal(false);
    } catch (error: any) {
      console.error('Error deleting complaint:', error);
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: "Không thể xóa khiếu nại",
      });
    }
  };

  // Hàm reset form khiếu nại
  const resetComplaintForm = () => {
    setComplaintData({ title: '', description: '', imageUrls: [] });
    setSelectedImages([]);
    setShowComplaintModal(false);
    setComplaintOrder(null);
    setEditingComplaint(null);
    setIsEditMode(false);
  };

  // ✅ Hàm mở modal tạo khiếu nại mới
  const handleCreateComplaint = (order: Order) => {
    console.log('📝 Mở modal khiếu nại cho đơn hàng:', order.id);
    setComplaintOrder(order);
    setIsEditMode(false);
    setEditingComplaint(null);
    setShowComplaintModal(true);
    setComplaintData({
      title: `Khiếu nại đơn hàng #${order.id}`,
      description: '',
      imageUrls: []
    });
  };

  // ✅ Hàm mở modal chỉnh sửa khiếu nại
  const handleEditComplaint = (complaint: Complaint) => {
    console.log('✏️ Chỉnh sửa khiếu nại:', complaint.id);
    setEditingComplaint(complaint);
    setIsEditMode(true);
    
    // Tìm order tương ứng
    const order = orders.find(o => o.id === complaint.orderId);
    setComplaintOrder(order || null);
    
    setShowComplaintModal(true);
    setComplaintData({
      title: complaint.title,
      description: complaint.description,
      imageUrls: complaint.imageUrl ? [complaint.imageUrl] : []
    });

    // Nếu có ảnh, tạo preview
    if (complaint.imageUrl) {
    setSelectedImages([{
      file: new File([], 'existing-image'),
      preview: `${process.env.NEXT_PUBLIC_BACKEND_API || 'http://103.82.27.97:5000'}/${complaint.imageUrl}`,
      id: 'existing-' + Date.now(),
      uploadedUrl: complaint.imageUrl // Giữ nguyên filePath gốc
    }]);
  }
};

  // ✅ Hàm xem chi tiết khiếu nại
  const handleViewComplaint = async (complaint: Complaint) => {
    try {
      const response = await api.getComplaintById(complaint.id);
      if (response.status === 200) {
        setViewComplaint(response.data);
        setShowComplaintDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải chi tiết khiếu nại",
      });
    }
  };

  // ✅ Kiểm tra có khiếu nại cho đơn hàng không
  const getComplaintForOrder = (orderId: number): Complaint | undefined => {
    return complaints.find(c => c.orderId === orderId);
  };

  // ✅ Kiểm tra xem có thể khiếu nại không
  const canComplain = (order: Order) => {
    const existingComplaint = getComplaintForOrder(order.id);
    return (order.status === 3 || order.status === 2) && !existingComplaint;
  };

  // ✅ Kiểm tra có thể chỉnh sửa khiếu nại không
  const canEditComplaint = (complaint: Complaint) => {
    return complaint.status === ComplaintStatus.Pending;
  };

  // Kiểm tra xem có ảnh đang upload không
  const hasUploadingImages = () => {
    return selectedImages.some(img => img.isUploading);
  };

  // Render loading states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-sm">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Đang tải dữ liệu...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render giao diện chính
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-gray-700">
                  Trang chủ
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2">/</span>
                <span className="font-medium text-gray-900">Lịch sử đơn hàng</span>
              </li>
            </ol>
          </nav>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">Đơn chờ xác nhận</p>
                    <h3 className="text-2xl font-bold mt-2">{getPendingOrdersCount()}</h3>
                  </div>
                  <Truck className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">Đơn thành công</p>
                    <h3 className="text-2xl font-bold mt-2">{getDeliveredOrdersCount()}</h3>
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
                      {formatCurrency(calculateTotalSpent())}
                    </h3>
                  </div>
                  <DollarSign className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ✅ Action Buttons */}
          <div className="flex justify-end gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => setShowComplaintsModal(true)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Xem khiếu nại của tôi ({complaints.length})
            </Button>
          </div>

          {/* Orders Table */}
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Package className="h-6 w-6 text-blue-600" />
                    Lịch sử đơn hàng
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Xem lại tất cả đơn hàng đã đặt
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Tabs for filtering orders by status */}
              <div className="sticky top-0 z-10 bg-white border-b mb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="overflow-x-auto scrollbar-hide">
                  <TabsList className="flex w-full min-w-max border-b">
                    <TabsTrigger value="all" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Tất cả</TabsTrigger>
                    <TabsTrigger value="0" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Chờ xác nhận</TabsTrigger>
                    <TabsTrigger value="1" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Chờ giao hàng</TabsTrigger>
                    <TabsTrigger value="2" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Đang giao hàng</TabsTrigger>
                    <TabsTrigger value="3" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Đã hoàn thành</TabsTrigger>
                    <TabsTrigger value="4" className="px-4 py-2 font-semibold whitespace-nowrap border-b-2 border-transparent data-[state=active]:border-black">Đã hủy</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Chưa có đơn hàng nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold">STT</TableHead>
                      <TableHead className="font-semibold">Ngày đặt</TableHead>
                      <TableHead className="font-semibold">Tổng tiền</TableHead>
                      <TableHead className="font-semibold">Trạng thái</TableHead>
                      <TableHead className="font-semibold">Khiếu nại</TableHead>
                      <TableHead className="font-semibold">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order, index) => {
                      const existingComplaint = getComplaintForOrder(order.id);
                      return (
                        <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell>{formatDate(order.createAt)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.total)}
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
                            {/* ✅ Hiển thị trạng thái khiếu nại */}
                            {existingComplaint ? (
                              <Badge 
                                variant={COMPLAINT_STATUS_MAP[existingComplaint.status].color as any}
                                className="font-medium"
                              >
                                {COMPLAINT_STATUS_MAP[existingComplaint.status].label}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">Chưa có</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Chi tiết
                              </Button>
                              
                              {/* ✅ Conditional buttons cho khiếu nại */}
                              {existingComplaint ? (
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                    onClick={() => handleViewComplaint(existingComplaint)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Xem KN
                                  </Button>
                                  {canEditComplaint(existingComplaint) && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                      onClick={() => handleEditComplaint(existingComplaint)}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ) : canComplain(order) ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                                  onClick={() => handleCreateComplaint(order)}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Khiếu nại
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
      {/* ✅ Modal danh sách khiếu nại */}
      {showComplaintsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Danh sách khiếu nại của tôi
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowComplaintsModal(false)}
              >
                ✕
              </Button>
            </div>

            {complaints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Bạn chưa có khiếu nại nào</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Đơn hàng</TableHead>
                    <TableHead className="font-semibold">Tiêu đề</TableHead>
                    <TableHead className="font-semibold">Ngày tạo</TableHead>
                    <TableHead className="font-semibold">Trạng thái</TableHead>
                    <TableHead className="font-semibold">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium">#{complaint.orderId}</TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.title}</TableCell>
                      <TableCell>{formatDate(complaint.createAt)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={COMPLAINT_STATUS_MAP[complaint.status].color as any}
                          className="font-medium"
                        >
                          {COMPLAINT_STATUS_MAP[complaint.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewComplaint(complaint)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Button>
                          {canEditComplaint(complaint) && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditComplaint(complaint)}
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Sửa
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteComplaint(complaint.id)}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ✅ Modal chi tiết khiếu nại */}
      {showComplaintDetailModal && viewComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Chi tiết khiếu nại #{viewComplaint.id}
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowComplaintDetailModal(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              {/* Thông tin cơ bản */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Đơn hàng:</span>
                    <span className="ml-2 font-medium">#{viewComplaint.orderId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày tạo:</span>
                    <span className="ml-2 font-medium">{formatDate(viewComplaint.createAt)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Trạng thái:</span>
                    <Badge 
                      variant={COMPLAINT_STATUS_MAP[viewComplaint.status].color as any}
                      className="ml-2"
                    >
                      {COMPLAINT_STATUS_MAP[viewComplaint.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Nội dung khiếu nại */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Tiêu đề:</Label>
                <p className="mt-1 text-gray-900">{viewComplaint.title}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Mô tả:</Label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{viewComplaint.description}</p>
              </div>

              {/* Hình ảnh -  */}
                {viewComplaint.imageUrl && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hình ảnh minh chứng:</Label>
                    <div className="mt-2">
                      <img 
                      src={`${process.env.NEXT_PUBLIC_BACKEND_API}/${viewComplaint.imageUrl} || 'http://localhost:5000'}/${viewComplaint.imageUrl}`}
                      alt="Minh chứng khiếu nại"
                      className="max-w-full h-auto rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                      />
                    </div>
                  </div>
                )}

              {/* Phản hồi từ admin */}
              {viewComplaint.adminResponse && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-blue-700">Phản hồi từ admin:</Label>
                  <p className="mt-1 text-blue-900 whitespace-pre-wrap">{viewComplaint.adminResponse}</p>
                  {viewComplaint.responseAt && (
                    <p className="text-xs text-blue-600 mt-2">
                      Phản hồi vào: {formatDate(viewComplaint.responseAt)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowComplaintDetailModal(false)}
              >
                Đóng
              </Button>
              {canEditComplaint(viewComplaint) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowComplaintDetailModal(false);
                      handleEditComplaint(viewComplaint);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteComplaint(viewComplaint.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết đơn hàng (giữ nguyên code cũ) */}
      {viewOrder && !showComplaintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng</h2>
              <Button variant="outline" size="sm" onClick={() => setViewOrder(null)}>
                ✕
              </Button>
            </div>

            {/* Thông tin khách hàng */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Khách hàng</p>
                <p className="font-medium">{viewOrder.nameCustomer}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium">{viewOrder.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{viewOrder.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Ngày đặt</p>
                <p className="font-medium">
                  {formatDate(viewOrder.createAt)}
                </p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="font-medium">{viewOrder.address}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-sm text-gray-500">Ghi chú</p>
                <p className="font-medium">{viewOrder.note || "Không có ghi chú"}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                <p className="font-medium">{viewOrder.paymentMethod}</p>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Sản phẩm</th>
                    <th className="px-4 py-2 text-right">Đơn giá</th>
                    <th className="px-4 py-2 text-right">Số lượng</th>
                    <th className="px-4 py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingDetails ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center">
                        Đang tải chi tiết đơn hàng...
                      </td>
                    </tr>
                  ) : orderDetails && orderDetails.length > 0 ? (
                    orderDetails.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.imageUrl || '/placeholder-image.jpg'} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                              }}
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">
                                {item.type === 'product' ? 'Sản phẩm' : 'Combo'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center">
                        Không có dữ liệu chi tiết đơn hàng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tổng cộng và trạng thái */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Trạng thái đơn hàng</p>
                <Badge 
                  variant={ORDER_STATUS[viewOrder.status].color as any}
                  className="px-3 py-1 text-sm"
                >
                  {ORDER_STATUS[viewOrder.status].label}
                </Badge>
              </div>
              <div className="text-right space-y-1">
                <div className="flex justify-between gap-8">
                  <p className="text-sm text-gray-500">Tạm tính:</p>
                  <p className="font-medium">
                    {formatCurrency((viewOrder.total || 0) - (viewOrder.shippingFee || 0))}
                  </p>
                </div>
                <div className="flex justify-between gap-8">
                  <p className="text-sm text-gray-500">Phí vận chuyển:</p>
                  <p className="font-medium">
                    {formatCurrency(viewOrder.shippingFee || 0)}
                  </p>
                </div>
                <div className="flex justify-between gap-8 border-t pt-2 mt-2">
                  <p className="text-sm text-gray-700">Tổng tiền:</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(viewOrder.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Bản đồ theo dõi tài xế */}
            {viewOrder.status === 2 && viewOrder.driverId && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Theo dõi tài xế</h3>
                <div className="rounded border overflow-hidden" style={{ height: "400px" }}>
                  <Maptracking
                    key={viewOrder.id}
                    orderId={viewOrder.id}
                    destination={viewOrder.address}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setViewOrder(null)}
              >
                Đóng
              </Button>

              {viewOrder.status === 0 && !viewOrder.isPaid && viewOrder.paymentMethod === 'BANKING' && (
                <Button
                  variant="default"
                  onClick={() => {
                    const vietQRUrl = `https://img.vietqr.io/image/mbbank-0565251240-compact2.jpg?amount=${viewOrder.total}&addInfo=GARANCUCTAC${viewOrder.id}&accountName=TRAN%20TAN%20KHAI`;
                    router.push(`/payment?orderId=${viewOrder.id}&qrCode=${encodeURIComponent(vietQRUrl)}&amount=${viewOrder.total}`);
                  }}
                >
                  Thanh toán lại
                </Button>
              )}

              {viewOrder.status === 0 && !viewOrder.isPaid && (
                <Button
                  variant="destructive"
                  onClick={() => handleCancelOrder(viewOrder.id)}
                >
                  Hủy đơn
                </Button>
              )}

              {canComplain(viewOrder) && (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setComplaintOrder(viewOrder);
                    setShowComplaintModal(true);
                    setComplaintData({
                      title: `Khiếu nại đơn hàng #${viewOrder.id}`,
                      description: '',
                      imageUrls: []
                    });
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Tạo khiếu nại
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal tạo/chỉnh sửa khiếu nại */}
      {showComplaintModal && complaintOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {isEditMode ? 'Chỉnh sửa khiếu nại' : 'Tạo khiếu nại'}
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetComplaintForm}
                disabled={submittingComplaint || hasUploadingImages()}
              >
                ✕
              </Button>
            </div>

            {/* Thông tin đơn hàng */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Thông tin đơn hàng</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="ml-2 font-medium">#{complaintOrder.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ngày đặt:</span>
                  <span className="ml-2 font-medium">{formatDate(complaintOrder.createAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tổng tiền:</span>
                  <span className="ml-2 font-medium">{formatCurrency(complaintOrder.total)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Trạng thái:</span>
                  <Badge 
                    variant={ORDER_STATUS[complaintOrder.status].color as any}
                    className="ml-2"
                  >
                    {ORDER_STATUS[complaintOrder.status].label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Form khiếu nại */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="complaint-title" className="text-sm font-medium">
                  Tiêu đề khiếu nại *
                </Label>
                <Input
                  id="complaint-title"
                  value={complaintData.title}
                  onChange={(e) => setComplaintData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề khiếu nại (tối thiểu 10 ký tự)"
                  className="mt-1"
                  maxLength={200}
                  disabled={submittingComplaint}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {complaintData.title.length}/200 ký tự
                </p>
              </div>

              <div>
                <Label htmlFor="complaint-description" className="text-sm font-medium">
                  Mô tả chi tiết *
                </Label>
                <Textarea
                  id="complaint-description"
                  value={complaintData.description}
                  onChange={(e) => setComplaintData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải (tối thiểu 20 ký tự)"
                  className="mt-1"
                  rows={4}
                  maxLength={2000}
                  disabled={submittingComplaint}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {complaintData.description.length}/2000 ký tự
                </p>
              </div>

              {/* Upload nhiều hình ảnh */}
              <div>
                <Label className="text-sm font-medium">
                  Hình ảnh minh chứng (tùy chọn) - Tối đa 5 ảnh
                </Label>
                <div className="mt-2">
                  {/* Khu vực upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelectAndUpload}
                      className="hidden"
                      id="images-upload"
                      disabled={submittingComplaint || selectedImages.length >= 5}
                    />
                    <label 
                      htmlFor="images-upload" 
                      className={`cursor-pointer ${selectedImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {selectedImages.length >= 5 
                          ? 'Đã đạt giới hạn 5 ảnh' 
                          : 'Click để chọn hình ảnh hoặc kéo thả vào đây'
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Hỗ trợ: JPG, PNG, GIF (tối đa 5MB/ảnh, tối đa 5 ảnh)
                      </p>
                    </label>
                  </div>

                  {/* ✅ Hiển thị ảnh với trạng thái upload */}
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          
                          {/* Loading overlay khi đang upload */}
                          {image.isUploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          )}
                          
                          {/* Checkmark khi upload thành công */}
                          {image.uploadedUrl && !image.isUploading && (
                            <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          )}
                          
                          {/* Error indicator */}
                          {image.uploadError && (
                            <div className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              ❌
                            </div>
                          )}
                          
                          {/* Nút xóa */}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeSelectedImage(image.id)}
                            disabled={submittingComplaint || image.isUploading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            {Math.round(image.file.size / 1024)}KB
                          </div>
                          
                          {/* Hiển thị lỗi upload */}
                          {image.uploadError && (
                            <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-1 rounded max-w-20 truncate">
                              Lỗi
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Nút thêm ảnh */}
                      {selectedImages.length < 5 && (
                        <label htmlFor="images-upload" className="cursor-pointer">
                          <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                            <Plus className="h-6 w-6 text-gray-400" />
                          </div>
                        </label>
                      )}
                    </div>
                  )}
                  
                  {/* Hiển thị trạng thái upload */}
                  {hasUploadingImages() && (
                    <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Đang upload {selectedImages.filter(img => img.isUploading).length} ảnh...
                    </div>
                  )}
                </div>
              </div>

              {/* Lưu ý */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Vui lòng mô tả chi tiết và chính xác vấn đề bạn gặp phải</li>
                      <li>Đính kèm hình ảnh minh chứng để hỗ trợ xử lý nhanh hơn</li>
                      <li>Chúng tôi sẽ phản hồi trong vòng 24-48 giờ làm việc</li>
                      <li>Khiếu nại sẽ được xem xét và xử lý theo quy định của công ty</li>
                      {isEditMode && <li className="text-orange-600">Chỉ có thể chỉnh sửa khiếu nại đang chờ xử lý</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Buttons với trạng thái disabled phù hợp */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={resetComplaintForm}
                disabled={submittingComplaint || hasUploadingImages()}
              >
                Hủy
              </Button>
              <Button
                onClick={handleComplaintSubmit}
                disabled={
                  submittingComplaint || 
                  hasUploadingImages() ||
                  !complaintData.title.trim() ||
                  !complaintData.description.trim() ||
                  complaintData.title.length < 10 ||
                  complaintData.description.length < 20
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {submittingComplaint ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? 'Đang cập nhật...' : 'Đang gửi khiếu nại...'}
                  </>
                ) : hasUploadingImages() ? (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Đang upload ảnh...
                  </>
                ) : (
                  <>
                    {isEditMode ? (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Cập nhật khiếu nại
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Gửi khiếu nại
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}