import { Product } from './product';
import { Combo } from './combo';

export interface CartItem {
  product?: Product;
  combo?: Combo;
  quantity: number;
  type: 'product' | 'combo';
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
  id: number;
  orderDate: string;
  status: number;
  createAt: string;
}
