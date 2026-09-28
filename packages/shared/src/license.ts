/**
 * ĐỊNH NGHĨA BẢN QUYỀN & GÓI THUÊ PHẦN MỀM A2ORDER
 */

export enum LicensePlan {
  TRIAL = "TRIAL",             // Dùng thử 14 ngày
  BASIC = "BASIC",             // Quán nhỏ (<15 bàn)
  PRO = "PRO",                 // Nhà hàng vừa (<40 bàn, full KDS, QR)
  ENTERPRISE = "ENTERPRISE",   // Chuỗi nhà hàng, bàn không giới hạn
}

/**
 * CÁC MODULE TÍNH NĂNG TÙY CHỌN THEO QUY MÔ QUÁN
 */
export enum AppModule {
  CORE_POS = "CORE_POS",                         // Bắt buộc: Quản lý bàn, gọi món, in bill cơ bản
  MODULE_KDS = "MODULE_KDS",                     // Màn hình bếp/bar KDS thông minh
  MODULE_ACCOUNTING = "MODULE_ACCOUNTING",       // Kế toán, sổ quỹ, đối soát ca chuyên sâu
  MODULE_QR_ORDER = "MODULE_QR_ORDER",           // Khách tự quét mã QR tại bàn gọi món
  MODULE_ADVANCED_ANALYTICS = "MODULE_ADVANCED_ANALYTICS", // Báo cáo đa chiều, ma trận menu, heatmap
  MODULE_LANDING_PAGE = "MODULE_LANDING_PAGE",   // Website riêng, custom domain, đặt bàn online
}

export interface ModulePricingInfo {
  id: AppModule;
  name: string;
  monthlyPrice: number; // VND/tháng
  description: string;
  isCore?: boolean;
}

/**
 * BẢNG GIÁ ĐÃ ĐƯỢC TỐI ƯU CỰC KỲ HỢP LÝ CHO THỊ TRƯỜNG F&B VIỆT NAM (QUÁN ĂN VỪA & NHỎ)
 */
export const APP_MODULE_CATALOG: ModulePricingInfo[] = [
  {
    id: AppModule.CORE_POS,
    name: "Vận Hành Bàn & Đơn (Core POS)",
    monthlyPrice: 99000, // ~3.300 đ/ngày - siêu tiết kiệm cho quán nhỏ
    description: "Sơ đồ bàn thời gian thực, gọi món, tính tiền tiền mặt & VietQR",
    isCore: true,
  },
  {
    id: AppModule.MODULE_KDS,
    name: "Màn Hình Bếp Thông Minh (KDS)",
    monthlyPrice: 39000,
    description: "Vé chế biến trực quan, báo hết món (86), chuông báo hoàn thành",
  },
  {
    id: AppModule.MODULE_ACCOUNTING,
    name: "Kế Toán & Đối Soát Ca",
    monthlyPrice: 29000,
    description: "Sổ quỹ tiền mặt, kiểm toán chống thất thoát, xuất hóa đơn Excel",
  },
  {
    id: AppModule.MODULE_QR_ORDER,
    name: "Khách Tự Gọi Món Tại Bàn (QR Order)",
    monthlyPrice: 39000,
    description: "Mã QR động từng bàn, khách tự chọn món gửi thẳng vào bếp không cần phục vụ",
  },
  {
    id: AppModule.MODULE_ADVANCED_ANALYTICS,
    name: "Thống Kê Doanh Số Đa Chiều (Deep Analytics)",
    monthlyPrice: 49000,
    description: "Ma trận món ăn (Menu Engineering), phân tích giờ vàng (Heatmap), chỉ số AOV",
  },
  {
    id: AppModule.MODULE_LANDING_PAGE,
    name: "Landing Page & Tên Miền Riêng",
    monthlyPrice: 49000,
    description: "Website thương hiệu chuẩn SEO, gắn domain riêng (phobonamdinh.vn), đặt bàn online",
  },
];

export enum LicenseStatus {
  ACTIVE = "ACTIVE",           // Đang hoạt động bình thường
  EXPIRING_SOON = "EXPIRING_SOON", // Sắp hết hạn trong vòng 7 ngày
  EXPIRED = "EXPIRED",         // Đã hết hạn thuê (Khóa mở bàn mới)
  SUSPENDED = "SUSPENDED",     // Bị đình chỉ do vi phạm chính sách
}

export enum InvoiceStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export interface StoreLicenseInfo {
  storeId: string;
  licenseKey: string;
  planType: LicensePlan;
  enabledModules: AppModule[];
  status: LicenseStatus;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  maxTables: number;
  maxStaff: number;
}

export interface SoftwareInvoiceDto {
  id: string;
  invoiceCode: string;
  storeName: string;
  amount: number;
  durationMonths: number;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  paymentMethod: string;
  createdAt: string;
}
