import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { CmsLayout } from "@/features/cms/components/CmsLayout";
import { CmsNotFoundPage } from "@/features/cms/components/CmsNotFoundPage";
import { AdminLoginPage, OwnerLoginPage } from "@/features/auth";
import { GlobalFeedback } from "@/components/feedback";
import { LoadingScreen, CmsPageSkeleton, ErrorBoundary, Icon } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { hasUnsavedChanges, useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { AuthUser } from "@/types";
import { CmsAppRole } from "@/types/cms.types";
import { AppModule } from "@a2order/shared";
import { usePersistentState } from "@/hooks/usePersistentState";
import { API_BASE_URL } from "@/services/api/apiClient";

// Hàm bọc lazy load chống lỗi chunk/module 404 sau khi build hoặc HMR
function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(() => {
    const execute = (attemptsLeft: number): Promise<{ default: T }> => {
      return factory().catch((error) => {
        if (attemptsLeft > 0) {
          return new Promise<{ default: T }>((resolve) => setTimeout(resolve, 350)).then(() =>
            execute(attemptsLeft - 1)
          );
        }
        throw error;
      });
    };
    return execute(retries);
  });
}

// Tải bất đồng bộ (Lazy-load & Code-splitting) các phân hệ CMS để giảm tải bundle và hiển thị Skeleton tức thì
const CmsDashboard = safeLazy(() => import("@/features/cms").then((m) => ({ default: m.CmsDashboard })));
const CmsSuperAdminView = safeLazy(() =>
  import("@/features/cms/components/CmsSuperAdminView").then((m) => ({ default: m.CmsSuperAdminView }))
);
const CmsAdminPricingManager = safeLazy(() =>
  import("@/features/cms/components/CmsAdminPricingManager").then((m) => ({ default: m.CmsAdminPricingManager }))
);
const ScenarioTemplateManager = safeLazy(() =>
  import("@/features/cms/components/superAdmin/ScenarioTemplateManager").then((m) => ({
    default: m.ScenarioTemplateManager,
  }))
);
const CmsDeepAnalyticsView = safeLazy(() =>
  import("@/features/cms/components/CmsDeepAnalyticsView").then((m) => ({ default: m.CmsDeepAnalyticsView }))
);
const CmsLandingPageEditor = safeLazy(() =>
  import("@/features/cms/components/CmsLandingPageEditor").then((m) => ({ default: m.CmsLandingPageEditor }))
);
const CmsTableManagement = safeLazy(() =>
  import("@/features/cms/components/CmsTableManagement").then((m) => ({ default: m.CmsTableManagement }))
);
const CmsMenuManagement = safeLazy(() =>
  import("@/features/cms/components/CmsMenuManagement").then((m) => ({ default: m.CmsMenuManagement }))
);
const CmsReservationsManagement = safeLazy(() =>
  import("@/features/cms/components/CmsReservationsManagement").then((m) => ({ default: m.CmsReservationsManagement }))
);
const CmsStaffManagement = safeLazy(() =>
  import("@/features/cms/components/CmsStaffManagement").then((m) => ({ default: m.CmsStaffManagement }))
);
const CmsStoreSettings = safeLazy(() =>
  import("@/features/cms/components/CmsStoreSettings").then((m) => ({ default: m.CmsStoreSettings }))
);
const CmsInventoryManagement = safeLazy(() =>
  import("@/features/cms/components/CmsInventoryManagement").then((m) => ({ default: m.CmsInventoryManagement }))
);
const CmsKdsView = safeLazy(() =>
  import("@/features/cms/components/CmsKdsView").then((m) => ({ default: m.CmsKdsView }))
);
const CmsStaffOrderView = safeLazy(() =>
  import("@/features/cms/components/CmsStaffOrderView").then((m) => ({ default: m.CmsStaffOrderView }))
);
const CmsCustomerManagement = safeLazy(() =>
  import("@/features/cms/components/CmsCustomerManagement").then((m) => ({ default: m.CmsCustomerManagement }))
);
const CmsPromotionsManagement = safeLazy(() =>
  import("@/features/cms/components/CmsPromotionsManagement").then((m) => ({ default: m.CmsPromotionsManagement }))
);
const CmsHardwareSettings = safeLazy(() =>
  import("@/features/cms/components/CmsHardwareSettings").then((m) => ({ default: m.CmsHardwareSettings }))
);
const CmsDeliveryIntegrations = safeLazy(() =>
  import("@/features/cms/components/CmsDeliveryIntegrations").then((m) => ({ default: m.CmsDeliveryIntegrations }))
);
const CmsEInvoiceManagement = safeLazy(() =>
  import("@/features/cms/components/CmsEInvoiceManagement").then((m) => ({ default: m.CmsEInvoiceManagement }))
);
const CmsProfileView = safeLazy(() =>
  import("@/features/cms/components/CmsProfileView").then((m) => ({ default: m.CmsProfileView }))
);
const CustomerTableOrderPage = safeLazy(() =>
  import("@/features/ordering/CustomerTableOrderPage").then((m) => ({ default: m.CustomerTableOrderPage }))
);

