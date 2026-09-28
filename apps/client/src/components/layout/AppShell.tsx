import React from "react";
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
  children,
  configVersion = "v1.0.3",
  hasNewVersionNotice = false,
  onSyncNewVersion,
  enabledModules = ["CORE_POS", "MODULE_KDS", "MODULE_ACCOUNTING", "MODULE_QR_ORDER"],
}) => {
  const hasKds = enabledModules.includes("MODULE_KDS");
  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col font-sans text-ink-primary">
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
      <header className="h-16 bg-white border-b border-surface-border px-5 flex items-center justify-between sticky top-0 z-40 shadow-card">
        {/* Logo & Store Name */}
        <div className="flex items-center gap-3">
          <img
            src="/logo-symbol.jpg"
            alt="A2Order"
            className="w-10 h-10 rounded-2xl object-cover shadow-sm ring-1 ring-black/5"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm leading-tight truncate max-w-[160px] sm:max-w-xs text-ink-primary">
                {storeName}
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-muted text-ink-muted">
                {configVersion}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted font-medium">
              {userName} • <span className="text-brand-700 font-bold">{userRole}</span>
            </p>
          </div>
        </div>

        {/* Thanh chuyển nhanh chế độ dạng Pill (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-surface-muted p-1.5 rounded-full border border-surface-border/50">
          <button
            onClick={() => onTabChange("tables")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "tables"
                ? "bg-brand-900 text-white shadow-sm"
                : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
            }`}
          >
            <Icon name="cart" size={15} />
            Đặt Bàn & Giỏ Món
          </button>
          {hasKds && (
            <button
              onClick={() => onTabChange("kds")}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "kds"
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
              }`}
            >
              <Icon name="kitchen" size={15} />
              Bếp KDS
            </button>
          )}
          <button
            onClick={() => onTabChange("billing")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "billing"
                ? "bg-brand-900 text-white shadow-sm"
                : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
            }`}
          >
            <Icon name="cashier" size={15} />
            Thu ngân
          </button>
          <button
            onClick={() => onTabChange("menu")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "menu"
                ? "bg-brand-900 text-white shadow-sm"
                : "text-ink-muted hover:text-ink-primary hover:bg-white/50"
            }`}
          >
            <Icon name="menu" size={15} />
            Món ăn (86)
          </button>
        </nav>

        {/* Right side: Nút Đăng xuất & Link CMS */}
        <div className="flex items-center gap-2">
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-xs font-black hover:bg-brand-100 transition-all shadow-sm"
          >
            <Icon name="externalLink" className="w-3.5 h-3.5 text-brand-900" size={14} />
            <span>Mở CMS Quản Trị</span>
          </a>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-full border border-surface-border text-xs font-bold text-ink-muted hover:text-ink-primary hover:bg-surface-canvas transition-all"
          >
            Đổi nhân viên
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar - Chuẩn Native App */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-surface-border/80 px-3 pt-1.5 pb-2 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Nút Đặt Bàn / Giỏ Món với Icon Giỏ Hàng theo yêu cầu */}
          <button
            onClick={() => onTabChange("tables")}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 ${
              activeTab === "tables"
                ? "text-brand-950 font-black"
                : "text-ink-muted hover:text-ink-primary font-semibold"
            }`}
          >
            <div
              className={`p-2 rounded-2xl transition-all ${
                activeTab === "tables"
                  ? "bg-brand-900 text-white shadow-md shadow-brand-900/20 scale-105"
                  : "text-ink-secondary hover:bg-surface-muted"
              }`}
            >
              <Icon name="cart" size={19} />
            </div>
            <span className="text-[11px] mt-1 leading-none tracking-tight">Đặt Bàn</span>
          </button>

          {hasKds && (
            <button
              onClick={() => onTabChange("kds")}
              className={`flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 ${
                activeTab === "kds"
                  ? "text-brand-950 font-black"
                  : "text-ink-muted hover:text-ink-primary font-semibold"
              }`}
            >
              <div
                className={`p-2 rounded-2xl transition-all ${
                  activeTab === "kds"
                    ? "bg-brand-900 text-white shadow-md shadow-brand-900/20 scale-105"
                    : "text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                <Icon name="kitchen" size={19} />
              </div>
              <span className="text-[11px] mt-1 leading-none tracking-tight">Bếp KDS</span>
            </button>
          )}

          <button
            onClick={() => onTabChange("billing")}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 ${
              activeTab === "billing"
                ? "text-brand-950 font-black"
                : "text-ink-muted hover:text-ink-primary font-semibold"
            }`}
          >
            <div
              className={`p-2 rounded-2xl transition-all ${
                activeTab === "billing"
                  ? "bg-brand-900 text-white shadow-md shadow-brand-900/20 scale-105"
                  : "text-ink-secondary hover:bg-surface-muted"
              }`}
            >
              <Icon name="cashier" size={19} />
            </div>
            <span className="text-[11px] mt-1 leading-none tracking-tight">Thu Ngân</span>
          </button>

          <button
            onClick={() => onTabChange("menu")}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 ${
              activeTab === "menu"
                ? "text-brand-950 font-black"
                : "text-ink-muted hover:text-ink-primary font-semibold"
            }`}
          >
            <div
              className={`p-2 rounded-2xl transition-all ${
                activeTab === "menu"
                  ? "bg-brand-900 text-white shadow-md shadow-brand-900/20 scale-105"
                  : "text-ink-secondary hover:bg-surface-muted"
              }`}
            >
              <Icon name="menu" size={19} />
            </div>
            <span className="text-[11px] mt-1 leading-none tracking-tight">Món Ăn</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
