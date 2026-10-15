import React, { useState, useEffect, useRef } from "react";
import { CmsLayout } from "@/components/layout/CmsLayout";
import { CmsRouteRenderer } from "@/components/layout/CmsRouteRenderer";
import { AdminLoginPage, OwnerLoginPage } from "@/features/auth";
import { GlobalFeedback } from "@/components/feedback";
import { LoadingScreen } from "@/components/ui";
import { toast, confirmDialog } from "@/stores/notificationStore";
import { hasUnsavedChanges, useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { AuthUser } from "@/types";
import { CmsAppRole } from "@/types/cms.types";
import { AppModule } from "@a2order/shared";
import { usePersistentState } from "@/hooks/usePersistentState";
import { API_BASE_URL } from "@/services/api/apiClient";
import { runStorageCleanup } from "@/lib/cleanupStorage";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  ROLE_ALLOWED_MENUS,
  ROLE_DEFAULT_MENUS,
  normalizeAppRole,
} from "@/data/roleConfig";

// Dọn dẹp dữ liệu mock cũ trong bộ nhớ trình duyệt
runStorageCleanup();

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

  // Quản lý URL nội bộ cho SPA
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") return window.location.pathname || "/";
    return "/";
  });

  const navigateTo = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path);
      setCurrentPath(path);
    }
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname || "/");
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

  // Tự động đồng bộ menu hợp lệ khi vai trò thay đổi (tránh kẹt menu quán cho Super Admin)
  useEffect(() => {
    if (currentUser) {
      const allowed = ROLE_ALLOWED_MENUS[currentRole] || ROLE_ALLOWED_MENUS.STORE_OWNER;
      if (!allowed.includes(activeMenu)) {
        setActiveMenu(ROLE_DEFAULT_MENUS[currentRole] || "dashboard");
      }
    }
  }, [currentRole, currentUser, activeMenu, setActiveMenu]);

  // Kiểm tra phiên đăng nhập đã lưu
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

        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            const mappedRole = normalizeAppRole(data.user.role);
            setCurrentRole(mappedRole);
          }
        } else {
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
    setActiveMenu(ROLE_DEFAULT_MENUS[resolvedRole] || "dashboard");

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
      title: "Đăng Xuất Khỏi Hệ Thống?",
      message: hasUnsavedChanges()
        ? "Bạn đang có thay đổi chưa lưu. Đăng xuất sẽ hủy bỏ các thay đổi này."
        : "Bạn có chắc muốn kết thúc phiên làm việc hiện tại trên thiết bị này?",
      confirmText: "Đăng Xuất",
      cancelText: "Ở lại",
      variant: "danger",
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

  // Phân hệ Khách hàng quét mã QR gọi món tại bàn (/order)
  if (currentPath.startsWith("/order")) {
    if (typeof window !== "undefined") {
      window.location.href = `http://localhost:3000${currentPath}${window.location.search}`;
    }
    return (
      <LoadingScreen
        message="Đang chuyển sang Cổng Gọi Món Bàn Ăn..."
        subMessage="Hệ thống đang kết nối phiên bàn trên cổng vận hành"
      />
    );
  }

  // Nếu chưa đăng nhập: Phân nhánh theo URL
  if (!currentUser) {
    const isAdminRoute = currentPath.startsWith("/admin") || currentPath.startsWith("/saas-admin");
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
        <CmsRouteRenderer
          currentRole={currentRole}
          activeMenu={activeMenu}
          currentUser={currentUser}
          enabledModules={enabledModules}
          navigateMenu={navigateMenu}
          handleNavigateToOrderWithTable={handleNavigateToOrderWithTable}
          handleLogout={handleLogout}
          setEnabledModules={setEnabledModules}
        />
      </CmsLayout>
    </>
  );
};
