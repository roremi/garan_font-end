'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Copy, Check, Timer, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { api } from '@/services/api';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(900); // 15 phút
  const [copied, setCopied] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  
  const orderId = searchParams?.get('orderId') ?? '';
  const qrCode = searchParams?.get('qrCode') ?? '';
  const amount = searchParams?.get('amount') ?? '0';

  const bankInfo = {
    bankName: "VietinBank", 
    accountNumber: "0565251240",
    accountName: "TRAN TAN KHAI",
    branch: "Chi nhánh TP.HCM",
    transferContent: `GARANCUCTAC${orderId}`
  };

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

    return () => clearInterval(timer);
  }, [orderId, qrCode, router]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
    
    toast({
      title: "Đã sao chép",
      description: `${field} đã được sao chép vào clipboard`,
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
        toast({
          title: "Xác nhận thanh toán thành công",
          description: checkResult.message || "Chúng tôi sẽ kiểm tra và xử lý đơn hàng của bạn trong thời gian sớm nhất",
          variant: "default",
        });
  
        // Chuyển hướng đến trang orders sau 2 giây
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Thông báo",
          description: checkResult.message || "Không tìm thấy giao dịch. Vui lòng thử lại sau vài phút",
        });
      }
    } catch (error) {
      console.error('Error checking transaction:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xác nhận thanh toán. Vui lòng thử lại sau",
      });
    } finally {
      setIsConfirming(false);
    }
  };
  

  if (!orderId || !qrCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8 pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">
                Thanh toán đơn hàng #{orderId}
              </h1>
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <Timer size={20} />
                <p className="font-semibold">
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - QR Code */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="relative w-full aspect-square">
                    {qrCode && (
                      <Image
                        src={qrCode}
                        alt="QR Code"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{ objectFit: 'contain' }}
                        priority
                        unoptimized
                      />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Quét mã QR để thanh toán nhanh chóng
                  </p>
                </div>
              </div>

              {/* Right Column - Transfer Information */}
              <div className="space-y-6">
                {/* Amount */}
                <div className="bg-orange-50 p-6 rounded-xl">
                  <p className="text-sm text-orange-600 mb-2">Số tiền cần thanh toán</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {formatCurrency(amount)}
                  </p>
                </div>

                {/* Bank Information */}
                <div className="space-y-4">
                  {[
                    { label: 'Ngân hàng', value: bankInfo.bankName },
                    { label: 'Số tài khoản', value: bankInfo.accountNumber },
                    { label: 'Chủ tài khoản', value: bankInfo.accountName },
                    { label: 'Chi nhánh', value: bankInfo.branch },
                    { label: 'Nội dung chuyển khoản', value: bankInfo.transferContent }
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="font-medium">{item.value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(item.value, item.label)}
                      >
                        {copied === item.label ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notice and Buttons */}
            <div className="mt-8 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Vui lòng nhập chính xác nội dung chuyển khoản</li>
                    <li>Đơn hàng sẽ được xử lý sau khi chúng tôi nhận được thanh toán</li>
                    <li>Thời gian xác nhận thanh toán có thể mất 5-10 phút</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
