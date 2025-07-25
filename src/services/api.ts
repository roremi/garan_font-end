import { Product } from "@/types/product";
import { Category } from "@/types/Category";
import { ComboCategory } from "@/types/ComboCategory";
import {Cart, CartItem} from "@/types/cart"
import { OrderCreateRequest, OrderResponse, OrderDetailResponse } from "@/types/order";
import { ImageUploadResponse } from "@/types/image";
import { Combo, ComboProduct } from '@/types/combo';
import { Feedback } from "@/types/feedback";
import {Voucher} from '@/types/voucher';
import {ShippingConfiguration} from '@/types/shipping'; 

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
  const errorJson = await response.json();
  throw {
    message: errorJson.message || "Failed to create order",
    status: response.status
    };
  }
  return response.json(); // ✅ OK
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
        `${API_URL}/Order/getAllOrderbyUser?idUser=${userId}`,
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

 async CancelOrderbyUser(orderId: number) {
    try {
      const response = await fetch(
        `${API_URL}/Order/${orderId}/cancel`,
        {
          method: 'PUT', 
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
      console.error('Error in CancelOrderByUser:', error);
      throw error;
    }
  },

   async CancelOrderbyInternalUser(orderId: number) {
    try {
      const response = await fetch(
        `${API_URL}/Order/${orderId}/cancel2`,
        {
          method: 'PUT', 
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
      console.error('Error in CancelOrderByUser:', error);
      throw error;
    }
  },

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
    const response = await fetch(`${API_URL}/Location/provinces`, {
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

  getDistricts: async (provinceId: number) => {
  const response = await fetch(`${API_URL}/Location/districts/${provinceId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      accept: '*/*'
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get districts');
  }

  return response.json(); // Trả về danh sách districts từ open-api.vn
},

getWards: async (districtId: number) => {
  const response = await fetch(`${API_URL}/Location/wards/${districtId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      accept: '*/*'
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get wards');
  }

  return response.json(); // Trả về danh sách wards từ open-api.vn
},

  // SHIPPING FEE API
calculateShippingFeeByAddress: async (
  userId: number,
  addressId: number,
  subtotal: number,
  idVoucherDiscount?: string,
  idVoucherShipping?: string
) => {
  const address = await api.getUserAddress(userId, addressId);
  if (!address || !address.latitude || !address.longitude) {
    throw new Error("Không thể lấy tọa độ từ địa chỉ.");
  }

  const body = {
    userId,
    latitude: address.latitude,
    longitude: address.longitude,
    subtotal,
    idVoucherDiscount: idVoucherDiscount ? parseInt(idVoucherDiscount) : undefined,
    idVoucherShipping: idVoucherShipping ? parseInt(idVoucherShipping) : undefined,
  };

  const response = await fetch(`${API_URL}/ShipingFee/shipping-fee-with-voucher`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Không thể tính phí vận chuyển');
  }

  return response.json(); // Trả về full thông tin: phí ship, giảm giá, lỗi voucher...
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

saveUserVoucher: async (userId: number, voucherId?: string, voucherCode?: string) => {
  const body: any = { userId };
  
  if (voucherId) {
    body.voucherId = parseInt(voucherId);
  } else if (voucherCode) {
    body.voucherCode = voucherCode;
  } else {
    throw new Error("Phải cung cấp voucherId hoặc voucherCode");
  }

  const response = await fetch(`${API_URL}/UserVoucher/save`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Không thể lưu voucher");
  }
  
  return response.json();
},

//getUserAddress
getUserAddress: async (userId: number, addressId: number) => {
  const response = await fetch(`${API_URL}/UserAddress/${userId}/${addressId}`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Không thể lấy thông tin địa chỉ');
  }

  return await response.json();
},



// Thống kê doanh thu theo ngày
getDailyRevenue: async (fromDate: string, toDate: string) => {
  const response = await fetch(`${API_URL}/Dashboard/daily-revenue?fromDate=${fromDate}&toDate=${toDate}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy dữ liệu doanh thu theo ngày');
  return response.json();
},
getDailyRevenueTable: async (from: string, to: string) => {
  const response = await fetch(`${API_URL}/dashboard/daily-revenue-table?fromDate=${from}&toDate=${to}`);
  return await response.json();
},


// Sản phẩm bán chạy
getBestSellingProducts: async (fromDate: string, toDate: string) => {
  const response = await fetch(`${API_URL}/Dashboard/best-selling-items?fromDate=${fromDate}&toDate=${toDate}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy sản phẩm bán chạy');
  return response.json();
},
getBestSellersTable: async (from: string, to: string) => {
  const response = await fetch(`${API_URL}/dashboard/best-selling-products-table?fromDate=${from}&toDate=${to}`);
  if (!response.ok) throw new Error('Không thể lấy bảng sản phẩm bán chạy');
  return await response.json();
},


// Trạng thái đơn hàng
getOrderStatusStatistics: async (fromDate: string, toDate: string) => {
  const response = await fetch(`${API_URL}/Dashboard/order-status-statistics?fromDate=${fromDate}&toDate=${toDate}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy thống kê trạng thái đơn hàng');
  return response.json();
},
getOrderStatusTable: async (from: string, to: string) => {
  const response = await fetch(`${API_URL}/dashboard/order-status-table?fromDate=${from}&toDate=${to}`);
  if (!response.ok) throw new Error('Không thể lấy bảng trạng thái đơn hàng');
  return await response.json();
},

// Lấy Google Maps API key
getGoogleMapsApiKey: async () => {
  const response = await fetch(`${API_URL}/Location/google-maps-api-key`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Không thể lấy Google Maps API key');
  }

  return response.json();
},

//shipping
// Lấy cấu hình phí ship
// Lấy danh sách cấu hình phí vận chuyển
getShippingConfigs: async () => {
  const response = await fetch(`${API_URL}/ShippingConfig`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Không thể tải danh sách cấu hình phí ship');
  return response.json();
},

// Cập nhật cấu hình phí ship theo key
updateShippingConfig: async (key: string, value: string) => {
  const response = await fetch(`${API_URL}/ShippingConfig/${key}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(value),
  });
  if (!response.ok) throw new Error('Không thể cập nhật cấu hình');
  return response.json();
},

// lấy vị trí tài xế 
getDriverLocation: async (orderId: number): Promise<{
  latitude: number;
  longitude: number;
  updatedAt: string;
}> => {
  const response = await fetch(`${API_URL}/driver/order-tracking/${orderId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Không thể lấy vị trí tài xế");
  }

  const result = await response.json();

  if (result.status !== 200 || !result.data) {
    throw new Error(result.message || "Không có dữ liệu vị trí tài xế");
  }

  return result.data;
},
// Lấy danh sách quyền của user
getUserPermissions: async (userId: number): Promise<{ id: number, username: string, permissions: string[] }> => {
  const res = await fetch(`${API_URL}/admin/user-permissions/${userId}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Không thể tải quyền người dùng');
  return res.json();
},

// Gán lại quyền cho user
assignPermissionsToUser: async (userId: number, permissionNames: string[]): Promise<{ message: string }> => {
  const res = await fetch(`${API_URL}/admin/user-permissions/${userId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(permissionNames)
  });
  if (!res.ok) throw new Error('Không thể cập nhật quyền');
  return res.json();
},
getAllUserProfiles: async (): Promise<{ id: number, username: string, fullName: string, role: number }[]> => {
  const res = await fetch(`${API_URL}/User/all-profiles`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Không thể tải danh sách người dùng');
  return res.json();
},

getUserProfile: async () => {
  const response = await fetch(`https://localhost:5001/api/User/profile`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('app_token')?.replace(/^"(.*)"$/, '$1')}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Không thể lấy thông tin người dùng');
  }

  return response.json();
},
// Dashboard Campaign APIs
getCampaignOverview: async () => {
  const response = await fetch(`${API_URL}/admin/dashboard/campaign-overview`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy thống kê dashboard campaign');
  return response.json();
},

getRecentActivities: async () => {
  const response = await fetch(`${API_URL}/admin/dashboard/recent-activities`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy hoạt động gần đây');
  return response.json();
},

// Admin Campaign APIs
// Lấy danh sách tất cả campaigns
getAdminCampaigns: async () => {
  const response = await fetch(`${API_URL}/admin/campaigns`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy danh sách campaigns');
  return response.json();
},

// Lấy campaign theo ID
getAdminCampaignById: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy thông tin campaign');
  return response.json();
},

// Tạo campaign mới
createAdminCampaign: async (campaignData: {
  name: string;
  subject: string;
  content: string;
  targetSegment: string;
}) => {
  const response = await fetch(`${API_URL}/admin/campaigns`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(campaignData)
  });
  if (!response.ok) throw new Error('Không thể tạo campaign');
  return response.json();
},

// Cập nhật campaign
updateAdminCampaign: async (id: number, campaignData: {
  name: string;
  subject: string;
  content: string;
  targetSegment: string;
}) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(campaignData)
  });
  if (!response.ok) throw new Error('Không thể cập nhật campaign');
  return response.json();
},

// Xóa campaign
deleteAdminCampaign: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể xóa campaign');
  return response.json();
},

// Gửi campaign ngay lập tức
sendCampaignNow: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}/send`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể gửi campaign');
  return response.json();
},

// Gửi campaign với AI enhancement
sendCampaignWithAI: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}/send-with-ai`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể gửi campaign với AI');
  return response.json();
},

// Preview AI content cho campaign
previewCampaignAI: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}/preview-ai`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể tạo AI preview');
  return response.json();
},

// Tối ưu hóa campaign với AI
optimizeCampaignWithAI: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}/optimize-with-ai`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể tối ưu hóa campaign với AI');
  return response.json();
},

// Lập lịch gửi campaign
scheduleCampaign: async (id: number, scheduleTime: string) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}/schedule`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ scheduleTime })
  });
  if (!response.ok) throw new Error('Không thể lập lịch campaign');
  return response.json();
},

// Lấy thống kê tracking campaign
getCampaignTracking: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/campaigns/${id}/tracking`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy thống kê campaign');
  return response.json();
},

