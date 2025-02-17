import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// hooks/useCart.ts
export interface CartItem {
    id: number;
    name: string;
    price: number;
    imageUrl: string; // Đổi từ image thành imageUrl
    quantity: number;
  }
  

interface CartStore {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (item: CartItem) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          
          if (existingItem) {
            // Nếu item đã tồn tại, tăng số lượng
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          
          // Nếu item chưa tồn tại, thêm mới
          return {
            items: [...state.items, item],
          };
        });
      },
      
      removeFromCart: (itemId: number) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },
      
      updateQuantity: (itemId: number, quantity: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        const state = get();
        return state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage', // tên unique cho localStorage key
    }
  )
);
