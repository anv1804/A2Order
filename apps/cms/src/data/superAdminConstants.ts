import { BusinessType } from "@a2order/shared";
import { IconName } from "@/types";

export const BUSINESS_TYPE_ICONS: Record<BusinessType, IconName> = {
  RESTAURANT: "utensils",
  BEER_GARDEN: "beer",
  SNACK_SHOP: "cookie",
  BUBBLE_TEA: "cup",
  COFFEE_SHOP: "coffee",
  SPICY_NOODLE: "flame",
  JUICE_BAR: "cup",
  OTHER: "settings",

};

export const STORE_ROLES = [
  { value: "STORE_OWNER", label: "Chủ Quán (Toàn quyền)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "STORE_MANAGER", label: "Quản Lý Điểm Bán", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "CASHIER", label: "Thu Ngân (POS Bán Hàng)", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "CHEF", label: "Đầu Bếp (Màn KDS Bếp)", color: "text-purple-700 bg-purple-50 border-purple-200" },
  { value: "WAITER", label: "Nhân Viên Phục Vụ", color: "text-slate-700 bg-slate-100 border-slate-200" },
] as const;
