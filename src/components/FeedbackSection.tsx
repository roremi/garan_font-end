import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarIcon, Edit2Icon, Trash2Icon } from 'lucide-react';
import { api } from '@/services/api';
import { Feedback } from '@/types/feedback';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface FeedbackSectionProps {
  productId: number;
}

export default function FeedbackSection({ productId }: FeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadFeedbacks();
    // Lấy ID người dùng từ localStorage hoặc context
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id); // Lấy id từ object user
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [productId]);

  const loadFeedbacks = async () => {
    try {
      const data = await api.getProductFeedbacks(productId);
      setFeedbacks(data);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      toast.error('Không thể tải đánh giá sản phẩm');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingFeedback) {
        // Cập nhật feedback
        await api.updateFeedback(editingFeedback.id, {
          rating: newRating,
          comment: newComment.trim()
        });
        toast.success('Đã cập nhật đánh giá thành công');
        setEditingFeedback(null);
      } else {
        // Thêm feedback mới
        await api.addFeedback({
          productId,
          rating: newRating,
          comment: newComment.trim()
        });
        toast.success('Cảm ơn bạn đã đánh giá sản phẩm');
      }

      // Reset form và load lại feedbacks
      setNewComment('');
      setNewRating(5);
      await loadFeedbacks();

    } catch (error: any) {
      let errorMessage = editingFeedback 
        ? "Không thể cập nhật đánh giá" 
        : "Không thể gửi đánh giá";
      
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setNewRating(feedback.rating);
    setNewComment(feedback.comment);
  };

  const handleCancelEdit = () => {
    setEditingFeedback(null);
    setNewRating(5);
    setNewComment('');
  };

  const handleDeleteClick = (feedbackId: number) => {
    setFeedbackToDelete(feedbackId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!feedbackToDelete) return;

    try {
      await api.deleteFeedback(feedbackToDelete);
      setFeedbacks(feedbacks.filter(f => f.id !== feedbackToDelete));
      toast.success('Đã xóa đánh giá thành công');
    } catch (error) {
      toast.error('Không thể xóa đánh giá');
    } finally {
      setShowDeleteDialog(false);
      setFeedbackToDelete(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const canModifyFeedback = (feedback: Feedback) => {
    return currentUserId === feedback.user.id;
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>

      {/* Form thêm/sửa đánh giá */}
      <form onSubmit={handleSubmitFeedback} className="mb-8">
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewRating(star)}
                className="focus:outline-none"
              >
                <StarIcon
                  className={`w-6 h-6 ${
                    star <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Nhập đánh giá của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {editingFeedback ? 'Đang cập nhật...' : 'Đang gửi...'}
              </div>
            ) : (
              editingFeedback ? 'Cập nhật đánh giá' : 'Gửi đánh giá'
            )}
          </Button>
          {editingFeedback && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              className="w-full md:w-auto"
            >
              Hủy
            </Button>
          )}
        </div>
      </form>

      {/* Danh sách đánh giá */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <p className="text-gray-500">Chưa có đánh giá nào.</p>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="border rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(feedback.user.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium mb-1">{feedback.user.fullName}</p>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, index) => (
                          <StarIcon
                            key={index}
                            className={`w-4 h-4 ${
                              index < feedback.rating 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {canModifyFeedback(feedback) && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(feedback)}
                        >
                          <Edit2Icon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(feedback.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700">{feedback.comment}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(feedback.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog xác nhận xóa */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
