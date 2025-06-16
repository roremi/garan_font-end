"use client";

// Phần 1: Import các thư viện và components cần thiết
import { useEffect, useState, useRef, useCallback } from "react";
import { authService } from "@/services/auth.service";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import React from "react";
import { UserAddress } from "@/types/useraddress";


// Phần 2: Định nghĩa types và interfaces cho dữ liệu địa chỉ
declare global {
  interface Window {
    initMap: () => void;
  }
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

interface UserAddressListProps {
  userId: number;
  onRefresh?: () => void;
  isSelecting?: boolean;
  onSelectAddress?: (addr: UserAddress) => void;
  selectedAddressId?: number;
}

// Phần 3: Hằng số và hàm tiện ích để xử lý timeout API
const API_TIMEOUT = 5000;

const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Yêu cầu hết thời gian")), timeoutMs);
  });
  return Promise.race([promise, timeout]);
};

// Phần 4: Component MapContainer để hiển thị Google Maps
const MapContainer = React.memo(({ mapId }: { mapId: string }) => (
  <div id="map-container" style={{ position: "relative", height: "400px", width: "100%" }}>
    <div id={mapId} style={{ height: "100%", width: "100%" }} />
    <img
      id="centerMarker"
      src="https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png"
      alt="marker"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -100%)",
        zIndex: 999,
        pointerEvents: "none",
        height: "40px",
        width: "20px",
      }}
    />
  </div>
));

