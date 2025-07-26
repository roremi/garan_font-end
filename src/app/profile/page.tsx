"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { authService } from '@/services/auth.service';
import UserAddressList from '@/components/UserAddressList'; // Điều chỉnh đường dẫn nếu cần

import { 
  User, 
  KeyRound, 
  Mail, 
  Phone, 
  Camera,
  Shield,
  QrCode,
  Save,
  X,
  Loader2
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
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const router = useRouter();
  const { 
    user, 
    getTwoFactorStatus, 
    setupTwoFactor, 
    verifyTwoFactor, 
    disableTwoFactor,
    logout 
  } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    avatar: user?.avatar || '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState<{ isEnabled: boolean; email: string }>({ 
    isEnabled: false, 
    email: '' 
  });

  useEffect(() => {
    if (user) {
      // Set profile data
      setProfileData({
        username: user?.username || '',
        fullName: user?.fullName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        avatar: user?.avatar || '',
      });
  
      // Fetch 2FA status
      const fetchTwoFactorStatus = async () => {
        try {
          const status = await getTwoFactorStatus();
          setTwoFactorStatus(status);
        } catch (error) {
          toast.error('Không thể lấy trạng thái 2FA');
        }
      };
  
      fetchTwoFactorStatus();
    }
  }, [user, router, getTwoFactorStatus]);
  

  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if(passwordData.newPassword.length < 6 ){
      toast.error('Mật khẩu mới không được ngắn hơn 6 ký tự')
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    if (passwordData.newPassword === passwordData.oldPassword) {
    toast.error('Mật khẩu mới không được trùng với mật khẩu cũ');
    return;
  }
  
    setIsLoading(true);
    try {
      await authService.changePassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success('Đổi mật khẩu thành công');
      authService.logout();
      logout();
      router.push('/auth/login');
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const UserId = Number(user?.id)
      await authService.updateUserProfile(UserId,profileData);
      toast.success('Cập nhật thông tin thành công');
      logout();
      router.push('/auth/login');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

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
    setIsLoading(true);
    try {
      if (enabled) {
        const response = await setupTwoFactor();
        setQrCodeUrl(response.qrCodeUrl);
        setShow2FADialog(true);
      } else {
        await disableTwoFactor();
        setTwoFactorStatus(prev => ({ ...prev, isEnabled: false }));
        toast.success('Đã tắt xác thực 2 yếu tố');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thay đổi trạng thái 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode) {
      toast.error('Vui lòng nhập mã xác thực');
      return;
    }

    setIsLoading(true);
    try {
      await verifyTwoFactor(verificationCode);
      setTwoFactorStatus(prev => ({ ...prev, isEnabled: true }));
      toast.success('Kích hoạt xác thực 2 yếu tố thành công');
      setShow2FADialog(false);
      setVerificationCode('');
    } catch (error) {
      toast.error('Mã xác thực không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              Quản lý tài khoản
            </h1>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
                <TabsTrigger value="security">Bảo mật</TabsTrigger>
                <TabsTrigger value="address">Địa chỉ</TabsTrigger> {/* 🆕 */}
              </TabsList>

              <TabsContent value="profile">
                <Card>
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
  {/* Username field */}
  <FormItem>
    <FormLabel>Tên đăng nhập</FormLabel>
    <FormControl>
      <Input
        disabled={!isEditing}
        value={profileData.username}
        onChange={(e) => setProfileData(prev => ({
          ...prev,
          username: e.target.value
        }))}
        className="bg-white"
      />
    </FormControl>
  </FormItem>

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
        value={profileData.phoneNumber}
        onChange={(e) => setProfileData(prev => ({
          ...prev,
          phoneNumber: e.target.value
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
                                disabled={isLoading}
                              >
                                Hủy
                              </Button>
                              <Button 
                                type="submit"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang lưu
                                  </>
                                ) : (
                                  'Lưu thay đổi'
                                )}
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
                <Card>
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
                        checked={twoFactorStatus.isEnabled}
                        onCheckedChange={handle2FAToggle}
                        disabled={isLoading}
                      />
                    </div>
                                {/* Password change section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Đổi mật khẩu</h4>
                          <p className="text-sm text-muted-foreground">
                            Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setIsChangingPassword(!isChangingPassword)}
                        >
                          {isChangingPassword ? 'Hủy' : 'Đổi mật khẩu'}
                        </Button>
                      </div>

                      {isChangingPassword && (
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                          <FormItem>
                            <FormLabel>Mật khẩu hiện tại</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData(prev => ({
                                  ...prev,
                                  oldPassword: e.target.value
                                }))}
                                disabled={isLoading}
                              />
                            </FormControl>
                          </FormItem>

                          <FormItem>
                            <FormLabel>Mật khẩu mới</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({
                                  ...prev,
                                  newPassword: e.target.value
                                }))}
                                disabled={isLoading}
                              />
                            </FormControl>
                          </FormItem>

                          <FormItem>
                            <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({
                                  ...prev,
                                  confirmPassword: e.target.value
                                }))}
                                disabled={isLoading}
                              />
                            </FormControl>
                          </FormItem>

                          <div className="flex justify-end space-x-4">
                            <Button
                              type="submit"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Đang cập nhật
                                </>
                              ) : (
                                'Cập nhật mật khẩu'
                              )}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                    <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Thiết lập xác thực 2 yếu tố</DialogTitle>
                          <DialogDescription>
                            Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy) và nhập mã xác thực
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {qrCodeUrl && (
                            <div className="flex justify-center p-4">
                              <img 
                                src={qrCodeUrl} 
                                alt="2FA QR Code" 
                                className="w-48 h-48 border rounded-lg"
                              />
                            </div>
                          )}
                          <FormItem>
                            <FormLabel>Mã xác thực</FormLabel>
                            <FormControl>
                              <Input
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Nhập mã 6 số từ ứng dụng xác thực"
                                maxLength={6}
                                disabled={isLoading}
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                        <DialogFooter className="flex space-x-2 sm:space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShow2FADialog(false)}
                            disabled={isLoading}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="button"
                            onClick={handleVerify2FA}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xác thực
                              </>
                            ) : (
                              'Xác nhận'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="address">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Địa chỉ của bạn</CardTitle>
                  <CardDescription>
                    Quản lý các địa chỉ giao hàng của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {user && <UserAddressList userId={Number(user.id)} />}
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