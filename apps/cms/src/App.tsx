import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { CmsLayout } from "@/features/cms/components/CmsLayout";
import { AdminLoginPage, OwnerLoginPage } from "@/features/auth";
import { GlobalFeedback } from "@/components/feedback";
import { LoadingScreen, CmsPageSkeleton } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { hasUnsavedChanges, useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { AuthUser } from "@/types";
import { AppModule } from "@a2order/shared";
import { usePersistentState } from "@/hooks/usePersistentState";
import { API_BASE_URL } from "@/services/api/apiClient";

// Tải bất đồng bộ (Lazy-load & Code-splitting) các phân hệ CMS để giảm tải bundle và hiển thị Skeleton tức thì
const CmsDashboard = lazy(() => import("@/features/cms").then((m) => ({ default: m.CmsDashboard })));
const CmsSuperAdminView = lazy(() =>
  import("@/features/cms/components/CmsSuperAdminView").then((m) => ({ default: m.CmsSuperAdminView }))
);
const CmsAdminPricingManager = lazy(() =>
  import("@/features/cms/components/CmsAdminPricingManager").then((m) => ({ default: m.CmsAdminPricingManager }))
);
const ScenarioTemplateManager = lazy(() =>
  import("@/features/cms/components/superAdmin/ScenarioTemplateManager").then((m) => ({
    default: m.ScenarioTemplateManager,
  }))
);
const CmsDeepAnalyticsView = lazy(() =>
  import("@/features/cms/components/CmsDeepAnalyticsView").then((m) => ({ default: m.CmsDeepAnalyticsView }))
);
const CmsLandingPageEditor = lazy(() =>
  import("@/features/cms/components/CmsLandingPageEditor").then((m) => ({ default: m.CmsLandingPageEditor }))
);
const CmsTableManagement = lazy(() =>
  import("@/features/cms/components/CmsTableManagement").then((m) => ({ default: m.CmsTableManagement }))
);
const CmsMenuManagement = lazy(() =>
  import("@/features/cms/components/CmsMenuManagement").then((m) => ({ default: m.CmsMenuManagement }))
);
const CmsReservationsManagement = lazy(() =>
  import("@/features/cms/components/CmsReservationsManagement").then((m) => ({ default: m.CmsReservationsManagement }))
);
const CmsStaffManagement = lazy(() =>
  import("@/features/cms/components/CmsStaffManagement").then((m) => ({ default: m.CmsStaffManagement }))
);
const CmsStoreSettings = lazy(() =>
  import("@/features/cms/components/CmsStoreSettings").then((m) => ({ default: m.CmsStoreSettings }))
);
const CmsInventoryManagement = lazy(() =>
  import("@/features/cms/components/CmsInventoryManagement").then((m) => ({ default: m.CmsInventoryManagement }))
);
const CmsKdsView = lazy(() =>
  import("@/features/cms/components/CmsKdsView").then((m) => ({ default: m.CmsKdsView }))
);
const CmsStaffOrderView = lazy(() =>
  import("@/features/cms/components/CmsStaffOrderView").then((m) => ({ default: m.CmsStaffOrderView }))
);
const CmsCustomerManagement = lazy(() =>
  import("@/features/cms/components/CmsCustomerManagement").then((m) => ({ default: m.CmsCustomerManagement }))
);
const CmsPromotionsManagement = lazy(() =>
  import("@/features/cms/components/CmsPromotionsManagement").then((m) => ({ default: m.CmsPromotionsManagement }))
);
const CmsHardwareSettings = lazy(() =>
  import("@/features/cms/components/CmsHardwareSettings").then((m) => ({ default: m.CmsHardwareSettings }))
);
const CmsProfileView = lazy(() =>
  import("@/features/cms/components/CmsProfileView").then((m) => ({ default: m.CmsProfileView }))
);

const AUTH_TOKEN_KEY = "a2order_auth_token";
const AUTH_USER_KEY = "a2order_auth_user";

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentRole, setCurrentRole] = usePersistentState<"STORE_OWNER" | "SUPER_ADMIN">("currentRole", "SUPER_ADMIN");
  const [activeMenu, setActiveMenu] = usePersistentState<string>("activeMenu", "telemetry");
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
      setCurrentPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
          if (parsed.role === "SUPER_ADMIN") {
            setCurrentRole("SUPER_ADMIN");
          }
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
            if (data.user.role === "SUPER_ADMIN") {
              setCurrentRole("SUPER_ADMIN");
            }
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

    if (user.role === "SUPER_ADMIN") {
      setCurrentRole("SUPER_ADMIN");
      setActiveMenu("telemetry");
      toast.success(`Chào mừng Super Admin ${user.name}! Đã kết nối trung tâm điều hành SaaS A2Order.`);
      if (currentPath.startsWith("/admin/login") || currentPath.startsWith("/login")) {
        navigateTo("/admin");
      }
    } else {
      setCurrentRole("STORE_OWNER");
      setActiveMenu("dashboard");
      toast.success(`Đăng nhập thành công: ${user.name}`);
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

  // Nếu chưa đăng nhập: Phân nhánh hiển thị riêng biệt theo URL
  if (!currentUser) {
    const isAdminRoute =
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/saas-admin");

    return (
      <>
        <GlobalFeedback />
        {isAdminRoute ? (
          <AdminLoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToOwner={() => navigateTo("/login")}
          />
        ) : (
          <OwnerLoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToAdmin={() => navigateTo("/admin/login")}
          />
        )}
      </>
    );
  }

  const isLandingPageUnlocked = enabledModules.includes(AppModule.MODULE_LANDING_PAGE);

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
        onChangeRole={async (role) => {
          if (!(await confirmLeaveUnsaved())) return;
          setCurrentRole(role);
          if (role === "SUPER_ADMIN") {
            setActiveMenu("telemetry");
          } else {
            setActiveMenu("dashboard");
          }
          toast.info(`Đã chuyển sang chế độ ${role === "SUPER_ADMIN" ? "Super Admin Nền Tảng" : "Chủ Quán"}`);
        }}
      >
        <Suspense fallback={<CmsPageSkeleton />}>
          {activeMenu === "profile" ? (
            <CmsProfileView user={currentUser} currentRole={currentRole} onLogout={handleLogout} />
          ) : currentRole === "SUPER_ADMIN" ? (
            activeMenu === "pricing_config" ? (
              <CmsAdminPricingManager />
            ) : activeMenu === "scenarios" ? (
              <ScenarioTemplateManager />
            ) : (
              <CmsSuperAdminView
                subView={
                  activeMenu === "tenants"
                    ? "tenants"
                    : activeMenu === "license_manager"
                    ? "license_manager"
                    : activeMenu === "software_invoices"
                    ? "software_invoices"
                    : activeMenu === "audit_logs"
                    ? "audit_logs"
                    : "telemetry"
                }
                onTabChange={(tab) => {
                  if (tab === "telemetry") navigateMenu("telemetry");
                  else if (tab === "tenants") navigateMenu("tenants");
                  else if (tab === "licenses") navigateMenu("license_manager");
                  else if (tab === "invoices") navigateMenu("software_invoices");
                  else if (tab === "audit") navigateMenu("audit_logs");
                  else if (tab === "scenarios") navigateMenu("scenarios");
                }}
                onImpersonateStore={async (store) => {
                  if (!(await confirmLeaveUnsaved())) return;
                  setCurrentRole("STORE_OWNER");
                  setActiveMenu("dashboard");
                  toast.success(`Đã truy cập quản trị quán: ${store.name} (Chế độ hỗ trợ kỹ thuật)`);
                }}
              />
            )
          ) : (
            <>
              {activeMenu === "dashboard" && <CmsDashboard onNavigateTab={navigateMenu} />}
              {activeMenu === "staff_order" && <CmsStaffOrderView />}
              {activeMenu === "tables" && <CmsTableManagement />}
              {activeMenu === "menu" && <CmsMenuManagement />}
              {activeMenu === "inventory" && <CmsInventoryManagement />}
              {activeMenu === "customers" && <CmsCustomerManagement />}
              {activeMenu === "promotions" && <CmsPromotionsManagement />}
              {activeMenu === "reservations" && <CmsReservationsManagement />}
              {activeMenu === "kds" && <CmsKdsView />}
              {activeMenu === "analytics" && <CmsDeepAnalyticsView />}
              {activeMenu === "landing_page" && (
                <CmsLandingPageEditor
                  isUnlocked={isLandingPageUnlocked}
                  onUpgradeClick={() => navigateMenu("settings")}
                />
              )}
              {activeMenu === "team" && <CmsStaffManagement />}
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
      </CmsLayout>
    </>
  );
};
