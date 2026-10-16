import { readAuth, saveAuth, clearAuth, ApiError } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import React, { useState, useEffect, useRef } from "react";
import { CmsLayout } from "@/components/layout/CmsLayout";
import { CmsRouteRenderer } from "@/components/layout/CmsRouteRenderer";
import { AdminLoginPage } from "@/features/auth";
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
  const [currentRole, setCurrentRole] = useState<CmsAppRole>("WAITER");
  const [activeMenu, setActiveMenu] = usePersistentState<string>("activeMenu", "dashboard");
  const [enabledModules, setEnabledModules] = useState<AppModule[]>([]);
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

  useEffect(() => {
    let active = true;
    const verify = async () => {
      const previousAuth = readAuth();
      if (!previousAuth) { setCurrentUser(null); setEnabledModules([]); setIsInitializing(false); return; }
      try {
        const result = await requestApi<{ user: AuthUser }>("/auth/me");
        if (!active || readAuth()?.token !== previousAuth.token) return;
        const auth = readAuth();
        if (!auth) return;
        setCurrentUser(result.user);
        setCurrentRole(normalizeAppRole(result.user.role));
      } catch (error) { if (active && readAuth()?.token === previousAuth.token) { if (error instanceof ApiError && [401, 403].includes(error.status)) { clearAuth(false); setCurrentUser(null); } else toast.error("Chưa thể xác minh phiên đăng nhập. Hệ thống sẽ thử kết nối lại."); } }
      finally { if (active) setIsInitializing(false); }
    };
    void verify();
    const changed = () => { void verify(); };
    window.addEventListener("a2order:auth", changed);
    window.addEventListener("online", changed);
    const timer = setInterval(changed, 30000);
    return () => { active = false; clearInterval(timer); window.removeEventListener("online", changed); window.removeEventListener("a2order:auth", changed); };
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role === "SUPER_ADMIN") return;
    let active = true;
    requestApi<{ enabledModules: AppModule[] }>("/licenses/" + currentUser.storeId + "/info")
      .then(result => { if (active) setEnabledModules(result.enabledModules); })
      .catch(error => toast.error(error.message));
    return () => { active = false; };
  }, [currentUser?.storeId, currentUser?.role]);

  const handleLoginSuccess = (user: AuthUser, token: string, rememberMe: boolean) => {
    setCurrentUser(user);

    if (!user.storeId) { toast.error("Tài khoản chưa được gán cửa hàng"); return; }
    saveAuth({ ...user, storeId: user.storeId }, token, rememberMe);

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

    useUnsavedChangesStore.getState().clearAll();
    try { await requestApi("/auth/logout", { method: "POST" }); } catch { toast.warning("Đã đăng xuất trên thiết bị; chưa xác nhận thu hồi phiên trên máy chủ."); }
    clearAuth();
    setCurrentUser(null);
    toast.info("Đã đăng xuất khỏi tài khoản quản trị.");
    navigateTo("/");
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
      window.location.href = `${(import.meta.env.VITE_ORDER_BASE_URL || window.location.origin).replace(/\/$/, "")}${currentPath}${window.location.search}`;
    }
    return (
      <LoadingScreen
        message="Đang chuyển sang Cổng Gọi Món Bàn Ăn..."
        subMessage="Hệ thống đang kết nối phiên bàn trên cổng vận hành"
      />
    );
  }

  // Cổng 3001: Dành riêng cho Super Admin quản trị nền tảng SaaS HQ
  if (!currentUser) {
    return (
      <>
        <GlobalFeedback />
        <AdminLoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateToOwner={() => {
            if (typeof window !== "undefined") {
              window.location.href = (import.meta.env.VITE_CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
            }
          }}
        />
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
