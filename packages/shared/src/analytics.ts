/**
 * ĐỊNH NGHĨA DỮ LIỆU LANDING PAGE & BÁO CÁO THỐNG KÊ DOANH SỐ ĐA CHIỀU (F&B)
 */

export interface StoreLandingPageData {
  storeId: string;
  storeName: string;
  customDomain?: string;
  slug: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroBannerUrl?: string;
  storyContent?: string;
  openingHours: string;
  hotline?: string;
  address?: string;
  googleMapsUrl?: string;
  facebookUrl?: string;
  zaloPhone?: string;
  isBookingOpen: boolean;
  isPublished: boolean;
  publicMenuCategories: {
    name: string;
    items: {
      id: string;
      name: string;
      price: number;
      image?: string;
      description?: string;
    }[];
  }[];
}

/**
 * Phân loại Ma Trận Kỹ Thuật Menu (Menu Engineering Matrix)
 */
export enum MenuCategoryType {
  STARS = "STARS",             // 🌟 Lãi cao, Bán chạy
  PLOWHORSES = "PLOWHORSES",   // 🐎 Lãi thấp, Bán chạy
  PUZZLES = "PUZZLES",         // ❓ Lãi cao, Bán ế
  DOGS = "DOGS",               // 🐶 Lãi thấp, Bán ế
}

export interface MenuItemAnalytics {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  marginPercent: number;
  totalSold: number;
  revenue: number;
  categoryType: MenuCategoryType;
  advice: string;
}

export interface HourlyPeakData {
  hourLabel: string; // "11:00", "12:00", v.v.
  revenue: number;
  orderCount: number;
  isPeak: boolean;
}

export interface PaymentBreakdown {
  method: "CASH" | "VIETQR" | "CARD";
  label: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface DeepAnalyticsReport {
  period: "today" | "week" | "month";
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number; // AOV
    discountLossTotal: number; // Thất thoát chiết khấu
    canceledItemCount: number; // Số món hủy
  };
  hourlyHeatmap: HourlyPeakData[];
  paymentDistribution: PaymentBreakdown[];
  menuMatrix: {
    stars: MenuItemAnalytics[];
    plowhorses: MenuItemAnalytics[];
    puzzles: MenuItemAnalytics[];
    dogs: MenuItemAnalytics[];
  };
}
