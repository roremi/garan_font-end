import { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderDetails {
  fullName: string;
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
}

export interface Order extends OrderDetails {
  id: string;
  orderDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
}
