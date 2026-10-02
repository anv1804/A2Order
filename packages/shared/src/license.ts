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
  MODULE_ATTENDANCE_HRM = "MODULE_ATTENDANCE_HRM", // Add-on: Chấm công, xếp ca, quản lý giờ làm nhân viên
  MODULE_STAFF_INTERCOM = "MODULE_STAFF_INTERCOM", // Add-on: Bộ đàm & Chat nội bộ Realtime 0ms
  MODULE_LANDING_PAGE = "MODULE_LANDING_PAGE",   // Add-on: Website riêng, custom domain, đặt bàn online
}

export interface ModulePricingInfo {
  id: AppModule;
  name: string;
  monthlyPrice: number; // VND/tháng
  description: string;
  isCore?: boolean;
  category?: "OPERATION" | "ADDON";
}

/**
 * BẢNG GIÁ ĐÃ ĐƯỢC TỐI ƯU CỰC KỲ HỢP LÝ CHO THỊ TRƯỜNG F&B VIỆT NAM (QUÁN ĂN VỪA & NHỎ)
 */
export const APP_MODULE_CATALOG: ModulePricingInfo[] = [
  // --- NHÓM 1: VẬN HÀNH BÀN & ĐƠN CỐT LÕI (CORE OPERATION) ---
  {
    id: AppModule.CORE_POS,
    name: "Vận Hành Bàn & Đơn (Core POS)",
    monthlyPrice: 99000, // ~3.300 đ/ngày - siêu tiết kiệm cho quán nhỏ
    description: "Sơ đồ bàn thời gian thực, gọi món, tính tiền tiền mặt & VietQR",
    isCore: true,
    category: "OPERATION",
  },
  {
    id: AppModule.MODULE_QR_ORDER,
    name: "Khách Tự Gọi Món Tại Bàn (QR Order)",
    monthlyPrice: 39000, // ~1.300 đ/ngày - Giúp quán cắt giảm 1 nhân viên chạy bàn
    description: "Mã QR động từng bàn, khách tự chọn món gửi thẳng vào bếp không cần phục vụ",
    category: "OPERATION",
  },
  {
    id: AppModule.MODULE_KDS,
    name: "Màn Hình Bếp Thông Minh (KDS)",
    monthlyPrice: 49000, // Dùng không giới hạn màn hình (CukCuk thu 50k-99k/máy)
    description: "Vé chế biến trực quan realtime 0ms, báo hết món (86), chuông báo hoàn thành",
    category: "OPERATION",
  },
  {
    id: AppModule.MODULE_ACCOUNTING,
    name: "Kế Toán & Đối Soát Ca",
    monthlyPrice: 29000, // ~900 đ/ngày
    description: "Sổ quỹ tiền mặt, kiểm toán chống thất thoát, xuất hóa đơn Excel",
    category: "OPERATION",
  },
  {
    id: AppModule.MODULE_ADVANCED_ANALYTICS,
    name: "Thống Kê Doanh Số Đa Chiều (Deep Analytics)",
    monthlyPrice: 39000,
    description: "Ma trận món ăn (Menu Engineering), phân tích giờ vàng (Heatmap), chỉ số AOV",
    category: "OPERATION",
  },

  // --- NHÓM 2: CÁC MODULE CHUYÊN SÂU TÁCH RIÊNG BÁN THÊM (PREMIUM ADD-ONS) ---
  {
    id: AppModule.MODULE_ATTENDANCE_HRM,
    name: "Chấm Công & Xếp Ca Nhân Viên (HRM)",
    monthlyPrice: 49000, // KiotViet thu 15k-25k/nhân sự/tháng (Quán 10 người tốn 250k). A2Order trọn gói 49k
    description: "Chấm công PIN/Mobile, quản lý đi muộn về sớm, xếp ca và xuất bảng giờ làm tính lương",
    category: "ADDON",
  },
  {
    id: AppModule.MODULE_STAFF_INTERCOM,
    name: "Bộ Đàm & Chat Nội Bộ Realtime",
    monthlyPrice: 29000, // Thay thế hoàn toàn bộ đàm vật lý 3-5 triệu/bộ
    description: "Bấm nói và nhắn tin nhanh giữa Thu ngân - Bồi bàn - Bếp KDS qua WebSocket 0ms",
    category: "ADDON",
  },
  {
    id: AppModule.MODULE_LANDING_PAGE,
    name: "Website Thương Hiệu & Tên Miền Riêng",
    monthlyPrice: 69000, // Thị trường (Sapo/Haravan/KiotViet) thu 150k-350k/tháng
    description: "Website thương hiệu chuẩn SEO, gắn tên miền riêng (phobonamdinh.vn), đặt bàn online",
    category: "ADDON",
  },
];

