import { Product } from './product';
import { Combo } from './combo';

export interface CartItem {
  product?: Product;
  combo?: Combo;
  quantity: number;
  type: 'product' | 'combo';
}

export interface OrderDetails {
  nameCustomer: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
  paymentMethod: 'COD' | 'BANKING';
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  isPaid: boolean;
}

export interface Order extends OrderDetails {
  id: number;
  orderDate: string;
  status: number;
  createAt: string;
}


export interface OrderCreateRequest {
  nameCustomer: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
  paymentMethod: string;
  cartItems: {
    id: number;
    quantity: number;
    type: string;
  }[];
  shippingFee: number;
  totalAmount: number;
  latitude: number;
  longitude: number;
  // ✅ Thêm hai dòng mới:
  idVoucherDiscount?: number;
  idVoucherShipping?: number;
}

export interface OrderResponse {
  id: number;
  idUser: number;
  nameCustomer: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  shippingFee : number;
  paymentMethod: string;
  createAt: string;
  status: number;
  total: number;
  detailorders: OrderDetailResponse[];
}

export interface OrderDetailResponse {
  id: number;
  quantity: number;
  price: number;
  productId?: number;
  comboId?: number;
  name: string;
  imageUrl: string;
  type: 'product' | 'combo';
}
