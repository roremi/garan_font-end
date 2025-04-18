import { Product } from "@/types/product";
import { Category } from "@/types/Category";
import { ComboCategory } from "@/types/ComboCategory";
import {Cart, CartItem} from "@/types/cart"
import { OrderCreateRequest, OrderResponse, OrderDetailResponse } from "@/types/order";
import { ImageUploadResponse } from "@/types/image";
import { Combo, ComboProduct } from '@/types/combo';
import { Feedback } from "@/types/feedback";
import {Voucher} from '@/types/voucher';


const API_URL = "https://localhost:5001/api";
const API_URL1 = "https://localhost:5000/api";

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
  async createOrder(orderData: OrderCreateRequest): Promise<{message: string, status: number, data: OrderResponse}> {
    const response = await fetch(`${API_URL}/Order/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData)
    });
  
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create order');
    }
  
    return response.json();
  },
  async getAllOrders() {
    try {
      const response = await fetch(`${API_URL}/Order/all`, {
        headers: getHeaders() // Thêm headers nếu cần
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const text = await response.text(); // Đọc response dưới dạng text trước
  
      // Kiểm tra xem response có rỗng không
      if (!text) {
        throw new Error('Empty response received');
      }
  
      try {
        const data = JSON.parse(text); // Parse text thành JSON
        
        if (!data.status || data.status !== 200) {
          throw new Error(data.message || "Failed to fetch orders");
        }
  
        return {
          status: 200,
          data: data.data || [] // Đảm bảo luôn trả về mảng, ngay cả khi rỗng
        };
  
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response Text:', text);
        throw new Error('Invalid JSON response');
      }
  
    } catch (error) {
      console.error('Error in getAllOrders:', error);
      return {
        status: 500,
        data: []
      };
    }
  },

async getOrderById(orderId: number): Promise<OrderResponse> {
  const response = await fetch(`${API_URL}/Order/${orderId}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order details');
  }

  return response.json();
},


  async getOrderDetails(orderId: number) {
    try {
      const response = await fetch(`${API_URL}/DetailOrder/getAllByOrder/${orderId}`, {
        headers: getHeaders()
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
  
      const text = await response.text();
      
      if (!text) {
        return {
          status: 200,
          data: []
        };
      }
  
      try {
        const data = JSON.parse(text);
        
        if (!data.status || data.status !== 200) {
          throw new Error(data.message || "Failed to fetch order details");
        }
  
        return {
          status: 200,
          data: data.data || []
        };
  
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response Text:', text);
        throw new Error('Invalid JSON response');
      }
  
    } catch (error) {
      console.error('Error in getOrderDetails:', error);
      return {
        status: 500,
        data: []
      };
    }
  },

  async getOrdersbyUser(userId: number) {
    try {
      const response = await fetch(
        `${API_URL}/Order/getAllOrder?idUser=${userId}`,
        {
          headers: getHeaders() // Thêm headers để đảm bảo xác thực
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Đọc response dưới dạng text trước để kiểm tra
      const text = await response.text();
      
      // Kiểm tra xem response có rỗng không
      if (!text) {
        console.log('Empty response received from getOrdersbyUser');
        return [];
      }
      
      try {
        // Parse text thành JSON
        const data = JSON.parse(text);
        
        if (!data.status || data.status !== 200) {
          throw new Error(data.message || "Failed to fetch orders");
        }
        
        // Đảm bảo data.data tồn tại, nếu không thì trả về mảng rỗng
        return data.data || [];
        
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response Text:', text);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('Error in getOrdersbyUser:', error);
      // Trả về mảng rỗng thay vì ném lỗi để tránh làm hỏng UI
      return [];
    }
  },
  

  async confirmOrder(orderId: number, status: number) {
    try {
      const response = await fetch(
        `${API_URL}/Order/confirmOrder?idOrder=${orderId}&status=${status}`,
        {
          headers: getHeaders() // Thêm headers nếu cần
        }
      );
      
      // Đọc response dưới dạng text trước
      const text = await response.text();
      
      // Kiểm tra xem response có rỗng không
      if (!text) {
        return {
          status: response.status,
          message: "No response data",
          data: null
        };
      }
      
      // Parse text thành JSON
      try {
        const data = JSON.parse(text);
        
        if (!data.status || data.status !== 200) {
          throw new Error(data.message || "Failed to confirm order");
        }
        
        return data;
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response Text:', text);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('Error in confirmOrder:', error);
      throw error;
    }
  },
  // Thêm vào object api trong services/api.ts (thêm vào cuối trước dấu ngoặc nhọn đóng)

// Lấy trạng thái đơn hàng
async getOrderStatus(orderId: number): Promise<{status: string}> {
  const response = await fetch(`${API_URL}/Order/${orderId}/status`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to get order status');
  }

  return response.json();
},

// Hủy đơn hàng
async cancelOrder(orderId: number): Promise<{message: string, status: number}> {
  const response = await fetch(`${API_URL}/Order/${orderId}/cancel`, {
    method: 'POST',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to cancel order');
  }

  return response.json();
},


//   // Thêm vào api object trong services/api.ts
// async updateOrder(orderData: OrderCreateRequest): Promise<{message: string, status: number, data: OrderResponse}> {
//   const response = await fetch(`${API_URL}/Order/update`, {
//     method: 'PUT',
//     headers: getHeaders(),
//     body: JSON.stringify(orderData)
//   });

//   if (!response.ok) {
//     const error = await response.text();
//     throw new Error(error || 'Failed to update order');
//   }

//   return response.json();
// },
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

  // Thêm phương thức này vào đối tượng api trong file services/api.ts
getShippingFeeByAddress: async (
  userId: number, 
  addressId: number, 
  subtotal?: number, 
  idVoucherDiscount?: string, 
  idVoucherShipping?: string
) => {
  let url = `${API_URL}/ShipingFee/calculate-by-address?userId=${userId}&addressId=${addressId}`;
  // Thêm các tham số tùy chọn vào URL nếu có
  if (subtotal !== undefined) {
    url += `&subtotal=${subtotal}`;
  }
  if (idVoucherDiscount) {
    url += `&idVoucherDiscount=${idVoucherDiscount}`;
  }
  if (idVoucherShipping) {
    url += `&idVoucherShipping=${idVoucherShipping}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Không thể tính phí vận chuyển');
  }

  return response.json();
},




  //combo
  //ComboCategory
// Lấy tất cả danh mục combo
async getComboCategories(): Promise<ComboCategory[]> {
  try {
    const response = await fetch(`${API_URL}/ComboCategories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching combo categories:", error);
    return [];
  }
},

// Lấy danh mục combo theo id
async getComboCategoryById(id: number): Promise<ComboCategory> {
  const response = await fetch(`${API_URL}/ComboCategories/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch combo category");
  }
  return response.json();
},

// Thêm danh mục combo mới
addComboCategory: async (category: Omit<ComboCategory, "id">): Promise<ComboCategory> => {
  const response = await fetch(`${API_URL}/ComboCategories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) throw new Error("Failed to add combo category");
  return response.json();
},

// Cập nhật danh mục combo
updateComboCategory: async (id: number, category: ComboCategory): Promise<void> => {
  const response = await fetch(`${API_URL}/ComboCategories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) throw new Error("Failed to update combo category");
},



// Xóa danh mục combo
deleteComboCategory: async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/ComboCategories/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete combo category");
  }
},

// Lấy tất cả combo trong một danh mục
async getCombosByCategory(categoryId: number): Promise<Combo[]> {
  const response = await fetch(`${API_URL}/Combos/category/${categoryId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch combos by category");
  }
  return response.json();
},
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
},


// feedback

// Lấy feedback theo product id
async getProductFeedbacks(productId: number): Promise<Feedback[]> {
  const response = await fetch(`${API_URL}/Feedback/Product/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product feedbacks');
  }
  return response.json();
},

// Sửa feedback
async updateFeedback(id: number, feedback: { rating: number; comment: string }): Promise<void> {
  const response = await fetch(`${API_URL}/Feedback/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to update feedback');
  }
},

// Xóa feedback
async deleteFeedback(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/Feedback/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete feedback');
  }
},

// Thêm feedback mới
async addFeedback(feedback: {
  productId: number;
  rating: number;
  comment: string;
}): Promise<Feedback> {
  const response = await fetch(`${API_URL}/Feedback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(feedback)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to add feedback');
  }

  return response.json();
},
// services/api.ts
// Thêm các phương thức sau vào object api hiện có

async getCart(): Promise<Cart> {
  const response = await fetch(`${API_URL}/Cart`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Không thể lấy thông tin giỏ hàng');
  return response.json();
},

async addToCart(itemType: 'Product' | 'Combo', itemId: number, quantity: number): Promise<Cart> {
  const response = await fetch(`${API_URL}/Cart/items`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ itemType, itemId, quantity }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Không thể thêm vào giỏ hàng');
  }
  return response.json();
},

async updateCartItem(cartItemId: number, quantity: number): Promise<Cart> {
  const response = await fetch(`${API_URL}/Cart/items`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ cartItemId, quantity }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Không thể cập nhật giỏ hàng');
  }
  return response.json();
},

async removeCartItem(cartItemId: number): Promise<boolean> {
  const response = await fetch(`${API_URL}/Cart/items`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ cartItemId }),
  });
  if (!response.ok) throw new Error('Không thể xóa sản phẩm khỏi giỏ hàng');
  return response.json();
},

async clearCart(): Promise<boolean> {
  const response = await fetch(`${API_URL}/Cart`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Không thể xóa giỏ hàng');
  return response.json();
},

// Voucher APIs
getVouchers: async (): Promise<Voucher[]> => {
  const response = await fetch(`${API_URL}/Voucher/all`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách voucher');
  }

  return response.json();
},
getVouchersAvailable: async (): Promise<Voucher[]> => {
  const response = await fetch(`${API_URL}/Voucher/available`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách voucher');
  }

  return response.json();
},
addVoucher: async (voucher: Omit<Voucher, 'id'>): Promise<Voucher> => {
  const response = await fetch(`${API_URL}/Voucher`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(voucher)
  });

  if (!response.ok) {
    throw new Error('Không thể thêm voucher');
  }

  return response.json();
},

updateVoucher: async (id: string, voucher: Voucher): Promise<void> => {
  const response = await fetch(`${API_URL}/Voucher/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(voucher)
  });

  if (!response.ok) {
    throw new Error('Không thể cập nhật voucher');
  }
},

deleteVoucher: async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/Voucher/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Không thể xóa voucher');
  }
}, 

//uservoucher
getUserVouchers: async (userId: number) => {
  const response = await fetch(`${API_URL}/UserVoucher/user/${userId}`);
  if (!response.ok) throw new Error("Không thể lấy voucher đã lưu");
  return response.json();
},

saveUserVoucher: async (userId: number, voucherId: string) => {
  const response = await fetch(`${API_URL}/UserVoucher/save?userId=${userId}&voucherId=${voucherId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error("Không thể lưu voucher");
  return response.json();
},

//getUserAddress
getUserAddress: async (userId: number) => {
  const response = await fetch(`${API_URL}/UserAddress/by-user/${userId}`);
  if (!response.ok) throw new Error("Không thể lấy các địa chỉ người dùng");
  return response.json();
},


};
