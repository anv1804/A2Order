import { NotificationModal } from "@/components/ui/NotificationModal";
import React, { useState } from "react";
import { Icon } from "@/components/ui";
import { AppShellProps } from "@/types";

interface ExtendedAppShellProps extends AppShellProps {
  configVersion?: string;
  hasNewVersionNotice?: boolean;
  onSyncNewVersion?: () => void;
  enabledModules?: string[];
}

export const AppShell: React.FC<ExtendedAppShellProps> = ({
  storeName,
  userName,
  userRole,
  activeTab,
  onTabChange,
  onLogout,
  onBackToTables,
  children,
  configVersion = "v1.0.3",
  hasNewVersionNotice = false,
  onSyncNewVersion,
  enabledModules = ["CORE_POS", "MODULE_KDS", "MODULE_ACCOUNTING", "MODULE_QR_ORDER"],
}) => {
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const hasKds = enabledModules.includes("MODULE_KDS");

  // Chuẩn hóa kiểm tra vai trò người dùng (RBAC)
  const roleUpper = (userRole || "").toUpperCase();
  const isManager = roleUpper.includes("QUẢN LÝ") || roleUpper.includes("CHỦ QUÁN") || roleUpper.includes("ADMIN") || roleUpper.includes("OWNER");
  const isWaiter = roleUpper.includes("PHỤC VỤ") || roleUpper.includes("WAITER");
  const isCashier = roleUpper.includes("THU NGÂN") || roleUpper.includes("CASHIER");
  const isChef = roleUpper.includes("ĐẦU BẾP") || roleUpper.includes("BẾP") || roleUpper.includes("CHEF") || roleUpper.includes("BAR");

  return (
    <div className={`${activeTab === "chat" ? "h-[100dvh] overflow-hidden" : "min-h-screen"} bg-surface-canvas flex flex-col font-sans text-ink-primary`}>
      <NotificationModal isOpen={isNotiOpen} onClose={() => setIsNotiOpen(false)} />
      {/* Thông báo đồng bộ nhẹ nhàng khi Chủ Quán nhấn Publish từ CMS */}
      {hasNewVersionNotice && (
        <div className="bg-brand-900 text-white px-4 py-2 text-xs flex items-center justify-between select-none animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">
              Chủ quán vừa cập nhật menu/giá mới.
            </span>
            <span className="hidden sm:inline text-brand-200">
              (Đang dùng bản cache {configVersion})
            </span>
          </div>

          <button
            onClick={onSyncNewVersion}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-brand-950 font-bold hover:bg-brand-100 transition-all text-[11px] shadow-sm"
          >
            <Icon name="refresh" className="w-3 h-3 text-brand-950" size={12} />
            <span>Cập nhật ngay</span>
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 bg-white border-b border-surface-border px-3 sm:px-5 flex items-center justify-between sticky top-0 z-40 shadow-card gap-2">
        {/* Left: Back button or Logo & Store Name */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial">
          {activeTab !== "tables" && (
            <button
              onClick={onBackToTables || (() => onTabChange("tables"))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-muted hover:bg-brand-50 text-ink-primary hover:text-brand-900 border border-surface-border transition-all text-xs font-black shrink-0 active:scale-95 shadow-2xs"
              title="Quay lại Sơ Đồ Bàn"
            >
              <Icon name="arrowLeft" className="w-4 h-4 text-brand-900" size={15} />
              <span className="hidden sm:inline">Về Sơ Đồ Bàn</span>
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
            <p className="text-[10px] sm:text-[11px] text-ink-muted font-medium truncate mt-0.5 whitespace-nowrap">
              {userName} • <span className="text-brand-700 font-bold">{userRole}</span>
            </p>
          </div>
        </div>

        {/* Thanh chuyển nhanh chế độ dạng Pill (Desktop & Tablet) - Lọc chặt chẽ theo Role */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-surface-muted p-1.5 rounded-full border border-surface-border/50">
          {(isManager || isWaiter || isCashier) && (
            <button
              onClick={() => onTabChange("tables")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "tables"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
              }`}
            >
              <Icon name="cart" size={14} />
              Đặt Bàn
            </button>
          )}

          {hasKds && (isManager || isChef) && (
            <button
              onClick={() => onTabChange("kds")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "kds"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
              }`}
            >
              <Icon name="kitchen" size={14} />
              Bếp KDS
            </button>
          )}

          {(isManager || isCashier) && (
            <button
              onClick={() => onTabChange("billing")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "billing"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
              }`}
            >
              <Icon name="cashier" size={14} />
              Thu ngân
            </button>
          )}

          {(isManager || isWaiter || isChef) && (
            <button
              onClick={() => onTabChange("menu")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "menu"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
              }`}
            >
              <Icon name="menu" size={14} />
              Báo Hết Món
            </button>
          )}

          {/* Tab Bộ đàm & Chat nội bộ */}
          <button
            onClick={() => onTabChange("chat")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "chat"
                ? "bg-brand-900 text-white shadow-sm"
                : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
            }`}
          >
            <Icon name="messageSquare" size={14} />
            Bộ Đàm
          </button>

          {/* Tab Cá Nhân / Lịch & Chấm Công */}
          <button
            onClick={() => onTabChange("schedule")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "schedule"
                ? "bg-brand-900 text-white shadow-sm"
                : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
            }`}
          >
            <Icon name="calendarCheck" size={14} />
            Cá Nhân
          </button>
        </nav>

        {/* Right side: Quản trị CMS link (nếu là quản lý) & Đổi nhân viên / Đăng xuất */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isManager && (
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-xs font-black hover:bg-brand-100 transition-all shadow-sm"
            >
              <Icon name="externalLink" className="w-3.5 h-3.5 text-brand-900" size={14} />
              <span>Mở CMS</span>
            </a>
          )}

          <button
            onClick={() => setIsNotiOpen(true)}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-surface-border bg-white text-ink-muted hover:text-ink-primary hover:bg-surface-canvas transition-all shrink-0 active:scale-95 shadow-2xs relative"
            title="Thông báo"
          >
            <Icon name="bell" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 w-full flex flex-col ${activeTab === "chat" ? "p-0 pb-[60px] md:pb-0 overflow-hidden" : "p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 md:pb-8"}`}>
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar - Lọc nghiêm ngặt theo Role */}
      {/* Mobile Fixed Bottom Navigation Bar - Lọc nghiêm ngặt theo Role */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-surface-border/80 px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto flex items-center justify-around h-12">
          {(isManager || isWaiter || isCashier) && (
            <button
              onClick={() => onTabChange("tables")}
              className={`flex items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 ${
                activeTab === "tables"
                  ? "text-brand-900 bg-brand-50"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-muted"
              }`}
            >
              <Icon name="cart" size={24} />
            </button>
          )}

          {hasKds && (isManager || isChef) && (
            <button
              onClick={() => onTabChange("kds")}
              className={`flex items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 ${
                activeTab === "kds"
                  ? "text-brand-900 bg-brand-50"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-muted"
              }`}
            >
              <Icon name="kitchen" size={24} />
            </button>
          )}

          {(isManager || isCashier) && (
            <button
              onClick={() => onTabChange("billing")}
              className={`flex items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 ${
                activeTab === "billing"
                  ? "text-brand-900 bg-brand-50"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-muted"
              }`}
            >
              <Icon name="cashier" size={24} />
            </button>
          )}

          {(isManager || isWaiter || isChef) && (
            <button
              onClick={() => onTabChange("menu")}
              className={`flex items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 ${
                activeTab === "menu"
                  ? "text-brand-900 bg-brand-50"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-muted"
              }`}
            >
              <Icon name="menu" size={24} />
            </button>
          )}

          {/* Tab Chat / Bộ Đàm Nội Bộ trên Mobile */}
          <button
            onClick={() => onTabChange("chat")}
            className={`flex items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 relative ${
              activeTab === "chat"
                ? "text-brand-900 bg-brand-50"
                : "text-ink-subtle hover:text-ink-primary hover:bg-surface-muted"
            }`}
          >
            <Icon name="messageSquare" size={24} />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-[25%] animate-pulse shadow-sm" />
          </button>

          {/* Tab Lịch & Chấm Công trên Mobile */}
          <button
            onClick={() => onTabChange("schedule")}
            className={`flex items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 ${
              activeTab === "schedule"
                ? "text-brand-900 bg-brand-50"
                : "text-ink-subtle hover:text-ink-primary hover:bg-surface-muted"
            }`}
          >
            <Icon name="calendarCheck" size={24} />
          </button>
        </div>
      </nav>
    </div>
  );
};
