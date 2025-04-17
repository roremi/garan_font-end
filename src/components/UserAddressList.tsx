"use client"
import { useEffect, useState, useCallback } from "react";
import { authService } from '@/services/auth.service';
import { api } from '@/services/api';
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { UserAddress } from "@/types/useraddress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Timeout mặc định cho các cuộc gọi API (5 giây)
const API_TIMEOUT = 5000;

// Hàm hỗ trợ để thêm timeout cho các promise
const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeout]);
};

export default function UserAddressList({
  userId,
  onRefresh,
  isSelecting = false,
  onSelectAddress,
  selectedAddressId,
}: {
  userId: number;
  onRefresh?: () => void;
  isSelecting?: boolean;
  onSelectAddress?: (addr: UserAddress) => void;
  selectedAddressId?: number;
}) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

  // States cho địa chỉ mới hoặc cập nhật
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [addressDetail, setAddressDetail] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(false);
  const [isLoadingWards, setIsLoadingWards] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Kiểm tra cache trong localStorage cho provinces
  const loadCachedProvinces = useCallback(() => {
    const cached = localStorage.getItem('provincesData');
    if (cached) {
      const parsed = JSON.parse(cached);
      // Kiểm tra thời gian cache (ví dụ: 24 giờ)
      const cacheTime = parsed.timestamp;
      if (Date.now() - cacheTime < 24 * 60 * 60 * 1000) {
        setProvinces(parsed.data);
        const hcmCity = parsed.data.find((province: any) =>
          province.ProvinceName.includes('Hồ Chí Minh')
        );
        if (hcmCity) {
          setSelectedProvince(hcmCity.ProvinceID);
          loadCachedDistricts(hcmCity.ProvinceID);
        }
        return true;
      }
    }
    return false;
  }, []);

  const loadCachedDistricts = useCallback((provinceId: number) => {
    const cached = localStorage.getItem(`districts_${provinceId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      const cacheTime = parsed.timestamp;
      if (Date.now() - cacheTime < 24 * 60 * 60 * 1000) {
        setDistricts(parsed.data);
        return true;
      }
    }
    return false;
  }, []);

  // Tải danh sách địa chỉ của người dùng
  const refreshAddresses = useCallback(async () => {
    setLoading(true);
    setLoadingError(null);
    try {
      const data = await withTimeout(
        authService.getUserFormattedAddresses(userId),
        API_TIMEOUT
      );
      setAddresses(data);
    } catch (err) {
      setLoadingError("Không thể tải địa chỉ người dùng. Vui lòng thử lại.");
      toast.error("Không thể tải địa chỉ người dùng.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshAddresses();
  }, [refreshAddresses]);

  // Tải danh sách tỉnh
  const loadProvinces = useCallback(async () => {
    if (provinces.length > 0) return;
    if (loadCachedProvinces()) return;
    try {
      const response = await withTimeout(api.getProvince(), API_TIMEOUT);
      if (Array.isArray(response['data'])) {
        const hcmCity = response['data'].find(province =>
          province.ProvinceName.includes('Hồ Chí Minh')
        );
        if (hcmCity) {
          setProvinces([hcmCity]);
          setSelectedProvince(hcmCity.ProvinceID);
          // Lưu vào cache
          localStorage.setItem('provincesData', JSON.stringify({
            data: [hcmCity],
            timestamp: Date.now()
          }));
          loadDistricts(hcmCity.ProvinceID);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tỉnh:', error);
      toast.error("Không thể lấy danh sách tỉnh thành");
      setLoadingError("Không thể tải dữ liệu tỉnh thành. Vui lòng thử lại.");
    }
  }, [provinces.length, loadCachedProvinces]);

  // Tải danh sách quận
  const loadDistricts = useCallback(async (provinceId: number) => {
    setIsLoadingDistricts(true);
    if (loadCachedDistricts(provinceId)) {
      setIsLoadingDistricts(false);
      return;
    }
    try {
      const response = await withTimeout(api.getDistricts(provinceId), API_TIMEOUT);
      if (Array.isArray(response['data'])) {
        setDistricts(response['data']);
        setSelectedDistrict(null);
        setWards([]);
        setSelectedWard('');
        // Lưu vào cache
        localStorage.setItem(`districts_${provinceId}`, JSON.stringify({
          data: response['data'],
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách quận:', error);
      toast.error("Không thể lấy danh sách Quận/Huyện");
    } finally {
      setIsLoadingDistricts(false);
    }
  }, [loadCachedDistricts]);

  // Tải danh sách phường
  const handleDistrictChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = parseInt(e.target.value);
    setSelectedDistrict(districtId);
    setIsLoadingWards(true);
    try {
      const response = await withTimeout(api.getWards(districtId), API_TIMEOUT);
      if (Array.isArray(response['data'])) {
        setWards(response['data']);
        setSelectedWard('');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách Phường/Xã:', error);
      toast.error("Không thể lấy danh sách Phường/Xã");
    } finally {
      setIsLoadingWards(false);
    }
  }, []);

  const handleWardChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWard(e.target.value);
  }, []);

  // Mở dialog cập nhật với dữ liệu địa chỉ hiện tại
  const handleOpenUpdateDialog = useCallback(async (address: UserAddress) => {
    setSelectedAddress(address);
    setAddressDetail(address.detail);
    setIsDefault(address.isDefault);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard('');
    setDistricts([]);
    setWards([]);

    try {
      const response = await withTimeout(api.getProvince(), API_TIMEOUT);
      if (Array.isArray(response['data'])) {
        setProvinces(response['data']);
        const matchedProvince = response['data'].find(
          (p: any) => p.ProvinceName === address.provinceName
        );
        if (matchedProvince) {
          setSelectedProvince(matchedProvince.ProvinceID);
          const districtResponse = await withTimeout(api.getDistricts(matchedProvince.ProvinceID), API_TIMEOUT);
          if (Array.isArray(districtResponse['data'])) {
            setDistricts(districtResponse['data']);
            const matchedDistrict = districtResponse['data'].find(
              (d: any) => d.DistrictName === address.districtName
            );
            if (matchedDistrict) {
              setSelectedDistrict(matchedDistrict.DistrictID);
              const wardResponse = await withTimeout(api.getWards(matchedDistrict.DistrictID), API_TIMEOUT);
              if (Array.isArray(wardResponse['data'])) {
                setWards(wardResponse['data']);
                const matchedWard = wardResponse['data'].find(
                  (w: any) => w.WardName === address.wardName
                );
                if (matchedWard) {
                  setSelectedWard(matchedWard.WardCode);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin tỉnh/quận/phường:', error);
      toast.error("Không thể tải thông tin địa chỉ");
    }
    setOpenUpdateDialog(true);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setAddressDetail('');
    // Không reset selectedProvince để giữ mặc định HCM
    setSelectedDistrict(null);
    setSelectedWard('');
    setIsDefault(false);
    setSelectedAddress(null);
  }, []);
  

  // Lưu địa chỉ mới
  const handleSaveAddress = useCallback(async () => {
    if (!addressDetail) {
      toast.error("Vui lòng nhập chi tiết địa chỉ (số nhà, tên đường)");
      return;
    }
    if (!selectedProvince) {
      toast.error("Vui lòng chọn Tỉnh/Thành phố");
      return;
    }
    if (!selectedDistrict) {
      toast.error("Vui lòng chọn Quận/Huyện");
      return;
    }
    if (!selectedWard) {
      toast.error("Vui lòng chọn Phường/Xã");
      return;
    }
    setIsSaving(true);
    try {
      const newAddress = {
        UserId: userId,
        Detail: addressDetail,
        ProvinceId: selectedProvince,
        DistrictId: selectedDistrict,
        WardCode: selectedWard,
        IsDefault: isDefault
      };
      await withTimeout(authService.addUserAddress(userId, newAddress), API_TIMEOUT);
      await refreshAddresses();
      if (onRefresh) onRefresh();
      toast.success("Thêm địa chỉ thành công");
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Lỗi khi lưu địa chỉ:', error);
      toast.error("Không thể lưu địa chỉ");
    } finally {
      setIsSaving(false);
    }
  }, [addressDetail, selectedProvince, selectedDistrict, selectedWard, isDefault, userId, refreshAddresses, onRefresh, resetForm]);
  
  // Cập nhật địa chỉ
  const handleUpdateAddress = useCallback(async () => {
    if (!addressDetail || !selectedProvince || !selectedDistrict || !selectedWard || !selectedAddress) {
      toast.error("Vui lòng nhập đầy đủ thông tin địa chỉ");
      return;
    }
    setIsSaving(true);
    try {
      const updatedAddress = {
        UserId: userId,
        Detail: addressDetail,
        ProvinceId: selectedProvince,
        DistrictId: selectedDistrict,
        WardCode: selectedWard,
        IsDefault: isDefault
      };
      await withTimeout(authService.updateUserAddress(userId, selectedAddress.id, updatedAddress), API_TIMEOUT);
      await refreshAddresses();
      if (onRefresh) onRefresh();
      toast.success("Cập nhật địa chỉ thành công");
      setOpenUpdateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Lỗi khi cập nhật địa chỉ:', error);
      toast.error("Không thể cập nhật địa chỉ");
    } finally {
      setIsSaving(false);
    }
  }, [addressDetail, selectedProvince, selectedDistrict, selectedWard, isDefault, userId, selectedAddress, refreshAddresses, onRefresh, resetForm]);

  // Xóa địa chỉ
  const handleDeleteAddress = useCallback(async () => {
    if (!selectedAddress) return;
    setIsSaving(true);
    try {
      await withTimeout(authService.deleteUserAddress(userId, selectedAddress.id), API_TIMEOUT);
      await refreshAddresses();
      if (onRefresh) onRefresh();
      toast.success("Xóa địa chỉ thành công");
      setOpenUpdateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Lỗi khi xóa địa chỉ:', error);
      toast.error("Không thể xóa địa chỉ");
    } finally {
      setIsSaving(false);
    }
  }, [selectedAddress, userId, refreshAddresses, onRefresh, resetForm]);

  // Thiết lập địa chỉ mặc định
  const handleSetDefaultAddress = useCallback(async (addressId: number) => {
    setIsSaving(true);
    try {
      await withTimeout(authService.setDefaultAddress(userId, addressId), API_TIMEOUT);
      await refreshAddresses();
      if (onRefresh) onRefresh();
      toast.success("Thiết lập địa chỉ mặc định thành công");
    } catch (error) {
      console.error('Lỗi khi thiết lập địa chỉ mặc định:', error);
      toast.error("Không thể thiết lập địa chỉ mặc định");
    } finally {
      setIsSaving(false);
    }
  }, [userId, refreshAddresses, onRefresh]);

  // Tải tỉnh khi mở dialog
  useEffect(() => {
    if (openDialog) {
      // Nếu chưa có provinces, tải từ cache hoặc API
      if (provinces.length === 0) {
        loadProvinces();
      } else {
        // Nếu đã có provinces, đặt selectedProvince mặc định là HCM
        const hcmCity = provinces.find(province =>
          province.ProvinceName.includes('Hồ Chí Minh')
        );
        if (hcmCity && !selectedProvince) {
          setSelectedProvince(hcmCity.ProvinceID);
          loadDistricts(hcmCity.ProvinceID);
        }
      }
    }
  }, [openDialog, loadProvinces, provinces, selectedProvince]);

  if (loading) {
    return <Loader2 className="animate-spin text-muted mx-auto mt-4" />;
  }

  if (loadingError && addresses.length === 0) {
    return (
      <div className="text-center mt-4 space-y-2">
        <p className="text-sm text-red-500">{loadingError}</p>
        <Button
          variant="outline"
          onClick={refreshAddresses}
          className="text-blue-600"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-start mb-2 -mt-2">
        <Button
          variant="default"
          className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
          onClick={() => setOpenDialog(true)}
        >
          <Plus className="w-4 h-4" />
          Thêm địa chỉ mới
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center mt-4">Bạn chưa có địa chỉ nào.</p>
      ) : (
        addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-4 border rounded-md bg-white shadow-sm ${
              addr.isDefault ? "border-orange-500" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{addr.detail}</p>
                <p className="text-sm text-muted-foreground">
                  {addr.wardName}, {addr.districtName}, {addr.provinceName}
                </p>
                {addr.isDefault && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold text-orange-700 bg-orange-100 rounded border border-orange-300">
                    Mặc định
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  variant="outline"
                  className="text-blue-600 text-sm hover:bg-blue-50"
                  onClick={() => handleOpenUpdateDialog(addr)}
                >
                  Cập nhật
                </Button>
                {isSelecting ? (
                  <input
                    type="radio"
                    name="addressRadio"
                    className="w-5 h-5 text-orange-500"
                    checked={selectedAddressId === addr.id}
                    onChange={() => {
                      setSelectedAddress(addr);
                      if (onSelectAddress) onSelectAddress(addr);
                    }}
                  />
                ) : (
                  <Button
                    variant="outline"
                    className={`text-gray-800 border-gray-300 px-3 py-1 text-sm ${
                      addr.isDefault ? "cursor-not-allowed opacity-60 relative" : ""
                    }`}
                    disabled={addr.isDefault || isSaving}
                    onClick={() => handleSetDefaultAddress(addr.id)}
                  >
                    Thiết lập mặc định
                    {addr.isDefault && (
                      <span
                        className="absolute top-1/2 -right-6 transform -translate-y-1/2 text-red-500 text-xl"
                        title="Đây đã là địa chỉ mặc định"
                      >
                        ⚠
                      </span>
                    )}
                  </Button>
                )}
              </div>
           
              </div>
          </div>
        ))
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm địa chỉ mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="addressDetail">Chi tiết địa chỉ</Label>
              <Input
                id="addressDetail"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="Số nhà, tên đường"
                required
              />
            </div>
            <div>
              <Label>Tỉnh/Thành phố</Label>
              <Input
                value="Thành phố Hồ Chí Minh"
                disabled
                className="w-full p-2 border rounded bg-gray-50"
              />
            </div>
            <div>
              <Label>Quận/Huyện</Label>
              {isLoadingDistricts ? (
                <div className="flex items-center p-2 border rounded bg-gray-50">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>Đang tải Quận/Huyện...</span>
                </div>
              ) : (
                <select
                  className="w-full p-2 border rounded appearance-none bg-white"
                  value={selectedDistrict || ""}
                  onChange={handleDistrictChange}
                  required
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map((district) => (
                    <option key={district.DistrictID} value={district.DistrictID}>
                      {district.DistrictName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label>Phường/Xã</Label>
              {isLoadingWards ? (
                <div className="flex items-center p-2 border rounded bg-gray-50">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>Đang tải Phường/Xã...</span>
                </div>
              ) : (
                <select
                  className="w-full p-2 border rounded appearance-none bg-white"
                  value={selectedWard}
                  onChange={handleWardChange}
                  required
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((ward) => (
                    <option key={ward.WardCode} value={ward.WardCode}>
                      {ward.WardName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={() => setIsDefault(!isDefault)}
              />
              <Label>Đặt làm địa chỉ mặc định</Label>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 sm:space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDialog(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSaveAddress}
              disabled={isSaving || isLoadingDistricts || isLoadingWards}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu
                </>
              ) : (
                "Lưu địa chỉ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openUpdateDialog} onOpenChange={setOpenUpdateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật địa chỉ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="addressDetail">Chi tiết địa chỉ</Label>
              <Input
                id="addressDetail"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="Số nhà, tên đường"
                required
              />
            </div>
            <div>
              <Label>Tỉnh/Thành phố</Label>
              <Input
                value="Thành phố Hồ Chí Minh"
                disabled
                className="w-full p-2 border rounded bg-gray-50"
              />
            </div>
            <div>
              <Label>Quận/Huyện</Label>
              {isLoadingDistricts ? (
                <div className="flex items-center p-2 border rounded bg-gray-50">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>Đang tải Quận/Huyện...</span>
                </div>
              ) : (
                <select
                  className="w-full p-2 border rounded appearance-none bg-white"
                  value={selectedDistrict || ""}
                  onChange={handleDistrictChange}
                  required
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map((district) => (
                    <option key={district.DistrictID} value={district.DistrictID}>
                      {district.DistrictName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label>Phường/Xã</Label>
              {isLoadingWards ? (
                <div className="flex items-center p-2 border rounded bg-gray-50">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>Đang tải Phường/Xã...</span>
                </div>
              ) : (
                <select
                  className="w-full p-2 border rounded appearance-none bg-white"
                  value={selectedWard}
                  onChange={handleWardChange}
                  required
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((ward) => (
                    <option key={ward.WardCode} value={ward.WardCode}>
                      {ward.WardName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={() => setIsDefault(!isDefault)}
              />
              <Label>Đặt làm địa chỉ mặc định</Label>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 sm:space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenUpdateDialog(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAddress}
              disabled={isSaving || selectedAddress?.isDefault}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa
                </>
              ) : (
                "Xóa địa chỉ"
              )}
            </Button>
            <Button
              type="button"
              onClick={handleUpdateAddress}
              disabled={isSaving || isLoadingDistricts || isLoadingWards}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật
                </>
              ) : (
                "Cập nhật địa chỉ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
