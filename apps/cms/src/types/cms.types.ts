import React from "react";
import { IconName } from "./icon.types.js";
import { AppModule, StoreScale } from "@a2order/shared";

export { AppModule };
export type { StoreScale };

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
  code?: string;
  pin?: string;
  zoneId?: string;
  orderUrl?: string;
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
}

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

export interface AttendanceLogRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  clockInTime: string;
  clockOutTime?: string;
  shiftName: string;
  date: string;
  status: "ACTIVE" | "COMPLETED";
  workHours?: number;
  note?: string;
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
  status: "PENDING" | "CONFIRMED" | "ARRIVED" | "NO_SHOW" | "CANCELLED" | "LATE";
  createdAt: string;
  depositResolution?: "FORFEIT_PENALTY" | "VOUCHER_CREDIT" | "REFUNDED";
  extendedMinutes?: number;
  lateNotifiedAt?: string;
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

export type CmsAppRole =
  | "SUPER_ADMIN"
  | "STORE_OWNER"
  | "ACCOUNTANT"
  | "CASHIER"
  | "CHEF"
  | "WAITER";

export interface CmsSidebarProps {
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  onLogout: () => void;
  currentRole: CmsAppRole;
  onChangeRole?: (role: CmsAppRole) => void;
  enabledModules?: AppModule[];
  onCloseMobileDrawer?: () => void;
  currentUser?: { name: string; email?: string | null; storeName?: string | null; role?: string } | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface CmsTopNavProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  onSearch?: (query: string) => void;
  onToggleMobileMenu?: () => void;
  activeMenuTitle?: string;
  roleBadgeText?: string;
  storeName?: string;
  onOpenProfile?: () => void;
  onOpenSearch?: () => void;
  onSelectMenu?: (menuKey: string) => void;
  currentRole?: CmsAppRole;
  onChangeRole?: (role: CmsAppRole) => void;
}

export interface CmsLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  currentRole: CmsAppRole;
  onChangeRole?: (role: CmsAppRole) => void;
  enabledModules?: AppModule[];
  currentUser?: { name: string; email?: string | null; storeName?: string | null; role?: string } | null;
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
  subView?: "telemetry" | "tenants" | "license_manager" | "software_invoices" | "audit_logs" | "pricing_config" | "scenarios" | "store_users";
  onTabChange?: (tab: string) => void;
}

export interface CmsDashboardProps {
  onNavigateTab?: (tab: string) => void;
  currentRole?: CmsAppRole;
}

export interface CmsMenuManagementProps {
  currentRole?: CmsAppRole;
}

export interface CmsStaffOrderViewProps {
  currentRole?: CmsAppRole;
  onNavigateTab?: (tab: string) => void;
}

export interface CmsTableManagementProps {
  currentRole?: CmsAppRole;
  onNavigateToOrder?: (tableId: string) => void;
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
  ownerEmail?: string;
  staffList?: Array<{
    id: string;
    name: string;
    email: string | null;
    role: string;
    isActive: boolean;
  }>;
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

// ================= CRM & KHÁCH HÀNG THÂN THIẾT =================
export type CustomerMembershipTier = "MEMBER" | "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface CustomerRecord {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  tier: CustomerMembershipTier;
  points: number;
  totalSpent: number;
  totalVisits: number;
  favoriteDish?: string;
  lastVisit: string;
  createdAt: string;
  notes?: string;
}

// ================= CHƯƠNG TRÌNH KHUYẾN MÃI & VOUCHER =================
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface PromotionVoucherRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  happyHourOnly?: boolean;
  happyHourTimeRange?: string;
  isActive: boolean;
}

// ================= THIẾT BỊ PHẦN CỨNG & MÁY IN =================
export type PrinterType = "CASHIER_BILL" | "KITCHEN_TICKET" | "BAR_TICKET";
export type PrinterInterface = "LAN_IP" | "USB" | "BLUETOOTH" | "WIFI";

