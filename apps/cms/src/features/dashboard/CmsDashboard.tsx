import React, { useState, useMemo } from "react";
import { browserRequest, getAuthUser } from "@a2order/shared";
import { useResource } from "@a2order/shared/react";
import { Button, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { CmsDashboardProps, CmsLiveStats } from "@/types";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  DashboardCalendarWidget,
  CmsDashboardHeroBanner,
  CmsBentoKpiGrid,
  CmsUrgentAlertsAndStations,
  CmsShiftStaffCarousel,
  CmsHourlyRevenueChart,
  CmsTopDishesSection,
  CmsRecentOrdersSection,
} from "./components";

export const CmsDashboard: React.FC<CmsDashboardProps> = ({
  onNavigateTab,
  currentRole = "STORE_OWNER",
}) => {
  const [currentVersion, setCurrentVersion] = useState("v1.0.3");
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAccountant = currentRole === "ACCOUNTANT";
  const isCashier = currentRole === "CASHIER";
  const storeId = getAuthUser()?.storeId || "";

  const [report, refreshReport] = useResource<any>(`/analytics/${storeId}/reports?period=today`, { bills: [] });
  const bills: any[] = report.bills || [];
  const [tablesZones, refreshTables] = useResource<any[]>(`/tables/${storeId}`, []);
  const [staffList, refreshStaff] = useResource<any[]>(currentRole === "STORE_OWNER" ? `/staff?storeId=${storeId}` : null, []);
  const [ingredients] = usePersistentState<any[]>("inventory_ingredients", []);
  const [kdsTickets] = useResource<any[]>(currentRole === "STORE_OWNER" ? "/orders/kds/tickets" : null, []);

  const liveStats = useMemo<CmsLiveStats>(() => {
    const totalRevenue = bills.reduce((s: number, b: any) => s + (b.finalAmount || 0), 0);
    const totalOrders = bills.length;
    const discountTotal = bills.reduce((s: number, b: any) => s + (b.discountAmount || 0), 0);
    const vietqrTotal = bills.reduce(
      (s: number, b: any) =>
        s + (b.payments || []).filter((p: any) => p.method === "VIETQR").reduce((sum: number, p: any) => sum + p.amount, 0),
      0
    );
    const vietqrPct = totalRevenue > 0 ? Math.round((vietqrTotal / totalRevenue) * 100) : 0;
    const cashTotal = bills.reduce(
      (s: number, b: any) =>
        s + (b.payments || []).filter((p: any) => p.method === "CASH").reduce((sum: number, p: any) => sum + p.amount, 0),
      0
    );

    const allTables = tablesZones.flatMap((z: any) => z.tables || []);
    const occupiedTables = allTables.filter((t: any) => t.status !== "EMPTY").length;
    const totalTables = allTables.length;
    const activeStaff = staffList.filter((s: any) => s.isActive).length;
    const lowStockCount = ingredients.filter((i: any) => i.currentStock <= (i.minStock || 0)).length;
    const pendingTickets = kdsTickets.filter((t: any) => t.status === "NEW" || t.status === "IN_PROGRESS").length;

    return {
      totalRevenue,
      totalOrders,
      discountTotal,
      vietqrPct,
      cashTotal,
      vietqrTotal,
      occupiedTables,
      totalTables,
      activeStaff,
      lowStockCount,
      pendingTickets,
    };
  }, [bills, tablesZones, staffList, ingredients, kdsTickets]);

  const handlePublishChanges = async () => {
    setIsPublishing(true);
    try {
      const result = await browserRequest<any>(`/stores/${storeId}/publish`, { method: "POST" });
      setCurrentVersion(result.configVersion || result.version);
      setHasUnpublishedChanges(false);
      toast.success("Đã xuất bản cấu hình");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshReport(), refreshTables(), refreshStaff()]);
      toast.success("Đã đồng bộ dữ liệu");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {!isAccountant && !isCashier && hasUnpublishedChanges && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Icon name="alert" size={16} />
            </span>
            <div className="text-xs">
              <span className="font-extrabold">Bạn có thay đổi chưa áp dụng! </span>
              <span className="text-amber-800">
                Các máy phục vụ tại quán vẫn đang dùng cache cũ (bản {currentVersion}). Nhấn "Áp Dụng Thay Đổi" để phát lệnh cập nhật tới POS/KDS.
              </span>
            </div>
          </div>

          <Button
            size="sm"
            className="rounded-xl bg-amber-700 hover:bg-amber-800 text-white gap-1.5 text-xs font-bold shrink-0 shadow-2xs"
            onClick={handlePublishChanges}
            disabled={isPublishing}
          >
            <Icon name="refresh" size={14} className={isPublishing ? "animate-spin" : ""} />
            <span>{isPublishing ? "Đang xuất bản..." : "Áp Dụng Thay Đổi (Publish)"}</span>
          </Button>
        </div>
      )}

      <CmsDashboardHeroBanner
        currentRole={currentRole}
        isAccountant={isAccountant}
        isCashier={isCashier}
        liveStats={liveStats}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onNavigateTab={onNavigateTab}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3.5 sm:gap-5 items-start">
        <div className="space-y-3.5 sm:space-y-5 min-w-0">
          <CmsBentoKpiGrid
            isAccountant={isAccountant}
            isCashier={isCashier}
            liveStats={liveStats}
            onNavigateTab={onNavigateTab}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
            <div className="lg:col-span-7">
              <CmsUrgentAlertsAndStations
                liveStats={liveStats}
                onNavigateTab={onNavigateTab}
              />
            </div>
            <CmsShiftStaffCarousel
              staffList={staffList}
              onNavigateTab={onNavigateTab}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5">
            <CmsHourlyRevenueChart
              bills={bills}
              liveStats={liveStats}
            />
            <CmsTopDishesSection
              bills={bills}
              onNavigateTab={onNavigateTab}
            />
          </div>

          <CmsRecentOrdersSection
            bills={bills}
            onNavigateTab={onNavigateTab}
          />
        </div>

        <div className="xl:sticky xl:top-1.5 self-start space-y-3 sm:space-y-3.5">
          <DashboardCalendarWidget onNavigateTab={onNavigateTab} />
        </div>
      </div>
    </div>
  );
};
