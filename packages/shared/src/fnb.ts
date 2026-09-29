import { AppModule } from "./license.js";

// ==========================================
// 1. CÁC MÔ HÌNH KINH DOANH F&B (BUSINESS TYPES)
// ==========================================
export type BusinessType =
  | "RESTAURANT"
  | "BEER_GARDEN"
  | "SNACK_SHOP"
  | "BUBBLE_TEA"
  | "COFFEE_SHOP"
  | "SPICY_NOODLE"
  | "JUICE_BAR"
  | "OTHER";

export const BUSINESS_TYPE_CONFIG: Record<
  BusinessType,
  { label: string; emoji: string; description: string; suggestedModules: AppModule[] }
> = {
  RESTAURANT: {
    label: "Nhà Hàng Lớn",
    emoji: "🍽️",
    description: "Phục vụ tại bàn, đặt trước, nhiều phòng VIP",
    suggestedModules: [
      AppModule.CORE_POS,
      AppModule.MODULE_KDS,
      AppModule.MODULE_QR_ORDER,
      AppModule.MODULE_ADVANCED_ANALYTICS,
      AppModule.MODULE_LANDING_PAGE,
      AppModule.MODULE_ACCOUNTING,
    ],
  },
  BEER_GARDEN: {
    label: "Quán Nhậu / Bia Hơi",
    emoji: "🍺",
    description: "Bàn đông, gọi món nhanh, vòng quay cao",
    suggestedModules: [AppModule.CORE_POS, AppModule.MODULE_KDS, AppModule.MODULE_QR_ORDER],
  },
  SNACK_SHOP: {
    label: "Quán Ăn Vặt",
    emoji: "🧆",
    description: "Phục vụ nhanh, ít bàn, menu đơn giản",
    suggestedModules: [AppModule.CORE_POS, AppModule.MODULE_QR_ORDER],
  },
  BUBBLE_TEA: {
    label: "Trà Sữa / Topping",
    emoji: "🧋",
    description: "Bán theo ly, nhiều topping, take-away",
    suggestedModules: [AppModule.CORE_POS, AppModule.MODULE_QR_ORDER, AppModule.MODULE_LANDING_PAGE],
  },
  COFFEE_SHOP: {
    label: "Quán Cà Phê",
    emoji: "☕",
    description: "Không gian, làm việc, check-in, khách quen",
    suggestedModules: [
      AppModule.CORE_POS,
      AppModule.MODULE_QR_ORDER,
      AppModule.MODULE_LANDING_PAGE,
      AppModule.MODULE_ADVANCED_ANALYTICS,
    ],
  },
  SPICY_NOODLE: {
    label: "Mì Cay / Bún / Phở",
    emoji: "🍜",
    description: "Bếp bận, cần KDS, phục vụ nhanh",
    suggestedModules: [AppModule.CORE_POS, AppModule.MODULE_KDS, AppModule.MODULE_QR_ORDER],
  },
  JUICE_BAR: {
    label: "Nước Ép / Sinh Tố",
    emoji: "🥤",
    description: "Đơn giản, take-away, mùa vụ",
    suggestedModules: [AppModule.CORE_POS, AppModule.MODULE_QR_ORDER],
  },
  OTHER: {
    label: "Loại Hình Khác",
    emoji: "🏪",
    description: "Tự cấu hình module phù hợp",
    suggestedModules: [AppModule.CORE_POS],
  },
};

// ==========================================
// 2. BIẾN THỂ SIZE & TÙY CHỌN TOPPING
// ==========================================
export interface ModifierOption {
  name: string;
  price: number;
}

export interface DishVariantOption {
  id: string;
  name: string;
  price: number;
}

export interface DishCustomizationOption {
  id: string;
  name: string;
  priceModifier?: number;
}

export interface DishCustomizationGroup {
  id: string;
  name: string;
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  type?: "SINGLE" | "MULTIPLE";
  options: DishCustomizationOption[];
}

export interface FnbDishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  station: "KITCHEN" | "BAR" | "DESSERT";
  isAvailable: boolean;
  stockCount?: number;
  image?: string;
  description?: string;
  isBestSeller?: boolean;
  modifiers?: ModifierOption[];
  variants?: DishVariantOption[];
  customizationGroups?: DishCustomizationGroup[];
  majorCategory?: FnbMajorCategory;
}

// ==========================================
// 3. PHÂN LOẠI DANH MỤC THỰC ĐƠN NỀN TẢNG (3 TRỤ CỘT)
// ==========================================
export type FnbMajorCategory = "FOOD" | "DRINK" | "DESSERT";

export interface FnbCategoryTemplate {
  id: string;
  name: string;
  majorType: FnbMajorCategory;
  emoji?: string;
  description?: string;
  order?: number;
}

export const FNB_MAJOR_CONFIG: Record<
  FnbMajorCategory,
  { label: string; emoji: string; icon: string; station: "KITCHEN" | "BAR" | "DESSERT"; description: string }
