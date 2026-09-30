import React, { useMemo } from "react";
import { Icon, Panel } from "@/components/ui";
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
  // --- TÍNH TOÁN NGHIỆP VỤ ---
  const mrr = useMemo(() => stores.reduce((sum, store) => {
    if (store.status === "ACTIVE") {
      if (store.plan === "STARTER") return sum + 299000;
      if (store.plan === "PRO") return sum + 599000;
      if (store.plan === "ENTERPRISE") return sum + 1299000;
    }
    return sum;
  }, 0), [stores]);

  const planDistribution = useMemo(() => {
    const active = stores.filter(s => s.status === "ACTIVE");
    return {
      STARTER: active.filter(s => s.plan === "STARTER").length,
      PRO: active.filter(s => s.plan === "PRO").length,
      ENTERPRISE: active.filter(s => s.plan === "ENTERPRISE").length,
      total: active.length || 1 // avoid div by 0
    };
  }, [stores]);

  // Mock data biểu đồ doanh thu (6 tháng gần nhất)
  const revenueHistory = [
    { month: "T4", value: mrr * 0.4 },
    { month: "T5", value: mrr * 0.55 },
    { month: "T6", value: mrr * 0.6 },
    { month: "T7", value: mrr * 0.75 },
    { month: "T8", value: mrr * 0.9 },
    { month: "T9", value: mrr },
  ];
  const maxRevenue = Math.max(...revenueHistory.map(r => r.value), 1);

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn pb-12">
      {/* 1. Jumbotron Header */}
      <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0a231b] to-[#12372a] px-5 py-6 text-white shadow-[0_20px_55px_rgba(16,45,36,.25)] sm:px-8 sm:py-8 border border-white/10">
        <div className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-[-90px] left-[30%] -z-10 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
        
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-emerald-100 uppercase shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Trung tâm điều hành SaaS F&B
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Hệ Thống Đang Hoạt Động <span className="text-emerald-400">Tốt</span>.</h2>
            <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-emerald-50/70 font-medium">
              Chào mừng Admin. Giám sát toàn bộ dòng tiền MRR, tình trạng máy chủ và vòng đời của hàng ngàn đối tác chỉ trong một màn hình.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 mr-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 backdrop-blur-md">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-emerald-200/60 uppercase tracking-widest">Uptime</span>
                <span className="text-sm font-black text-white">99.99%</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-emerald-200/60 uppercase tracking-widest">Latency</span>
                <span className="text-sm font-black text-emerald-300">24ms</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60 backdrop-blur-md"
            >
              <Icon name="refresh" size={16} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Đang xử lý..." : "Làm mới"}
            </button>
            <button
              type="button"
              onClick={onOpenNewStoreModal}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-b from-white to-emerald-50 px-5 text-xs font-black text-[#0a231b] shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,255,255,0.2)] active:translate-y-0"
            >
              <Icon name="plus" size={16} />
              Tạo Đối Tác
            </button>
          </div>
        </div>
      </section>

      {/* 2. Deep Business Metrics (MRR, Churn, CAC) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Doanh Thu Hằng Tháng (MRR)", value: formatCurrency(mrr), detail: "+18.2% so với tháng trước", trend: "up", icon: "creditCard", tone: "emerald" },
          { label: "Tổng Cơ Sở Active", value: stores.filter(s => s.status === "ACTIVE").length, detail: "Tỷ lệ giữ chân: 94%", trend: "up", icon: "building", tone: "blue" },
          { label: "Thiết Bị Ghi Nhận (POS/KDS)", value: stores.reduce((sum, store) => sum + store.activeDevices, 0), detail: "21 thiết bị mới tuần này", trend: "up", icon: "activity", tone: "violet" },
          { label: "Tỷ Lệ Hủy Gói (Churn Rate)", value: "2.8%", detail: "-0.4% so với quý trước", trend: "down_good", icon: "percent", tone: "amber" },
        ].map((metric, i) => (
          <article key={i} className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,.03)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,.06)]">
            <div className="flex justify-between items-start mb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 border border-slate-100 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100">
                <Icon name={metric.icon as any} size={20} />
              </span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                metric.trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-emerald-50 text-emerald-700"
              }`}>
                <Icon name={metric.trend.includes("down") ? "trendingDown" : "trending"} size={10} />
                {(metric.trend === "up" || metric.trend === "down_good") ? "Tốt" : "Cảnh báo"}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{metric.label}</h4>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metric.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {metric.detail}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* 3. Advanced Charts & System Health */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 sm:gap-6">
        
        {/* Lưới Biểu đồ Doanh Thu CSS */}
        <Panel variant="default" padding="lg" className="rounded-[28px] border-slate-200/80 shadow-[0_4px_18px_rgba(15,23,42,.035)] flex flex-col min-h-[380px]">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900">Xu Hướng Tăng Trưởng MRR</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Lưu lượng tiền định kỳ hằng tháng (VND)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100"><div className="w-2 h-2 bg-emerald-400 rounded-sm" /> 2026</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-end gap-3 sm:gap-6 relative pt-6 pb-2">
            {/* Lưới Y-axis (Guide lines) */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
              {[100, 75, 50, 25, 0].map(pct => (
                <div key={pct} className="flex items-center w-full gap-3">
                  <span className="w-10 text-[9px] font-bold text-slate-400 text-right shrink-0">{pct === 0 ? "0đ" : `${(maxRevenue * pct / 100 / 1000000).toFixed(1)}M`}</span>
                  <div className="flex-1 border-b border-dashed border-slate-200" />
                </div>
              ))}
            </div>
            
            {/* Cột dữ liệu */}
            <div className="flex-1 flex justify-around items-end h-full z-10 pl-14">
              {revenueHistory.map((col, i) => (
                <div key={col.month} className="group relative flex flex-col items-center w-12 sm:w-16 h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-20">
                    {formatCurrency(col.value)}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-700 ease-out shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:brightness-110 cursor-pointer"
                    style={{ height: `${Math.max((col.value / maxRevenue) * 100, 4)}%` }}
                  />
                  {/* X-axis label */}
                  <span className="absolute -bottom-6 text-[11px] font-bold text-slate-500">{col.month}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* System Health / Data Distribution */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <Panel variant="default" padding="lg" className="rounded-[28px] border-slate-200/80 shadow-[0_4px_18px_rgba(15,23,42,.035)] flex-1">
            <h3 className="text-sm font-black text-slate-900 mb-5">Hạ Tầng Dịch Vụ</h3>
            <div className="space-y-4">
              {[
                { name: "PostgreSQL Database", status: "Healthy", ping: "8ms", color: "text-emerald-500", bg: "bg-emerald-500" },
                { name: "Node.js API Gateway", status: "Load: 42%", ping: "12ms", color: "text-emerald-500", bg: "bg-emerald-500" },
                { name: "WebSockets Server", status: "1,204 Conn", ping: "2ms", color: "text-blue-500", bg: "bg-blue-500" },
              ].map(sys => (
                <div key={sys.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${sys.bg}`} />
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${sys.bg}`} />
                    </span>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-700">{sys.name}</p>
                      <p className="text-[9px] font-semibold text-slate-500 mt-0.5">{sys.status}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${sys.color}`}>{sys.ping}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel variant="default" padding="lg" className="rounded-[28px] border-slate-200/80 shadow-[0_4px_18px_rgba(15,23,42,.035)] flex-1">
            <h3 className="text-sm font-black text-slate-900 mb-5">Phân Bổ Gói Cước</h3>
            <div className="space-y-3">
              {[
                { name: "ENTERPRISE", val: planDistribution.ENTERPRISE, color: "bg-violet-500" },
                { name: "PRO", val: planDistribution.PRO, color: "bg-blue-500" },
                { name: "STARTER", val: planDistribution.STARTER, color: "bg-emerald-500" },
              ].map(plan => (
                <div key={plan.name} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>{plan.name} ({plan.val})</span>
                    <span>{Math.round((plan.val / planDistribution.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${plan.color}`} style={{ width: `${(plan.val / planDistribution.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {/* 4. Log Sự Kiện & Quán Gia Hạn */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Panel variant="default" padding="lg" className="rounded-[28px] border-slate-200/80 shadow-[0_4px_18px_rgba(15,23,42,.035)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4 shrink-0">
            <div>
              <h3 className="text-base font-black text-slate-900">Nhật Ký Nền Tảng</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Audit log thời gian thực</p>
            </div>
            <button onClick={() => onSwitchTab("audit")} className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition">
              Tất cả
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 relative before:absolute before:inset-y-3 before:left-4 before:w-px before:bg-slate-200">
            {auditLogs.slice(0, 7).map((log) => {
              const getLogIcon = (action: string) => {
                if (action.includes("CREATE") || action.includes("APPROVE")) return { name: "plus", color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" };
                if (action.includes("UPDATE")) return { name: "edit", color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200" };
                if (action.includes("DELETE") || action.includes("EXPIRED")) return { name: "trash", color: "text-rose-600", bg: "bg-rose-100", border: "border-rose-200" };
                return { name: "activity", color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200" };
              };
              const style = getLogIcon(log.action);
              return (
                <div key={log.id} className="relative flex gap-4">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${style.bg} ${style.color} ${style.border} relative z-10 shadow-sm`}>
                    <Icon name={style.name as any} size={14} />
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[9px] font-bold text-emerald-700 truncate">{log.storeName || "Hệ thống lõi"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel variant="default" padding="lg" className="rounded-[28px] border-slate-200/80 shadow-[0_4px_18px_rgba(15,23,42,.035)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4 shrink-0">
            <div>
              <h3 className="text-base font-black text-slate-900">Ưu Tiên Xử Lý</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Đối tác cần gia hạn ({stores.filter(s => s.status === "EXPIRED" || s.status === "EXPIRING_SOON").length})</p>
            </div>
            <button onClick={() => onSwitchTab("tenants")} className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition">
              Quản lý
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2.5">
            {stores.filter(s => s.status === "EXPIRED" || s.status === "EXPIRING_SOON").map(store => (
              <button
                key={store.id}
                onClick={() => onViewStoreDetails(store)}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white hover:border-amber-200 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    {store.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{store.name}</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">{store.owner} · {store.phone}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-3">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${store.status === "EXPIRED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                    {store.status === "EXPIRED" ? "Đã khóa" : `Còn ${store.daysLeft} ngày`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết →
                  </span>
                </div>
              </button>
            ))}
            {stores.filter(s => s.status === "EXPIRED" || s.status === "EXPIRING_SOON").length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <Icon name="checkCircle" size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-black text-slate-900">Mọi thứ đều hoàn hảo</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Không có đối tác nào nợ cước hay sắp hết hạn.</p>
              </div>
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
};
