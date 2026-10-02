import React from "react";
import { Icon } from "@/components/ui";
import { CmsSidebarProps, CmsSidebarMenuItem as MenuItem, CmsSidebarMenuGroup as MenuGroup } from "@/types/cms.types";

export const CmsSidebar: React.FC<CmsSidebarProps> = ({
  activeMenu,
  onSelectMenu,
  onLogout,
  currentRole,
  enabledModules = [],
  onCloseMobileDrawer,
  currentUser,
  collapsed = false,
  onToggleCollapse,
}) => {
  // Nhóm Menu chuẩn nghiệp vụ F&B dành cho Chủ Quán
  const storeOwnerGroups: MenuGroup[] = [
    {
      title: "VẬN HÀNH & BÁN HÀNG",
      items: [
        { id: "dashboard", label: "Tổng Quan Quán", icon: "activity" },
        { id: "staff_order", label: "Gọi Món", icon: "cart" },
        { id: "tables", label: "Phòng Bàn", icon: "table" },
        { id: "delivery_integrations", label: "App Giao Hàng", icon: "cart" },
        { id: "kds", label: "Bếp & Pha Chế", icon: "kitchen", requiredModule: "MODULE_KDS" as any },
        { id: "reservations", label: "Lịch Đặt Bàn", icon: "calendarCheck" },
      ],
    },
    {
      title: "THỰC ĐƠN & KHO HÀNG",
      items: [
        { id: "menu", label: "Thực Đơn", icon: "menu" },
        { id: "inventory", label: "Kho Hàng", icon: "cart" },
      ],
    },
    {
      title: "KHÁCH HÀNG & MARKETING",
      items: [
        { id: "customers", label: "Khách Hàng", icon: "userCheck" },
        { id: "promotions", label: "Khuyến Mãi", icon: "tag" },
      ],
    },
    {
      title: "TÀI CHÍNH & BÁO CÁO",
      items: [
        { id: "analytics", label: "Báo Cáo Doanh Thu", icon: "trending" },
        { id: "einvoice", label: "Hóa Đơn Điện Tử", icon: "fileText" },
      ],
    },
    {
      title: "HỆ THỐNG & CÀI ĐẶT",
      items: [
        { id: "team", label: "Nhân Viên", icon: "users" },
        { id: "hardware", label: "Máy In & Thiết Bị", icon: "print" },
        {
          id: "landing_page",
          label: "Trang Web Quán",
          icon: "globe",
          badge: enabledModules.includes("MODULE_LANDING_PAGE" as any) ? "SEO" : "PRO",
        },
        { id: "settings", label: "Cài Đặt Quán", icon: "settings" },
      ],
    },
  ];

  // Lọc chỉ hiện các chức năng quán đã đăng ký mua
  const filteredStoreOwnerGroups: MenuGroup[] = storeOwnerGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.requiredModule) return true;
        return enabledModules.includes(item.requiredModule);
      }),
    }))
    .filter((group) => group.items.length > 0);

  // Nhóm Menu dành cho Super Admin Nền Tảng (Chuẩn SaaS F&B)
  const superAdminGroups: MenuGroup[] = [
    {
      title: "TỔNG QUAN NỀN TẢNG",
      items: [
        { id: "telemetry", label: "Tổng Quan Nền Tảng", icon: "chart" },
        { id: "scenarios", label: "Kịch Bản & Món Mẫu F&B", icon: "clipboard" },
      ],
    },
    {
      title: "ĐỐI TÁC & THUÊ BAO",
      items: [
        { id: "tenants", label: "Quản Lý Quán & Chuỗi", icon: "building" },
        { id: "store_users", label: "Tài Khoản & User Quán", icon: "users" },
        { id: "license_manager", label: "Giấy Phép & License", icon: "key" },
        { id: "software_invoices", label: "Hóa Đơn & Thu Phí", icon: "fileText" },
        { id: "pricing_config", label: "Bảng Giá Gói & Voucher", icon: "tag" },
      ],
    },
    {
      title: "HỆ THỐNG & KỸ THUẬT",
      items: [
        { id: "audit_logs", label: "Kiểm Toán & Giám Sát", icon: "shield" },
      ],
    },
  ];

  // Nhóm menu cho Phục vụ bàn
  const waiterGroups: MenuGroup[] = [
    {
      title: "PHỤC VỤ & BÁN HÀNG",
      items: [
        { id: "tables", label: "Phòng Bàn", icon: "table" },
        { id: "staff_order", label: "Gọi Món", icon: "cart" },
        { id: "reservations", label: "Lịch Đặt Bàn", icon: "calendarCheck" },
      ],
    },
  ];

  // Nhóm menu cho Đầu bếp / Pha chế
  const chefGroups: MenuGroup[] = [
    {
      title: "BẾP & PHA CHẾ",
      items: [
        { id: "kds", label: "Bếp & Pha Chế", icon: "kitchen" },
        { id: "menu", label: "Thực Đơn", icon: "menu" },
      ],
    },
  ];

  // Nhóm menu cho Thu ngân
  const cashierGroups: MenuGroup[] = [
    {
      title: "THU NGÂN & BÁN HÀNG",
      items: [
        { id: "dashboard", label: "Tổng Quan Ca", icon: "activity" },
        { id: "staff_order", label: "Thu Ngân", icon: "cashier" },
        { id: "tables", label: "Phòng Bàn", icon: "table" },
        { id: "delivery_integrations", label: "App Giao Hàng", icon: "cart" },
        { id: "reservations", label: "Lịch Đặt Bàn", icon: "calendarCheck" },
        { id: "customers", label: "Khách Hàng", icon: "userCheck" },
        { id: "einvoice", label: "Hóa Đơn Điện Tử", icon: "fileText" },
      ],
    },
  ];

  // Nhóm menu cho Kế toán
  const accountantGroups: MenuGroup[] = [
    {
      title: "TÀI CHÍNH & SỔ SÁCH",
      items: [
        { id: "dashboard", label: "Tổng Quan Quán", icon: "activity" },
        { id: "analytics", label: "Báo Cáo Doanh Thu", icon: "trending" },
        { id: "inventory", label: "Kho & Nhập Hàng", icon: "cart" },
        { id: "einvoice", label: "Hóa Đơn Điện Tử (TT78)", icon: "fileText" },
      ],
    },
  ];

  const currentGroups = (() => {
    switch (currentRole) {
      case "SUPER_ADMIN":
        return superAdminGroups;
      case "ACCOUNTANT":
        return accountantGroups;
      case "CASHIER":
        return cashierGroups;
      case "CHEF":
        return chefGroups;
      case "WAITER":
        return waiterGroups;
      case "STORE_OWNER":
      default:
        return filteredStoreOwnerGroups;
    }
  })();

  const roleMeta: Record<string, { label: string; icon: any; desc: string }> = {
    SUPER_ADMIN: { label: "Quản trị nền tảng", icon: "shield", desc: "Toàn quyền SaaS A2Order" },
    STORE_OWNER: { label: "Chủ nhà hàng", icon: "store", desc: currentUser?.storeName || "Toàn quyền quản trị" },
    ACCOUNTANT: { label: "Kế toán quán", icon: "trending", desc: "Báo cáo dòng tiền & kho" },
    CASHIER: { label: "Thu ngân ca", icon: "cashier", desc: "Bán hàng & hóa đơn" },
    CHEF: { label: "Bếp / Pha chế", icon: "kitchen", desc: "Điều phối bếp KDS" },
    WAITER: { label: "Phục vụ bàn", icon: "users", desc: "Sơ đồ bàn & order" },
  };
  const activeRoleMeta = roleMeta[currentRole] || roleMeta.STORE_OWNER;

  return (
    <aside className={`flex h-full min-h-0 w-full select-none flex-col overflow-hidden bg-[#102d25] text-white transition-[width] duration-300 lg:border-r lg:border-[#0c241d] ${collapsed ? "lg:w-[76px] p-3" : "lg:w-[280px] p-4"}`}>
      <div className={`mb-5 flex shrink-0 items-center ${collapsed ? "justify-center" : "justify-between gap-3 px-1"} pt-1`}>
        <div className="flex min-w-0 items-center gap-3">
          {collapsed && onToggleCollapse ? (
            <button type="button" onClick={onToggleCollapse} aria-label="Mở rộng sidebar" title="Mở rộng sidebar" className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              <img src="/logo-symbol.jpg" alt="A2Order" className="h-10 w-10 rounded-2xl object-cover ring-1 ring-white/20" />
            </button>
          ) : <img src="/logo-symbol.jpg" alt="A2Order" className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-1 ring-white/20" />}
          {!collapsed && <div className="min-w-0">
            <span className="block truncate text-lg font-black tracking-tight">A2Order</span>
            <span className="block text-[10px] font-semibold tracking-[.14em] text-emerald-200/70">WORKSPACE</span>
          </div>}
        </div>
        {onToggleCollapse && !collapsed && <button type="button" onClick={onToggleCollapse} aria-label="Thu gọn sidebar" title="Thu gọn sidebar" className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-100 transition hover:bg-white/20 lg:flex"><Icon name="chevronLeft" size={17} /></button>}
        {onCloseMobileDrawer && (
          <button type="button" onClick={onCloseMobileDrawer} aria-label="Đóng menu" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white lg:hidden">
            <Icon name="x" size={17} />
          </button>
        )}
      </div>

      <div
        className={`mb-5 flex shrink-0 items-center ${
          collapsed
            ? "justify-center"
            : "gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-3"
        }`}
        title={collapsed ? activeRoleMeta.label : undefined}
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${collapsed ? "bg-white/10 border border-white/10 text-emerald-200" : "bg-emerald-300/20 text-emerald-200"}`}>
          <Icon name={activeRoleMeta.icon} size={18} />
        </span>
        {!collapsed && <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold">{activeRoleMeta.label}</span>
          <span className="mt-0.5 block truncate text-[10px] text-white/50">{activeRoleMeta.desc}</span>
        </span>}
        {!collapsed && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,.1)]" />}
      </div>

      <nav aria-label="Danh mục quản trị" className={`min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain sidebar-scroll ${collapsed ? "pr-0" : "pr-1"}`}>
        {currentGroups.map((group) => (
          <div key={group.title}>
            {collapsed ? <div className="w-8 mx-auto my-2 border-t border-white/10" /> : <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-100/40">{group.title}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectMenu(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={`group flex items-center transition-all duration-200 active:scale-[.98] ${
                      collapsed
                        ? "w-11 h-11 mx-auto justify-center rounded-2xl p-0"
                        : "min-h-11 w-full gap-3 rounded-xl px-3 text-left text-xs font-semibold"
                    } ${
                      isActive
                        ? "bg-white text-[#12372a] shadow-[0_8px_24px_rgba(0,0,0,.16)]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon name={item.icon} size={17} className={`shrink-0 ${isActive ? "text-emerald-800" : "text-emerald-100/60 group-hover:text-emerald-200"}`} />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.badge && <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black ${isActive ? "bg-emerald-100 text-emerald-900" : "bg-white/10 text-emerald-100"}`}>{item.badge}</span>}
                    {!collapsed && isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 shrink-0 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={() => onSelectMenu("profile")}
          aria-current={activeMenu === "profile" ? "page" : undefined}
          aria-label={collapsed ? "Hồ sơ cá nhân" : undefined}
          title={collapsed ? "Hồ sơ cá nhân" : undefined}
          className={`flex items-center transition ${
            collapsed
              ? "w-11 h-11 mx-auto justify-center rounded-2xl p-0"
              : "w-full gap-3 rounded-2xl p-2 text-left"
          } ${activeMenu === "profile" ? "bg-white text-[#12372a]" : "text-white hover:bg-white/10"}`}
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${activeMenu === "profile" ? "bg-emerald-100 text-emerald-900" : "bg-emerald-300/20 text-emerald-100"}`}>
            {(currentUser?.name || "A").charAt(0).toUpperCase()}
          </span>
          {!collapsed && <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold">{currentUser?.name || "Tài khoản quản trị"}</span>
            <span className={`mt-0.5 block truncate text-[10px] ${activeMenu === "profile" ? "text-emerald-900/60" : "text-white/50"}`}>{currentUser?.email || "Xem hồ sơ"}</span>
          </span>}
          {!collapsed && <Icon name="arrowRight" size={15} className={activeMenu === "profile" ? "text-emerald-800" : "text-white/40"} />}
        </button>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Đăng xuất"
          title={collapsed ? "Đăng xuất" : undefined}
          className={`mt-1 flex items-center transition hover:bg-white/10 hover:text-white ${
            collapsed
              ? "w-11 h-11 mx-auto justify-center rounded-2xl p-0 text-white/60"
              : "min-h-10 w-full gap-3 rounded-xl px-3 text-xs font-semibold text-white/60"
          }`}
        >
          <Icon name="logout" size={16} /> {!collapsed && "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
};
