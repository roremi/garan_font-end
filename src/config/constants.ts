export const CURRENCY_RATE = 23000; // 1 USD = 23,000 VND

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price * CURRENCY_RATE);
};
