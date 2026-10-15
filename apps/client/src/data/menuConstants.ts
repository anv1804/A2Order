/**
 * Danh mục món chuẩn hóa đồng bộ với Admin Platform
 */
export const CATEGORY_NAMES: Record<string, string> = {
  PHO: "Phở & Bún",
  COM: "Cơm & Đồ Ăn Kèm",
  DRINK: "Đồ Uống & Trà Sữa",
  LAU: "Lẩu & Nướng",
  KHAI_VI: "Khai Vị & Ăn Vặt",
  OTHER: "Khác",
};

export const QUICK_NOTES: string[] = [
  "Không hành",
  "Nhiều nước béo",
  "Ít cay",
  "Cay nhiều",
  "Ít đá",
  "Để riêng nước dùng",
];

export const ORDER_MODAL_CATEGORIES = [
  { id: "ALL", label: "Tất Cả Món" },
  { id: "PHO_BUN", label: "Phở & Bún" },
  { id: "NUONG_LAU", label: "Lẩu & Nướng" },
  { id: "KHAI_VI", label: "Khai Vị" },
  { id: "DOUONG", label: "Đồ Uống" },
] as const;

