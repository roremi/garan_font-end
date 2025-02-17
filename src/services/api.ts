import { Product } from '@/types/product';
import { Category } from '@/types/Category';
const API_URL = 'http://localhost:5000/api';

export const api = {

  // lấy tất cả sản phẩm
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/Products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  },
  


 // lấy sản phẩm theo id
  async getProductById(id: number): Promise<Product> {
    const response = await fetch(`${API_URL}/Products/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    return response.json();
  },

// Thêm sản phẩm mới
addProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
  // Format giá trước khi gửi
  const formattedProduct = {
    ...product,
    price: Number(product.price)
  };
  
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedProduct),
  });
  if (!response.ok) throw new Error('Failed to add product');
  return response.json();
},

// Cập nhật sản phẩm
updateProduct: async (id: number, product: Product): Promise<void> => {
  // Format giá trước khi gửi
  const formattedProduct = {
    ...product,
    price: Number(product.price)
  };

  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedProduct),
  });
  if (!response.ok) throw new Error('Failed to update product');
},



// Xóa sản phẩm
deleteProduct: async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
},




// lấy tất cả category

async getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_URL}/Category`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
},

  // ... các API khác
};
