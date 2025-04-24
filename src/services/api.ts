import { Product } from "@/types/product";
import { Category } from "@/types/Category";
import { ComboCategory } from "@/types/ComboCategory";
import { Cart, CartItem } from "@/types/cart";
import { OrderCreateRequest, OrderResponse, OrderDetailResponse } from "@/types/order";
import { ImageUploadResponse } from "@/types/image";
import { Combo, ComboProduct } from '@/types/combo';
import { Feedback } from "@/types/feedback";
import { Voucher } from '@/types/voucher';

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
export interface SpinReward {
  id: number;
  name: string;
  value: number;
  probability: number;
  isActive: boolean;
}
// Define GiftPoint interface
interface GiftPoint {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  points: number;
  spinCount: number;
  rank: string;
  lastUpdated: string;
}

export const api = {
  // lấy tất cả sản phẩm
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/Products`);
    if (!response.ok) {
      throw new Error("Không thể lấy sản phẩm");
    }
    return response.json();
  },

  // lấy sản phẩm theo id
  async getProductById(id: number): Promise<Product> {
    const response = await fetch(`${API_URL}/Products/${id}`);
    if (!response.ok) {
      throw new Error("Không thể lấy sản phẩm");
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
      throw new Error(error || "Không thể thêm sản phẩm");
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
      throw new Error(error || "Không thể cập nhật sản phẩm");
    }
  },

  deleteProduct: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Không thể xóa sản phẩm");
    }
  },

  // lấy tất cả category
  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_URL}/Category`);
      if (!response.ok) {
        throw new Error(`Lỗi HTTP! trạng thái: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
      return [];
    }
  },

  // Lấy category theo id
  async getCategoryById(id: number): Promise<Category> {
    const response = await fetch(`${API_URL}/Category/${id}`);
    if (!response.ok) {
      throw new Error("Không thể lấy danh mục");
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
    if (!response.ok) throw new Error("Không thể thêm danh mục");
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
    if (!response.ok) throw new Error("Không thể cập nhật danh mục");
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
      throw new Error("Không thể xóa danh mục");
    }
  },

  // Lấy tất cả sản phẩm trong một category
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const response = await fetch(`${API_URL}/Category/${categoryId}/products`);
    if (!response.ok) {
      throw new Error("Không thể lấy sản phẩm theo danh mục");
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
      throw new Error(errorText || "Không thể tải lên hình ảnh");
    }

    return response.json();
  },

  // API xóa ảnh
  async deleteImage(imageId: number): Promise<void> {
    const response = await fetch(`${API_URL}/Images/${imageId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Không thể xóa hình ảnh");
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
      throw new Error(error || 'Không thể tạo đơn hàng');
    }
  
    return response.json();
  },

  async getAllOrders() {
    try {
      const response = await fetch(`${API_URL}/Order/all`, {
        headers: getHeaders()
      });
  
      if (!response.ok) {
        throw new Error(`Lỗi HTTP! trạng thái: ${response.status}`);
      }
  
      const text = await response.text();
  
      if (!text) {
        throw new Error('Nhận được phản hồi rỗng');
      }
  
      try {
        const data = JSON.parse(text);
        
        if (!data.status || data.status !== 200) {
          throw new Error(data.message || "Không thể lấy đơn hàng");
        }
  
        return {
          status: 200,
          data: data.data || []
        };
  
      } catch (parseError) {
        console.error('Lỗi phân tích JSON:', parseError);
        console.error('Nội dung phản hồi:', text);
        throw new Error('Phản hồi JSON không hợp lệ');
      }
  
    } catch (error) {
      console.error('Lỗi trong getAllOrders:', error);
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
      throw new Error('Không thể lấy chi tiết đơn hàng');
    }

    return response.json();
  },

  async getOrderDetails(orderId: number) {
    try {
      const response = await fetch(`${API_URL}/DetailOrder/getAllByOrder/${orderId}`, {
        headers: getHeaders()
      });
  
      if (!response.ok) {
        throw new Error('Không thể lấy chi tiết đơn hàng');
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
          throw new Error(data.message || "Không thể lấy chi tiết đơn hàng");
        }
  
        return {
          status: 200,
          data: data.data || []
        };
  
      } catch (parseError) {
        console.error('Lỗi phân tích JSON:', parseError);
        console.error('Nội dung phản hồi:', text);
        throw new Error('Phản hồi JSON không hợp lệ');
      }
  
    } catch (error) {
      console.error('Lỗi trong getOrderDetails:', error);
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
          headers: getHeaders()
        }
      );
  
      if (!response.ok) {
        throw new Error(`Lỗi HTTP! trạng thái: ${response.status}`);
      }
  
      const text = await response.text();
      
      if (!text) {
        console.log('Nhận được phản hồi rỗng từ getOrdersbyUser');
        return [];
      }
      
      try {
        const data = JSON.parse(text);
        
        if (!data.status || data.status !== 200) {
          throw new Error(data.message || "Không thể lấy đơn hàng");
        }
        
        return data.data || [];
        
      } catch (parseError) {
        console.error('Lỗi phân tích JSON:', parseError);
        console.error('Nội dung phản hồi:', text);
        throw new Error('Phản hồi JSON không hợp lệ từ server');
      }
    } catch (error) {
      console.error('Lỗi trong getOrdersbyUser:', error);
      return [];
    }
  },

  async confirmOrder(orderId: number, status: number) {
    try {
      const response = await fetch(
        `${API_URL}/Order/confirmOrder?idOrder=${orderId}&status=${status}`,
        {
          headers: getHeaders()
        }
      );
      
      const text = await response.text();
      
      if (!text) {
        return {
          status: response.status,
          message: "Không có dữ liệu phản hồi",
          data: null
        };
      }
      
      try {
        const data = JSON.parse(text);
        
        if (!data.status || data.status !== 200) {
          throw new Error(data.message || "Không thể xác nhận đơn hàng");
        }
        
        return data;
      } catch (parseError) {
        console.error('Lỗi phân tích JSON:', parseError);
        console.error('Nội dung phản hồi:', text);
        throw new Error('Phản hồi JSON không hợp lệ từ server');
      }
    } catch (error) {
      console.error('Lỗi trong confirmOrder:', error);
      throw error;
    }
  },

  // Lấy trạng thái đơn hàng
  async getOrderStatus(orderId: number): Promise<{status: string}> {
    const response = await fetch(`${API_URL}/Order/${orderId}/status`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Không thể lấy trạng thái đơn hàng');
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
      throw new Error('Không thể hủy đơn hàng');
    }

    return response.json();
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
      throw new Error("Không thể kiểm tra giao dịch");
    }

    return response.json();
  },

  // Location
  getProvince: async () => {
    const response = await fetch(`${API_URL}/Location/province`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*'
      },   
    });
  
    if (!response.ok) {
      throw new Error('Không thể lấy danh sách tỉnh/thành');
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
      throw new Error('Không thể lấy danh sách quận/huyện');
    }
  
    return response.json();
  },

  getWards: async (districtId: number) => {
    if (!districtId) {
      throw new Error('Yêu cầu ID quận/huyện');
    }
  
    const response = await fetch(`${API_URL}/Location/wards?district_id=${districtId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*'
      },
    });
  
    if (!response.ok) {
      throw new Error('Không thể lấy danh sách phường/xã');
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

  getShippingFeeByAddress: async (
    userId: number, 
    addressId: number, 
    subtotal?: number, 
    idVoucherDiscount?: string, 
    idVoucherShipping?: string
  ) => {
    let url = `${API_URL}/ShipingFee/calculate-by-address?userId=${userId}&addressId=${addressId}`;
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

  // combo
  // ComboCategory
  async getComboCategories(): Promise<ComboCategory[]> {
    try {
      const response = await fetch(`${API_URL}/ComboCategories`);
      if (!response.ok) {
        throw new Error(`Lỗi HTTP! trạng thái: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error("Lỗi khi lấy danh mục combo:", error);
      return [];
    }
  },

  async getComboCategoryById(id: number): Promise<ComboCategory> {
    const response = await fetch(`${API_URL}/ComboCategories/${id}`);
    if (!response.ok) {
      throw new Error("Không thể lấy danh mục combo");
    }
    return response.json();
  },

  addComboCategory: async (category: Omit<ComboCategory, "id">): Promise<ComboCategory> => {
    const response = await fetch(`${API_URL}/ComboCategories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error("Không thể thêm danh mục combo");
    return response.json();
  },

  updateComboCategory: async (id: number, category: ComboCategory): Promise<void> => {
    const response = await fetch(`${API_URL}/ComboCategories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error("Không thể cập nhật danh mục combo");
  },

  deleteComboCategory: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/ComboCategories/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Không thể xóa danh mục combo");
    }
  },

  async getCombosByCategory(categoryId: number): Promise<Combo[]> {
    const response = await fetch(`${API_URL}/Combos/category/${categoryId}`);
    if (!response.ok) {
      throw new Error("Không thể lấy combo theo danh mục");
    }
    return response.json();
  },

  async getCombos(): Promise<Combo[]> {
    try {
      const response = await fetch(`${API_URL}/Combos`);
      if (!response.ok) {
        throw new Error('Không thể lấy combo');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Lỗi khi lấy combo:', error);
      throw new Error('Không thể lấy combo');
    }
  },

  async getComboById(id: number): Promise<Combo> {
    const response = await fetch(`${API_URL}/Combos/${id}`);
    if (!response.ok) {
      throw new Error('Không thể lấy combo');
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
    if (!response.ok) throw new Error('Không thể thêm combo');
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
      console.error('Lỗi cập nhật combo:', errorText);
      throw new Error('Không thể cập nhật combo');
    }
  },

  async deleteCombo(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/Combos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Không thể xóa combo');
  },

  // API calls cho ComboProducts
  async getComboProducts(): Promise<ComboProduct[]> {
    const response = await fetch(`${API_URL}/ComboProducts`);
    if (!response.ok) {
      throw new Error('Không thể lấy sản phẩm combo');
    }
    return response.json();
  },

  async getComboProductsByComboId(comboId: number): Promise<ComboProduct[]> {
    const response = await fetch(`${API_URL}/ComboProducts/combo/${comboId}`);
    if (!response.ok) {
      throw new Error('Không thể lấy sản phẩm combo');
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
      console.error('Lỗi thêm sản phẩm combo:', errorText);
      throw new Error('Không thể thêm sản phẩm combo');
    }
    
    return response.json();
  },

  async deleteComboProduct(comboId: number, productId: number): Promise<void> {
    const response = await fetch(`${API_URL}/ComboProducts/${comboId}/${productId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lỗi xóa sản phẩm combo:', errorText);
      throw new Error('Không thể xóa sản phẩm combo');
    }
  },

  // feedback
  async getProductFeedbacks(productId: number): Promise<Feedback[]> {
    const response = await fetch(`${API_URL}/Feedback/Product/${productId}`);
    if (!response.ok) {
      throw new Error('Không thể lấy phản hồi sản phẩm');
    }
    return response.json();
  },

  async updateFeedback(id: number, feedback: { rating: number; comment: string }): Promise<void> {
    const response = await fetch(`${API_URL}/Feedback/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Không thể cập nhật phản hồi');
    }
  },

  async deleteFeedback(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/Feedback/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Không thể xóa phản hồi');
    }
  },

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
      throw new Error(error || 'Không thể thêm phản hồi');
    }

    return response.json();
  },

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

  // uservoucher
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

  // getUserAddress
  getUserAddress: async (userId: number) => {
    const response = await fetch(`${API_URL}/UserAddress/by-user/${userId}`);
    if (!response.ok) throw new Error("Không thể lấy các địa chỉ người dùng");
    return response.json();
  },

  async getSpinRewards(): Promise<{ id: number; name: string; value: number; isActive: boolean; probability: number; }[]> {
    const response = await fetch(`${API_URL}/SpinReward`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Không thể lấy phần thưởng quay');
    }

    return response.json();
  },

  async getUserPoints(userId: number): Promise<GiftPoint> {
    try {
      const response = await fetch(`${API_URL}/GiftPoint/${userId}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error(`Lỗi HTTP! trạng thái: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Lỗi khi lấy điểm quà tặng:", error);
      throw error;
    }
  },

  // Sử dụng lượt quay và nhận GiftPoint sau khi quay
useSpin: async (userId: number): Promise<GiftPoint> => {
  const response = await fetch(`${API_URL}/GiftPoint/${userId}/use-spin`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể sử dụng lượt quay');
  }

  return response.json();
},

addPoints: async (userId: number, points: number): Promise<GiftPoint> => {
  const response = await fetch(`${API_URL}/GiftPoint/${userId}/add-points`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(points) // Gửi trực tiếp số điểm (kiểu int)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể cộng điểm');
  }

  return response.json(); // Trả về GiftPointDTO mới
},

// SPIN REWARD APIs
addSpinReward: async (reward: Omit<SpinReward, 'id'>): Promise<SpinReward> => {
  const response = await fetch(`${API_URL}/SpinReward`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reward),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể thêm phần thưởng');
  }
  return response.json();
},

