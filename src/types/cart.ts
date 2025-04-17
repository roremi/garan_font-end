// types/cart.ts
export interface CartItem {
    id: number;
    cartId: number;
    itemType: 'Product' | 'Combo';
    itemId: number;
    quantity: number;
    price: number;
    name: string;
    imageUrl: string;
    totalPrice: number;
  }
  
  export interface Cart {
    id: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
    cartItems: CartItem[];
    total: number;
    subtotal: number;
  }
  