// types/combo.ts
export interface ComboProduct {
    comboId: number;
    productId: number;
    quantity: number;
    productName: string;
  }
  
  export interface Combo {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
    createAt: string;
    idUser?: number;
    comboProducts: ComboProduct[];
  }
  