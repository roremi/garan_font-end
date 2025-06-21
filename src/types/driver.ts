export interface Driver {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  driverInfo?: {
    vehiclePlate: string;
    isAvailableShipper: boolean;
    feedbackRating: number;
  };
}
