import React from "react";
import { Icon } from "@/components/ui";
import { AppShellProps } from "@/types";

export const AppShell: React.FC<AppShellProps> = ({
  storeName,
  userName,
  userRole,
  activeTab,
  onTabChange,
  onLogout,
  children,
}) => {
  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col font-sans text-ink-primary">
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
            <h1 className="font-extrabold text-sm leading-tight truncate max-w-[160px] sm:max-w-xs text-ink-primary">
              {storeName}
            </h1>
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
            <Icon name="table" size={15} />
            Sơ đồ bàn
          </button>
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
            Thực đơn
          </button>
        </nav>

        {/* Nút Đổi ca */}
        <button
          onClick={onLogout}
          className="text-xs bg-surface-muted hover:bg-slate-200 px-3.5 py-2 rounded-full text-ink-muted hover:text-ink-primary flex items-center gap-1.5 font-bold transition-all"
        >
          <Icon name="logout" size={14} />
          <span className="hidden sm:inline">Đổi ca</span>
        </button>
      </header>

      {/* Main View Area */}
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Pill Active States) */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-surface-border grid grid-cols-4 items-center z-40 select-none px-2 shadow-lg">
        <button
          onClick={() => onTabChange("tables")}
          className={`flex flex-col items-center justify-center gap-1 h-12 rounded-2xl transition-all ${
            activeTab === "tables" ? "bg-brand-100 text-brand-900 font-extrabold" : "text-ink-muted"
          }`}
        >
          <Icon name="table" size={18} />
          <span className="text-[10px]">Bàn ăn</span>
        </button>
        <button
          onClick={() => onTabChange("kds")}
          className={`flex flex-col items-center justify-center gap-1 h-12 rounded-2xl transition-all ${
            activeTab === "kds" ? "bg-brand-100 text-brand-900 font-extrabold" : "text-ink-muted"
          }`}
        >
          <Icon name="kitchen" size={18} />
          <span className="text-[10px]">Bếp</span>
        </button>
        <button
          onClick={() => onTabChange("billing")}
          className={`flex flex-col items-center justify-center gap-1 h-12 rounded-2xl transition-all ${
            activeTab === "billing" ? "bg-brand-100 text-brand-900 font-extrabold" : "text-ink-muted"
          }`}
        >
          <Icon name="cashier" size={18} />
          <span className="text-[10px]">Thu ngân</span>
        </button>
        <button
          onClick={() => onTabChange("menu")}
          className={`flex flex-col items-center justify-center gap-1 h-12 rounded-2xl transition-all ${
            activeTab === "menu" ? "bg-brand-100 text-brand-900 font-extrabold" : "text-ink-muted"
          }`}
        >
          <Icon name="menu" size={18} />
          <span className="text-[10px]">Thực đơn</span>
        </button>
      </footer>
    </div>
  );
};
