import React, { useState, useEffect, lazy, Suspense } from "react";
import { CmsLayout } from "@/features/cms/components/CmsLayout";
import { UnifiedAuthModal } from "@/features/auth/components/UnifiedAuthModal";
import { GlobalFeedback } from "@/components/feedback";
import { LoadingScreen, CmsPageSkeleton } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { StaffMember } from "@/types";
import { AppModule } from "@a2order/shared";
import { usePersistentState } from "@/hooks/usePersistentState";

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

const MOCK_STAFF: StaffMember[] = [
  { id: "s1", name: "Nguyễn Thành An", role: "Chủ quán" },
  { id: "s2", name: "Admin Hệ Thống", role: "Super Admin" },
  { id: "s3", name: "Chị Lan", role: "Thu ngân" },
];

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = usePersistentState<"STORE_OWNER" | "SUPER_ADMIN">("currentRole", "STORE_OWNER");
  const [activeMenu, setActiveMenu] = usePersistentState<string>("activeMenu", "reservations");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [enabledModules, setEnabledModules] = usePersistentState<AppModule[]>("enabledModules", [
    AppModule.CORE_POS,
    AppModule.MODULE_KDS,
    AppModule.MODULE_QR_ORDER,
    AppModule.MODULE_ADVANCED_ANALYTICS,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen
        message="Đang khởi tạo A2Order CMS..."
        subMessage="Tải thông số hạ tầng, cấu hình quán và bản quyền phần mềm"
      />
    );
  }

  const isLandingPageUnlocked = enabledModules.includes(AppModule.MODULE_LANDING_PAGE);

  return (
    <>
      <GlobalFeedback />

      <CmsLayout
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        onLogout={() => setIsAuthModalOpen(true)}
        currentRole={currentRole}
        enabledModules={enabledModules}
        onChangeRole={(role) => {
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
          {currentRole === "SUPER_ADMIN" ? (
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
                  if (tab === "telemetry") setActiveMenu("telemetry");
                  else if (tab === "tenants") setActiveMenu("tenants");
                  else if (tab === "licenses") setActiveMenu("license_manager");
                  else if (tab === "invoices") setActiveMenu("software_invoices");
                  else if (tab === "audit") setActiveMenu("audit_logs");
                  else if (tab === "scenarios") setActiveMenu("scenarios");
                }}
                onImpersonateStore={(store) => {
                  setCurrentRole("STORE_OWNER");
                  setActiveMenu("dashboard");
                  toast.success(`Đã truy cập quản trị quán: ${store.name} (Chế độ hỗ trợ kỹ thuật)`);
                }}
              />
            )
          ) : (
            <>
              {activeMenu === "dashboard" && <CmsDashboard onNavigateTab={setActiveMenu} />}
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
                  onUpgradeClick={() => setActiveMenu("settings")}
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

      <UnifiedAuthModal
        isOpen={isAuthModalOpen}
        staffList={MOCK_STAFF}
        onPinSubmit={(staffId) => {
          const staff = MOCK_STAFF.find((s) => s.id === staffId);
          toast.success(`Nhân viên ${staff?.name || ""} vào ca thành công!`);
          setIsAuthModalOpen(false);
        }}
        onAdminLogin={(email) => {
          if (email.includes("superadmin") || email.includes("admin")) {
            setCurrentRole("SUPER_ADMIN");
            setActiveMenu("telemetry");
            toast.success("Đăng nhập Super Admin thành công! Đã kết nối trung tâm điều hành SaaS F&B.");
          } else {
            setCurrentRole("STORE_OWNER");
            setActiveMenu("dashboard");
            toast.success("Đăng nhập Chủ Quán thành công!");
          }
          setIsAuthModalOpen(false);
        }}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
