export interface UserAddress {
    id: number;
    detail: string;
    provinceName: string;
    districtName: string;
    wardName: string;
    provinceId?: number; // Thêm trường này, optional để tránh lỗi nếu không có dữ liệu
    districtId?: number; // Thêm trường này, optional
    wardCode?: string;   // Thêm trường này, optional
    isDefault: boolean;
  }
  