export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    categoryId: number;
    category: any;
    imageId?: number | null;
    isAvailable: boolean;
  }
  