export interface PrinterConfigRecord {
  id: string;
  name: string;
  type: PrinterType;
  interfaceType: PrinterInterface;
  ipAddress?: string;
  port?: number;
  paperWidth: "80mm" | "58mm";
  autoCut: boolean;
  openCashDrawer: boolean;
  soundAlarm: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "WARNING";
  lastPingMs?: number;
}

export interface ReceiptTemplateConfig {
  storeName: string;
  slogan: string;
  address: string;
  phone: string;
  wifiName: string;
  wifiPass: string;
  showVietQr: boolean;
  showLogo: boolean;
  footerNote: string;
}

// ================= NHÂN VIÊN ORDER CẦM TAY (WAITER POS) =================
export interface WaiterOrderItem {
  id?: string;
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedModifiers?: string[];
  status?: "WAITING" | "COOKING" | "SERVED" | "OUT_OF_STOCK" | "REMAKE" | "RETURNED" | "CANCELED";
  orderedAt?: string;
  round?: number;
  remakeReason?: string;
  cancelReason?: string;
}

export interface OrderSurcharge {
  id: string;
  name: string;
  amount: number;
}

export interface OrderDiscount {
  type: "PERCENT" | "AMOUNT";
  value: number;
  reason: string;
}

export interface WaiterTableOrder {
  tableId: string;
  tableName: string;
  tableCode?: string;
  pin?: string;
  zoneName: string;
  guestCount: number;
  status: "EMPTY" | "OCCUPIED" | "WAITING_FOOD" | "SERVED" | "BILL_REQUESTED";
  openedAt?: string;
  openedAtMs?: number;
  items: WaiterOrderItem[];
  totalAmount: number;
  isSplit?: boolean;
  mergedTables?: string[];
  surcharges?: OrderSurcharge[];
  discount?: OrderDiscount;
  offlinePaid?: boolean;
  offlinePaidAt?: string;
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
  type?: "CANCEL_WAITING" | "CANCEL_COOKING" | "RETURN_SERVED" | "REMAKE";
}

// ================= TÀI KHOẢN & USER QUÁN (SUPER ADMIN PLATFORM) =================
export interface PlatformStoreUserRecord {
  id: string;
  name: string;
  email: string;
  pinCode: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  storeId: string;
  storeName: string;
  storeStatus?: string;
  storePlan?: string;
  hasPassword?: boolean;
}

// ================= APP GIAO HÀNG (DELIVERY APPS INTEGRATION) =================
export type DeliveryPlatform = "GRAB_FOOD" | "SHOPEE_FOOD" | "BE_FOOD" | "GO_FOOD";

export interface DeliveryChannelConfig {
  id: DeliveryPlatform;
  name: string;
  logo: string;
  badgeColor: string;
  isConnected: boolean;
  merchantStoreId?: string;
  apiKey?: string;
  secretKey?: string;
  webhookUrl: string;
  autoAccept: boolean;
  autoSendToKds: boolean;
  priceMarkupPercent: number; // Tăng giá bán trên app (VD: 15% bù chiết khấu sàn)
  lastSyncAt?: string;
}

export interface DeliveryOrderItem {
  name: string;
  quantity: number;
  price: number;
  options?: string[];
  notes?: string;
}

export interface DeliveryOrderRecord {
  id: string;
  platform: DeliveryPlatform;
  platformOrderCode: string;
  customerName: string;
  customerPhone: string;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  status: "WAITING_ACCEPT" | "COOKING" | "READY_FOR_PICKUP" | "DELIVERING" | "COMPLETED" | "CANCELLED";
  items: DeliveryOrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  platformCommission: number;
  netPayout: number;
  orderTime: string;
  estimatedPickupTime?: string;
}

// ================= HÓA ĐƠN ĐIỆN TỬ (E-INVOICE MISA, VNPT, VIETTEL, BKAV) =================
export type EInvoiceProvider = "MISA_MEINVOICE" | "VNPT_INVOICE" | "VIETTEL_SINVOICE" | "BKAV_EHOADON";

