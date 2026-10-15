import React, { lazy, Suspense } from "react";
import { AuthUser } from "@/types";
import { CmsAppRole } from "@/types/cms.types";
import { AppModule } from "@a2order/shared";
import { CmsNotFoundPage } from "@/components/common/CmsNotFoundPage";
import { CmsPageSkeleton, ErrorBoundary } from "@/components/ui";
import { ROLE_ALLOWED_MENUS, ROLE_DEFAULT_MENUS } from "@/data/roleConfig";

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

// Lazy-loaded modules from Feature-Driven packages
const CmsDashboard = safeLazy(() => import("@/features/dashboard").then((m) => ({ default: m.CmsDashboard })));
const CmsSuperAdminView = safeLazy(() =>
  import("@/features/super-admin").then((m) => ({ default: m.CmsSuperAdminView }))
);
const CmsDeepAnalyticsView = safeLazy(() =>
  import("@/features/analytics").then((m) => ({ default: m.CmsDeepAnalyticsView }))
);
const CmsLandingPageEditor = safeLazy(() =>
  import("@/features/settings").then((m) => ({ default: m.CmsLandingPageEditor }))
);
const CmsTableManagement = safeLazy(() =>
  import("@/features/tables").then((m) => ({ default: m.CmsTableManagement }))
);
const CmsMenuManagement = safeLazy(() =>
  import("@/features/menu").then((m) => ({ default: m.CmsMenuManagement }))
);
const CmsReservationsManagement = safeLazy(() =>
  import("@/features/reservations").then((m) => ({ default: m.CmsReservationsManagement }))
);
const CmsStaffManagement = safeLazy(() =>
  import("@/features/staff").then((m) => ({ default: m.CmsStaffManagement }))
);
const CmsStoreSettings = safeLazy(() =>
  import("@/features/settings").then((m) => ({ default: m.CmsStoreSettings }))
);
const CmsInventoryManagement = safeLazy(() =>
  import("@/features/inventory").then((m) => ({ default: m.CmsInventoryManagement }))
);
const CmsKdsView = safeLazy(() =>
  import("@/features/kds").then((m) => ({ default: m.CmsKdsView }))
);
const CmsStaffOrderView = safeLazy(() =>
  import("@/features/staff-order").then((m) => ({ default: m.CmsStaffOrderView }))
);
const CmsCustomerManagement = safeLazy(() =>
  import("@/features/customers").then((m) => ({ default: m.CmsCustomerManagement }))
);
const CmsPromotionsManagement = safeLazy(() =>
  import("@/features/promotions").then((m) => ({ default: m.CmsPromotionsManagement }))
);
const CmsHardwareSettings = safeLazy(() =>
  import("@/features/settings").then((m) => ({ default: m.CmsHardwareSettings }))
);
const CmsDeliveryIntegrations = safeLazy(() =>
  import("@/features/delivery").then((m) => ({ default: m.CmsDeliveryIntegrations }))
);
const CmsEInvoiceManagement = safeLazy(() =>
  import("@/features/e-invoice").then((m) => ({ default: m.CmsEInvoiceManagement }))
);
const CmsProfileView = safeLazy(() =>
  import("@/features/settings").then((m) => ({ default: m.CmsProfileView }))
);

export interface CmsRouteRendererProps {
  currentRole: CmsAppRole;
  activeMenu: string;
  currentUser: AuthUser | null;
  enabledModules: AppModule[];
  navigateMenu: (menu: string) => void;
  handleNavigateToOrderWithTable: (tableId: string) => void;
  handleLogout: () => void;
  setEnabledModules: (modules: AppModule[]) => void;
}

export const CmsRouteRenderer: React.FC<CmsRouteRendererProps> = ({
  currentRole,
  activeMenu,
  currentUser,
  enabledModules,
  navigateMenu,
  handleNavigateToOrderWithTable,
  handleLogout,
  setEnabledModules,
}) => {
  const allowedMenus = ROLE_ALLOWED_MENUS[currentRole] || ROLE_ALLOWED_MENUS.STORE_OWNER;
  const isMenuAllowed = allowedMenus.includes(activeMenu);
  const isLandingPageUnlocked = enabledModules.includes(AppModule.MODULE_LANDING_PAGE);

  return (
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
        ) : activeMenu === "profile" && currentUser ? (
          <CmsProfileView user={currentUser} currentRole={currentRole} onLogout={handleLogout} />
        ) : currentRole === "SUPER_ADMIN" ? (
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
            }}
          />
        ) : currentRole === "CHEF" ? (
          <>
            {activeMenu === "kds" && <CmsKdsView />}
            {activeMenu === "menu" && <CmsMenuManagement currentRole="CHEF" />}
          </>
        ) : currentRole === "WAITER" ? (
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
          <>
            {activeMenu === "analytics" && <CmsDeepAnalyticsView />}
            {activeMenu === "inventory" && <CmsInventoryManagement />}
            {activeMenu === "einvoice" && <CmsEInvoiceManagement />}
            {activeMenu === "dashboard" && <CmsDashboard onNavigateTab={navigateMenu} currentRole="ACCOUNTANT" />}
          </>
        ) : (
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
  );
};
