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
 * Định dạng thời gian đếm SLA (phút trước)
 */
export function formatMinutesAgo(date: Date | string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  return `${minutes} phút trước`;
}

/**
 * Rút gọn chuỗi văn bản nếu quá dài
 */
export function truncateText(text: string, maxLength: number = 40): string {
  if (!text || text.length <= maxLength) return text || "";
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Chuyển đổi tên có dấu tiếng Việt thành slug URL
 */
export function slugifyVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
