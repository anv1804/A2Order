import React, { useEffect, useMemo, useRef, useState } from "react";
import { CmsSidebar } from "./CmsSidebar";
import { CmsTopNav } from "./CmsTopNav";
import { Icon } from "@/components/ui";
import { IconName } from "@/types";
import { usePersistentState } from "@/hooks/usePersistentState";

import { CmsLayoutProps } from "@/types/cms.types";

export const CmsLayout: React.FC<CmsLayoutProps> = ({
  children,
  onLogout,
  activeMenu,
  onSelectMenu,
  currentRole,
  onChangeRole,
  enabledModules = [],
  currentUser,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState("cms_sidebar_collapsed", false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSelection, setSearchSelection] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const navigationItems = useMemo(() => currentRole === "SUPER_ADMIN" ? [
    { id: "telemetry", label: "Tổng quan nền tảng", hint: "Số liệu và hoạt động" },
    { id: "tenants", label: "Quản lý quán & chuỗi", hint: "Đối tác và thiết bị" },
    { id: "license_manager", label: "License key", hint: "Cấp và gia hạn" },
    { id: "software_invoices", label: "Hóa đơn & thu phí", hint: "Theo dõi thanh toán" },
    { id: "pricing_config", label: "Bảng giá & voucher", hint: "Cấu hình gói dịch vụ" },
    { id: "scenarios", label: "Kịch bản F&B", hint: "Thực đơn mẫu" },
    { id: "audit_logs", label: "Kiểm toán hệ thống", hint: "Nhật ký hoạt động" },
    { id: "profile", label: "Hồ sơ cá nhân", hint: "Tài khoản và quyền truy cập" },
  ] : [
    { id: "dashboard", label: "Tổng quan quán", hint: "Tình hình vận hành" },
    { id: "staff_order", label: "Gọi món", hint: "POS cầm tay" },
    { id: "tables", label: "Bàn ăn", hint: "Sơ đồ bàn" },
    { id: "kds", label: "Màn hình bếp", hint: "KDS và trạng thái món" },
    { id: "reservations", label: "Đặt bàn", hint: "Lịch hẹn khách" },
    { id: "menu", label: "Thực đơn", hint: "Món ăn và giá" },
    { id: "inventory", label: "Kho hàng", hint: "Tồn kho và nhập hàng" },
    { id: "customers", label: "Khách hàng", hint: "Hồ sơ và khách thân thiết" },
    { id: "promotions", label: "Khuyến mãi", hint: "Voucher và ưu đãi" },
    { id: "analytics", label: "Báo cáo", hint: "Doanh thu và hiệu quả" },
    { id: "team", label: "Nhân sự", hint: "Nhân viên và quyền" },
    { id: "hardware", label: "Thiết bị", hint: "Máy in và phần cứng" },
    { id: "settings", label: "Cài đặt", hint: "Cấu hình cửa hàng" },
    { id: "landing_page", label: "Website cửa hàng", hint: "Landing page và SEO" },
    { id: "profile", label: "Hồ sơ cá nhân", hint: "Tài khoản và quyền truy cập" },
  ], [currentRole]);
  const matchingNavigation = navigationItems.filter((item) => `${item.label} ${item.hint}`.toLocaleLowerCase("vi").includes(searchQuery.trim().toLocaleLowerCase("vi")));

  useEffect(() => setSearchSelection(0), [searchQuery]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
      if (event.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const displayName = currentUser?.name || (currentRole === "SUPER_ADMIN" ? "Quản Trị Viên A2Order" : "Chủ cửa hàng");
  const displayEmail = currentUser?.email || "";
  const displayStore = currentRole === "SUPER_ADMIN" ? "Nền tảng A2Order" : (currentUser?.storeName || "Cửa hàng");
  const mobilePrimaryItems: Array<{ id: string; label: string; icon: IconName }> = currentRole === "SUPER_ADMIN"
    ? [
        { id: "telemetry", label: "Tổng quan", icon: "home" },
        { id: "tenants", label: "Quán", icon: "building" },
        { id: "scenarios", label: "Kịch bản", icon: "clipboard" },
        { id: "software_invoices", label: "Hóa đơn", icon: "fileText" },
      ]
    : [
        { id: "dashboard", label: "Tổng quan", icon: "home" },
        { id: "staff_order", label: "Gọi món", icon: "cart" },
        { id: "tables", label: "Bàn ăn", icon: "table" },
        { id: "menu", label: "Thực đơn", icon: "grid" },
      ];
  const isMoreActive = !mobilePrimaryItems.some((item) => item.id === activeMenu);

  return (
    <div className="cms-workspace flex h-[100dvh] w-full overflow-hidden bg-[#f6f8f7] font-sans text-ink-primary">
      {/* 1. Desktop Fixed Left Sidebar */}
      <div className="hidden lg:block h-full shrink-0 z-30">
        <CmsSidebar
          activeMenu={activeMenu}
          onSelectMenu={onSelectMenu}
          onLogout={onLogout}
          currentRole={currentRole}
          onChangeRole={onChangeRole}
          enabledModules={enabledModules}
          currentUser={currentUser}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        />
      </div>

      {/* 2. Mobile Drawer Backdrop Overlay (Sidebar) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 3. Mobile Slide-Over Drawer Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-[340px] max-w-[calc(100vw-1rem)] bg-[#102d25] z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out flex flex-col rounded-r-3xl overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="min-h-0 flex-1">
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
            currentUser={currentUser}
            onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
          />
        </div>
      </div>

      {/* 4. Main Work Area (Chứa Header cố định + Content cuộn độc lập) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Fixed Header */}
        <header className="sticky top-0 z-10 shrink-0 bg-white/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 border-b border-slate-200/80">
          <div className="w-full">
            <CmsTopNav
              userName={displayName}
              userEmail={displayEmail}
              onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
              onOpenProfile={() => onSelectMenu("profile")}
              onOpenSearch={() => { setSearchQuery(""); setIsSearchOpen(true); }}
              activeMenuTitle={
                currentRole === "SUPER_ADMIN"
                  ? ({
                      telemetry: "Tổng Quan",
                      tenants: "Chuỗi Quán",
                      license_manager: "Giấy Phép",
                      software_invoices: "Hóa Đơn",
                      pricing_config: "Bảng Giá",
                      scenarios: "Kịch Bản",
                      audit_logs: "Giám Sát",
                      profile: "Hồ Sơ",
                    } as Record<string, string>)[activeMenu] || "Tổng Quan"
                  : ({
                      dashboard: "Tổng Quan",
                      staff_order: "Gọi Món",
                      tables: "Bàn Ăn",
                      menu: "Thực Đơn",
                      kds: "Màn Bếp",
                      analytics: "Báo Cáo",
                      inventory: "Kho Hàng",
                      team: "Nhân Sự",
                      customers: "Khách Hàng",
                      reservations: "Đặt Bàn",
                      promotions: "Khuyến Mãi",
                      settings: "Cài Đặt",
                      landing_page: "Trang Web",
                      hardware: "Thiết Bị",
                      profile: "Hồ Sơ",
                    } as Record<string, string>)[activeMenu] || "Tổng Quan"
              }
              roleBadgeText={currentRole === "SUPER_ADMIN" ? "Super Admin" : "Chủ Quán"}
              storeName={displayStore}
            />
          </div>
        </header>

        {/* Scrollable Main Content Container with responsive padding */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-8 w-full max-w-full scroll-smooth">
          <div className="mx-auto w-full min-w-0 max-w-[1680px]">{children}</div>
        </main>

        {/* Mobile navigation dock */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] lg:hidden">
          <nav aria-label="Điều hướng chính" className="pointer-events-auto mx-auto flex max-w-md items-center gap-1 rounded-[24px] border border-white/10 bg-[#102d25] p-1.5 shadow-[0_16px_40px_rgba(12,36,29,.32)]">
            {mobilePrimaryItems.map((item) => {
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMenu(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-0.5 transition-all duration-200 active:scale-95 ${isActive ? "bg-white text-[#12372a] shadow-sm" : "text-emerald-50/70 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon name={item.icon} size={19} />
                  <span className="w-full truncate text-center text-[9px] font-bold leading-tight">{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Mở tất cả chức năng"
              aria-expanded={isMobileMenuOpen}
              className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-0.5 transition-all duration-200 active:scale-95 ${isMoreActive || isMobileMenuOpen ? "bg-white text-[#12372a] shadow-sm" : "text-emerald-50/70 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon name="moreHorizontal" size={19} />
              <span className="w-full truncate text-center text-[9px] font-bold leading-tight">Tất cả</span>
            </button>
          </nav>
        </div>
      </div>


    </div>
  );
};
