// types/product.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: number | null; // Cho phép null
  category?: Category | null; // Cho phép null
  imageId?: number | null;
  isAvailable: boolean;
  idUser?: number;
  createAt?: string;
  quantity?: number;
}

// Import Category type nếu cần sử dụng circular reference
import type { Category } from './Category';