updateSpinReward: async (id: number, reward: SpinReward): Promise<SpinReward> => {
  const response = await fetch(`${API_URL}/SpinReward/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(reward),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể cập nhật phần thưởng');
  }
  return response.json();
},

deleteSpinReward: async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/SpinReward/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể xóa phần thưởng');
  }
},

getSpinProbabilitySummary: async (): Promise<any> => {
  const response = await fetch(`${API_URL}/SpinReward/probability-summary`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Không thể lấy thống kê xác suất');
  }
  return response.json();
},

updateSpinProbabilities: async (updates: { id: number; probability: number }[]): Promise<void> => {
  const response = await fetch(`${API_URL}/SpinReward/update-probabilities`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể cập nhật xác suất');
  }
},

// GIFT POINT APIs bổ sung thêm
addSpinCount: async (userId: number, spins: number): Promise<GiftPoint> => {
  const response = await fetch(`${API_URL}/GiftPoint/${userId}/add-spin`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(spins)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể thêm lượt quay');
  }

  return response.json();
},

useGiftPoints: async (userId: number, points: number): Promise<GiftPoint> => {
  const response = await fetch(`${API_URL}/GiftPoint/${userId}/use-points`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(points),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể sử dụng điểm');
  }

  return response.json();
},

getSpinHistory: async (userId: number): Promise<any[]> => {
  const response = await fetch(`${API_URL}/GiftPoint/${userId}/spin-history`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Không thể lấy lịch sử quay');
  }

  return response.json();
},

performSpin: async (userId: number): Promise<{ GiftPoint: GiftPoint, Reward: SpinReward }> => {
  const response = await fetch(`${API_URL}/GiftPoint/${userId}/spin`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể thực hiện quay thưởng');
  }

  return response.json();
},

getAllGiftPoints: async (): Promise<GiftPoint[]> => {
  const response = await fetch(`${API_URL}/GiftPoint/all`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Không thể lấy danh sách điểm thưởng');
  }

  return response.json();
}


};