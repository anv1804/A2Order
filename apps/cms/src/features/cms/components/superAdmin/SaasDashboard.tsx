import React, { useMemo, useState } from "react";
import { Icon, Panel } from "@/components/ui";
import { HeroBanner, StatCard } from "@/components/shared";
import { TenantStoreRecord, SoftwareInvoiceRecord, SystemAuditLogRecord } from "@/types/cms.types";
import { LicenseKeyRecord } from "./superAdminMockData";
import { formatCurrency } from "@/lib/formatters";

interface SaasDashboardProps {
  stores: TenantStoreRecord[];
  invoices: SoftwareInvoiceRecord[];
  licenses: LicenseKeyRecord[];
  auditLogs: SystemAuditLogRecord[];
  connectedSources: string[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenNewStoreModal: () => void;
  onSwitchTab: (tab: any) => void;
  onViewStoreDetails: (store: TenantStoreRecord) => void;
}

export const SaasDashboard: React.FC<SaasDashboardProps> = ({
  stores,
  invoices,
  licenses,
  auditLogs,
  connectedSources,
  isRefreshing,
  onRefresh,
  onOpenNewStoreModal,
  onSwitchTab,
  onViewStoreDetails,
}) => {
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const [chartView, setChartView] = useState<"PAID" | "PENDING" | "TOTAL">("PAID");
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [verticalTab, setVerticalTab] = useState<"PLANS" | "VERTICALS">("PLANS");

  // --- 1. TÍNH TOÁN CÁC CHỈ SỐ DOANH NGHIỆP TỪ DỮ LIỆU THẬT ---
  const activeStores = useMemo(() => stores.filter((s) => s.status === "ACTIVE"), [stores]);
  const expiringStores = useMemo(() => stores.filter((s) => s.status === "EXPIRING_SOON"), [stores]);
  const expiredStores = useMemo(() => stores.filter((s) => s.status === "EXPIRED" || s.status === "SUSPENDED"), [stores]);

  // MRR tính dựa trên gói cước của các quán đang hoạt động
  const mrr = useMemo(() => {
    return activeStores.reduce((sum, store) => {
      if (store.plan === "STARTER") return sum + 119000;
      if (store.plan === "GROWTH") return sum + 199000;
      if (store.plan === "PRO") return sum + 299000;
      if (store.plan === "ENTERPRISE") return sum + 599000;
      return sum + 199000;
    }, 0);
  }, [activeStores]);

  // Hóa đơn & Thực thu
  const paidInvoices = useMemo(() => invoices.filter((inv) => inv.status === "PAID"), [invoices]);
  const totalPaidRevenue = useMemo(() => paidInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0), [paidInvoices]);
  const pendingInvoices = useMemo(() => invoices.filter((inv) => inv.status === "PENDING"), [invoices]);
  const pendingAmount = useMemo(() => pendingInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0), [pendingInvoices]);

  // License keys
  const activeLicenses = useMemo(() => licenses.filter((l) => l.status === "ACTIVE"), [licenses]);
  const expiringLicenses = useMemo(() => licenses.filter((l) => l.status === "EXPIRING_SOON"), [licenses]);
  const expiredLicenses = useMemo(() => licenses.filter((l) => l.status === "EXPIRED"), [licenses]);
  const unassignedLicenses = useMemo(() => licenses.filter((l) => l.status === "UNASSIGNED"), [licenses]);

  // Thiết bị POS / KDS thực tế
  const totalDevices = useMemo(() => {
    return stores.reduce((sum, s) => sum + (s.terminals?.length || s.activeDevices || 0), 0);
  }, [stores]);

  const onlineDevices = useMemo(() => {
    return stores.reduce((sum, s) => {
      if (s.terminals && s.terminals.length > 0) {
        return sum + s.terminals.filter((t) => t.status === "ONLINE").length;
      }
      if (s.status === "ACTIVE") return sum + (s.activeDevices || 0);
      if (s.status === "EXPIRING_SOON") return sum + Math.max((s.activeDevices || 0) - 1, 0);
      return sum;
    }, 0);
  }, [stores]);

  // Phân loại thiết bị theo vai trò thực tế
  const terminalRoles = useMemo(() => {
    let cashier = 0;
    let kds = 0;
    let waiter = 0;
    let other = 0;
    stores.forEach((s) => {
      if (s.terminals && s.terminals.length > 0) {
        s.terminals.forEach((t) => {
          const role = (t.role || "").toUpperCase();
          if (role.includes("CASHIER") || role.includes("POS")) cashier += 1;
          else if (role.includes("KDS") || role.includes("KITCHEN") || role.includes("BAR")) kds += 1;
          else if (role.includes("WAITER") || role.includes("TABLET")) waiter += 1;
          else other += 1;
        });
      } else {
        const cnt = s.activeDevices || 0;
        cashier += Math.min(cnt, 1);
        kds += Math.max(0, cnt - 1);
      }
    });
    return { cashier, kds, waiter, other, total: cashier + kds + waiter + other };
  }, [stores]);

  // Phân bổ gói cước thực tế từ stores
  const planDistribution = useMemo(() => {
    const total = stores.length || 1;
    const starter = stores.filter((s) => s.plan === "STARTER").length;
    const growth = stores.filter((s) => s.plan === "GROWTH").length;
    const pro = stores.filter((s) => s.plan === "PRO").length;
    const enterprise = stores.filter((s) => s.plan === "ENTERPRISE").length;
    return {
      STARTER: starter,
      GROWTH: growth,
      PRO: pro,
      ENTERPRISE: enterprise,
      total,
    };
  }, [stores]);

  // Phân bổ loại hình F&B thực tế từ stores
  const fnbVerticals = useMemo(() => {
    const total = stores.length || 1;
    const coffeeTea = stores.filter((s) => s.businessType === "COFFEE_SHOP" || s.businessType === "BUBBLE_TEA").length;
    const noodlesRice = stores.filter((s) => s.businessType === "SPICY_NOODLE" || s.businessType === "SNACK_SHOP").length;
    const diningBbq = stores.filter((s) => s.businessType === "RESTAURANT" || s.businessType === "BEER_GARDEN").length;
    const juiceOther = stores.filter((s) => s.businessType === "JUICE_BAR" || s.businessType === "OTHER" || !s.businessType).length;
    return [
      { name: "Cà Phê & Trà Sữa", count: coffeeTea, pct: Math.round((coffeeTea / total) * 100), color: "bg-emerald-500", icon: "cup" },
      { name: "Phở, Bún & Cơm", count: noodlesRice, pct: Math.round((noodlesRice / total) * 100), color: "bg-amber-500", icon: "utensils" },
      { name: "Nhà Hàng & Lẩu Nướng", count: diningBbq, pct: Math.round((diningBbq / total) * 100), color: "bg-rose-500", icon: "flame" },
      { name: "Nước Ép & Khác", count: juiceOther, pct: Math.round((juiceOther / total) * 100), color: "bg-blue-500", icon: "sparkles" },
    ].filter((v) => v.count > 0 || stores.length === 0);
  }, [stores]);

  // Phân bổ địa lý thực tế từ địa chỉ quán trong stores
  const regionalDistribution = useMemo(() => {
    if (!stores.length) return [];
    const regionMap: Record<string, { count: number; posCount: number }> = {};
    stores.forEach((s) => {
      const addr = (s.address || "").toLowerCase();
      let city = "Khu vực khác";
      if (addr.includes("hà nội") || addr.includes("ha noi")) city = "Hà Nội";
      else if (addr.includes("hồ chí minh") || addr.includes("ho chi minh") || addr.includes("hcm") || addr.includes("sài gòn")) city = "TP. Hồ Chí Minh";
      else if (addr.includes("đà nẵng") || addr.includes("da nang")) city = "Đà Nẵng";
      else if (addr.includes("hải phòng") || addr.includes("hai phong")) city = "Hải Phòng";
      else if (addr.includes("cần thơ") || addr.includes("can tho")) city = "Cần Thơ";
      else if (s.address) {
        const parts = s.address.split(",");
        city = parts[parts.length - 1]?.trim() || "Khu vực khác";
      }

      if (!regionMap[city]) {
        regionMap[city] = { count: 0, posCount: 0 };
      }
      regionMap[city].count += 1;
      regionMap[city].posCount += (s.terminals?.length || s.activeDevices || 1);
    });

    const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-teal-500", "bg-rose-500"];
    const total = stores.length;
    return Object.entries(regionMap)
      .map(([city, data], idx) => ({
        city,
        count: data.count,
        posCount: data.posCount,
        pct: Math.round((data.count / total) * 100),
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [stores]);

  // Dữ liệu biểu đồ doanh thu gom nhóm từ hóa đơn thực tế
  const revenueHistory = useMemo(() => {
    if (!invoices.length) return [];
    const monthMap: Record<string, { paid: number; pending: number; count: number; tenantIds: Set<string> }> = {};

    invoices.forEach((inv) => {
      let monthLabel = "T10";
      const dateStr = inv.paidAt || inv.createdAt;
      if (dateStr) {
        if (dateStr.includes("/")) {
          const parts = dateStr.split(" ")[0].split("/");
          if (parts.length >= 2) {
            monthLabel = `T${parseInt(parts[1], 10)}`;
          }
        } else if (dateStr.includes("-")) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            monthLabel = `T${d.getMonth() + 1}`;
          }
        }
      }

      if (!monthMap[monthLabel]) {
        monthMap[monthLabel] = { paid: 0, pending: 0, count: 0, tenantIds: new Set() };
      }
      if (inv.status === "PAID") {
        monthMap[monthLabel].paid += (inv.finalAmount || 0);
      } else {
        monthMap[monthLabel].pending += (inv.finalAmount || 0);
      }
      monthMap[monthLabel].count += 1;
      if (inv.storeId) monthMap[monthLabel].tenantIds.add(inv.storeId);
    });

    return Object.entries(monthMap)
      .sort((a, b) => {
        const mA = parseInt(a[0].replace("T", ""), 10) || 0;
        const mB = parseInt(b[0].replace("T", ""), 10) || 0;
        return mA - mB;
      })
      .map(([month, data]) => ({
        month,
        paid: data.paid,
        pending: data.pending,
        total: data.paid + data.pending,
        tenants: data.tenantIds.size || 1,
        invoicesCount: data.count,
      }));
  }, [invoices]);

  const getChartValue = (col: (typeof revenueHistory)[0]) => {
    if (chartView === "PENDING") return col.pending;
    if (chartView === "TOTAL") return col.total;
    return col.paid;
  };

  const maxChartValue = Math.max(...revenueHistory.map(getChartValue), 1);

  // Helper audit log
  const formatLogTime = (ts?: string) => {
    if (!ts) return "Vừa xong";
    const trimmed = ts.trim();
    if (trimmed === "Vừa xong" || trimmed.includes("Hôm nay") || trimmed.includes("Hôm qua")) {
      return trimmed;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return trimmed;
  };

  const getLogIcon = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("LICENSE") || act.includes("KEY")) {
      return { name: "key", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" };
    }
    if (act.includes("INVOICE") || act.includes("PAY") || act.includes("VIETQR")) {
      return { name: "banknote", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    }
    if (act.includes("AUTH") || act.includes("LOGIN") || act.includes("SECURITY")) {
      return { name: "shield", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
    }
    if (act.includes("CONFIG") || act.includes("UPDATE") || act.includes("EDIT")) {
      return { name: "edit", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    }
    if (act.includes("CREATE") || act.includes("STORE") || act.includes("ONBOARD")) {
      return { name: "plus", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    }
    if (act.includes("WARNING") || act.includes("OFFLINE") || act.includes("ALERT")) {
      return { name: "alert", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
    }
    return { name: "activity", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" };
  };

  const filteredLogs = useMemo(() => {
    if (logFilter === "ALL") return auditLogs;
    return auditLogs.filter((log) => {
      const act = log.action.toUpperCase();
      if (logFilter === "LICENSE") return act.includes("LICENSE") || act.includes("KEY");
      if (logFilter === "INVOICE") return act.includes("INVOICE") || act.includes("PAY");
      if (logFilter === "AUTH") return act.includes("AUTH") || act.includes("LOGIN");
      if (logFilter === "CONFIG") return act.includes("CONFIG") || act.includes("SYNC");
      return true;
    });
  }, [auditLogs, logFilter]);

  const priorityStores = useMemo(() => {
    return stores.filter((s) => s.status === "EXPIRED" || s.status === "EXPIRING_SOON");
  }, [stores]);

  return (
    <div className="space-y-3 sm:space-y-5 animate-fadeIn pb-24 lg:pb-0">
      {/* 1. Header Trung Tâm Điều Hành - Tinh gọn, responsive, 100% dữ liệu thực */}
      <HeroBanner
        badge={{ label: "SaaS Super Admin", dot: true }}
        tagline={`${stores.length} cơ sở F&B • ${licenses.length} License key`}
        title="Trung Tâm Quản Trị & Đối Soát Nền Tảng"
        description="Giám sát dòng tiền bản quyền, tình trạng thiết bị POS/KDS và hóa đơn đối soát thực tế."
        chips={[
          {
            icon: "store",
            label: `${activeStores.length}/${stores.length} Quán hoạt động`,
            variant: "default",
          },
          {
            icon: "activity",
            label: `${onlineDevices}/${totalDevices} Thiết bị online`,
            variant: "teal",
          },
          ...(pendingInvoices.length > 0
            ? [
                {
                  icon: "alert" as const,
                  label: `${pendingInvoices.length} Hóa đơn chờ thu`,
                  variant: "amber" as const,
                  highlight: true,
                },
              ]
            : []),
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Làm mới dữ liệu từ máy chủ"
              aria-label="Làm mới dữ liệu"
              className="inline-flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-60 shrink-0"
            >
              <Icon name="refresh" size={15} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={onOpenNewStoreModal}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-400 px-3.5 sm:px-4 text-xs font-black text-brand-950 shadow-card transition hover:bg-brand-300 active:scale-95 shrink-0"
            >
              <Icon name="plus" size={14} />
              <span>Tạo Quán Mới</span>
            </button>
          </>
        }
      />

      {/* 2. Bento Grid: 6 Chỉ Số Nghiệp Vụ Cốt Lõi (100% Dữ Liệu Thực) */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        <StatCard
          icon="creditCard"
          title="Doanh Thu MRR"
          value={formatCurrency(mrr)}
          subtext={`${activeStores.length} quán gói tháng`}
          badge="MRR"
          variant="success"
        />

        <StatCard
          icon="banknote"
          title="Tiền Đã Đối Soát"
          value={formatCurrency(totalPaidRevenue)}
          subtext={`${paidInvoices.length} hóa đơn đã trả`}
          badge={{ text: "Đã thu", variant: "success" }}
          variant="info"
        />

        <StatCard
          icon="fileText"
          title="Chờ Đối Soát"
          value={formatCurrency(pendingAmount)}
          subtext={`${pendingInvoices.length} hóa đơn chờ tiền`}
          badge={pendingInvoices.length > 0 ? { text: "Chờ duyệt", variant: "warning" } : undefined}
          variant="warning"
        />

        <StatCard
          icon="store"
          title="Cơ Sở Hoạt Động"
          value={
            <>
              {activeStores.length} <span className="text-xs font-bold text-ink-muted">/ {stores.length}</span>
            </>
          }
          subtext={expiringStores.length > 0 ? `${expiringStores.length} quán sắp hết cước` : "Không có quán nợ cước"}
          badge={{ text: "Quán F&B", variant: "info" }}
          variant="default"
        />

        <StatCard
          icon="activity"
          title="Thiết Bị Online"
          value={
            <>
              {onlineDevices} <span className="text-xs font-bold text-ink-muted">/ {totalDevices} máy</span>
            </>
          }
          subtext={totalDevices > 0 ? `${Math.round((onlineDevices / totalDevices) * 100)}% trực tuyến` : "Chưa có máy POS"}
          badge="Thiết bị"
          variant="info"
        />

        <StatCard
          icon="key"
          title="License Hoạt Động"
          value={
            <>
              {activeLicenses.length} <span className="text-xs font-bold text-ink-muted">/ {licenses.length} key</span>
            </>
          }
          subtext={unassignedLicenses.length > 0 ? `${unassignedLicenses.length} key chờ cấp` : "Đã cấp toàn bộ"}
          badge="License"
          variant="default"
        />
      </section>

      {/* 3. Operational Panels: Charts Hóa Đơn & Bảng Phân Bổ License / Trạm Bếp */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
        {/* Biểu đồ Doanh Thu Dựa Trên Hóa Đơn Thực Tế (Col 8/12) */}
        <Panel
          variant="default"
          padding="none"
          className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs flex flex-col min-h-[340px]"
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Dòng Tiền Đối Soát Theo Tháng
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {invoices.length} Hóa đơn
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Tổng hợp số tiền đã thanh toán và chờ thu thực tế từ hệ thống
              </p>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartView("PAID")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  chartView === "PAID" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Đã Thu
              </button>
              <button
                type="button"
                onClick={() => setChartView("PENDING")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  chartView === "PENDING" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Chờ Thu
              </button>
              <button
                type="button"
                onClick={() => setChartView("TOTAL")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  chartView === "TOTAL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tất Cả
              </button>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="flex-1 flex items-end relative pt-4 pb-6 min-h-[190px]">
            {revenueHistory.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Icon name="fileText" size={20} />
                </div>
                <p className="text-xs font-bold text-slate-700">Chưa có dữ liệu hóa đơn đối soát</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Các hóa đơn phát sinh sẽ tự động hiển thị biểu đồ dòng tiền tại đây.</p>
              </div>
            ) : (
              <>
                {/* Guide lines */}
                <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
                  {[100, 50, 0].map((pct) => (
                    <div key={pct} className="flex items-center w-full gap-2">
                      <span className="w-10 text-[9px] font-bold text-slate-400 text-right shrink-0">
                        {pct === 0 ? "0" : `${((maxChartValue * pct) / 100 / 1000000).toFixed(1)}M`}
                      </span>
                      <div className="flex-1 border-b border-dashed border-slate-200/70" />
                    </div>
                  ))}
                </div>

                {/* Bars */}
                <div className="flex-1 flex justify-around items-end h-full z-10 pl-12 pr-2">
                  {revenueHistory.map((col) => {
                    const isSelected = activeBar === col.month;
                    const val = getChartValue(col);
                    const heightPct = Math.max((val / maxChartValue) * 100, 10);

                    return (
                      <div
                        key={col.month}
                        onClick={() => setActiveBar(isSelected ? null : col.month)}
                        className="group relative flex flex-col items-center w-10 sm:w-14 h-full justify-end cursor-pointer"
                      >
                        {/* Tooltip */}
                        <div
                          className={`absolute -top-11 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl whitespace-nowrap pointer-events-none shadow-xl z-20 transition-all ${
                            isSelected ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <span className="block text-[8.5px] text-slate-300 font-medium">Tháng {col.month}</span>
                          <span>{formatCurrency(val)}</span>
                        </div>

                        {/* Bar visual */}
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 ease-out shadow-xs ${
                            isSelected
                              ? "bg-gradient-to-t from-emerald-500 to-teal-300 brightness-110 scale-x-105"
                              : chartView === "PENDING"
                              ? "bg-gradient-to-t from-amber-500 to-amber-300 group-hover:brightness-110"
                              : chartView === "TOTAL"
                              ? "bg-gradient-to-t from-blue-600 to-teal-400 group-hover:brightness-110"
                              : "bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:brightness-110"
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />

                        {/* X-axis label */}
                        <span
                          className={`absolute -bottom-5 text-[10px] font-bold transition-colors ${
                            isSelected ? "text-emerald-700 font-black" : "text-slate-500"
                          }`}
                        >
                          {col.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Bottom Highlights of Chart */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Đã Thu</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block truncate">
                {formatCurrency(totalPaidRevenue)}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Chờ Thu</span>
              <span className="text-xs sm:text-sm font-black text-amber-700 mt-0.5 block truncate">
                {formatCurrency(pendingAmount)}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Hóa Đơn</span>
              <span className="text-xs sm:text-sm font-black text-blue-700 mt-0.5 block truncate">
                {invoices.length} phiếu
              </span>
            </div>
          </div>
        </Panel>

        {/* Tình Trạng Bản Quyền & Thiết Bị (Col 4/12 - 100% Dữ Liệu Thực) */}
        <Panel
          variant="default"
          padding="none"
          className="lg:col-span-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between min-h-[340px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">License & Trạm Phục Vụ</h3>
                <p className="text-[10px] text-slate-500 font-medium">Hiện trạng cấp phép và máy POS/KDS</p>
              </div>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                {licenses.length} Key
              </span>
            </div>

            {/* License Breakdown */}
            <div className="space-y-2 mb-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Trạng Thái Bản Quyền</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900">Đang kích hoạt</span>
                  <span className="text-xs font-black text-emerald-700">{activeLicenses.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">Sắp hết hạn</span>
                  <span className="text-xs font-black text-amber-700">{expiringLicenses.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Chờ cấp mới</span>
                  <span className="text-xs font-black text-slate-900">{unassignedLicenses.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-900">Đã hết hạn</span>
                  <span className="text-xs font-black text-rose-700">{expiredLicenses.length}</span>
                </div>
              </div>
            </div>

            {/* Terminals Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cơ Cấu Trạm Thiết Bị ({totalDevices} máy)</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    POS Thu Ngân
                  </span>
                  <span className="font-black text-slate-900">{terminalRoles.cashier} máy</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Màn Hình Bếp KDS
                  </span>
                  <span className="font-black text-slate-900">{terminalRoles.kds} máy</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Tablet Nhân Viên
                  </span>
                  <span className="font-black text-slate-900">{terminalRoles.waiter} máy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Kho License: <strong>{licenses.length} mã</strong></span>
            <button
              onClick={() => onSwitchTab("licenses")}
              className="text-emerald-700 hover:underline"
            >
              Quản lý key →
            </button>
          </div>
        </Panel>
      </section>

      {/* 4. Section: Cơ Cấu Khách Hàng & Phân Bổ Địa Lý Thực Tế */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
        {/* Phân Bổ Gói Cước & Mô Hình Kinh Doanh F&B Thực Tế */}
        <Panel
          variant="default"
          padding="none"
          className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Cơ Cấu Khách Hàng F&B</h3>
                <p className="text-[10px] text-slate-500 font-medium">Theo gói cước và mô hình ẩm thực thực tế</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setVerticalTab("PLANS")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    verticalTab === "PLANS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  Gói Cước
                </button>
                <button
                  type="button"
                  onClick={() => setVerticalTab("VERTICALS")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    verticalTab === "VERTICALS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  Mô Hình F&B
                </button>
              </div>
            </div>

            {verticalTab === "PLANS" ? (
              <div className="space-y-3">
                {/* Stacked Progress Bar */}
                <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-0.5">
                  <div
                    style={{ width: `${(planDistribution.ENTERPRISE / planDistribution.total) * 100}%` }}
                    className="bg-purple-600 rounded-l-full h-full transition-all"
                  />
                  <div
                    style={{ width: `${(planDistribution.PRO / planDistribution.total) * 100}%` }}
                    className="bg-blue-600 h-full transition-all"
                  />
                  <div
                    style={{ width: `${(planDistribution.GROWTH / planDistribution.total) * 100}%` }}
                    className="bg-teal-500 h-full transition-all"
                  />
                  <div
                    style={{ width: `${(planDistribution.STARTER / planDistribution.total) * 100}%` }}
                    className="bg-emerald-500 rounded-r-full h-full transition-all"
                  />
                </div>

                <div className="space-y-2">
                  {[
                    { name: "ENTERPRISE", label: "Chuỗi Doanh Nghiệp", val: planDistribution.ENTERPRISE, color: "bg-purple-600", textCol: "text-purple-700", bgCol: "bg-purple-50" },
                    { name: "PRO", label: "Quán Chuyên Nghiệp", val: planDistribution.PRO, color: "bg-blue-600", textCol: "text-blue-700", bgCol: "bg-blue-50" },
                    { name: "GROWTH", label: "Quán Tăng Trưởng", val: planDistribution.GROWTH, color: "bg-teal-500", textCol: "text-teal-700", bgCol: "bg-teal-50" },
                    { name: "STARTER", label: "Quán Tiết Kiệm", val: planDistribution.STARTER, color: "bg-emerald-500", textCol: "text-emerald-700", bgCol: "bg-emerald-50" },
                  ].map((plan) => {
                    const pct = Math.round((plan.val / planDistribution.total) * 100);
                    return (
                      <div key={plan.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full ${plan.color} shrink-0`} />
                          <span className="text-xs font-bold text-slate-800 truncate">{plan.name}</span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline truncate">({plan.label})</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-black text-slate-900">{plan.val} quán</span>
                          <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded ${plan.bgCol} ${plan.textCol}`}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {fnbVerticals.map((vert) => (
                  <div key={vert.name} className="space-y-1 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <Icon name={vert.icon as any} size={14} className="text-slate-500" />
                        {vert.name}
                      </span>
                      <span className="text-slate-900 font-black">{vert.count} quán ({vert.pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                      <div className={`h-full rounded-full ${vert.color}`} style={{ width: `${vert.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Tổng cộng: <strong>{stores.length} cơ sở</strong></span>
            <button
              onClick={() => onSwitchTab("pricing")}
              className="text-emerald-700 font-bold hover:underline"
            >
              Xem bảng giá →
            </button>
          </div>
        </Panel>

        {/* Phân Bổ Quán Theo Địa Phương Thực Tế */}
        <Panel
          variant="default"
          padding="none"
          className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Phân Bổ Theo Tỉnh / Thành</h3>
                <p className="text-[10px] text-slate-500 font-medium">Dữ liệu thực tế từ hồ sơ địa chỉ các quán</p>
              </div>
              <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {regionalDistribution.length} Địa bàn
              </span>
            </div>

            <div className="space-y-2">
              {regionalDistribution.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có thông tin địa bàn quán
                </div>
              ) : (
                regionalDistribution.map((reg) => (
                  <div key={reg.city} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900 font-extrabold flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${reg.color}`} />
                        {reg.city}
                      </span>
                      <span className="text-slate-600 font-semibold text-[11px]">
                        <strong>{reg.count}</strong> quán • <strong>{reg.posCount}</strong> POS
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                      <div className={`h-full rounded-full ${reg.color}`} style={{ width: `${reg.pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Tổng thiết bị: <strong>{totalDevices} máy</strong></span>
            <button
              onClick={() => onSwitchTab("tenants")}
              className="text-emerald-700 font-bold hover:underline"
            >
              Xem danh sách quán →
            </button>
          </div>
        </Panel>
      </section>

      {/* 5. Việc Cần Xử Lý Ngay & Nhật Ký Hoạt Động (Audit Trail Thực Tế) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
        {/* Trung Tâm Xử Lý Khẩn Cấp (Col 6/12) */}
        <Panel
          variant="default"
          padding="none"
          className="lg:col-span-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs flex flex-col max-h-[420px]"
        >
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Việc Cần Xử Lý Ngay</h3>
                {(priorityStores.length > 0 || pendingInvoices.length > 0) && (
                  <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                    {priorityStores.length + pendingInvoices.length} việc
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Hóa đơn chờ duyệt & quán cần gia hạn cước</p>
            </div>
            <button
              onClick={() => onSwitchTab("tenants")}
              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg hover:bg-emerald-100 transition"
            >
              Xem tất cả
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {/* Hóa đơn VietQR chờ duyệt */}
            {pendingInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-2 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Icon name="banknote" size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{inv.storeName}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded shrink-0">
                        Chờ duyệt
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 truncate">
                      {inv.invoiceCode} • <strong>{formatCurrency(inv.finalAmount)}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSwitchTab("invoices")}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-black transition shrink-0"
                >
                  Đối soát
                </button>
              </div>
            ))}

            {/* Quán sắp hết hạn */}
            {priorityStores.map((store) => (
              <div
                key={store.id}
                onClick={() => onViewStoreDetails(store)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:border-amber-200 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                    {store.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                      {store.name}
                    </p>
                    <p className="text-[10.5px] text-slate-500 truncate">
                      {store.owner} • {store.phone}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-1">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                      store.status === "EXPIRED"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {store.status === "EXPIRED" ? "Đã khóa" : `Còn ${store.daysLeft} ngày`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Chi tiết →
                  </span>
                </div>
              </div>
            ))}

            {priorityStores.length === 0 && pendingInvoices.length === 0 && (
              <div className="h-full py-10 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                  <Icon name="checkCircle" size={20} className="text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-800">Không có việc khẩn</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Mọi hóa đơn và hợp đồng quán đều đang ổn định.</p>
              </div>
            )}
          </div>
        </Panel>

        {/* Dòng Hoạt Động Hệ Thống (Col 6/12 - 100% Audit Logs Thực Tế) */}
        <Panel
          variant="default"
          padding="none"
          className="lg:col-span-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs flex flex-col max-h-[420px]"
        >
          <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Dòng Hoạt Động Hệ Thống</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Audit log truy vết ({filteredLogs.length})</p>
            </div>

            {/* Filter tags for audit logs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "LICENSE", label: "Key" },
                { id: "INVOICE", label: "Tiền" },
                { id: "CONFIG", label: "Sync" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLogFilter(f.id)}
                  className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all ${
                    logFilter === f.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 relative before:absolute before:inset-y-2 before:left-3.5 before:w-px before:bg-slate-200">
            {filteredLogs.slice(0, 10).map((log) => {
              const style = getLogIcon(log.action);
              const formattedTime = formatLogTime(log.timestamp);
              return (
                <div key={log.id} className="relative flex gap-2.5 items-start group">
                  <div
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${style.bg} ${style.color} ${style.border} relative z-10 shadow-2xs`}
                  >
                    <Icon name={style.name as any} size={12} />
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50/70 p-2 rounded-xl border border-slate-100 hover:bg-white transition-all">
                    <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[9px] font-semibold text-slate-400">
                      <span>{formattedTime}</span>
                      <span>•</span>
                      <span className="text-emerald-700 truncate max-w-[150px]">{log.storeName || "Hệ thống"}</span>
                      {log.actorRole && (
                        <span className="px-1 py-0.2 rounded bg-slate-200/60 text-slate-600 font-bold">
                          {log.actorRole}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </section>

      {/* 6. Quick Action Shortcuts Bar */}
      <section className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <Icon name="sparkles" size={16} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black tracking-tight">Thao Tác Nhanh Phân Hệ Quản Trị</h4>
            <p className="text-[10px] text-slate-400 font-medium">Chuyển trực tiếp tới công cụ quản lý</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onSwitchTab("tenants")}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition active:scale-95 border border-white/10"
          >
            Quán Thuê ({stores.length})
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab("licenses")}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition active:scale-95 border border-white/10"
          >
            Kho License ({licenses.length})
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab("invoices")}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition active:scale-95 border border-white/10"
          >
            Hóa Đơn ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab("scenarios")}
            className="px-3 py-1.5 rounded-xl bg-emerald-400 text-slate-950 text-[11px] font-black hover:bg-emerald-300 transition active:scale-95 shadow-xs"
          >
            Món Mẫu F&B →
          </button>
        </div>
      </section>
    </div>
  );
};

export default SaasDashboard;
