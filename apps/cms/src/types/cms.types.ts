import React from "react";
import { IconName } from "./icon.types.js";
import { AppModule } from "@a2order/shared";

export { AppModule };

export interface CmsMetric {
  id: string;
  title: string;
  value: string | number;
  changeText: string;
  isFeatured?: boolean;
}

export interface CmsStaffShift {
  id: string;
  name: string;
  role: string;
  task: string;
  avatar: string;
  status: "Completed" | "In Progress" | "Pending";
}

export interface CmsProjectItem {
  id: string;
  name: string;
  time: string;
  color: string;
}

export interface CmsAnalyticsBar {
  label: string;
  heightPercent: number;
  isPeak?: boolean;
  isHatched?: boolean;
  peakLabel?: string;
}

// Table Management Types
export interface CmsTableItem {
  id: string;
  name: string;
  capacity: number;
  status: "EMPTY" | "OCCUPIED" | "WAITING_FOOD" | "SERVED" | "PAYMENT_PENDING";
  qrCodeUrl: string;
}

export interface TableZoneData {
  id: string;
  name: string;
  tables: CmsTableItem[];
}

// Menu Management Types
export interface ModifierOption {
  name: string;
  price: number;
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
}

// Inventory & Inward Stock Types
export interface InventoryIngredient {
  id: string;
  code: string;
  name: string;
  category: "MEAT" | "VEGETABLE" | "SPICE" | "DRINK_RAW" | "PACKAGING" | "OTHER";
  unit: string;
  currentStock: number;
  minStockLevel: number;
  avgCostPrice: number;
  supplierName: string;
  updatedAt: string;
}

export interface InwardReceiptItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface InwardReceipt {
  id: string;
  code: string;
  supplierName: string;
  supplierPhone?: string;
  receivedDate: string;
  receivedBy: string;
  items: InwardReceiptItem[];
  totalAmount: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  notes?: string;
  createdAt: string;
}

export interface RecipeIngredientBOM {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface DishRecipeBOM {
  dishId: string;
  dishName: string;
  category: string;
  ingredients: RecipeIngredientBOM[];
}

// Staff & RBAC Management Types
export type StaffRole =
  | "STORE_OWNER"
  | "STORE_MANAGER"
  | "CASHIER"
  | "WAITER"
  | "CHEF"
  | "ACCOUNTANT";

export interface StaffUser {
  id: string;
  code: string;
  name: string;
  role: StaffRole;
  phone: string;
  shift: "MORNING" | "EVENING" | "FULL_TIME";
  pin: string;
  email?: string;
  ordersServedToday: number;
  isActive: boolean;
}

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  isSensitive?: boolean;
}

// Reservation Types
export interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  guestCount: number;
  reservationTime: string;
  dateCategory: "TODAY" | "TOMORROW" | "THIS_WEEK";
  tableAssigned?: string;
  occasion?: "BIRTHDAY" | "BUSINESS" | "ANNIVERSARY" | "FAMILY" | "GENERAL";
  depositAmount?: number;
  depositStatus?: "UNPAID" | "PAID";
  notes?: string;
  source: "LANDING_PAGE" | "PHONE_CALL" | "WALK_IN";
  status: "PENDING" | "CONFIRMED" | "ARRIVED" | "NO_SHOW" | "CANCELLED";
  createdAt: string;
}

// Navigation & Layout Component Props
export interface CmsSidebarMenuItem {
  id: string;
  label: string;
  icon: IconName;
  badge?: string;
  badgeColor?: string;
  requiredModule?: AppModule;
}

export interface CmsSidebarMenuGroup {
  title: string;
  items: CmsSidebarMenuItem[];
}

export interface CmsSidebarProps {
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  onLogout: () => void;
  currentRole: "STORE_OWNER" | "SUPER_ADMIN";
  onChangeRole: (role: "STORE_OWNER" | "SUPER_ADMIN") => void;
  enabledModules?: AppModule[];
}

export interface CmsTopNavProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  onSearch?: (query: string) => void;
}

export interface CmsLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  currentRole: "STORE_OWNER" | "SUPER_ADMIN";
  onChangeRole: (role: "STORE_OWNER" | "SUPER_ADMIN") => void;
  enabledModules?: AppModule[];
}

export interface CmsMetricCardsProps {
  metrics: CmsMetric[];
}

export interface CmsModuleManagerProps {
  currentModules: AppModule[];
  onSaveModules: (modules: AppModule[]) => void;
}

export interface CmsLandingPageEditorProps {
  isUnlocked: boolean;
  onUpgradeClick: () => void;
}

export interface CmsStoreSettingsProps {
  enabledModules: AppModule[];
  onSaveModules: (modules: AppModule[]) => void;
}

export interface CmsSuperAdminViewProps {
  subView?: "telemetry" | "tenants" | "license_manager" | "software_invoices" | "audit_logs" | "pricing_config";
}

export interface CmsDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

// Sales Audit & Reporting Types
export interface SalesBillItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface SalesBillRecord {
  id: string;
  billCode: string;
  tableName: string;
  cashierName: string;
  shiftName: "CA_SANG" | "CA_TOI";
  openedAt: string;
  closedAt: string;
  items: SalesBillItem[];
  subTotal: number;
  discountAmount: number;
  vatAmount: number;
  finalAmount: number;
  paymentMethod: "VIETQR" | "CASH" | "CARD";
  status: "COMPLETED" | "CANCELED";
  vietQrRef?: string;
}

export interface CanceledItemRecord {
  id: string;
  dishName: string;
  quantity: number;
  price: number;
  canceledAt: string;
  tableName: string;
  canceledBy: string;
  reason: string;
}

// Super Admin Platform Types

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
    description: "Không gian, làm việc, check-in, loyal customers",
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
  businessType?: BusinessType;
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

export interface SystemAuditLogRecord {
  id: string;
  action: string;
  storeName: string;
  actor: string;
  actorRole: string;
  ipAddress: string;
  timestamp: string;
  details: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
}