// Lấy thống kê tổng quan campaigns
getCampaignStatistics: async () => {
  const response = await fetch(`${API_URL}/admin/campaigns/statistics`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy thống kê campaigns');
  return response.json();
},

// Kiểm tra trạng thái AI service
getCampaignAIStatus: async () => {
  const response = await fetch(`${API_URL}/admin/campaigns/ai-status`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể kiểm tra trạng thái AI');
  return response.json();
},

// Test nhanh AI service
quickTestCampaignAI: async () => {
  const response = await fetch(`${API_URL}/admin/campaigns/ai-quick-test`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể test AI service');
  return response.json();
},

// Lấy AI insights và recommendations
getCampaignAIInsights: async () => {
  const response = await fetch(`${API_URL}/admin/campaigns/ai-insights`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy AI insights');
  return response.json();
},
// Customer Segments APIs
// Lấy danh sách tất cả phân khúc khách hàng
getCustomerSegments: async () => {
  const response = await fetch(`${API_URL}/admin/customer-segments`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy danh sách phân khúc khách hàng');
  return response.json();
},

// Cập nhật tự động tất cả phân khúc khách hàng
autoUpdateAllSegments: async () => {
  const response = await fetch(`${API_URL}/admin/customer-segments/auto-update`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể cập nhật tự động phân khúc khách hàng');
  return response.json();
},

// Cập nhật tự động phân khúc cho một khách hàng
autoUpdateUserSegment: async (userId: number) => {
  const response = await fetch(`${API_URL}/admin/customer-segments/auto-update/${userId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể cập nhật phân khúc khách hàng');
  return response.json();
},

// Preview phân khúc cho một khách hàng
previewUserSegment: async (userId: number) => {
  const response = await fetch(`${API_URL}/admin/customer-segments/preview/${userId}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy preview phân khúc khách hàng');
  return response.json();
},

// Preview tất cả phân khúc khách hàng
previewAllSegments: async () => {
  const response = await fetch(`${API_URL}/admin/customer-segments/preview-all`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy preview tất cả phân khúc');
  return response.json();
},

// Lấy thống kê phân khúc khách hàng
getSegmentationStats: async () => {
  const response = await fetch(`${API_URL}/admin/customer-segments/stats`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy thống kê phân khúc');
  return response.json();
},

// Tạo hoặc cập nhật phân khúc khách hàng (manual)
createCustomerSegment: async (segmentData: {
  userId: number;
  segment: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string;
}) => {
  const response = await fetch(`${API_URL}/admin/customer-segments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(segmentData)
  });
  if (!response.ok) throw new Error('Không thể tạo phân khúc khách hàng');
  return response.json();
},

// Segmentation Rules APIs
// Lấy danh sách tất cả quy tắc phân khúc
getSegmentationRules: async () => {
  const response = await fetch(`${API_URL}/admin/segmentation-rules`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy danh sách quy tắc phân khúc');
  return response.json();
},

// Lấy quy tắc phân khúc theo ID
getSegmentationRuleById: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/segmentation-rules/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể lấy thông tin quy tắc phân khúc');
  return response.json();
},

// Tạo quy tắc phân khúc mới
createSegmentationRule: async (ruleData: {
  name: string;
  segmentType: string;
  conditions: any;
  priority: number;
  isActive: boolean;
}) => {
  const response = await fetch(`${API_URL}/admin/segmentation-rules`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(ruleData)
  });
  if (!response.ok) throw new Error('Không thể tạo quy tắc phân khúc');
  return response.json();
},

// Cập nhật quy tắc phân khúc
updateSegmentationRule: async (id: number, ruleData: {
  name: string;
  segmentType: string;
  conditions: any;
  priority: number;
  isActive: boolean;
}) => {
  const response = await fetch(`${API_URL}/admin/segmentation-rules/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(ruleData)
  });
  if (!response.ok) throw new Error('Không thể cập nhật quy tắc phân khúc');
  return response.json();
},

// Xóa quy tắc phân khúc
deleteSegmentationRule: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/segmentation-rules/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể xóa quy tắc phân khúc');
  return response.json();
},

// Bật/tắt trạng thái quy tắc phân khúc
toggleSegmentationRuleStatus: async (id: number) => {
  const response = await fetch(`${API_URL}/admin/segmentation-rules/${id}/toggle`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể thay đổi trạng thái quy tắc phân khúc');
  return response.json();
},

// Tạo quy tắc mặc định
seedDefaultSegmentationRules: async () => {
  const response = await fetch(`${API_URL}/admin/segmentation-rules/seed-default`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Không thể tạo quy tắc mặc định');
  return response.json();
},

};
