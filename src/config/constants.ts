export const formatPrice = (price: number): string => {
  // Đảm bảo price là số
  const numericPrice = Number(price);
  
  // Kiểm tra nếu không phải số hợp lệ
  if (isNaN(numericPrice)) {
    return '0 ₫';
  }

  // Format số theo định dạng tiền tệ Việt Nam
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericPrice);
};
