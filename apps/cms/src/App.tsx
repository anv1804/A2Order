import React, { useState, useEffect } from "react";
import { CmsLayout, CmsDashboard } from "@/features/cms";
import { CmsSuperAdminView } from "@/features/cms/components/CmsSuperAdminView";
import { CmsDeepAnalyticsView } from "@/features/cms/components/CmsDeepAnalyticsView";
import { CmsLandingPageEditor } from "@/features/cms/components/CmsLandingPageEditor";
import { CmsModuleManager } from "@/features/cms/components/CmsModuleManager";
import { CmsTableManagement } from "@/features/cms/components/CmsTableManagement";
import { CmsMenuManagement } from "@/features/cms/components/CmsMenuManagement";
import { CmsReservationsManagement } from "@/features/cms/components/CmsReservationsManagement";
import { CmsStaffManagement } from "@/features/cms/components/CmsStaffManagement";
import { CmsStoreSettings } from "@/features/cms/components/CmsStoreSettings";
import { CmsAdminPricingManager } from "@/features/cms/components/CmsAdminPricingManager";
import { CmsInventoryManagement } from "@/features/cms/components/CmsInventoryManagement";
import { CmsKdsView } from "@/features/cms/components/CmsKdsView";
import { UnifiedAuthModal } from "@/features/auth/components/UnifiedAuthModal";
import { GlobalFeedback } from "@/components/feedback";
import { LoadingScreen } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { StaffMember } from "@/types";
import { AppModule } from "@a2order/shared";

const MOCK_STAFF: StaffMember[] = [
  { id: "s1", name: "Nguyễn Thành An", role: "Chủ quán" },
  { id: "s2", name: "Admin Hệ Thống", role: "Super Admin" },
  { id: "s3", name: "Chị Lan", role: "Thu ngân" },
];

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<"STORE_OWNER" | "SUPER_ADMIN">("STORE_OWNER");
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [enabledModules, setEnabledModules] = useState<AppModule[]>([
    AppModule.CORE_POS,
    AppModule.MODULE_KDS,
    AppModule.MODULE_QR_ORDER,
    AppModule.MODULE_ADVANCED_ANALYTICS,
    // Chưa mua MODULE_LANDING_PAGE để test tính năng Paywall trả phí
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
        {currentRole === "SUPER_ADMIN" ? (
          activeMenu === "pricing_config" ? (
            <CmsAdminPricingManager />
          ) : (
            <CmsSuperAdminView
              subView={
                activeMenu === "tenants"
                  ? "tenants"
                  : activeMenu === "software_invoices" || activeMenu === "license_manager"
                  ? "software_invoices"
                  : activeMenu === "audit_logs"
                  ? "audit_logs"
                  : "telemetry"
              }
            />
          )
        ) : (
          <>
            {activeMenu === "dashboard" && <CmsDashboard onNavigateTab={setActiveMenu} />}
            {activeMenu === "tables" && <CmsTableManagement />}
            {activeMenu === "menu" && <CmsMenuManagement />}
            {activeMenu === "inventory" && <CmsInventoryManagement />}
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
            {activeMenu === "settings" && (
              <CmsStoreSettings
                enabledModules={enabledModules}
                onSaveModules={setEnabledModules}
              />
            )}
          </>
        )}
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
            toast.success("Đăng nhập Super Admin thành công! Đã kích hoạt Zero-Knowledge.");
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