export interface EInvoiceConfig {
  provider: EInvoiceProvider;
  isConnected: boolean;
  taxCode: string;
  companyName: string;
  companyAddress: string;
  invoiceTemplate: string; // Mẫu số HĐ (VD: 1/001)
  invoiceSeries: string;   // Ký hiệu HĐ (VD: 1C26TBB)
  signatureType: "CLOUD_CA" | "USB_TOKEN";
  autoIssueOnCheckout: boolean;
  minAmountForAutoIssue?: number;
  accountUsername?: string;
  accountPassword?: string;
  apiEndpoint?: string;
}

export interface EInvoiceRecord {
  id: string;
  orderCode: string;
  invoiceNumber: string; // Số HĐ (VD: 0000123)
  invoiceSeries: string; // Ký hiệu
  cqtCode?: string;      // Mã cơ quan thuế cấp
  buyerName: string;
  buyerTaxCode?: string;
  buyerEmail?: string;
  buyerAddress?: string;
  totalBeforeTax: number;
  vatRate: number;       // 8% hoặc 10%
  vatAmount: number;
  totalPayment: number;
  issuedAt: string;
  signedBy: string;
  status: "ISSUED_WITH_CODE" | "WAITING_CQT_CODE" | "REJECTED" | "CANCELLED";
  xmlDownloadUrl?: string;
  pdfDownloadUrl?: string;
}

// ================= HỘI VIÊN & QUY TẮC TÍCH ĐIỂM (LOYALTY & CRM) =================
export interface LoyaltyRuleConfig {
  spendingPerPoint: number;    // Bao nhiêu tiền được 1 điểm (VD: 10000)
  pointRedeemValue: number;    // 1 điểm bằng bao nhiêu tiền giảm trừ (VD: 100)
  minPointsToRedeem: number;   // Tối thiểu bao nhiêu điểm để được đổi (VD: 50)
  welcomePoints: number;       // Tặng điểm khi tạo mới (VD: 20)
  birthdayBonusPoints: number; // Tặng điểm ngày sinh nhật (VD: 100)
  autoUpgradeTier: boolean;
}

export interface CrmCampaign {
  id: string;
  name: string;
  type: "BIRTHDAY" | "WIN_BACK" | "TIER_UPGRADE" | "HOLIDAY_BROADCAST";
  targetAudience: string;
  voucherDiscount: number;
  voucherType: "PERCENT" | "FIXED";
  channels: ("ZALO_ZNS" | "SMS_BRANDNAME" | "IN_APP")[];
  isActive: boolean;
  sentCount: number;
  convertedCount: number;
  lastRunAt?: string;
}

// ================= GỌI MÓN POS NHÂN VIÊN & KHÁCH QUÉT QR (STAFF ORDER & QR) =================
export interface PendingSessionRequest {
  tableId: string;
  tableName: string;
  tableCode: string;
  zoneName: string;
  storeId: string;
  requestedAt: number;
  guestCount: number;
}

export interface DishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  isPopular?: boolean;
  modifiers?: string[];
}

export interface ServiceRequestItem {
  id: string;
  tableId?: string;
  tableName?: string;
  type: string;
  note?: string;
  time: string;
}

export interface VoidCookingModalState {
  isOpen: boolean;
  item: WaiterOrderItem | null;
  itemIndex: number;
  reason: string;
  pin: string;
  pinError: string;
  notes: string;
}

export interface CustomerOrderedItem {
  id: string;
  dishId?: string;
  name: string;
  price: number;
  quantity: number;
  status: "PENDING_APPROVAL" | "COOKING" | "SERVED" | "CANCELLED";
  orderId?: string;
  orderedAt: string;
  notes?: string;
}

export interface CustomerMenuItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
}

export interface CustomerCategory {
  id: string;
  name: string;
  menuItems: CustomerMenuItem[];
}

export interface CustomerCartItem {
  menuItem: CustomerMenuItem;
  quantity: number;
  notes?: string;
}

export interface CustomerVoucher {
  code: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  description: string;
  minOrder?: number;
}



