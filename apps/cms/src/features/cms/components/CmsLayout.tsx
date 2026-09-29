import React, { useState } from "react";
import { CmsSidebar } from "./CmsSidebar";
import { CmsTopNav } from "./CmsTopNav";
import { Icon } from "@/components/ui";

import { CmsLayoutProps } from "@/types/cms.types";

export const CmsLayout: React.FC<CmsLayoutProps> = ({
  children,
  onLogout,
  activeMenu,
  onSelectMenu,
  currentRole,
  onChangeRole,
  enabledModules = [],
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface-canvas flex font-sans text-ink-primary">
      {/* 1. Desktop Fixed Left Sidebar */}
      <div className="hidden lg:block h-full shrink-0 z-30">
        <CmsSidebar
          activeMenu={activeMenu}
          onSelectMenu={onSelectMenu}
          onLogout={onLogout}
          currentRole={currentRole}
          onChangeRole={onChangeRole}
          enabledModules={enabledModules}
        />
      </div>

      {/* 2. Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 3. Mobile Slide-Over Drawer Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-80 max-w-[86vw] bg-white z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out flex flex-col rounded-r-3xl overflow-hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <CmsSidebar
            activeMenu={activeMenu}
            onSelectMenu={(menu) => {
              onSelectMenu(menu);
              setIsMobileMenuOpen(false);
            }}
            onLogout={onLogout}
            currentRole={currentRole}
            onChangeRole={onChangeRole}
            enabledModules={enabledModules}
            onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
          />
        </div>
      </div>

      {/* 4. Main Work Area (Chứa Header cố định + Content cuộn độc lập) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Fixed Header */}
        <header className="sticky top-0 z-10 shrink-0 bg-surface-canvas px-3 sm:px-6 lg:px-8 pt-2.5 pb-2 sm:pt-3.5 sm:pb-2.5 border-b border-surface-border">
          <div className="w-full">
            <CmsTopNav
              userName={currentRole === "SUPER_ADMIN" ? "Quản Trị Viên A2Order" : "Nguyễn Thành An"}
              userEmail={currentRole === "SUPER_ADMIN" ? "superadmin@a2order.vn" : "an.owner@a2order.vn"}
              onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
              canGoBack={activeMenu !== "dashboard"}
              onBack={() => onSelectMenu("dashboard")}
              activeMenuTitle={
                ({
                  dashboard: "Tổng Quan Quán",
                  staff_order: "Gọi Món Tại Bàn",
                  tables: "Sơ Đồ Bàn Ăn",
                  menu: "Thực Đơn Món",
                  kds: "Màn Hình Bếp KDS",
                  analytics: "Báo Cáo Doanh Thu",
                  inventory: "Quản Lý Kho",
                  staff: "Nhân Sự & Ca Làm",
                  customers: "Khách Hàng",
                  reservations: "Lịch Đặt Bàn",
                  promotions: "Khuyến Mãi",
                  settings: "Cài Đặt Quán",
                  landing_builder: "Trang Web Quán",
                  super_admin: "Super Admin",
                  telemetry: "Tổng Quan & Doanh Số SaaS",
                  tenants: "Quản Lý Quán & Chuỗi",
                  software_invoices: "Hóa Đơn & Thu Phí",
                  pricing_config: "Bảng Giá Gói & Voucher",
                  audit_logs: "Kiểm Toán & Giám Sát",
                } as Record<string, string>)[activeMenu] || "Phở Nam Định"
              }
            />
          </div>
        </header>

        {/* Scrollable Main Content Container with responsive padding */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-20 lg:pb-6 w-full">
          {children}
        </main>

        {/* Mobile Horizontal Bottom Navigation Bar - Chuẩn Native App */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-surface-border/80 px-2 pt-1.5 pb-2 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-md mx-auto flex items-center justify-around">
            {/* 1. Tổng quan */}
            <button
              onClick={() => onSelectMenu("dashboard")}
              className={`flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 ${
                activeMenu === "dashboard"
                  ? "text-brand-950 font-black"
                  : "text-ink-muted hover:text-ink-primary font-semibold"
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-all ${
                  activeMenu === "dashboard"
                    ? "bg-brand-900 text-white shadow-md shadow-brand-900/20 scale-105"
                    : "text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                <Icon name="chart" size={18} />
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight">Tổng Quan</span>
            </button>

            {/* 2. Order Cầm Tay / Đặt Bàn với icon Giỏ Hàng nổi bật */}
            <button
              onClick={() => onSelectMenu("staff_order")}
              className={`flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 ${
                activeMenu === "staff_order"
                  ? "text-brand-950 font-black"
                  : "text-ink-muted hover:text-ink-primary font-semibold"
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-all ${
                  activeMenu === "staff_order"
                    ? "bg-brand-900 text-white shadow-md shadow-brand-900/20 scale-105"
                    : "text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                <Icon name="cart" size={18} />
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight">Gọi Món</span>
            </button>

            {/* 3. Sơ đồ bàn */}
            <button
              onClick={() => onSelectMenu("tables")}
              className={`flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 ${
                activeMenu === "tables"
                  ? "text-brand-950 font-black"
                  : "text-ink-muted hover:text-ink-primary font-semibold"
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-all ${
                  activeMenu === "tables"
                    ? "bg-brand-900 text-white shadow-md shadow-brand-900/20 scale-105"
                    : "text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                <Icon name="table" size={18} />
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight">Bàn Ăn</span>
            </button>

            {/* 4. Doanh thu / Báo cáo */}
            <button
              onClick={() => onSelectMenu("analytics")}
              className={`flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 ${
                activeMenu === "analytics"
                  ? "text-brand-950 font-black"
                  : "text-ink-muted hover:text-ink-primary font-semibold"
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-all ${
                  activeMenu === "analytics"
                    ? "bg-brand-900 text-white shadow-md shadow-brand-900/20 scale-105"
                    : "text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                <Icon name="trending" size={18} />
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight">Báo Cáo</span>
            </button>

            {/* 5. Mở toàn bộ Menu với icon bars chuẩn */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-0.5 px-1 rounded-2xl transition-all active:scale-95 text-ink-muted hover:text-ink-primary font-semibold"
            >
              <div className="p-1.5 rounded-2xl text-ink-secondary hover:bg-surface-muted">
                <Icon name="bars" size={18} />
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight">Menu Khác</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};
