import { Product } from "@/types/product";
import { Category } from "@/types/Category";
import { ImageUploadResponse } from "@/types/image";

const API_URL = "http://localhost:5000/api";
const getHeaders = (contentType: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {};
  
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};
export const api = {
  // lấy tất cả sản phẩm
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/Products`);
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  },

  // lấy sản phẩm theo id
  async getProductById(id: number): Promise<Product> {
    const response = await fetch(`${API_URL}/Products/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch product");
    }
    return response.json();
  },

  addProduct: async (product: Omit<Product, "id">): Promise<Product> => {
    const formattedProduct = {
      ...product,
      price: Number(product.price),
    };

    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(formattedProduct),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to add product");
    }
    return response.json();
  },

  updateProduct: async (id: number, product: Product): Promise<void> => {
    const formattedProduct = {
      ...product,
      price: Number(product.price),
    };

    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(formattedProduct),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to update product");
    }
  },

  deleteProduct: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to delete product");
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
      console.error("Error fetching categories:", error);
      return [];
    }
  },
  // Lấy category theo id
  async getCategoryById(id: number): Promise<Category> {
    const response = await fetch(`${API_URL}/Category/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch category");
    }
    return response.json();
  },
  // Thêm category mới
  addCategory: async (category: Omit<Category, "id">): Promise<Category> => {
    const response = await fetch(`${API_URL}/Category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error("Failed to add category");
    return response.json();
  },
  // Cập nhật category
  updateCategory: async (id: number, category: Category): Promise<void> => {
    const response = await fetch(`${API_URL}/Category/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error("Failed to update category");
  },
  // Xóa category
  deleteCategory: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/Category/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete category");
    }
  },

  // Lấy tất cả sản phẩm trong một category
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const response = await fetch(`${API_URL}/Category/${categoryId}/products`);
    if (!response.ok) {
      throw new Error("Failed to fetch products by category");
    }
    return response.json();
  },

  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/Images/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to upload image");
    }

    return response.json();
  },

  // API xóa ảnh
  async deleteImage(imageId: number): Promise<void> {
    const response = await fetch(`${API_URL}/Images/${imageId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete image");
    }
  },
  // order
  // Tạo order mới
  async createOrder(orderData: any) {
    const response = await fetch(`${API_URL}/Order/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    console.log("Create Order API Response:", data); // Log để kiểm tra

    if (!data.status || data.status !== 200) {
      throw new Error(data.message || "Failed to create order");
    }
    return data;
  },

  async createOrderDetail(detailData: any) {
    const response = await fetch(`${API_URL}/DetailOrder/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(detailData),
    });

    const data = await response.json();
    console.log("Create Detail API Response:", data); // Log để kiểm tra

    if (!data.status || data.status !== 200) {
      throw new Error(data.message || "Failed to create order detail");
    }
    return data;
  },
  async getAllOrders() {
    const response = await fetch(`${API_URL}/Order/all`);
    const data = await response.json();

    // console.log('Raw API response:', data); // Thêm dòng này

    if (!data.status || data.status !== 200) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    // console.log('Processed data:', data.data); // Thêm dòng này
    return data.data;
  },

  async getOrderDetails(orderId: number) {
    const response = await fetch(
      `${API_URL}/DetailOrder/getAllByOrder?idOrder=${orderId}`
    );
    const data = await response.json();

    if (!data.status || data.status !== 200) {
      throw new Error(data.message || "Failed to fetch order details");
    }
    return data.data;
  },

  async getOrdersbyUser(userId: number) {
    const response = await fetch(
      `${API_URL}/Order/getAllOrder?idUser=${userId}`
    );
    const data = await response.json();

    // console.log('Raw API response:', data); // Thêm dòng này

    if (!data.status || data.status !== 200) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    // console.log('Processed data:', data.data); // Thêm dòng này
    return data.data;
  },

  async confirmOrder(orderId: number, status: number) {
    const response = await fetch(
      `${API_URL}/Order/confirmOrder?idOrder=${orderId}&status=${status}`
    );
    const data = await response.json();

    if (!data.status || data.status !== 200) {
      throw new Error(data.message || "Failed to confirm order");
    }
    return data;
  },
  async checkTransaction(transactionData: {
    orderId: number;
    amount: number;
    description: string;
  }): Promise<{
    success: boolean;
    message: string;
    orderId: number;
    amount: number;
  }> {
    const response = await fetch(`${API_URL}/Transaction/check-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      throw new Error("Failed to check transaction");
    }

    return response.json();
  },
};