export interface PlanConfig {
  id: "STARTER" | "GROWTH" | "PRO";
  name: string;
  monthlyPrice: number;
  description: string;
  badge?: string;
  maxTables: number;
  maxStaff: number;
  includedModules: AppModule[];
  targetAudience: string;
  comparisonHighlights: string[];
}

export const PLAN_CONFIGS: Record<"STARTER" | "GROWTH" | "PRO", PlanConfig> = {
  STARTER: {
    id: "STARTER",
    name: "STARTER (Quán Nhỏ)",
    monthlyPrice: 79000,
    description: "Xe đẩy, quán nhỏ, take-away. Tối đa 15 bàn, 5 nhân viên.",
    maxTables: 15,
    maxStaff: 5,
    includedModules: [AppModule.CORE_POS, AppModule.MODULE_QR_ORDER],
    targetAudience: "Quán nhỏ, cafe vỉa hè, take-away",
    comparisonHighlights: [
      "Rẻ hơn 70% so với KiotViet (250k) và rẻ hơn cả CukCuk (99k)",
      "Tặng kèm QR Order tại bàn tự động không giới hạn",
      "Không giới hạn số lượng hóa đơn/ngày",
      "Không thu phí thiết bị điện thoại nhân viên",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "GROWTH (Tiêu Chuẩn)",
    monthlyPrice: 149000,
    description: "Quán cà phê, nhà hàng vừa. Tối đa 50 bàn, 15 nhân viên.",
    badge: "Phổ Biến Nhất",
    maxTables: 50,
    maxStaff: 15,
    includedModules: [
      AppModule.CORE_POS,
      AppModule.MODULE_QR_ORDER,
      AppModule.MODULE_KDS,
      AppModule.MODULE_ACCOUNTING,
    ],
    targetAudience: "Quán cafe, trà sữa, quán ăn gia đình vừa",
    comparisonHighlights: [
      "Rẻ hơn KiotViet (310k) hơn một nửa, rẻ hơn CukCuk (199k) 25%",
      "Tích hợp sẵn Bếp KDS Realtime không giới hạn màn hình",
      "Kèm sổ quỹ kế toán chống thất thoát thu ngân",
      "Hỗ trợ tới 50 bàn và 15 nhân viên cùng lúc",
    ],
  },
  PRO: {
    id: "PRO",
    name: "PRO (Chuyên Nghiệp)",
    monthlyPrice: 249000,
    description: "Chuỗi quán, nhà hàng lớn. Tối đa 150 bàn, mở rộng tối đa.",
    badge: "Đầy Đủ Vận Hành",
    maxTables: 150,
    maxStaff: 50,
    includedModules: [
      AppModule.CORE_POS,
      AppModule.MODULE_QR_ORDER,
      AppModule.MODULE_KDS,
      AppModule.MODULE_ACCOUNTING,
      AppModule.MODULE_ADVANCED_ANALYTICS,
    ],
    targetAudience: "Nhà hàng lớn, quán nhậu, chuỗi thương hiệu",
    comparisonHighlights: [
      "Rẻ hơn 50% so với KiotViet (490k) và CukCuk Enterprise (499k)",
      "Mở rộng tối đa 150 bàn & 50 nhân viên hoạt động đồng thời",
      "Báo cáo chuyên sâu Menu Engineering & Heatmap giờ vàng",
      "Đầy đủ bộ tứ: POS + QR Order + Bếp KDS + Sổ Quỹ Kế Toán",
    ],
  },
};

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
