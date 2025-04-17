'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useCart } from '@/contexts/CartContext';
import Footer from '@/components/layout/Footer';
import { Copy, Check, Timer, AlertCircle } from 'lucide-react';
import { toast as toastSoner } from 'sonner';
import { api } from '@/services/api';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(900); // 15 phút
  const [copied, setCopied] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const { cart, clearCart } = useCart();
  
  const orderId = searchParams?.get('orderId') ?? '';
  const qrCode = searchParams?.get('qrCode') ?? '';
  const amount = searchParams?.get('amount') ?? '0';

  const bankInfo = {
    bankName: "MBBank", 
    accountNumber: "0565251240",
    accountName: "TRAN TAN KHAI",
    branch: "Chi nhánh TP.HCM",
    transferContent: `GARANCUCTAC${orderId}`
  };

  // Kiểm tra trạng thái đơn hàng khi component mount
  useEffect(() => {
    if (orderId) {
      api.getOrderStatus(Number(orderId))
        .then(response => {
          setOrderStatus(response.status);
        })
        .catch(error => {
          console.error('Lỗi khi kiểm tra trạng thái đơn hàng:', error);
        });
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !qrCode) {
      router.push('/');
      return;
    }
  
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    // Chỉ cleanup timer, không hủy đơn ở đây nữa
    return () => clearInterval(timer);
  }, [orderId, qrCode, router]);
  

  // Định dạng thời gian đếm ngược
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
    
    toastSoner.success("Đã sao chép", {
      description: `${field} đã được sao chép vào clipboard`
    });
  };

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      // Gọi API kiểm tra giao dịch
      const checkResult = await api.checkTransaction({
        orderId: Number(orderId),
        amount: Number(amount),
        description: bankInfo.transferContent
      });
  
      if (checkResult.success) {
        setIsPaymentConfirmed(true); // Đánh dấu đã xác nhận thanh toán
        clearCart();
        toastSoner.success("Xác nhận thanh toán thành công", {
          description: checkResult.message || "Chúng tôi sẽ kiểm tra và xử lý đơn hàng của bạn trong thời gian sớm nhất"
        });
  
        // Chuyển hướng đến trang lịch sử đơn hàng sau 2 giây
        setTimeout(() => {
          router.push('/history');
        }, 2000);
      } else {
        toastSoner.error("Thông báo", {
          description: checkResult.message || "Không tìm thấy giao dịch. Vui lòng thử lại sau vài phút"
        });
      }
    } catch (error) {
      console.error('Error checking transaction:', error);
      toastSoner.error("Lỗi", {
        description: "Có lỗi xảy ra khi xác nhận thanh toán. Vui lòng thử lại sau"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Hàm xử lý khi người dùng nhấn nút "Về trang chủ"
  const handleGoHome = () => {
    if (orderStatus === "0" && !isPaymentConfirmed && orderId) {
      api.cancelOrder(Number(orderId))
        .then(() => {
          console.log(`Đã hủy đơn hàng #${orderId}`);
          router.push('/');
        })
        .catch(err => {
          console.error(`Lỗi khi hủy đơn hàng #${orderId}:`, err);
          router.push('/');
        });
    } else {
      router.push('/');
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8 pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <h1 className="text-2xl font-bold text-center mb-2">Thanh toán đơn hàng #{orderId}</h1>
              <div className="flex items-center text-orange-500 font-medium">
                <Timer className="w-5 h-5 mr-1" />
                <span>Thời gian thanh toán còn lại: {formatTime(countdown)}</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="border rounded-lg p-4 mb-4">
                  <h2 className="font-semibold text-lg mb-3">Thông tin chuyển khoản</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Ngân hàng</p>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{bankInfo.bankName}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => copyToClipboard(bankInfo.bankName, "Tên ngân hàng")}
                        >
                          {copied === "Tên ngân hàng" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Số tài khoản</p>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{bankInfo.accountNumber}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => copyToClipboard(bankInfo.accountNumber, "Số tài khoản")}
                        >
                          {copied === "Số tài khoản" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Tên chủ tài khoản</p>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{bankInfo.accountName}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => copyToClipboard(bankInfo.accountName, "Tên chủ tài khoản")}
                        >
                          {copied === "Tên chủ tài khoản" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Chi nhánh</p>
                      <p className="font-medium">{bankInfo.branch}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Số tiền</p>
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-red-600">{parseInt(amount).toLocaleString('vi-VN')} VNĐ</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => copyToClipboard(amount, "Số tiền")}
                        >
                          {copied === "Số tiền" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Nội dung chuyển khoản</p>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{bankInfo.transferContent}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => copyToClipboard(bankInfo.transferContent, "Nội dung chuyển khoản")}
                        >
                          {copied === "Nội dung chuyển khoản" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Lưu ý khi thanh toán</h3>
                      <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                        <li>Vui lòng nhập chính xác nội dung chuyển khoản</li>
                        <li>Đơn hàng sẽ được xử lý sau khi chúng tôi nhận được thanh toán</li>
                        <li>Nếu cần hỗ trợ, vui lòng liên hệ hotline: 0909 123 456</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="border rounded-lg p-4 mb-4">
                  <h2 className="font-semibold text-lg mb-3">Mã QR thanh toán</h2>
                  <div className="flex justify-center">
                    <div className="relative w-64 h-64">
                      <Image
                        src={qrCode}
                        alt="QR Code"
                        fill
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">Quét mã QR để thanh toán nhanh chóng</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleGoHome}
            >
              Về trang chủ
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleConfirmPayment}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <span className="animate-spin mr-2">⭕</span>
                  Đang xác nhận...
                </>
              ) : (
                'Tôi đã chuyển khoản'
              )}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