const AUTH_TOKEN_KEY = "a2order_auth_token";
const AUTH_USER_KEY = "a2order_auth_user";

const ROLE_ALLOWED_MENUS: Record<CmsAppRole, string[]> = {
  SUPER_ADMIN: [
    "telemetry",
    "tenants",
    "store_users",
    "license_manager",
    "software_invoices",
    "pricing_config",
    "scenarios",
    "audit_logs",
    "profile",
  ],
  STORE_OWNER: [
    "dashboard",
    "staff_order",
    "tables",
    "delivery_integrations",
    "kds",
    "reservations",
    "menu",
    "inventory",
    "customers",
    "promotions",
    "analytics",
    "einvoice",
    "team",
    "hardware",
    "landing_page",
    "settings",
    "profile",
  ],
  ACCOUNTANT: ["analytics", "inventory", "einvoice", "dashboard", "profile"],
  CASHIER: ["staff_order", "tables", "delivery_integrations", "dashboard", "reservations", "customers", "einvoice", "profile"],
  CHEF: ["kds", "menu", "profile"],
  WAITER: ["tables", "staff_order", "reservations", "profile"],
};

const ROLE_DEFAULT_MENUS: Record<CmsAppRole, string> = {
  SUPER_ADMIN: "telemetry",
  STORE_OWNER: "dashboard",
  ACCOUNTANT: "analytics",
  CASHIER: "staff_order",
  CHEF: "kds",
  WAITER: "tables",
};

export const PATH_TO_MENU_MAP: Record<string, string> = {
  "/admin": "telemetry",
  "/admin/telemetry": "telemetry",
  "/admin/tenants": "tenants",
  "/admin/store_users": "store_users",
  "/admin/licenses": "license_manager",
  "/admin/license_manager": "license_manager",
  "/admin/invoices": "software_invoices",
  "/admin/software_invoices": "software_invoices",
  "/admin/pricing": "pricing_config",
  "/admin/pricing_config": "pricing_config",
  "/admin/scenarios": "scenarios",
  "/admin/audit": "audit_logs",
  "/admin/audit_logs": "audit_logs",
  "/admin/profile": "profile",
  "/dashboard": "dashboard",
  "/tables": "tables",
  "/staff_order": "staff_order",
  "/pos": "staff_order",
  "/kds": "kds",
  "/menu": "menu",
  "/inventory": "inventory",
  "/customers": "customers",
  "/promotions": "promotions",
  "/reservations": "reservations",
  "/analytics": "analytics",
  "/einvoice": "einvoice",
  "/delivery": "delivery_integrations",
  "/delivery_integrations": "delivery_integrations",
  "/team": "team",
  "/staff": "team",
  "/hardware": "hardware",
  "/settings": "settings",
  "/landing": "landing_page",
  "/landing_page": "landing_page",
  "/profile": "profile",
};

export const MENU_TO_PATH_MAP: Record<string, string> = {
  telemetry: "/admin/telemetry",
  tenants: "/admin/tenants",
  store_users: "/admin/store_users",
  license_manager: "/admin/licenses",
  software_invoices: "/admin/invoices",
  pricing_config: "/admin/pricing",
  scenarios: "/admin/scenarios",
  audit_logs: "/admin/audit",
  dashboard: "/dashboard",
  tables: "/tables",
  staff_order: "/staff_order",
  kds: "/kds",
  menu: "/menu",
  inventory: "/inventory",
  customers: "/customers",
  promotions: "/promotions",
  reservations: "/reservations",
  analytics: "/analytics",
  einvoice: "/einvoice",
  delivery_integrations: "/delivery",
  team: "/team",
  hardware: "/hardware",
  settings: "/settings",
  landing_page: "/landing_page",
  profile: "/profile",
};

