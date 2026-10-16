import { NotificationModal } from "@/components/ui/NotificationModal";
import React, { useState } from "react";
import { Icon } from "@/components/ui";
import { ExtendedAppShellProps } from "@/types";

export const AppShell: React.FC<ExtendedAppShellProps> = ({
  storeName,
  userName,
  userRole,
  canonicalRole,
  activeTab,
  onTabChange,
  onLogout,
  onBackToTables,
  children,
  configVersion = "v7.0.0",
  hasNewVersionNotice = false,
  onSyncNewVersion,
  enabledModules = ["CORE_POS", "MODULE_KDS", "MODULE_ACCOUNTING", "MODULE_QR_ORDER"],
}) => {
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [waiterDeviceView, setWaiterDeviceView] = useState<"tablet" | "mobile">("tablet");
  const hasKds = enabledModules.includes("MODULE_KDS");

  // Chuẩn hóa kiểm tra vai trò người dùng (RBAC Matrix)
  const roleCode = (canonicalRole || "").toUpperCase();
  const roleText = (userRole || "").toUpperCase();

  // 1. Quản trị tối cao (Chủ quán, Quản lý, Super Admin) -> Có cả 3 màn hình Desktop, Tablet, Mobile & Tất cả Tabs
  const isSuperAdmin = roleCode === "SUPER_ADMIN" || roleText.includes("QUẢN TRỊ") || roleText.includes("SUPER_ADMIN");
  const isOwner = roleCode === "STORE_OWNER" || roleText.includes("CHỦ QUÁN") || roleText.includes("OWNER");
  const isManager = isSuperAdmin || isOwner || roleCode === "MANAGER" || roleText.includes("QUẢN LÝ");

  // 2. Vai trò Bếp chuyên trách (Không phải quản lý)
  const isChefOnly = (roleCode === "CHEF" || roleText.includes("BẾP") || roleText.includes("BAR")) && !isManager;

  // 3. Vai trò Thu Ngân chuyên trách (Không phải quản lý)
  const isCashierOnly = (roleCode === "CASHIER" || roleText.includes("THU NGÂN")) && !isManager;

  // 4. Vai trò Phục Vụ chuyên trách: CHỈ CÓ TABLET VÀ MOBILE
  const isWaiterOnly = (roleCode === "WAITER" || roleText.includes("PHỤC VỤ")) && !isManager && !isCashierOnly && !isChefOnly;

  // Ma trận quyền hiển thị tab
  const canViewTables = isManager || isWaiterOnly || isCashierOnly;
  const canViewKds = hasKds && (isManager || isChefOnly);
  const canViewBilling = isManager || isCashierOnly;
  const canViewMenu = true;
  const canViewChat = true;
  const canViewSchedule = true;

  return (
    <div className={`${activeTab === "chat" ? "h-[100dvh] overflow-hidden" : "min-h-screen"} bg-surface-canvas flex flex-col font-sans text-ink-primary select-none`}>
      <NotificationModal isOpen={isNotiOpen} onClose={() => setIsNotiOpen(false)} />

      {/* Thông báo cập nhật phiên bản CMS */}
      {hasNewVersionNotice && (
        <div className="bg-brand-900 text-white px-4 py-2 text-xs flex items-center justify-between select-none animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Chủ quán vừa cập nhật thực đơn / giá mới.</span>
            <span className="hidden sm:inline text-brand-200">({configVersion})</span>
          </div>

          <button
            onClick={onSyncNewVersion}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-brand-950 font-bold hover:bg-brand-100 transition-all text-[11px] shadow-sm cursor-pointer"
          >
            <Icon name="refresh" className="w-3 h-3 text-brand-950" size={12} />
            <span>Cập nhật ngay</span>
          </button>
        </div>
      )}

      {/* Top Header Bar (Hỗ trợ hoàn hảo Desktop & Tablet) */}
      <header className="h-16 bg-white border-b border-surface-border px-3 sm:px-5 flex items-center justify-between sticky top-0 z-40 shadow-card gap-2">
        {/* Left: Back button or Logo & Store Name */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 md:flex-initial">
          {activeTab !== "tables" && activeTab !== "billing" && activeTab !== "kds" && (
            <button
              onClick={onBackToTables || (() => onTabChange(isChefOnly ? "kds" : isCashierOnly ? "billing" : "tables"))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-muted hover:bg-brand-50 text-ink-primary hover:text-brand-900 border border-surface-border transition-all text-xs font-black shrink-0 active:scale-95 shadow-2xs cursor-pointer"
              title="Quay lại màn hình chính"
            >
              <Icon name="arrowLeft" className="w-4 h-4 text-brand-900" size={15} />
              <span className="hidden sm:inline">Quay Lại</span>
            </button>
          )}

          <img
            src="/logo-symbol.jpg"
            alt="A2Order"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover shadow-sm ring-1 ring-black/5 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-extrabold text-xs sm:text-sm leading-tight truncate text-ink-primary whitespace-nowrap">
                {storeName}
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-surface-muted text-ink-muted shrink-0 whitespace-nowrap hidden xs:inline">
                {configVersion}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-[10px] sm:text-[11px] text-ink-muted font-medium truncate mt-0.5 whitespace-nowrap text-left hover:text-brand-900 transition-colors flex items-center gap-1 group cursor-pointer"
              title="Nhấn để đổi ca / đăng xuất nhân viên"
            >
              <span className="font-semibold">{userName}</span>
              <span>•</span>
              <span className="text-brand-700 font-bold group-hover:underline">{userRole}</span>
              <Icon name="logout" size={11} className="text-ink-muted group-hover:text-brand-900 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Thanh Điều Hướng Trên Header - Hiện diện rõ ràng trên cả Desktop và Tablet (md:flex) */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-canvas p-1 rounded-full border border-surface-border">
          {/* 1. Tab Sơ Đồ Bàn */}
          {canViewTables && (
            <button
              onClick={() => onTabChange("tables")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "tables"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="table" size={14} />
              <span>Sơ Đồ Bàn</span>
            </button>
          )}

          {/* 2. Tab Bếp KDS */}
          {canViewKds && (
            <button
              onClick={() => onTabChange("kds")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "kds"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="kitchen" size={14} />
              <span>Bếp KDS</span>
            </button>
          )}

          {/* 3. Tab Thu Ngân POS */}
          {canViewBilling && (
            <button
              onClick={() => onTabChange("billing")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "billing"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="cashier" size={14} />
              <span>Thu Ngân POS</span>
            </button>
          )}

          {/* 4. Tab Báo Hết Món */}
          {canViewMenu && (
            <button
              onClick={() => onTabChange("menu")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "menu"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="menu" size={14} />
              <span>Hết Món</span>
            </button>
          )}

          {/* 5. Tab Bộ Đàm & Chat */}
          {canViewChat && (
            <button
              onClick={() => onTabChange("chat")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="messageSquare" size={14} />
              <span>Bộ Đàm</span>
            </button>
          )}

          {/* 6. Tab Cá Nhân & Ca Làm */}
          {canViewSchedule && (
            <button
              onClick={() => onTabChange("schedule")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "schedule"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="calendarCheck" size={14} />
              <span>Ca Làm</span>
            </button>
          )}
        </nav>

        {/* Right side: Thiết Bị Phục Vụ / Mở CMS / Đổi Ca / Thông Báo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Toggle Khung Nhìn Cho Phục Vụ (Khi mở trên màn hình lớn Desktop) */}
          {isWaiterOnly && (
            <div className="hidden lg:flex items-center gap-1 bg-surface-canvas p-1 rounded-full border border-surface-border text-[11px] font-bold">
              <span className="text-ink-muted px-2 flex items-center gap-1">
                <Icon name="smartphone" size={12} className="text-brand-800" />
                Thiết Bị:
              </span>
              <button
                type="button"
                onClick={() => setWaiterDeviceView("tablet")}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  waiterDeviceView === "tablet" ? "bg-white text-brand-950 shadow-xs font-extrabold" : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                Tablet (iPad)
              </button>
              <button
                type="button"
                onClick={() => setWaiterDeviceView("mobile")}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  waiterDeviceView === "mobile" ? "bg-white text-brand-950 shadow-xs font-extrabold" : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                Mobile (PWA)
              </button>
            </div>
          )}

          {/* Nút Mở CMS cho Quản Lý & Chủ Quán */}
          {isManager && (
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-xs font-black hover:bg-brand-100 transition-all shadow-sm"
            >
              <Icon name="externalLink" className="w-3.5 h-3.5 text-brand-900" size={14} />
              <span>Mở CMS</span>
            </a>
          )}

          {/* Nút Đổi Ca Nhanh */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-surface-border bg-white text-ink-primary hover:bg-surface-canvas hover:border-brand-300 transition-all text-xs font-bold shrink-0 shadow-2xs active:scale-95 cursor-pointer"
            title="Đổi ca làm việc / Đăng xuất nhân viên"
          >
            <Icon name="logout" className="w-3.5 h-3.5 text-brand-800" size={14} />
            <span className="hidden sm:inline">Đổi Ca</span>
          </button>

          {/* Chuông Thông Báo */}
          <button
            onClick={() => setIsNotiOpen(true)}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-surface-border bg-white text-ink-muted hover:text-ink-primary hover:bg-surface-canvas transition-all shrink-0 active:scale-95 shadow-2xs relative cursor-pointer"
            title="Thông báo"
          >
            <Icon name="bell" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-brand-600 border-2 border-white" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full flex flex-col ${
          activeTab === "chat"
            ? "p-0 pb-[60px] md:pb-0 overflow-hidden"
            : isWaiterOnly
            ? `mx-auto p-3 sm:p-5 pb-24 md:pb-8 transition-all duration-300 ${
                waiterDeviceView === "mobile" ? "max-w-md" : "max-w-3xl"
              }`
            : "p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 md:pb-8"
        }`}
      >
        {/* Banner thông báo chế độ phục vụ cầm tay trên Desktop */}
        {isWaiterOnly && (
          <div className="hidden lg:flex items-center justify-between px-4 py-2 mb-3 bg-brand-50 border border-brand-200/80 rounded-2xl text-xs text-brand-900 font-semibold shadow-2xs">
            <div className="flex items-center gap-2">
              <Icon name="smartphone" size={15} className="text-brand-800" />
              <span>
                Phân hệ Phục Vụ tối ưu cho thiết bị cầm tay: <strong>Tablet (iPad POS)</strong> và <strong>Mobile (PWA)</strong>
              </span>
            </div>
            <span className="text-[11px] font-mono text-brand-700 bg-white px-2 py-0.5 rounded-full border border-brand-200">
              {waiterDeviceView === "mobile" ? "Chiều rộng 448px" : "Chiều rộng 768px"}
            </span>
          </div>
        )}

        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Chỉ hiển thị trên Mobile < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-surface-border/80 px-2 py-1 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto flex items-center justify-around h-13">
          {/* 1. Sơ đồ bàn */}
          {canViewTables && (
            <button
              onClick={() => onTabChange("tables")}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 cursor-pointer ${
                activeTab === "tables"
                  ? "text-brand-900 bg-brand-50 font-black"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas font-medium"
              }`}
            >
              <Icon name="table" size={20} />
              <span className="text-[10px] mt-0.5">Đặt Bàn</span>
            </button>
          )}

          {/* 2. Bếp KDS */}
          {canViewKds && (
            <button
              onClick={() => onTabChange("kds")}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 cursor-pointer ${
                activeTab === "kds"
                  ? "text-brand-900 bg-brand-50 font-black"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas font-medium"
              }`}
            >
              <Icon name="kitchen" size={20} />
              <span className="text-[10px] mt-0.5">Bếp KDS</span>
            </button>
          )}

          {/* 3. Thu Ngân POS */}
          {canViewBilling && (
            <button
              onClick={() => onTabChange("billing")}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 cursor-pointer ${
                activeTab === "billing"
                  ? "text-brand-900 bg-brand-50 font-black"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas font-medium"
              }`}
            >
              <Icon name="cashier" size={20} />
              <span className="text-[10px] mt-0.5">Thu Ngân</span>
            </button>
          )}

          {/* 4. Hết Món */}
          {canViewMenu && (
            <button
              onClick={() => onTabChange("menu")}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 cursor-pointer ${
                activeTab === "menu"
                  ? "text-brand-900 bg-brand-50 font-black"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas font-medium"
              }`}
            >
              <Icon name="menu" size={20} />
              <span className="text-[10px] mt-0.5">Hết Món</span>
            </button>
          )}

          {/* 5. Bộ Đàm Chat */}
          <button
            onClick={() => onTabChange("chat")}
            className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 cursor-pointer relative ${
              activeTab === "chat"
                ? "text-brand-900 bg-brand-50 font-black"
                : "text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas font-medium"
            }`}
          >
            <Icon name="messageSquare" size={20} />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-[28%] animate-pulse" />
            <span className="text-[10px] mt-0.5">Bộ Đàm</span>
          </button>

          {/* 6. Ca Làm */}
          <button
            onClick={() => onTabChange("schedule")}
            className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 cursor-pointer ${
              activeTab === "schedule"
                ? "text-brand-900 bg-brand-50 font-black"
                : "text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas font-medium"
            }`}
          >
            <Icon name="calendarCheck" size={20} />
            <span className="text-[10px] mt-0.5">Ca Làm</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
