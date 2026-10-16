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

  // 4. Vai trò Phục Vụ chuyên trách
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
        <div className="bg-brand-900 text-white px-3 sm:px-4 py-2 text-xs flex items-center justify-between select-none animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[11px] sm:text-xs">Chủ quán vừa cập nhật thực đơn / giá mới.</span>
            <span className="hidden sm:inline text-brand-200 text-xs">({configVersion})</span>
          </div>

          <button
            onClick={onSyncNewVersion}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white text-brand-950 font-bold hover:bg-brand-100 transition-all text-[10px] sm:text-[11px] shadow-sm cursor-pointer shrink-0"
          >
            <Icon name="refresh" className="w-3 h-3 text-brand-950" size={12} />
            <span>Cập nhật</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. MOBILE TOP HEADER (md:hidden): 1 dòng chuẩn thực tế F&B      */}
      {/* Chiều cao h-14 (56px), không tràn lề, không dồn chữ nhiều dòng   */}
      {/* ============================================================== */}
      <header className="md:hidden h-14 bg-white/95 backdrop-blur-md border-b border-surface-border px-3 flex items-center justify-between sticky top-0 z-40 shadow-xs gap-2">
        {/* Trái: Nút Quay lại (nếu có) + Logo + Tên Quán / Nhân Viên */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {activeTab !== "tables" && activeTab !== "billing" && activeTab !== "kds" && (
            <button
              onClick={onBackToTables || (() => onTabChange(isChefOnly ? "kds" : isCashierOnly ? "billing" : "tables"))}
              className="w-8 h-8 rounded-xl bg-surface-muted hover:bg-brand-50 text-ink-primary hover:text-brand-900 border border-surface-border flex items-center justify-center shrink-0 active:scale-95 cursor-pointer shadow-2xs"
              title="Quay lại"
            >
              <Icon name="arrowLeft" className="w-4 h-4 text-brand-900" size={16} />
            </button>
          )}

          <img
            src="/logo-symbol.jpg"
            alt="A2Order"
            className="w-8 h-8 rounded-xl object-cover shadow-2xs ring-1 ring-black/5 shrink-0"
          />

          <div className="min-w-0 flex-1">
            <h1 className="font-black text-xs text-ink-primary truncate leading-tight">
              {storeName}
            </h1>
            <div className="text-[10px] text-ink-muted truncate font-medium flex items-center gap-1 mt-0.5">
              <span className="font-bold text-brand-800 truncate">{userName}</span>
              <span>•</span>
              <span className="truncate">{userRole}</span>
            </div>
          </div>
        </div>

        {/* Phải: Nút Đổi Ca nhỏ gọn + Chuông thông báo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="h-8 px-2.5 rounded-full border border-surface-border bg-surface-canvas text-ink-primary hover:bg-brand-50 hover:text-brand-900 hover:border-brand-200 transition-all text-[11px] font-bold flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer shadow-2xs"
            title="Đổi ca làm việc / Đăng xuất"
          >
            <Icon name="logout" className="w-3 h-3 text-brand-800" size={12} />
            <span className="font-bold">Đổi Ca</span>
          </button>

          <button
            onClick={() => setIsNotiOpen(true)}
            className="w-8 h-8 rounded-full border border-surface-border bg-white text-ink-muted hover:text-ink-primary hover:bg-surface-canvas flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-2xs relative cursor-pointer"
            title="Thông báo"
          >
            <Icon name="bell" className="w-4 h-4" size={15} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 border-2 border-white" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. DESKTOP & TABLET HEADER (hidden md:flex): Rộng rãi, Đầy đủ  */}
      {/* Chiều cao h-16 (64px), Menu Pill Tabs ở giữa, Phân quyền rõ ràng */}
      {/* ============================================================== */}
      <header className="hidden md:flex h-16 bg-white border-b border-surface-border px-5 lg:px-6 items-center justify-between sticky top-0 z-40 shadow-xs gap-4">
        {/* Trái: Logo + Tên quán + Nhân viên & Ca làm */}
        <div className="flex items-center gap-3 shrink-0">
          {activeTab !== "tables" && activeTab !== "billing" && activeTab !== "kds" && (
            <button
              onClick={onBackToTables || (() => onTabChange(isChefOnly ? "kds" : isCashierOnly ? "billing" : "tables"))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-brand-50 text-ink-primary hover:text-brand-900 border border-surface-border transition-all text-xs font-black shrink-0 active:scale-95 cursor-pointer shadow-2xs"
              title="Quay lại màn hình chính"
            >
              <Icon name="arrowLeft" className="w-4 h-4 text-brand-900" size={15} />
              <span>Quay Lại</span>
            </button>
          )}

          <img
            src="/logo-symbol.jpg"
            alt="A2Order"
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl object-cover shadow-sm ring-1 ring-black/5 shrink-0"
          />

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm lg:text-base leading-tight text-ink-primary whitespace-nowrap">
                {storeName}
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-muted text-ink-muted">
                {configVersion}
              </span>
            </div>
            <p className="text-xs text-ink-muted font-medium mt-0.5 flex items-center gap-1.5">
              <span className="font-semibold text-ink-primary">{userName}</span>
              <span>•</span>
              <span className="text-brand-800 font-bold">{userRole}</span>
            </p>
          </div>
        </div>

        {/* Giữa: Menu Điều Hướng Dạng Pill Tabs cho Desktop & Tablet */}
        <nav className="flex items-center gap-1 bg-surface-canvas p-1 rounded-full border border-surface-border">
          {canViewTables && (
            <button
              onClick={() => onTabChange("tables")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "tables"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="table" size={15} />
              <span>Sơ Đồ Bàn</span>
            </button>
          )}

          {canViewKds && (
            <button
              onClick={() => onTabChange("kds")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "kds"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="kitchen" size={15} />
              <span>Bếp KDS</span>
            </button>
          )}

          {canViewBilling && (
            <button
              onClick={() => onTabChange("billing")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "billing"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="cashier" size={15} />
              <span>Thu Ngân POS</span>
            </button>
          )}

          {canViewMenu && (
            <button
              onClick={() => onTabChange("menu")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "menu"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="menu" size={15} />
              <span>Hết Món</span>
            </button>
          )}

          {canViewChat && (
            <button
              onClick={() => onTabChange("chat")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="messageSquare" size={15} />
              <span>Bộ Đàm</span>
            </button>
          )}

          {canViewSchedule && (
            <button
              onClick={() => onTabChange("schedule")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "schedule"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/80"
              }`}
            >
              <Icon name="calendarCheck" size={15} />
              <span>Ca Làm</span>
            </button>
          )}
        </nav>

        {/* Phải: Mở CMS (Owner/Manager), Đổi Ca, Thông Báo */}
        <div className="flex items-center gap-2 shrink-0">
          {isManager && (
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-xs font-black hover:bg-brand-100 transition-all shadow-2xs"
            >
              <Icon name="externalLink" className="w-3.5 h-3.5 text-brand-900" size={14} />
              <span>Mở CMS</span>
            </a>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-surface-border bg-white text-ink-primary hover:bg-surface-canvas hover:border-brand-300 transition-all text-xs font-bold shrink-0 shadow-2xs active:scale-95 cursor-pointer"
            title="Đổi ca làm việc / Đăng xuất"
          >
            <Icon name="logout" className="w-3.5 h-3.5 text-brand-800" size={14} />
            <span>Đổi Ca</span>
          </button>

          <button
            onClick={() => setIsNotiOpen(true)}
            className="w-9 h-9 rounded-full border border-surface-border bg-white text-ink-muted hover:text-ink-primary hover:bg-surface-canvas flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-2xs relative cursor-pointer"
            title="Thông báo"
          >
            <Icon name="bell" className="w-4 h-4 text-ink-muted" size={16} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-600 border-2 border-white" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. MAIN CONTENT: Tự nhiên trên mọi kích cỡ, KHÔNG ép dồn giữa  */}
      {/* ============================================================== */}
      <main
        className={`flex-1 w-full flex flex-col ${
          activeTab === "chat"
            ? "p-0 pb-[60px] md:pb-0 overflow-hidden"
            : "w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 pb-24 md:pb-8"
        }`}
      >
        {children}
      </main>

      {/* ============================================================== */}
      {/* 4. MOBILE BOTTOM NAV (md:hidden): Thanh điều hướng chuẩn ngón cái*/}
      {/* ============================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-surface-border/80 px-2 py-1 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto flex items-center justify-around h-14">
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
              <span className="text-[10px] mt-0.5 font-bold">Sơ Đồ Bàn</span>
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
              <span className="text-[10px] mt-0.5 font-bold">Bếp KDS</span>
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
              <span className="text-[10px] mt-0.5 font-bold">Thu Ngân</span>
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
              <span className="text-[10px] mt-0.5 font-bold">Hết Món</span>
            </button>
          )}

          {/* 5. Bộ Đàm Chat */}
          {canViewChat && (
            <button
              onClick={() => onTabChange("chat")}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 cursor-pointer relative ${
                activeTab === "chat"
                  ? "text-brand-900 bg-brand-50 font-black"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas font-medium"
              }`}
            >
              <Icon name="messageSquare" size={20} />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-[28%] animate-pulse" />
              <span className="text-[10px] mt-0.5 font-bold">Bộ Đàm</span>
            </button>
          )}

          {/* 6. Ca Làm */}
          {canViewSchedule && (
            <button
              onClick={() => onTabChange("schedule")}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all active:scale-95 cursor-pointer ${
                activeTab === "schedule"
                  ? "text-brand-900 bg-brand-50 font-black"
                  : "text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas font-medium"
              }`}
            >
              <Icon name="calendarCheck" size={20} />
              <span className="text-[10px] mt-0.5 font-bold">Ca Làm</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};
