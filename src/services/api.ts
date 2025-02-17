import { Product } from '@/types/product';

const API_URL = 'http://localhost:5000/api';

export const api = {
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/Products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  },

  // Thêm các API khác ở đây
  async getProductById(id: number): Promise<Product> {
    const response = await fetch(`${API_URL}/Products/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    return response.json();
  },

  // ... các API khác
};
