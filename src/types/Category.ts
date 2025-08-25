// types/Category.ts
export interface Category {
  id: number;
  name: string;
  description: string;
  products?: Product[];
  createdAt?: string;
}

// Import Product type nếu cần sử dụng circular reference
import type { Product } from './product';