// Phần 5: Component chính để quản lý danh sách địa chỉ người dùng
export default function UserAddressList({
  userId,
  onRefresh,
  isSelecting = false,
  onSelectAddress,
  selectedAddressId,
}: UserAddressListProps) {
  // Phần 6: Quản lý state cho danh sách địa chỉ, dialog và dữ liệu form
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [addressDetail, setAddressDetail] = useState<string>("");
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(false);
  const [isLoadingWards, setIsLoadingWards] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [canShowMap, setCanShowMap] = useState(false);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const frameRef = useRef<number | null>(null);
  const listenersRef = useRef<{
    dragend: google.maps.MapsEventListener | null;
    zoom_changed: google.maps.MapsEventListener | null;
  }>({
    dragend: null,
    zoom_changed: null,
  });

  // Phần 7: Hàm tiện ích để parse dữ liệu API
  const parseApiJson = async (apiCall: Promise<any>) => {
    const res = await withTimeout(apiCall, API_TIMEOUT);
    return Array.isArray(res) ? res : res?.data || [];
  };

  // Phần 8: Hàm gọi API để tải danh sách tỉnh, quận, phường
  const loadProvinces = useCallback(async () => {
    try {
      const data = await parseApiJson(api.getProvince());
      setProvinces(data);
      return data;
    } catch {
      toast.error("Không thể tải danh sách tỉnh/thành phố");
      return [];
    }
  }, []);

  const loadDistricts = useCallback(async (provinceId: number) => {
    setIsLoadingDistricts(true);
    try {
      const data = (await parseApiJson(api.getDistricts(provinceId))) as District[];
      setDistricts(data);
      setWards([]);
      setSelectedDistrict(null);
      setSelectedWard(null);
      return data;
    } catch {
      toast.error("Không thể tải danh sách quận/huyện");
      return [];
    } finally {
      setIsLoadingDistricts(false);
    }
  }, []);

  const loadWards = useCallback(async (districtId: number) => {
    setIsLoadingWards(true);
    try {
      const data = (await parseApiJson(api.getWards(districtId))) as Ward[];
      setWards(data);
      setSelectedWard(null);
      return data;
    } catch {
      toast.error("Không thể tải danh sách phường/xã");
      return [];
    } finally {
      setIsLoadingWards(false);
    }
  }, []);

  const refreshAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await withTimeout(authService.getUserFormattedAddresses(userId), API_TIMEOUT);
      setAddresses(data);
    } catch {
      toast.error("Không thể tải địa chỉ người dùng");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Phần 9: Xử lý tải và khởi tạo Google Maps
  useEffect(() => {
    const loadMapScript = async (mapId: string) => {
      try {
        const { key } = await api.getGoogleMapsApiKey();
        if (!key) {
          toast.error("API key Google Maps chưa được cấu hình.");
          return;
        }

        if (!document.getElementById("google-maps-script")) {
          const script = document.createElement("script");
          script.id = "google-maps-script";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
          script.async = true;
          script.defer = true;
          script.onload = () => waitForMapElement(mapId, () => initMap(mapId));
          document.head.appendChild(script);
        } else {
          waitForMapElement(mapId, () => initMap(mapId));
        }
      } catch (error) {
        toast.error("Không thể tải bản đồ.");
      }
    };

    const waitForMapElement = (mapId: string, callback: () => void) => {
      const check = () => {
        const el = document.getElementById(mapId);
        if (el) {
          callback();
        } else {
          frameRef.current = requestAnimationFrame(check);
        }
      };
      frameRef.current = requestAnimationFrame(check);
    };

    const initMap = (mapId: string) => {
      const el = document.getElementById(mapId);
      if (!el || googleMapRef.current) return;

      const center = { lat: latitude || 10.776, lng: longitude || 106.701 }; // Mặc định tại TP.HCM
      const map = new google.maps.Map(el, {
        center,
        zoom: 14,
      });

      googleMapRef.current = map;

      listenersRef.current.dragend = map.addListener("dragend", () => {
        const c = map.getCenter();
        if (c) {
          setLatitude(c.lat());
          setLongitude(c.lng());
        }
      });

      listenersRef.current.zoom_changed = map.addListener("zoom_changed", () => {
        const zoomLevel = map.getZoom();
        console.log("Zoom level:", zoomLevel);
      });
    };

    if ((openDialog || openUpdateDialog) && canShowMap) {
      loadMapScript(openDialog ? "map-add" : "map-update");
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (listenersRef.current.dragend) google.maps.event.removeListener(listenersRef.current.dragend);
      if (listenersRef.current.zoom_changed) google.maps.event.removeListener(listenersRef.current.zoom_changed);
      googleMapRef.current = null;
    };
  }, [openDialog, openUpdateDialog, canShowMap]);

  useEffect(() => {
    if (googleMapRef.current && latitude && longitude) {
      googleMapRef.current.setCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  // Phần 10: Hàm geocoding để lấy tọa độ từ địa chỉ
  const geocodeAddress = async (fullAddress: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const { key } = await api.getGoogleMapsApiKey();
      const encoded = encodeURIComponent(fullAddress);
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${key}`);
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
      console.warn("Geocoding không tìm thấy vị trí:", fullAddress);
      return null;
    } catch (error) {
      console.error("Lỗi geocoding:", error);
      return null;
    }
  };

  // Phần 11: Xử lý sự kiện thay đổi form
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedProvince(id);
    setLatitude(null);
    setLongitude(null);
    setCanShowMap(false);
    await loadDistricts(id);
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedDistrict(id);
    setLatitude(null);
    setLongitude(null);
    setCanShowMap(false);
    await loadWards(id);
  };

  const handleWardChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedWard(id);
    setLatitude(null);
    setLongitude(null);
    setCanShowMap(false);
  };

  const resetForm = useCallback(() => {
    setAddressDetail("");
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setIsDefault(false);
    setDistricts([]);
    setWards([]);
    setSelectedAddress(null);
    setCanShowMap(false);
    setLatitude(null);
    setLongitude(null);
  }, []);

  // Phần 12: Xử lý các hành động thêm, cập nhật, xóa địa chỉ
  const handleOpenAddDialog = () => {
    resetForm();
    setSelectedProvince(79);
    loadDistricts(79);
    setOpenDialog(true);
  };

  const handleSaveAddress = async () => {
    if (!addressDetail || !selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error("Vui lòng nhập đầy đủ thông tin địa chỉ");
      return;
    }

    const province = provinces.find((p) => p.code === selectedProvince);
    const district = districts.find((d) => d.code === selectedDistrict);
    const ward = wards.find((w) => w.code === selectedWard);

    const newAddress = {
      UserId: userId,
      Detail: addressDetail,
      ProvinceName: province?.name || "",
      DistrictName: district?.name || "",
      WardName: ward?.name || "",
      Latitude: latitude || 0,
      Longitude: longitude || 0,
      IsDefault: isDefault,
    };

    setIsSaving(true);
    try {
      await withTimeout(authService.addUserAddress(userId, newAddress), API_TIMEOUT);
      toast.success("Đã thêm địa chỉ");
      await refreshAddresses();
      if (onRefresh) onRefresh();
      setOpenDialog(false);
      resetForm();
    } catch {
      toast.error("Lỗi khi thêm địa chỉ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!addressDetail || !selectedProvince || !selectedDistrict || !selectedWard || !selectedAddress) {
      toast.error("Vui lòng nhập đầy đủ thông tin địa chỉ");
      return;
    }

    const province = provinces.find((p) => p.code === selectedProvince);
    const district = districts.find((d) => d.code === selectedDistrict);
    const ward = wards.find((w) => w.code === selectedWard);

    const updatedAddress = {
      UserId: userId,
      Detail: addressDetail,
      ProvinceName: province?.name || "",
      DistrictName: district?.name || "",
      WardName: ward?.name || "",
      Latitude: latitude || 0,
      Longitude: longitude || 0,
      IsDefault: isDefault,
    };

    setIsSaving(true);
    try {
      await withTimeout(authService.updateUserAddress(userId, selectedAddress.id, updatedAddress), API_TIMEOUT);
      toast.success("Cập nhật địa chỉ thành công");
      await refreshAddresses();
      if (onRefresh) onRefresh();
      setOpenUpdateDialog(false);
      resetForm();
    } catch {
      toast.error("Lỗi khi cập nhật địa chỉ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!selectedAddress) return;
    setIsSaving(true);
    try {
      await withTimeout(authService.deleteUserAddress(userId, selectedAddress.id), API_TIMEOUT);
      toast.success("Xóa địa chỉ thành công");
      await refreshAddresses();
      if (onRefresh) onRefresh();
      setOpenUpdateDialog(false);
      resetForm();
    } catch {
      toast.error("Lỗi khi xóa địa chỉ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addr: UserAddress) => {
    if (addr.isDefault || isUpdatingDefault) return;

    setIsUpdatingDefault(true);
    try {
      await withTimeout(authService.setDefaultAddress(userId, addr.id), API_TIMEOUT);
      toast.success("Đã đặt địa chỉ mặc định");
      await refreshAddresses();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Lỗi khi đặt địa chỉ mặc định");
      console.error("Lỗi khi đặt địa chỉ mặc định:", error);
    } finally {
      setIsUpdatingDefault(false);
    }
  };

  const handleOpenUpdateDialog = useCallback(
    async (addr: UserAddress) => {
      setSelectedAddress(addr);
      setAddressDetail(addr.detail);
      setIsDefault(addr.isDefault);
      setLatitude(addr.latitude || null);
      setLongitude(addr.longitude || null);
      setCanShowMap(!!addr.latitude && !!addr.longitude);

      try {
        let provincesData = provinces;
        if (provinces.length === 0) {
          provincesData = await loadProvinces();
        }

        const province = provincesData.find((p) => p.name === addr.provinceName);
        if (province) {
          setSelectedProvince(province.code);
          const districtsData = await loadDistricts(province.code);
          const district = districtsData.find((d) => d.name === addr.districtName);
          if (district) {
            setSelectedDistrict(district.code);
            const wardsData = await loadWards(district.code);
            const ward = wardsData.find((w) => w.name === addr.wardName);
            if (ward) {
              setSelectedWard(ward.code);
            } else {
              console.warn(`Không tìm thấy phường/xã: ${addr.wardName}`);
              setSelectedWard(null);
            }
          } else {
            console.warn(`Không tìm thấy quận/huyện: ${addr.districtName}`);
            setSelectedDistrict(null);
          }
        } else {
          console.warn(`Không tìm thấy tỉnh/thành phố: ${addr.provinceName}`);
          setSelectedProvince(null);
        }

        setOpenUpdateDialog(true);
      } catch (error) {
        console.error("Lỗi khi tải thông tin địa chỉ:", error);
        toast.error("Không thể tải thông tin địa chỉ để cập nhật");
      }
    },
    [provinces, loadProvinces, loadDistricts, loadWards]
  );

  // Phần 13: Tải dữ liệu ban đầu
  useEffect(() => {
    refreshAddresses();
  }, [refreshAddresses]);

  useEffect(() => {
    if ((openDialog || openUpdateDialog) && provinces.length === 0) {
      loadProvinces();
    }
  }, [openDialog, openUpdateDialog, loadProvinces]);

  // Phần 14: Render giao diện người dùng
  if (loading) {
    return <Loader2 className="animate-spin text-muted mx-auto mt-4" />;
  }

  return (
    <div className="p-4">
      <Button
        onClick={handleOpenAddDialog}
        className="mb-4 bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Thêm địa chỉ
      </Button>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center mt-4">Bạn chưa có địa chỉ nào.</p>
      ) : (
        addresses.map((addr) => (
          <div key={addr.id} className="border p-2 mb-2 rounded relative">
            <div>{addr.detail}</div>
            <div>
              {addr.wardName}, {addr.districtName}, {addr.provinceName}
            </div>
            {addr.isDefault && <div className="text-orange-500">[Mặc định]</div>}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => handleOpenUpdateDialog(addr)}
              >
                Sửa
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="radio"
                  name="defaultAddress"
                  checked={addr.isDefault}
                  onChange={() => handleSetDefaultAddress(addr)}
                  disabled={isUpdatingDefault}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-600"></span>
              </div>
            </div>
          </div>
        ))
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm địa chỉ</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>Tỉnh/Thành phố</Label>
              <Input
                className="w-full p-2 border rounded bg-gray-100 text-gray-600"
                value="Thành phố Hồ Chí Minh"
                readOnly
                disabled
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
                  className="w-full p-2 border rounded"
                  value={selectedDistrict || ""}
                  onChange={handleDistrictChange}
                >
                  <option value="">-- chọn quận/huyện --</option>
                  {districts.map((d: District) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
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
                  className="w-full p-2 border rounded"
                  value={selectedWard || ""}
                  onChange={handleWardChange}
                >
                  <option value="">-- chọn phường/xã --</option>
                  {wards.map((w: Ward) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label>Chi tiết (Số nhà, tên đường)</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="VD: 123 Lê Văn Khương"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!selectedProvince || !selectedDistrict || !selectedWard || !addressDetail) {
                      toast.error("Vui lòng chọn tỉnh, quận, huyện và phường/xã trước khi tìm kiếm.");
                      return;
                    }
                    const province = provinces.find((p) => p.code === selectedProvince);
                    const district = districts.find((d) => d.code === selectedDistrict);
                    const ward = wards.find((w) => w.code === selectedWard);

                    const fullAddress = `${addressDetail}, ${ward?.name}, ${district?.name}, ${province?.name}`;
                    const location = await geocodeAddress(fullAddress);
                    if (location) {
                      setLatitude(location.lat);
                      setLongitude(location.lng);
                      setCanShowMap(true);
                      toast.success("Đã định vị thành công");
                    } else {
                      toast.error("Không tìm thấy vị trí phù hợp");
                    }
                  }}
                >
                  Tìm vị trí
                </Button>
              </div>
            </div>
            {canShowMap && (
              <div className="form-group mt-4">
                <Label>Bản đồ</Label>
                <MapContainer mapId="map-add" />
              </div>
            )}
            {!canShowMap && (
              <div
                className="form-group mt-4"
                style={{ height: "400px", width: "100%", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Button variant="outline" disabled>
                  <Plus className="w-4 h-4 mr-2" /> Thêm vị trí
                </Button>
                <p className="text-sm text-gray-500 mt-2">Loại địa chỉ:</p>
              </div>
            )}
            {/* {canShowMap && (
              <>
                <div className="form-group mt-2">
                  <Label>Vĩ độ</Label>
                  <Input id="latitude" value={latitude || ""} readOnly />
                </div>
                <div className="form-group">
                  <Label>Kinh độ</Label>
                  <Input id="longitude" value={longitude || ""} readOnly />
                </div>
              </>
            )} */}
            <div className="flex items-center">
              <input type="checkbox" checked={isDefault} onChange={() => setIsDefault(!isDefault)} />
              <Label className="ml-2">Mặc định</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={handleSaveAddress} disabled={isSaving || isLoadingDistricts || isLoadingWards}>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật địa chỉ</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>Tỉnh/Thành phố</Label>
              <Input
                className="w-full p-2 border rounded bg-gray-100 text-gray-600"
                value="Thành phố Hồ Chí Minh"
                readOnly
                disabled
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
                  className="w-full p-2 border rounded"
                  value={selectedDistrict || ""}
                  onChange={handleDistrictChange}
                >
                  <option value="">-- chọn quận/huyện --</option>
                  {districts.map((d: District) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
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
                  className="w-full p-2 border rounded"
                  value={selectedWard || ""}
                  onChange={handleWardChange}
                >
                  <option value="">-- chọn phường/xã --</option>
                  {wards.map((w: Ward) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label>Chi tiết (Số nhà, tên đường)</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="VD: 123 Lê Văn Khương"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!selectedProvince || !selectedDistrict || !selectedWard || !addressDetail) {
                      toast.error("Vui lòng chọn tỉnh, quận, huyện và phường/xã trước khi tìm kiếm.");
                      return;
                    }
                    const province = provinces.find((p) => p.code === selectedProvince);
                    const district = districts.find((d) => d.code === selectedDistrict);
                    const ward = wards.find((w) => w.code === selectedWard);

                    const fullAddress = `${addressDetail}, ${ward?.name}, ${district?.name}, ${province?.name}`;
                    const location = await geocodeAddress(fullAddress);
                    if (location) {
                      setLatitude(location.lat);
                      setLongitude(location.lng);
                      setCanShowMap(true);
                      toast.success("Đã định vị thành công");
                    } else {
                      toast.error("Không tìm thấy vị trí phù hợp");
                    }
                  }}
                >
                  Tìm vị trí
                </Button>
              </div>
            </div>

            {canShowMap && (
              <div className="form-group mt-4">
                <Label>Bản đồ</Label>
                <MapContainer mapId="map-update" />
              </div>
            )}
            {!canShowMap && (
              <div
                className="form-group mt-4"
                style={{ height: "400px", width: "100%", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Button variant="outline" disabled>
                  <Plus className="w-4 h-4 mr-2" /> Thêm vị trí
                </Button>
                <p className="text-sm text-gray-500 mt-2">Loại địa chỉ:</p>
              </div>
            )}
            {/* {canShowMap && (
              <>
                <div className="form-group mt-2">
                  <Label>Vĩ độ</Label>
                  <Input id="latitude" value={latitude || ""} readOnly />
                </div>
                <div className="form-group">
                  <Label>Kinh độ</Label>
                  <Input id="longitude" value={longitude || ""} readOnly />
                </div>
              </>
            )} */}
            <div className="flex items-center">
              <input type="checkbox" checked={isDefault} onChange={() => setIsDefault(!isDefault)} />
              <Label className="ml-2">Mặc định</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenUpdateDialog(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button
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
            <Button onClick={handleUpdateAddress} disabled={isSaving || isLoadingDistricts || isLoadingWards}>
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