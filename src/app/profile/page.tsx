"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { 
  User, 
  KeyRound, 
  Mail, 
  Phone, 
  Camera,
  Shield,
  QrCode,
  Save,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, enable2FA, disable2FA, verify2FA } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [show2FADialog, setShow2FADialog] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      toast.success('Cập nhật thông tin thành công');
      setIsEditing(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handle2FAToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const response = await enable2FA();
        setQrCodeUrl(response.qrCode);
        setShow2FADialog(true);
      } else {
        await disable2FA();
        toast.success('Đã tắt xác thực 2 yếu tố');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await verify2FA(verificationCode);
      toast.success('Kích hoạt xác thực 2 yếu tố thành công');
      setShow2FADialog(false);
    } catch (error) {
      toast.error('Mã xác thực không chính xác');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 pt-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Quản lý tài khoản</h1>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
                <TabsTrigger value="security">Bảo mật</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="shadow-lg">
                  <CardHeader className="border-b">
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>
                      Quản lý thông tin cá nhân của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleProfileUpdate}>
                      <div className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <img
                              src={profileData.avatar || '/default-avatar.png'}
                              alt="Avatar"
                              className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                            {isEditing && (
                              <label className="absolute bottom-0 right-0 cursor-pointer">
                                <div className="rounded-full bg-primary p-2 text-white shadow-lg hover:bg-primary/90 transition-colors">
                                  <Camera className="h-4 w-4" />
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleAvatarChange}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-6">
                          <FormItem>
                            <FormLabel>Họ và tên</FormLabel>
                            <FormControl>
                              <Input
                                disabled={!isEditing}
                                value={profileData.fullName}
                                onChange={(e) => setProfileData(prev => ({
                                  ...prev,
                                  fullName: e.target.value
                                }))}
                                className="bg-white"
                              />
                            </FormControl>
                          </FormItem>

                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                disabled
                                value={profileData.email}
                                className="bg-gray-50"
                              />
                            </FormControl>
                          </FormItem>

                          <FormItem>
                            <FormLabel>Số điện thoại</FormLabel>
                            <FormControl>
                              <Input
                                disabled={!isEditing}
                                value={profileData.phone}
                                onChange={(e) => setProfileData(prev => ({
                                  ...prev,
                                  phone: e.target.value
                                }))}
                                className="bg-white"
                              />
                            </FormControl>
                          </FormItem>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                              >
                                Hủy
                              </Button>
                              <Button type="submit">
                                Lưu thay đổi
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => setIsEditing(true)}
                            >
                              Chỉnh sửa
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="shadow-lg">
                  <CardHeader className="border-b">
                    <CardTitle>Bảo mật tài khoản</CardTitle>
                    <CardDescription>
                      Quản lý các tùy chọn bảo mật cho tài khoản của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Xác thực 2 yếu tố</h4>
                        <p className="text-sm text-muted-foreground">
                          Bảo vệ tài khoản của bạn bằng xác thực 2 yếu tố
                        </p>
                      </div>
                      <Switch
                        checked={user.is2FAEnabled}
                        onCheckedChange={handle2FAToggle}
                      />
                    </div>

                    <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Thiết lập xác thực 2 yếu tố</DialogTitle>
                          <DialogDescription>
                            Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy) và nhập mã xác thực
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {qrCodeUrl && (
                            <div className="flex justify-center">
                              <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                            </div>
                          )}
                          <FormItem>
                            <FormLabel>Mã xác thực</FormLabel>
                            <FormControl>
                              <Input
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Nhập mã 6 số từ ứng dụng xác thực"
                              />
                            </FormControl>
                          </FormItem>
                          <Button className="w-full" onClick={handleVerify2FA}>
                            Xác nhận
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="space-y-4 p-4 bg-white rounded-lg border">
                      <h4 className="text-sm font-medium">Đổi mật khẩu</h4>
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/auth/change-password')}
                        className="w-full sm:w-auto"
                      >
                        Thay đổi mật khẩu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}