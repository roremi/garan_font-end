import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarIcon } from 'lucide-react';
import { api } from '@/services/api';
import { Feedback } from '@/types/feedback';
import { toast } from 'sonner';

interface FeedbackSectionProps {
  productId: number;
}

export default function FeedbackSection({ productId }: FeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFeedbacks();
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
      await api.addFeedback({
        productId,
        rating: newRating,
        comment: newComment.trim()
      });

      // Reset form và load lại feedbacks
      setNewComment('');
      setNewRating(5);
      await loadFeedbacks();

      toast.success('Cảm ơn bạn đã đánh giá sản phẩm');

    } catch (error: any) {
      let errorMessage = "Không thể gửi đánh giá";
      
      // Kiểm tra message từ API response
      if (error?.response?.data?.message === "Bạn cần mua sản phẩm trước khi đánh giá") {
        toast.error('Bạn cần mua sản phẩm trước khi đánh giá');
      } else if (error?.response?.data?.message) {
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

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>

      {/* Form thêm đánh giá */}
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
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Đang gửi...
            </div>
          ) : (
            'Gửi đánh giá'
          )}
        </Button>
      </form>

      {/* Danh sách đánh giá */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <p className="text-gray-500">Chưa có đánh giá nào.</p>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="border rounded-lg p-4">
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
              <p className="text-gray-700">{feedback.comment}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}