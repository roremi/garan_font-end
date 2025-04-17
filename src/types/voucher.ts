export interface Voucher {
    id: string;
    code: string;
    description?: string;
    type: string; // "Fixed" | "Percent" | "Shipping"
    discountValue?: number;
    discountPercent?: number;
    maximumDiscount?: number;
    minimumOrderValue: number;
    applyToShipping: boolean;
    expirationDate: string;
    status: string; // "Active" | "Inactive"
  }
  