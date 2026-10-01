import React, { useEffect, useMemo, useRef, useState } from "react";
import { Portal } from "./Portal";
import { Icon } from "./Icon";
import { IconName } from "@/types";

export interface SubAction {
  id: string;
  label: string;
  desc: string;
  icon: IconName;
  shortcut?: string;
}

export interface ModuleItem {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  category: "core" | "operations" | "menu" | "finance" | "settings";
  categoryLabel: string;
  color: string;
  bg: string;
  badgeColor: string;
  subActions: SubAction[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchingNavigation?: any[];
  onSelect: (menuId: string) => void;
  currentRole?: "SUPER_ADMIN" | "STORE_OWNER";
}

const SUPER_ADMIN_MODULES: ModuleItem[] = [
  {
    id: "telemetry",
    label: "Tổng Quan Nền Tảng",
    hint: "Số liệu thời gian thực & tình trạng hệ thống",
    icon: "activity",
    category: "core",
    categoryLabel: "Giám Sát",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200/80",
    badgeColor: "bg-emerald-100 text-emerald-800",
    subActions: [
      { id: "realtime", label: "Chỉ số doanh thu & đơn hàng thời gian thực", desc: "Theo dõi số đơn phát sinh, doanh thu toàn chuỗi và quán đang online", icon: "trending" },
      { id: "gateway", label: "Giám sát Node.js Gateway & WebSocket", desc: "Theo dõi tải CPU, RAM, độ trễ mạng và số lượng kết nối đồng thời", icon: "server" },
      { id: "kpi", label: "Thống kê tăng trưởng nền tảng", desc: "Biểu đồ phát triển quán mới và tổng lượng giao dịch theo tháng", icon: "chart" },
    ],
  },
  {
    id: "tenants",
    label: "Quản Lý Quán & Chuỗi",
    hint: "Danh sách thương hiệu, điểm bán và cấu hình trạm",
    icon: "building",
    category: "operations",
    categoryLabel: "Đối Tác",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200/80",
    badgeColor: "bg-blue-100 text-blue-800",
    subActions: [
      { id: "tenant_list", label: "Danh sách chuỗi & điểm bán đối tác", desc: "Xem chi tiết thông tin quán, trạng thái kích hoạt và gói dịch vụ", icon: "store" },
      { id: "tenant_create", label: "Thêm quán / thương hiệu mới", desc: "Khởi tạo hồ sơ quán mới và tài khoản chủ quán ban đầu", icon: "plus" },
      { id: "tenant_devices", label: "Cấu hình trạm thiết bị & KDS", desc: "Quản lý kết nối máy in hóa đơn, POS thu ngân và màn bếp", icon: "print" },
    ],
  },
  {
    id: "license_manager",
    label: "Quản Lý License Key",
    hint: "Cấp phát, gia hạn & kiểm soát bản quyền",
    icon: "key",
    category: "operations",
    categoryLabel: "Bản Quyền",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200/80",
    badgeColor: "bg-purple-100 text-purple-800",
    subActions: [
      { id: "license_active", label: "Danh sách bản quyền đang hoạt động", desc: "Kiểm tra hạn sử dụng, số máy POS cho phép của từng quán", icon: "checkCircle" },
      { id: "license_issue", label: "Cấp mới mã bản quyền (License Key)", desc: "Tạo License key theo gói 1 tháng, 6 tháng, 1 năm hoặc trọn đời", icon: "plus" },
      { id: "license_history", label: "Lịch sử kích hoạt & thu hồi", desc: "Theo dõi nhật ký gia hạn, nâng cấp hoặc tạm khóa bản quyền", icon: "history" },
    ],
  },
  {
    id: "software_invoices",
    label: "Hóa Đơn & Thu Phí",
    hint: "Theo dõi cước phí phần mềm & thanh toán VietQR",
    icon: "fileText",
    category: "finance",
    categoryLabel: "Tài Chính",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200/80",
    badgeColor: "bg-amber-100 text-amber-800",
    subActions: [
      { id: "invoice_pending", label: "Hóa đơn cước phí chờ thanh toán", desc: "Danh sách cước phí dịch vụ phần mềm của các quán trong tháng", icon: "clock" },
      { id: "invoice_vietqr", label: "Đối soát thanh toán tự động VietQR", desc: "Kiểm tra giao dịch ngân hàng theo mã thanh toán động", icon: "vietqr" },
      { id: "invoice_export", label: "Xuất báo cáo tài chính & doanh thu cước", desc: "Tải file dữ liệu đối soát cước dịch vụ nền tảng", icon: "download" },
    ],
  },
  {
    id: "pricing_config",
    label: "Bảng Giá & Voucher",
    hint: "Cấu hình gói dịch vụ Starter, Pro & mã khuyến mãi",
    icon: "tag",
    category: "finance",
    categoryLabel: "Gói Cước",
    color: "text-rose-700",
    bg: "bg-rose-50 border-rose-200/80",
    badgeColor: "bg-rose-100 text-rose-800",
    subActions: [
      { id: "pricing_plans", label: "Cấu hình bảng giá gói dịch vụ", desc: "Thiết lập đơn giá theo tháng/năm cho từng quy mô chuỗi quán", icon: "dollar" },
      { id: "pricing_vouchers", label: "Mã ưu đãi & Voucher chiết khấu", desc: "Tạo mã khuyến mãi khi quán thanh toán hoặc gia hạn cước", icon: "percent" },
    ],
  },
  {
    id: "scenarios",
    label: "Kịch Bản F&B (Kho Mẫu)",
    hint: "Kho thực đơn mẫu, nhóm phân loại, biến thể & topping",
    icon: "clipboard",
    category: "menu",
    categoryLabel: "Thực Đơn",
    color: "text-emerald-800",
    bg: "bg-emerald-50 border-emerald-200/80",
    badgeColor: "bg-emerald-100 text-emerald-900",
    subActions: [
      { id: "scenario_food", label: "Kho thực đơn mẫu Đồ Ăn (Food)", desc: "Món chính, khai vị, lẩu nướng, cơm trưa và món ăn kèm", icon: "utensils" },
      { id: "scenario_drink", label: "Kho thực đơn mẫu Đồ Uống (Drink)", desc: "Cà phê, trà trái cây, trà sữa, sinh tố và nước đóng chai", icon: "coffee" },
      { id: "scenario_dessert", label: "Kho thực đơn mẫu Tráng Miệng (Dessert)", desc: "Bánh ngọt, chè, kem, sữa chua và món tráng miệng", icon: "cake" },
      { id: "scenario_presets", label: "Bộ Size & Tùy chọn đề xuất", desc: "Cấu hình nhóm tùy chọn đường đá, size M-L và topping chuẩn", icon: "grid" },
    ],
  },
  {
    id: "audit_logs",
    label: "Kiểm Toán & Giám Sát",
    hint: "Ghi vết thao tác Admin, bảo mật & lịch sử đăng nhập",
    icon: "shield",
    category: "settings",
    categoryLabel: "Bảo Mật",
    color: "text-slate-700",
    bg: "bg-slate-100 border-slate-300/80",
    badgeColor: "bg-slate-200 text-slate-800",
    subActions: [
      { id: "audit_actions", label: "Nhật ký hành động Quản trị viên", desc: "Ghi vết ai đã thêm sửa xóa quán, cấp license hoặc sửa giá", icon: "history" },
      { id: "audit_security", label: "Cảnh báo bảo mật & Truy cập lạ", desc: "Phát hiện đăng nhập sai nhiều lần hoặc truy cập từ IP lạ", icon: "alert" },
    ],
  },
  {
    id: "profile",
    label: "Hồ Sơ Quản Trị Viên",
    hint: "Thông tin cá nhân, quyền hạn và bảo mật tài khoản",
    icon: "user",
    category: "settings",
    categoryLabel: "Tài Khoản",
    color: "text-teal-800",
    bg: "bg-teal-50 border-teal-200/80",
    badgeColor: "bg-teal-100 text-teal-900",
    subActions: [
      { id: "profile_info", label: "Cập nhật thông tin quản trị", desc: "Thay đổi họ tên, email liên hệ và ảnh đại diện", icon: "userCheck" },
      { id: "profile_pass", label: "Đổi mật khẩu & Mã PIN bảo vệ", desc: "Cập nhật mật khẩu an toàn và mã PIN mở khóa khẩn cấp", icon: "lock" },
    ],
  },
];

const STORE_OWNER_MODULES: ModuleItem[] = [
  {
    id: "dashboard",
    label: "Tổng Quan Quán",
    hint: "Tình hình vận hành, doanh thu hôm nay và sơ đồ bàn",
    icon: "home",
    category: "core",
    categoryLabel: "Tổng Quan",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200/80",
    badgeColor: "bg-emerald-100 text-emerald-800",
    subActions: [
      { id: "dash_revenue", label: "Doanh thu & Số lượng đơn hôm nay", desc: "Xem tổng tiền thực thu, tiền tip và trạng thái thanh toán", icon: "trending" },
      { id: "dash_tables", label: "Tình trạng sơ đồ bàn thời gian thực", desc: "Bàn có khách, bàn trống và bàn đã nhận đặt chỗ", icon: "table" },
    ],
  },
  {
    id: "staff_order",
    label: "Gọi Món POS",
    hint: "POS cầm tay nhân viên, chọn món & gửi bếp tức thì",
    icon: "cart",
    category: "operations",
    categoryLabel: "Bán Hàng",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200/80",
    badgeColor: "bg-blue-100 text-blue-800",
    subActions: [
      { id: "order_create", label: "Tạo đơn mới cho bàn", desc: "Chọn món, chọn biến thể size, topping và gửi vào bếp", icon: "plus" },
      { id: "order_serving", label: "Danh sách đơn đang phục vụ", desc: "Kiểm tra món đang chế biến, tạm tính và in phiếu tạm", icon: "list" },
    ],
  },
  {
    id: "tables",
    label: "Sơ Đồ Bàn Ăn",
    hint: "Quản lý khu vực bàn, ghép bàn & chuyển bàn",
    icon: "table",
    category: "operations",
    categoryLabel: "Bàn Ăn",
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200/80",
    badgeColor: "bg-teal-100 text-teal-800",
    subActions: [
      { id: "table_map", label: "Sơ đồ bàn theo khu vực", desc: "Xem trạng thái các bàn Tầng 1, Tầng 2, Sân vườn", icon: "grid" },
      { id: "table_transfer", label: "Thao tác Chuyển bàn / Ghép bàn", desc: "Hỗ trợ khách đổi bàn hoặc gộp nhiều bàn thanh toán", icon: "arrowRight" },
    ],
  },
  {
    id: "kds",
    label: "Màn Hình Bếp (KDS)",
    hint: "Hàng đợi món vào bếp, báo xong món và điều phối",
    icon: "kitchen",
    category: "operations",
    categoryLabel: "KDS Bếp",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200/80",
    badgeColor: "bg-amber-100 text-amber-800",
    subActions: [
      { id: "kds_pending", label: "Hàng đợi món chờ chế biến", desc: "Theo dõi thứ tự gọi món, thời gian chờ của từng bàn", icon: "clock" },
      { id: "kds_done", label: "Báo xong món trả khách", desc: "Thông báo cho nhân viên chạy bàn mang món ra phục vụ", icon: "checkCircle" },
    ],
  },
  {
    id: "menu",
    label: "Thực Đơn Quán",
    hint: "Món ăn, đồ uống, giá bán, bật/tắt hết hàng & topping",
    icon: "grid",
    category: "menu",
    categoryLabel: "Thực Đơn",
    color: "text-emerald-800",
    bg: "bg-emerald-50 border-emerald-200/80",
    badgeColor: "bg-emerald-100 text-emerald-900",
    subActions: [
      { id: "menu_list", label: "Danh sách món ăn & đồ uống", desc: "Cập nhật giá bán, sửa công thức hoặc tạm khóa khi hết hàng", icon: "utensils" },
      { id: "menu_categories", label: "Danh mục món & Nhóm tùy chọn", desc: "Quản lý nhóm khai vị, món chính, nhóm đường đá, topping", icon: "list" },
    ],
  },
  {
    id: "inventory",
    label: "Kho Hàng & Nguyên Liệu",
    hint: "Tồn kho thực phẩm, cảnh báo hết hàng & phiếu nhập kho",
    icon: "building",
    category: "operations",
    categoryLabel: "Kho Hàng",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200/80",
    badgeColor: "bg-orange-100 text-orange-800",
    subActions: [
      { id: "inv_stock", label: "Kiểm tra tồn kho hiện tại", desc: "Xem mức tồn kho nguyên vật liệu và cảnh báo sắp hết", icon: "alert" },
      { id: "inv_import", label: "Tạo phiếu nhập nguyên vật liệu", desc: "Ghi nhận phiếu nhập hàng mới và tính giá vốn nguyên liệu", icon: "plus" },
    ],
  },
  {
    id: "analytics",
    label: "Báo Cáo Chuyên Sâu",
    hint: "Báo cáo doanh thu, lợi nhuận, món bán chạy & giờ cao điểm",
    icon: "chart",
    category: "finance",
    categoryLabel: "Báo Cáo",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200/80",
    badgeColor: "bg-indigo-100 text-indigo-800",
    subActions: [
      { id: "ana_revenue", label: "Báo cáo doanh thu & Lợi nhuận", desc: "Phân tích doanh số theo ngày, tuần, tháng và phương thức thanh toán", icon: "trending" },
      { id: "ana_topdishes", label: "Top món bán chạy nhất", desc: "Thống kê món sinh lời cao nhất và các món ít người gọi", icon: "flame" },
    ],
  },
  {
    id: "settings",
    label: "Cài Đặt Cửa Hàng",
    hint: "Máy in bill, VietQR ngân hàng, thông tin quán & ca làm việc",
    icon: "settings",
    category: "settings",
    categoryLabel: "Cài Đặt",
    color: "text-slate-700",
    bg: "bg-slate-100 border-slate-300/80",
    badgeColor: "bg-slate-200 text-slate-800",
    subActions: [
      { id: "set_printer", label: "Kết nối máy in bill & in bếp", desc: "Cấu hình in tự động qua mạng LAN, Bluetooth hoặc USB", icon: "print" },
      { id: "set_vietqr", label: "Tài khoản ngân hàng VietQR", desc: "Thiết lập số tài khoản nhận tiền quét mã tự động tại bàn", icon: "vietqr" },
    ],
  },
  {
    id: "profile",
    label: "Hồ Sơ Chủ Quán",
    hint: "Thông tin cá nhân, phân quyền nhân sự & đăng xuất",
    icon: "user",
    category: "settings",
    categoryLabel: "Tài Khoản",
    color: "text-teal-800",
    bg: "bg-teal-50 border-teal-200/80",
    badgeColor: "bg-teal-100 text-teal-900",
    subActions: [
      { id: "prof_info", label: "Thông tin tài khoản cửa hàng", desc: "Cập nhật số điện thoại, tên chủ quán và địa chỉ liên hệ", icon: "userCheck" },
      { id: "prof_security", label: "Bảo mật & Đổi mật khẩu", desc: "Đổi mật khẩu truy cập hệ thống quản trị", icon: "lock" },
    ],
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  onSelect,
  currentRole = "SUPER_ADMIN",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [drilledModule, setDrilledModule] = useState<ModuleItem | null>(null);

  // Lấy danh sách module theo role
  const allModules = useMemo(() => {
    return currentRole === "SUPER_ADMIN" ? SUPER_ADMIN_MODULES : STORE_OWNER_MODULES;
  }, [currentRole]);

  // Reset drill-down khi mở modal hoặc khi query thay đổi
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setDrilledModule(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "unset";
      setDrilledModule(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Lắng nghe phím ESC hoặc phím mũi tên
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (drilledModule) {
          // Thoát khỏi chế độ nảy vào sâu
          setDrilledModule(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, drilledModule, onClose]);

  // Lọc theo search query (hỗ trợ cả module lẫn từng sub-action con)
  const query = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!isOpen) return [];
    return allModules
      .map((mod) => {
        // Kiểm tra category filter
        if (selectedCategory !== "ALL" && mod.category !== selectedCategory) {
          return null;
        }

        if (!query) {
          return { module: mod, matchedSubActions: mod.subActions };
        }

        const matchModule =
          mod.label.toLowerCase().includes(query) ||
          mod.hint.toLowerCase().includes(query) ||
          mod.categoryLabel.toLowerCase().includes(query);

        const matchedSubActions = mod.subActions.filter(
          (sub) =>
            sub.label.toLowerCase().includes(query) ||
            sub.desc.toLowerCase().includes(query)
        );

        if (matchModule || matchedSubActions.length > 0) {
          return {
            module: mod,
            matchedSubActions: matchedSubActions.length > 0 ? matchedSubActions : mod.subActions,
            hasDirectSubMatch: matchedSubActions.length > 0,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{
      module: ModuleItem;
      matchedSubActions: SubAction[];
      hasDirectSubMatch?: boolean;
    }>;
  }, [isOpen, allModules, selectedCategory, query]);

  // Khi bấm chọn một tác vụ cụ thể
  const handleExecuteAction = (moduleId: string) => {
    onSelect(moduleId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10001] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 pt-[6vh] sm:pt-[10vh] animate-in fade-in duration-150"
        onClick={onClose}
      >
        {/* Modal Dialog */}
        <div
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-surface-border overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[75vh] animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header Search Bar */}
          <div className="flex items-center px-4 py-3 sm:px-5 sm:py-3.5 border-b border-surface-border gap-2 sm:gap-3 bg-gradient-to-r from-slate-50/60 via-white to-slate-50/40">
            {drilledModule ? (
              <button
                type="button"
                onClick={() => setDrilledModule(null)}
                className="h-8 px-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 flex items-center gap-1.5 text-xs font-bold hover:bg-brand-100 transition shrink-0 active:scale-95"
                title="Quay lại danh sách phân hệ"
              >
                <Icon name="arrowLeft" size={14} />
                <span>Quay lại</span>
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-900 shrink-0">
                <Icon name="search" size={16} />
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              className="flex-1 min-w-0 text-xs sm:text-sm font-semibold text-ink-primary bg-transparent outline-none placeholder:text-ink-subtle"
              placeholder={
                drilledModule
                  ? `Tìm tác vụ trong ${drilledModule.label}...`
                  : "Tìm phân hệ, tác vụ, hóa đơn..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas transition"
                title="Xóa từ khóa"
              >
                <Icon name="x" size={13} />
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg bg-surface-muted text-[10px] font-black text-ink-muted border border-surface-border">
              ESC
            </kbd>
          </div>

          {/* 2. Breadcrumb / Mode Indicator khi đang "nảy vào sâu" */}
          {drilledModule ? (
            <div className="px-4 py-2.5 bg-brand-50/60 border-b border-brand-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${drilledModule.bg} ${drilledModule.color}`}
                >
                  <Icon name={drilledModule.icon} size={14} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-brand-800 uppercase tracking-wider">
                      Phân hệ đang mở:
                    </span>
                    <h3 className="text-xs font-black text-brand-950 truncate">
                      {drilledModule.label}
                    </h3>
                  </div>
                  <p className="text-[10.5px] text-brand-900/70 truncate">{drilledModule.hint}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExecuteAction(drilledModule.id)}
                className="px-3 py-1.5 rounded-xl bg-brand-900 hover:bg-brand-950 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs shrink-0 transition active:scale-95"
              >
                <span>Mở trang</span>
                <Icon name="arrowUpRight" size={13} />
              </button>
            </div>
          ) : (
            /* 3. Category Filter Chips khi ở màn hình tổng quan */
            <div className="px-3 sm:px-4 py-2 border-b border-surface-border/60 bg-surface-canvas/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "core", label: "Vận hành" },
                { id: "operations", label: "Quán & Trạm" },
                { id: "menu", label: "Thực đơn" },
                { id: "finance", label: "Tài chính" },
                { id: "settings", label: "Cài đặt" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? "bg-brand-900 text-white shadow-2xs"
                      : "text-ink-secondary hover:text-ink-primary hover:bg-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* 4. Nội Dung Danh Sách: Hỗ trợ Drill-Down "nảy vào sâu hơn" */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-surface-border/50">
            {/* TRƯỜNG HỢP 1: ĐANG NẢY VÀO SÂU TRONG 1 PHÂN HỆ */}
            {drilledModule ? (
              <div className="space-y-1.5 pt-1">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-extrabold text-ink-muted uppercase tracking-wider">
                  <span>Các tác vụ chi tiết ({drilledModule.subActions.length})</span>
                  <span className="text-brand-800">Nhấp để mở ngay</span>
                </div>

                {drilledModule.subActions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleExecuteAction(drilledModule.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-brand-50/60 border border-transparent hover:border-brand-200/60 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-surface-border flex items-center justify-center text-brand-900 group-hover:bg-brand-900 group-hover:text-white transition shadow-2xs shrink-0 mt-0.5">
                        <Icon name={sub.icon} size={15} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-ink-primary group-hover:text-brand-950 transition">
                          {sub.label}
                        </h4>
                        <p className="text-[11px] text-ink-secondary mt-0.5 leading-relaxed">
                          {sub.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 pl-2">
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-surface-canvas text-[10px] font-bold text-ink-muted group-hover:bg-white group-hover:text-brand-900 transition">
                        Truy cập
                      </span>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-subtle group-hover:text-brand-900 transition">
                        <Icon name="arrowRight" size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              /* TRƯỜNG HỢP 2: KHÔNG TÌM THẤY KẾT QUẢ */
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-canvas flex items-center justify-center text-ink-subtle mb-2">
                  <Icon name="search" size={22} />
                </div>
                <h4 className="text-xs font-bold text-ink-primary">Không tìm thấy phân hệ phù hợp</h4>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Thử tìm với từ khóa khác như "quán", "món", "bản quyền", "hóa đơn"...
                </p>
              </div>
            ) : (
              /* TRƯỜNG HỢP 3: DANH SÁCH TỔNG QUAN CÁC PHÂN HỆ */
              <div className="space-y-1.5">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-extrabold text-ink-muted uppercase tracking-wider">
                  <span>Phân hệ & tính năng ({filteredItems.length})</span>
                  <span className="hidden sm:inline">Nhấn để xem tác vụ chi tiết</span>
                </div>

                {filteredItems.map(({ module: mod, matchedSubActions, hasDirectSubMatch }) => (
                  <div
                    key={mod.id}
                    onClick={() => setDrilledModule(mod)}
                    className="p-2.5 sm:p-3 rounded-2xl hover:bg-emerald-50/50 border border-transparent hover:border-emerald-200/70 transition-all cursor-pointer group"
                  >
                    {/* Hàng Phân Hệ Chính: Bố Cục 2 Dòng Thông Minh - KHÔNG BAO GIỜ BỊ CẮT CHỮ */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Icon Phân Hệ */}
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${mod.bg} ${mod.color}`}
                        >
                          <Icon name={mod.icon} size={18} />
                        </div>

                        {/* Tiêu Đề Chiếm Trọn Dòng 1, Nhãn + Mô Tả Ở Dòng 2 */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-950 transition truncate">
                            {mod.label}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider shrink-0 ${mod.badgeColor}`}
                            >
                              {mod.categoryLabel}
                            </span>
                            <p className="text-[11px] text-slate-500 truncate">{mod.hint}</p>
                          </div>
                        </div>
                      </div>

                      {/* Nút tác vụ gọn gàng bên phải */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 group-hover:text-emerald-800 bg-slate-100 group-hover:bg-emerald-100/70 px-2 py-1 rounded-lg border border-slate-200/60 group-hover:border-emerald-200 transition flex items-center gap-1">
                          <span>{mod.subActions.length} tác vụ</span>
                          <Icon name="arrowRight" size={12} />
                        </span>
                      </div>
                    </div>

                    {/* Nếu tìm kiếm khớp trực tiếp với sub-actions, hiển thị các sub-action đó ngay bên dưới */}
                    {query && hasDirectSubMatch && (
                      <div className="mt-2.5 pl-12 space-y-1.5 border-t border-slate-100 pt-2">
                        {matchedSubActions.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => handleExecuteAction(mod.id)}
                            className="p-1.5 px-2.5 rounded-xl bg-brand-50/40 hover:bg-brand-50 border border-brand-100/60 flex items-center justify-between text-left cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon name={sub.icon} size={12} className="text-brand-800 shrink-0" />
                              <span className="text-[11px] font-bold text-brand-950 truncate">
                                {sub.label}
                              </span>
                            </div>
                            <span className="text-[9.5px] font-bold text-brand-800 shrink-0 flex items-center gap-0.5">
                              Mở <Icon name="arrowRight" size={10} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Footer Thông Tin & Phím Tắt */}
          <div className="px-3.5 sm:px-4 py-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[10.5px] font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold text-slate-700 shadow-2xs">
                  Chạm
                </kbd>
                <span>Mở tác vụ</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold text-slate-700 shadow-2xs">
                  ESC
                </kbd>
                <span>Đóng</span>
              </span>
            </div>

            <span className="text-[10px] font-bold text-emerald-800">A2Order Spotlight</span>
          </div>
        </div>
      </div>
    </Portal>
  );
};