> = {
  FOOD: {
    label: "Đồ Ăn",
    emoji: "🍲",
    icon: "utensils",
    station: "KITCHEN",
    description: "Cơm, bún, phở, lẩu, nướng, khai vị, món chính & món ăn vặt",
  },
  DRINK: {
    label: "Đồ Uống",
    emoji: "🥤",
    icon: "coffee",
    station: "BAR",
    description: "Cà phê, trà sữa, trà trái cây, sinh tố, nước ép, bia & đồ uống đóng lon",
  },
  DESSERT: {
    label: "Đồ Tráng Miệng",
    emoji: "🍰",
    icon: "cake",
    station: "DESSERT",
    description: "Bánh ngọt, chè truyền thống, kem tươi, pudding & trái cây đĩa",
  },
};

// ==========================================
// 4. KỊCH BẢN MÔ HÌNH (SCENARIO TEMPLATES)
// ==========================================
export interface BusinessScenarioCategory {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
}

export interface BusinessScenarioTable {
  id: string;
  name: string;
  capacity: number;
  zone: string;
}

export interface BusinessScenarioTemplate {
  type: BusinessType;
  businessType?: BusinessType;
  label: string;
  businessName?: string;
  emoji: string;
  tagline: string;
  description: string;
  suggestedModules: AppModule[];
  categories: BusinessScenarioCategory[];
  suggestedCategories?: BusinessScenarioCategory[];
  defaultTables: BusinessScenarioTable[];
  suggestedTables?: BusinessScenarioTable[];
  dishes: FnbDishItem[];
}

// ==========================================
// 4. QUẢN TRỊ NỀN TẢNG (PLATFORM RECORDS)
// ==========================================
export interface ConnectedTerminalRecord {
  id: string;
  name: string;
  role: "POS_CASHIER" | "KITCHEN_KDS" | "TABLET_WAITER" | "BAR_KDS";
  ipAddress: string;
  appVersion: string;
  lastSync: string;
  status: "ONLINE" | "OFFLINE";
}

export interface TenantStoreRecord {
  id: string;
  name: string;
  owner: string;
  phone: string;
  address: string;
  tableCount: number;
  licenseKey: string;
  plan: "STARTER" | "GROWTH" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "SUSPENDED";
  activatedAt: string;
  expiresAt: string;
  daysLeft: number;
  pingMs: number;
  activeDevices: number;
  configVer: string;
  modules: AppModule[];
  scale?: StoreScale;
  businessType?: BusinessType;
  lastSync?: string;
  terminals?: ConnectedTerminalRecord[];
}

export interface SoftwareInvoiceRecord {
  id: string;
  invoiceCode: string;
  storeId: string;
  storeName: string;
  plan: string;
  durationMonths: number;
  subTotal: number;
  discountAmount: number;
  finalAmount: number;
  status: "PAID" | "PENDING" | "CANCELLED";
  paymentMethod: "VIETQR";
  createdAt: string;
  paidAt?: string;
  qrUrl?: string;
}

// ==========================================
// 5. QUY MÔ CỬA HÀNG (STORE SCALES)
// ==========================================
export type StoreScale = "KIOSK" | "STANDARD" | "LARGE" | "CHAIN";

export interface StoreScaleConfig {
  id: StoreScale;
  label: string;
  badge: string;
  description: string;
  tableRange: string;
  defaultTables: number;
  recommendedPlan: "STARTER" | "GROWTH" | "PRO";
  deviceEstimate: string;
}

export const STORE_SCALE_CONFIGS: Record<StoreScale, StoreScaleConfig> = {
  KIOSK: {
    id: "KIOSK",
    label: "Ki-ốt / Mang Đi / Nhỏ",
    badge: "1 - 5 Bàn",
    description: "Mô hình tinh gọn, chủ yếu bán mang đi, quầy bar hoặc ít bàn.",
    tableRange: "1 - 5",
    defaultTables: 4,
    recommendedPlan: "STARTER",
    deviceEstimate: "1 Máy POS hoặc Tablet thu ngân",
  },
  STANDARD: {
    id: "STANDARD",
    label: "Cửa Hàng Tiêu Chuẩn",
    badge: "6 - 20 Bàn",
    description: "Quán cà phê, trà sữa, quán ăn gia đình 1 tầng, khách ngồi tại chỗ vừa phải.",
    tableRange: "6 - 20",
    defaultTables: 12,
    recommendedPlan: "GROWTH",
    deviceEstimate: "1 POS Thu ngân + 1 Màn hình Bếp KDS",
  },
  LARGE: {
    id: "LARGE",
    label: "Nhà Hàng Lớn / Nhiều Tầng",
    badge: "21 - 50 Bàn",
    description: "Nhà hàng gọi món, quán nhậu sân vườn, nhiều khu vực phòng VIP.",
    tableRange: "21 - 50",
    defaultTables: 30,
    recommendedPlan: "PRO",
    deviceEstimate: "1 POS + 2 KDS + 2 Tablet order di động",
  },
  CHAIN: {
    id: "CHAIN",
    label: "Chuỗi / Đại Tiệc / Siêu Quy Mô",
    badge: "> 50 Bàn",
    description: "Hệ thống nhiều chi nhánh, hội nghị tiệc cưới hoặc nhà hàng quy mô lớn.",
    tableRange: "50 - 200",
    defaultTables: 60,
    recommendedPlan: "PRO",
    deviceEstimate: "Đa điểm POS + Bếp phân trạm + QR Order",
  },
};
