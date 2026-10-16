import React, { useState } from "react";
import { Icon } from "@/components/ui";
import { NotificationModal } from "@/components/ui/NotificationModal";
import { AppTab, ClientNavItem, ExtendedAppShellProps } from "@/types";

const NAV_ITEMS: ClientNavItem[] = [
  { tab: "dashboard", label: "Tổng quan", desktopLabel: "Tổng quan", icon: "chart" },
  { tab: "tables", label: "Bàn", desktopLabel: "Sơ đồ bàn", icon: "table" },
  { tab: "kds", label: "Bếp", desktopLabel: "Bếp KDS", icon: "kitchen" },
  { tab: "billing", label: "Thu ngân", desktopLabel: "Thu ngân POS", icon: "cashier" },
  { tab: "menu", label: "Thực đơn", desktopLabel: "Trạng thái món", icon: "menu" },
  { tab: "chat", label: "Bộ đàm", desktopLabel: "Bộ đàm", icon: "messageSquare" },
  { tab: "schedule", label: "Ca làm", desktopLabel: "Ca làm", icon: "calendarCheck" },
];

export const AppShell: React.FC<ExtendedAppShellProps> = ({
  storeName, userName, userRole, canonicalRole, activeTab, onTabChange, onLogout, onBackToTables,
  children, configVersion = "v7.0.0", hasNewVersionNotice = false, onSyncNewVersion,
  enabledModules = ["CORE_POS", "MODULE_KDS", "MODULE_ACCOUNTING", "MODULE_QR_ORDER"],
}) => {
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const role = (canonicalRole || userRole || "").toUpperCase();
  const isManager = ["SUPER_ADMIN", "STORE_OWNER", "MANAGER"].includes(role) || /QUẢN LÝ|CHỦ QUÁN/.test(role);
  const isChef = role === "CHEF" || /BẾP|BAR/.test(role);
  const isCashier = role === "CASHIER" || /THU NGÂN/.test(role);
  const isWaiter = role === "WAITER" || /PHỤC VỤ/.test(role);
  const allowed = NAV_ITEMS.filter(item => {
    if (item.tab === "dashboard") return isManager;
    if (item.tab === "tables") return isManager || isWaiter || isCashier;
    if (item.tab === "kds") return enabledModules.includes("MODULE_KDS") && (isManager || isChef);
    if (item.tab === "billing") return isManager || isCashier;
    return true;
  });
  const primary = allowed.slice(0, allowed.length > 4 ? 3 : 4);
  const more = allowed.slice(primary.length);
  const current = allowed.find(item => item.tab === activeTab);
  const changeTab = (tab: AppTab) => { setIsMoreOpen(false); onTabChange(tab); };
  const backTab: AppTab = isManager ? "dashboard" : isChef ? "kds" : isCashier ? "billing" : "tables";

  return <div className={`flex min-h-[100dvh] min-w-0 flex-col bg-surface-canvas font-sans text-ink-primary ${activeTab === "chat" ? "h-[100dvh] overflow-hidden" : ""}`}>
    <NotificationModal isOpen={isNotiOpen} onClose={() => setIsNotiOpen(false)} />
    {hasNewVersionNotice && <div className="flex min-h-11 items-center justify-between gap-3 bg-brand-900 px-4 py-2 text-sm text-white"><span>Thực đơn vừa được cập nhật ({configVersion})</span><button type="button" onClick={onSyncNewVersion} className="min-h-11 rounded-xl bg-white px-3 font-bold text-brand-900">Đồng bộ</button></div>}
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {activeTab !== backTab && <button type="button" onClick={onBackToTables || (() => changeTab(backTab))} className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-surface-border text-brand-900" aria-label="Quay lại"><Icon name="arrowLeft" size={20} /></button>}
        <img src="/logo-symbol.jpg" alt="A2Order" className="size-10 shrink-0 rounded-2xl border border-surface-border object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-sm font-extrabold sm:text-base">{storeName}</h1>
            {isManager && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-900 border border-brand-200">
                Toàn quyền
              </span>
            )}
          </div>
          <p className="truncate text-xs text-ink-muted">
            <span className="font-semibold text-brand-800">{userName}</span> · {userRole}
          </p>
        </div>
        <nav aria-label="Điều hướng chính" className="hidden min-w-0 items-center gap-1 overflow-x-auto rounded-2xl bg-surface-canvas p-1 lg:flex no-scrollbar">
          {allowed.map(item => <button key={item.tab} type="button" onClick={() => changeTab(item.tab)} aria-current={activeTab === item.tab ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-colors ${activeTab === item.tab ? "bg-brand-900 text-white" : "text-ink-muted hover:bg-white hover:text-brand-900"}`}><Icon name={item.icon} size={18} />{item.desktopLabel}</button>)}
        </nav>
        {isManager && (
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-brand-800 bg-brand-900 px-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-brand-800 transition-colors"
            title="Mở cổng Quản trị Nhà hàng & Báo cáo (CMS)"
          >
            <Icon name="chart" size={17} />
            <span className="hidden md:inline">Quản trị CMS</span>
            <Icon name="externalLink" size={14} className="opacity-80" />
          </a>
        )}
        <button type="button" onClick={() => setIsNotiOpen(true)} className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-surface-border" aria-label="Thông báo"><Icon name="bell" size={20} /></button>
        <button type="button" onClick={onLogout} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-surface-border px-3 text-sm font-bold text-brand-900"><Icon name="logout" size={18} /><span className="hidden sm:inline">Đổi ca</span></button>
      </div>
    </header>
    <main className={`mx-auto flex w-full max-w-7xl min-w-0 flex-1 flex-col ${activeTab === "chat" ? "overflow-hidden pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0" : "px-4 py-5 pb-[calc(104px+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:pb-8"}`}>{children}</main>
    <nav aria-label="Điều hướng mobile và tablet" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pointer-events-none lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-full border border-surface-border bg-white/95 backdrop-blur-xl p-1.5 shadow-[0_10px_30px_rgba(18,55,42,0.12)]">
        {primary.map(item => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => changeTab(item.tab)}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-brand-900 text-white shadow-xs font-black"
                  : "text-ink-muted hover:text-brand-900 hover:bg-surface-canvas"
              }`}
            >
              <Icon name={item.icon} size={18} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
        {more.length > 0 && (
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-expanded={isMoreOpen}
            className={`flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
              more.some(item => item.tab === activeTab)
                ? "bg-brand-900 text-white shadow-xs font-black"
                : "text-ink-muted hover:text-brand-900 hover:bg-surface-canvas"
            }`}
          >
            <Icon name={current && more.some(item => item.tab === activeTab) ? current.icon : "menu"} size={18} />
            <span className="truncate">{current && more.some(item => item.tab === activeTab) ? current.label : "Thêm"}</span>
          </button>
        )}
      </div>
    </nav>
    {isMoreOpen && <div className="fixed inset-0 z-50 bg-ink-primary/50 lg:hidden" onClick={() => setIsMoreOpen(false)}><div role="dialog" aria-modal="true" aria-label="Thêm chức năng" onClick={event => event.stopPropagation()} className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">Thêm chức năng</h2><button type="button" onClick={() => setIsMoreOpen(false)} className="flex size-11 items-center justify-center rounded-2xl border border-surface-border" aria-label="Đóng"><Icon name="x" size={20} /></button></div><div className="grid grid-cols-2 gap-2">{isManager && <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" className="flex min-h-14 col-span-2 items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-3 text-left text-sm font-bold text-brand-900"><Icon name="chart" size={20} /><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span>Cổng Quản Trị (CMS)</span><Icon name="externalLink" size={14} /></div><div className="text-xs font-normal text-ink-muted">Báo cáo doanh thu, kho, nhân sự</div></div></a>}{more.map(item => <button key={item.tab} type="button" onClick={() => changeTab(item.tab)} className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left text-sm font-bold ${activeTab === item.tab ? "border-brand-800 bg-brand-100 text-brand-900" : "border-surface-border text-ink-primary"}`}><Icon name={item.icon} size={20} />{item.desktopLabel}</button>)}</div></div></div>}
  </div>;
};
