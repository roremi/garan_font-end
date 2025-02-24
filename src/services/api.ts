import { Product } from "@/types/product";
import { Category } from "@/types/Category";
import { ImageUploadResponse } from "@/types/image";
import { Combo, ComboProduct } from '@/types/combo';

const API_URL = "https://localhost:5001/api";
const getHeaders = (contentType: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {};
  
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  
  const token = localStorage.getItem('app_token')?.replace(/^"(.*)"$/, '$1');
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

  //Location
  getProvince: async () => {
    const response = await fetch(`${API_URL}/Location/province`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*'
      },   
    });
  
    if (!response.ok) {
      throw new Error('Failed to get provinces');
    }
  
    return response.json();
  },

  getDistricts: async (provinceId?: number) => {
    let url = `${API_URL}/Location/districts`;
    if (provinceId) {
      url += `?province_id=${provinceId}`;
    }
  
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*'
      },
    });
  
    if (!response.ok) {
      throw new Error('Failed to get districts');
    }
  
    return response.json();
  },

  getWards: async (districtId: number) => {
    if (!districtId) {
      throw new Error('District ID is required');
    }
  
    const response = await fetch(`${API_URL}/Location/wards?district_id=${districtId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*'
      },
    });
  
    if (!response.ok) {
      throw new Error('Failed to get wards');
    }
  
    return response.json();
  },

  // SHIPPING FEE API
  getShippingFee: async (params: {
    from_district_id: number;
    from_ward_code: string;
    to_district_id: number;
    to_ward_code: string;
    service_id?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
  }) => {
    const queryParams = new URLSearchParams({
      from_district_id: params.from_district_id.toString(),
      from_ward_code: params.from_ward_code,
      to_district_id: params.to_district_id.toString(),
      to_ward_code: params.to_ward_code,
      service_id: (params.service_id || 53320).toString(),
      weight: (params.weight || 20).toString(),
      length: (params.length || 20).toString(),
      width: (params.width || 20).toString(),
      height: (params.height || 20).toString()
    });

    const response = await fetch(
      `${API_URL}/ShipingFee/calculate?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Không thể tính phí vận chuyển');
    }

    return response.json();
  },




  //combo
// Thêm vào file api.ts
// Các API calls cho Combo
async getCombos(): Promise<Combo[]> {
  try {
    const response = await fetch(`${API_URL}/Combos`);
    if (!response.ok) {
      throw new Error('Failed to fetch combos');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching combos:', error);
    throw new Error('Failed to fetch combos');
  }
},


async getComboById(id: number): Promise<Combo> {
  const response = await fetch(`${API_URL}/Combos/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch combo');
  }
  return response.json();
},

async addCombo(combo: Omit<Combo, 'id'>): Promise<Combo> {
  const response = await fetch(`${API_URL}/Combos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(combo),
  });
  if (!response.ok) throw new Error('Failed to add combo');
  return response.json();
},

async updateCombo(id: number, combo: Combo): Promise<void> {
  const response = await fetch(`${API_URL}/Combos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(combo),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update combo error:', errorText);
    throw new Error('Failed to update combo');
  }
},

async deleteCombo(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/Combos/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete combo');
},

// API calls cho ComboProducts
async getComboProducts(): Promise<ComboProduct[]> {
  const response = await fetch(`${API_URL}/ComboProducts`);
  if (!response.ok) {
    throw new Error('Failed to fetch combo products');
  }
  return response.json();
},
async getComboProductsByComboId(comboId: number): Promise<ComboProduct[]> {
  const response = await fetch(`${API_URL}/ComboProducts/combo/${comboId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch combo products');
  }
  const data = await response.json();
  return data;
},

async addComboProduct(comboProduct: ComboProduct): Promise<ComboProduct> {
  const response = await fetch(`${API_URL}/ComboProducts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(comboProduct),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Add combo product error:', errorText);
    throw new Error('Failed to add combo product');
  }
  
  return response.json();
},

async deleteComboProduct(comboId: number, productId: number): Promise<void> {
  const response = await fetch(`${API_URL}/ComboProducts/${comboId}/${productId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Delete combo product error:', errorText);
    throw new Error('Failed to delete combo product');
  }
}
};
