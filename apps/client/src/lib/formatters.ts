/**
 * Định dạng tiền tệ Việt Nam (VND)
 * Ví dụ: 120000 -> "120.000 đ"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Định dạng thời gian đếm SLA (phút:giây)
 */
export function formatMinutesAgo(date: Date | string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  return `${minutes} phút trước`;
}