export const normalizeAppRole = (role?: string | null): CmsAppRole => {
  if (!role) return "STORE_OWNER";
  const upper = role.toUpperCase();
  if (upper === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (upper === "ACCOUNTANT") return "ACCOUNTANT";
  if (upper === "CASHIER") return "CASHIER";
  if (upper === "CHEF") return "CHEF";
  if (upper === "WAITER") return "WAITER";
  if (upper === "ADMIN" || upper === "OWNER" || upper === "STORE_OWNER") return "STORE_OWNER";
  return "STORE_OWNER";
};

// Tự động quét và dọn sạch TOÀN BỘ dữ liệu mock / fake cũ còn sót lại trong localStorage của trình duyệt
if (typeof window !== "undefined") {
  const storeFakeKeys = [
    "a2order_customers_data",
    "a2order_delivery_orders",
    "a2order_einvoice_records",
    "a2order_tables_zones_data",
    "a2order_staff_order_tables_data",
    "a2order_staff_order_active_table",
    "a2order_kds_tickets_data",
    "a2order_reservations_data",
    "a2order_reservations_filter_date",
    "a2order_reservations_filter_status",
    "a2order_inventory_data",
    "a2order_inventory_ingredients",
    "a2order_inventory_receipts",
    "a2order_inventory_recipes",
    "a2order_staff_users_data",
    "a2order_staff_list",
    "a2order_attendance_logs",
    "a2order_staff_attendance_logs",
    "a2order_menu_dishes_data",
    "a2order_sales_bills_data",
    "a2order_analytics_bills",
    "a2order_void_audit_canceled_items",
    "a2order_analytics_canceled_items",
    "a2order_hardware_printers",
    "a2order_promotions_data",
    "a2order_promotions_list",
    "a2order_calendar_notes",
    "a2order_a2order_calendar_notes",
    "a2order_crm_campaigns",
    "a2order_notifications",
  ];

  // 1. Quét kiểm tra bất kỳ key nào chứa dấu hiệu dữ liệu fake cũ
  const MOCK_PATTERNS = [
    "Khu Máy Lạnh",
    "Sân Vườn Thoáng Mát",
    "Phòng Tiệc VIP",
    "Bác Hùng",
    "Cô Hương Lan",
    "QUẨY BAR",
    "Quẩy Bar",
    "B12-004",
    "B03-005",
    "Coca Cola Tươi",
    "Bia Tiger Lon Bạc",
    "Sinh Tố Bơ Đắk Lắk",
    "Phở Bò Tái Nạm",
    "Bún Chả Hà Nội",
    "HD-2026",
    "Anh Hoàng Tuấn",
    "Chị Thảo Mai",
    "note-init-1",
    "Kiểm tra số lượng nguyên liệu",
    "Chúc Mừng Sinh Nhật Hội Viên (Tự Động)",
    "Kéo Khách Quen 30 Ngày Chưa Quay Lại",
    "INV-2026-0091",
    "Trà Sữa Topping Đô Đô",
    "Quán Cà Phê Muối Chú Long",
  ];

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("a2order_")) {
        const val = localStorage.getItem(key) || "";
        if (MOCK_PATTERNS.some((p) => val.includes(p))) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage iteration error
  }

  // 2. Chạy đợt dọn dẹp triệt để nếu chưa chạy v7
  if (!localStorage.getItem("a2order_store_fake_cleared_v7")) {
    storeFakeKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem("a2order_store_fake_cleared_v7", "true");
  }
}

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentRole, setCurrentRole] = usePersistentState<CmsAppRole>("currentRole", "STORE_OWNER");
  const [activeMenu, setActiveMenu] = usePersistentState<string>("activeMenu", "dashboard");
  const [enabledModules, setEnabledModules] = usePersistentState<AppModule[]>("enabledModules", [
    AppModule.CORE_POS,
    AppModule.MODULE_KDS,
    AppModule.MODULE_QR_ORDER,
    AppModule.MODULE_ADVANCED_ANALYTICS,
    AppModule.MODULE_LANDING_PAGE,
  ]);
  const confirmingNavigation = useRef(false);

  // Quản lý đường dẫn URL hiện tại cho các phân hệ (/admin/login vs /login)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

  const navigateTo = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path);
      setCurrentPath(path);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || "/";
      setCurrentPath(path);
      const matched = PATH_TO_MENU_MAP[path];
      if (matched) {
        setActiveMenu(matched);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Khởi tạo activeMenu ban đầu dựa trên URL hiện tại
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname || "/";
      const matched = PATH_TO_MENU_MAP[path];
      if (matched) {
        setActiveMenu(matched);
      }
    }
  }, []);

  // Đồng bộ Tiêu đề trang (Document Title) theo Cổng và Vai trò
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isPort3000Current = window.location.port === "3000";
    if (isPort3000Current) {
      document.title = "A2Order Platform - Quản Trị Hệ Thống SaaS (Port 3000)";
    } else {
      const roleTitles: Record<CmsAppRole, string> = {
        SUPER_ADMIN: "Admin Nền Tảng",
        STORE_OWNER: currentUser?.storeName ? `${currentUser.storeName} - Quản Trị Quán` : "A2Order CMS - Quản Trị Cửa Hàng",
        CASHIER: "A2Order POS - Thu Ngân & Điểm Bán",
        WAITER: "A2Order POS - Phục Vụ Bàn",
        CHEF: "A2Order KDS - Màn Hình Bếp Trưởng",
        ACCOUNTANT: "A2Order - Kế Toán & Dòng Tiền",
      };
      document.title = `${roleTitles[currentRole] || "A2Order Store"} (Port 3001)`;
    }
  }, [currentRole, currentUser?.storeName]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, []);

  // Kiểm tra phiên đăng nhập đã lưu (Remember Me)
  useEffect(() => {
    const verifySavedAuth = async () => {
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
      const savedUserStr = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);

      if (!savedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        if (savedUserStr) {
          const parsed = JSON.parse(savedUserStr);
          setCurrentUser(parsed);
          const mappedRole = normalizeAppRole(parsed.role);
          setCurrentRole(mappedRole);
        }

        // Xác thực token qua backend thật
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            const mappedRole = normalizeAppRole(data.user.role);
            setCurrentRole(mappedRole);
          }
        } else {
          // Token không còn hợp lệ -> Xóa bộ nhớ
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
          sessionStorage.removeItem(AUTH_USER_KEY);
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn("Không thể kết nối xác thực server:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    verifySavedAuth();
  }, []);

  const handleLoginSuccess = (user: AuthUser, token: string, rememberMe: boolean) => {
    setCurrentUser(user);

    if (rememberMe) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }

    const resolvedRole = normalizeAppRole(user.role);
    setCurrentRole(resolvedRole);

    const defaultMenu = ROLE_DEFAULT_MENUS[resolvedRole] || "dashboard";
    setActiveMenu(defaultMenu);

    if (resolvedRole === "SUPER_ADMIN") {
      toast.success(`Chào mừng Super Admin ${user.name}! Đã kết nối trung tâm điều hành SaaS A2Order.`);
      if (currentPath.startsWith("/admin/login") || currentPath.startsWith("/login")) {
        navigateTo("/admin");
      }
    } else {
      const roleLabels: Record<CmsAppRole, string> = {
        SUPER_ADMIN: "Super Admin",
        STORE_OWNER: "Chủ Quán",
        ACCOUNTANT: "Kế Toán",
        CASHIER: "Thu Ngân",
        CHEF: "Bếp Nấu / KDS",
        WAITER: "Phục Vụ Bàn",
      };
      toast.success(`Đăng nhập thành công: ${user.name} (${roleLabels[resolvedRole] || resolvedRole})`);
      if (currentPath.startsWith("/admin/login") || currentPath.startsWith("/login")) {
        navigateTo("/");
      }
    }
  };

  const confirmLeaveUnsaved = async () => {
    if (!hasUnsavedChanges()) return true;
    if (confirmingNavigation.current) return false;
    confirmingNavigation.current = true;
    try {
      const discard = await confirmDialog({
        title: "Bạn có thay đổi chưa lưu",
        message: "Rời màn hình lúc này sẽ bỏ các thay đổi đang chỉnh sửa.",
        confirmText: "Rời màn hình",
        cancelText: "Tiếp tục chỉnh sửa",
        variant: "warning",
      });
      if (discard) useUnsavedChangesStore.getState().clearAll();
      return discard;
    } finally {
      confirmingNavigation.current = false;
    }
  };

  const navigateMenu = async (menu: string) => {
    if (menu === activeMenu) return;
    if (!(await confirmLeaveUnsaved())) return;
    setActiveMenu(menu);

    if (typeof window !== "undefined") {
      const isPort3000Now = window.location.port === "3000";
      let targetPath = isPort3000Now ? `/admin/${menu}` : `/${menu}`;
      if (MENU_TO_PATH_MAP[menu]) {
        targetPath = MENU_TO_PATH_MAP[menu];
        if (isPort3000Now && !targetPath.startsWith("/admin")) {
          targetPath = `/admin/${menu}`;
        }
      }
      window.history.pushState({}, "", targetPath);
      setCurrentPath(targetPath);
    }
  };

  const handleNavigateToOrderWithTable = async (tableId: string) => {
    localStorage.setItem("a2order_staff_order_active_table", JSON.stringify(tableId));
    if (!(await confirmLeaveUnsaved())) return;
    setActiveMenu("staff_order");
  };

  const handleLogout = async () => {
    if (confirmingNavigation.current) return;
    confirmingNavigation.current = true;
    const confirmed = await confirmDialog({
      title: "Đăng xuất khỏi A2Order?",
      message: hasUnsavedChanges()
        ? "Bạn đang có thay đổi chưa lưu. Đăng xuất sẽ bỏ các thay đổi này."
        : "Phiên quản trị trên thiết bị này sẽ kết thúc.",
      confirmText: "Đăng xuất",
      cancelText: "Ở lại",
      variant: "warning",
    });
    confirmingNavigation.current = false;
    if (!confirmed) return;
    const wasAdmin = currentRole === "SUPER_ADMIN";
    useUnsavedChangesStore.getState().clearAll();
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    setCurrentUser(null);
    toast.info("Đã đăng xuất khỏi tài khoản quản trị.");
    if (wasAdmin) {
      navigateTo("/admin/login");
    } else {
      navigateTo("/login");
    }
  };

  if (isInitializing) {
    return (
      <LoadingScreen
        message="Đang khởi tạo A2Order Platform..."
        subMessage="Xác thực thông tin phiên làm việc và bảo mật"
      />
    );
  }

  const isPort3000 = typeof window !== "undefined" && window.location.port === "3000";
  const isPort3001 = typeof window !== "undefined" && (window.location.port === "3001" || (!isPort3000 && window.location.port !== "3002"));

  // 1. Phân hệ Khách hàng quét mã QR gọi món tại bàn (/order)
  if (currentPath.startsWith("/order")) {
    return (
      <Suspense fallback={<LoadingScreen message="Đang kết nối bàn ăn..." subMessage="Xác thực bảo mật phiên bàn" />}>
        <CustomerTableOrderPage />
      </Suspense>
    );
  }

  // 2. Nếu chưa đăng nhập: Phân nhánh hiển thị riêng biệt theo Port hoặc URL
  if (!currentUser) {
    const isAdminRoute =
      isPort3000 ||
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/saas-admin");

    return (
      <>
        <GlobalFeedback />
        {isAdminRoute ? (
          <AdminLoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToOwner={() => {
              if (isPort3000) {
                window.location.href = "http://localhost:3001";
              } else {
                navigateTo("/login");
              }
            }}
          />
        ) : (
          <OwnerLoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToAdmin={() => {
              if (isPort3001) {
                window.location.href = "http://localhost:3000";
              } else {
                navigateTo("/admin/login");
              }
            }}
          />
        )}
      </>
    );
  }

  // Tự động phân tách cổng khi đã đăng nhập:
  // Nếu đang mở Cổng Admin (3000) nhưng tài khoản là Chủ Quán/Nhân Viên:
  if (isPort3000 && currentRole !== "SUPER_ADMIN") {
    const roleLabels: Record<CmsAppRole, string> = {
      SUPER_ADMIN: "Super Admin",
      STORE_OWNER: "Chủ Quán",
      ACCOUNTANT: "Kế Toán",
      CASHIER: "Thu Ngân",
      CHEF: "Bếp Trưởng / Pha Chế",
      WAITER: "Nhân Viên Phục Vụ",
    };
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Icon name="shield" size={28} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Cổng Admin Nền Tảng (Port 3000)
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">Tài Khoản Không Có Quyền Admin</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Bạn đang đăng nhập bằng tài khoản <strong>{currentUser.name}</strong> ({roleLabels[currentRole] || currentRole}). Cổng Admin (Port 3000) chỉ dành cho Quản trị viên SaaS. Vui lòng chuyển sang Cổng Quán (Port 3001) để quản lý hoặc bán hàng.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="http://localhost:3001"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Mở Cổng Quán & Bán Hàng (Port 3001)</span>
              <Icon name="arrowRight" size={14} />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
            >
              Đăng Nhập Tài Khoản Admin Khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu đang mở Cổng Quán (3001) nhưng tài khoản là Super Admin:
  if (isPort3001 && currentRole === "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Icon name="store" size={28} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Cổng Quán & Bán Hàng (Port 3001)
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">Bạn Là Quản Trị Viên Nền Tảng</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Bạn đang đăng nhập bằng tài khoản <strong>{currentUser.name}</strong> (Super Admin). Vui lòng chuyển sang Cổng Admin Nền Tảng (Port 3000) để quản trị đối tác, license và cấu hình SaaS.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="http://localhost:3000"
              className="w-full py-3 px-4 rounded-xl bg-slate-950 text-white font-black text-xs hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Mở Cổng Admin Nền Tảng (Port 3000)</span>
              <Icon name="arrowRight" size={14} />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
            >
              Đăng Xuất Để Đăng Nhập Tài Khoản Quán
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLandingPageUnlocked = enabledModules.includes(AppModule.MODULE_LANDING_PAGE);
  const allowedMenus = ROLE_ALLOWED_MENUS[currentRole] || ROLE_ALLOWED_MENUS.STORE_OWNER;
  const isMenuAllowed = allowedMenus.includes(activeMenu);

  return (
    <>
      <GlobalFeedback />

      <CmsLayout
        activeMenu={activeMenu}
        onSelectMenu={navigateMenu}
        onLogout={handleLogout}
        currentRole={currentRole}
        enabledModules={enabledModules}
        currentUser={currentUser}
      >
        <ErrorBoundary>
          <Suspense fallback={<CmsPageSkeleton />}>
            {!isMenuAllowed ? (
              <CmsNotFoundPage
                currentRole={currentRole}
                attemptedMenu={activeMenu}
                currentUser={currentUser}
                onGoHome={() => {
                  const defaultMenu = ROLE_DEFAULT_MENUS[currentRole] || "dashboard";
                  navigateMenu(defaultMenu);
                }}
                onLogout={handleLogout}
              />
            ) : activeMenu === "profile" ? (
              <CmsProfileView user={currentUser} currentRole={currentRole} onLogout={handleLogout} />
            ) : currentRole === "SUPER_ADMIN" ? (
              /* Phân hệ Super Admin Nền Tảng */
              activeMenu === "scenarios" ? (
                <ScenarioTemplateManager />
              ) : (
                <CmsSuperAdminView
                  subView={
                    activeMenu === "tenants"
                      ? "tenants"
                      : activeMenu === "store_users"
                      ? "store_users"
                      : activeMenu === "license_manager"
                      ? "license_manager"
                      : activeMenu === "software_invoices"
                      ? "software_invoices"
                      : activeMenu === "audit_logs"
                      ? "audit_logs"
                      : activeMenu === "pricing_config"
                      ? "pricing_config"
                      : "telemetry"
                  }
                  onTabChange={(tab) => {
                    if (tab === "telemetry") navigateMenu("telemetry");
                    else if (tab === "tenants") navigateMenu("tenants");
                    else if (tab === "store_users") navigateMenu("store_users");
                    else if (tab === "licenses") navigateMenu("license_manager");
                    else if (tab === "invoices") navigateMenu("software_invoices");
                    else if (tab === "pricing") navigateMenu("pricing_config");
                    else if (tab === "audit") navigateMenu("audit_logs");
                    else if (tab === "scenarios") navigateMenu("scenarios");
                  }}
                />
              )
            ) : currentRole === "CHEF" ? (
              /* Phân hệ Bếp Nấu & Pha Chế (KDS & Báo Hết) - Tách riêng biệt 100% */
              <>
                {activeMenu === "kds" && <CmsKdsView />}
                {activeMenu === "menu" && <CmsMenuManagement currentRole="CHEF" />}
              </>
            ) : currentRole === "WAITER" ? (
              /* Phân hệ Phục Vụ Bàn & Order Cầm Tay - Tách riêng biệt 100% */
              <>
                {activeMenu === "tables" && (
                  <CmsTableManagement
                    currentRole="WAITER"
                    onNavigateToOrder={handleNavigateToOrderWithTable}
                  />
                )}
                {activeMenu === "staff_order" && (
                  <CmsStaffOrderView
                    currentRole="WAITER"
                    onNavigateTab={navigateMenu}
                  />
                )}
                {activeMenu === "reservations" && <CmsReservationsManagement />}
              </>
            ) : currentRole === "CASHIER" ? (
              /* Phân hệ Thu Ngân & Điểm Thanh Toán - Tách riêng biệt 100% */
              <>
                {activeMenu === "staff_order" && (
                  <CmsStaffOrderView
                    currentRole="CASHIER"
                    onNavigateTab={navigateMenu}
                  />
                )}
                {activeMenu === "tables" && (
                  <CmsTableManagement
                    currentRole="CASHIER"
                    onNavigateToOrder={handleNavigateToOrderWithTable}
                  />
                )}
                {activeMenu === "delivery_integrations" && <CmsDeliveryIntegrations />}
                {activeMenu === "dashboard" && <CmsDashboard onNavigateTab={navigateMenu} currentRole="CASHIER" />}
                {activeMenu === "reservations" && <CmsReservationsManagement />}
                {activeMenu === "customers" && <CmsCustomerManagement />}
                {activeMenu === "einvoice" && <CmsEInvoiceManagement />}
              </>
            ) : currentRole === "ACCOUNTANT" ? (
              /* Phân hệ Kế Toán & Dòng Tiền P&L - Tách riêng biệt 100% */
              <>
                {activeMenu === "analytics" && <CmsDeepAnalyticsView />}
                {activeMenu === "inventory" && <CmsInventoryManagement />}
                {activeMenu === "einvoice" && <CmsEInvoiceManagement />}
                {activeMenu === "dashboard" && <CmsDashboard onNavigateTab={navigateMenu} currentRole="ACCOUNTANT" />}
              </>
            ) : (
              /* Phân hệ Chủ Quán (Toàn quyền quản trị cửa hàng) */
              <>
                {activeMenu === "dashboard" && <CmsDashboard onNavigateTab={navigateMenu} currentRole="STORE_OWNER" />}
                {activeMenu === "staff_order" && (
                  <CmsStaffOrderView
                    currentRole="STORE_OWNER"
                    onNavigateTab={navigateMenu}
                  />
                )}
                {activeMenu === "tables" && (
                  <CmsTableManagement
                    currentRole="STORE_OWNER"
                    onNavigateToOrder={handleNavigateToOrderWithTable}
                  />
                )}
                {activeMenu === "delivery_integrations" && <CmsDeliveryIntegrations />}
                {activeMenu === "menu" && <CmsMenuManagement currentRole="STORE_OWNER" />}
                {activeMenu === "inventory" && <CmsInventoryManagement />}
                {activeMenu === "customers" && <CmsCustomerManagement />}
                {activeMenu === "promotions" && <CmsPromotionsManagement />}
                {activeMenu === "reservations" && <CmsReservationsManagement />}
                {activeMenu === "kds" && <CmsKdsView />}
                {activeMenu === "analytics" && <CmsDeepAnalyticsView />}
                {activeMenu === "einvoice" && <CmsEInvoiceManagement />}
                {activeMenu === "landing_page" && (
                  <CmsLandingPageEditor
                    isUnlocked={isLandingPageUnlocked}
                    onUpgradeClick={() => navigateMenu("settings")}
                  />
                )}
                {(activeMenu === "team" || activeMenu === "staff") && <CmsStaffManagement />}
                {activeMenu === "hardware" && <CmsHardwareSettings />}
                {activeMenu === "settings" && (
                  <CmsStoreSettings
                    enabledModules={enabledModules}
                    onSaveModules={setEnabledModules}
                  />
                )}
              </>
            )}
          </Suspense>
        </ErrorBoundary>
      </CmsLayout>
    </>
  );
};
