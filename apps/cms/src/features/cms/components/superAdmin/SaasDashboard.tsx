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
  const [activeBar, setActiveBar] = React.useState<string | null>(null);

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

  // Helper định dạng ngày an toàn, chống triệt để lỗi "Invalid Date"
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

  // Helper định dạng icon và màu sắc ngữ cảnh cho từng loại hành động Audit Log
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
    if (act.includes("DELETE") || act.includes("EXPIRED") || act.includes("BAN")) {
      return { name: "trash", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
    }
    return { name: "activity", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" };
  };

  const priorityStores = useMemo(() => {
    return stores.filter(s => s.status === "EXPIRED" || s.status === "EXPIRING_SOON");
  }, [stores]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
      {/* 1. Jumbotron Header */}
      <section className="relative isolate overflow-hidden rounded-[22px] sm:rounded-[32px] bg-gradient-to-br from-[#071d16] via-[#0c271f] to-[#12392c] p-4 sm:p-7 lg:p-8 text-white shadow-[0_20px_50px_rgba(7,29,22,.28)] border border-white/10">
        <div className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-90px] left-[30%] -z-10 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <div className="mb-2.5 sm:mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 sm:px-3 py-1 text-[9.5px] sm:text-[10px] font-black tracking-wide text-emerald-200 uppercase shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Trung tâm điều hành SaaS F&B
            </div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Hệ Thống Đang Hoạt Động <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">Tốt</span>.
            </h2>
            <p className="mt-1.5 sm:mt-2.5 max-w-lg text-xs sm:text-sm leading-relaxed text-emerald-100/70 font-medium">
              Giám sát dòng tiền MRR, trạng thái hạ tầng dịch vụ và vòng đời đối tác toàn hệ thống trong thời gian thực.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {/* Uptime & Latency Widget on Desktop */}
            <div className="hidden sm:flex items-center gap-4 mr-1 bg-white/[0.07] border border-white/15 rounded-2xl px-4 py-2 backdrop-blur-md shadow-inner">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest">Uptime</span>
                <span className="text-sm font-black text-white">99.99%</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest">Latency</span>
                <span className="text-sm font-black text-emerald-300">24ms</span>
              </div>
            </div>

            {/* Action Buttons: 2 equal buttons on mobile, compact on desktop */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-white/20 bg-white/10 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 disabled:cursor-wait disabled:opacity-60 backdrop-blur-md"
              >
                <Icon name="refresh" size={15} className={isRefreshing ? "animate-spin" : ""} />
                <span>{isRefreshing ? "Đang xử lý..." : "Làm mới"}</span>
              </button>
              <button
                type="button"
                onClick={onOpenNewStoreModal}
                className="inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 px-3.5 sm:px-5 text-[11px] sm:text-xs font-black text-[#071d16] shadow-[0_4px_20px_rgba(52,211,153,0.35)] transition hover:brightness-105 active:scale-95"
              >
                <Icon name="plus" size={15} />
                <span>Tạo Đối Tác</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Deep Business Metrics (MRR, Stores, Devices, Churn) - 2 cols on mobile, 4 on desktop */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { 
            label: "Doanh Thu Hằng Tháng (MRR)", 
            value: formatCurrency(mrr), 
            detail: "+18.2% so với tháng trước", 
            trend: "up", 
            icon: "creditCard", 
            tone: "emerald",
            iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100" 
          },
          { 
            label: "Tổng Cơ Sở Active", 
            value: stores.filter(s => s.status === "ACTIVE").length, 
            detail: "Tỷ lệ giữ chân: 94%", 
            trend: "up", 
            icon: "building", 
            tone: "blue",
            iconBg: "bg-blue-50 text-blue-600 border-blue-100" 
          },
          { 
            label: "Thiết Bị Ghi Nhận (POS/KDS)", 
            value: stores.reduce((sum, store) => sum + store.activeDevices, 0), 
            detail: "21 thiết bị mới tuần này", 
            trend: "up", 
            icon: "activity", 
            tone: "violet",
            iconBg: "bg-purple-50 text-purple-600 border-purple-100" 
          },
          { 
            label: "Tỷ Lệ Hủy Gói (Churn Rate)", 
            value: "2.8%", 
            detail: "-0.4% so với quý trước", 
            trend: "down_good", 
            icon: "percent", 
            tone: "amber",
            iconBg: "bg-amber-50 text-amber-600 border-amber-100" 
          },
        ].map((metric, i) => (
          <article 
            key={i} 
            className="group relative overflow-hidden rounded-[20px] sm:rounded-[26px] border border-slate-200/80 bg-white p-3 sm:p-5 shadow-[0_2px_12px_rgba(15,23,42,.03)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,.07)] flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <span className={`flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border transition-transform duration-300 group-hover:scale-105 ${metric.iconBg}`}>
                <Icon name={metric.icon as any} size={16} className="sm:hidden" />
                <Icon name={metric.icon as any} size={20} className="hidden sm:block" />
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[8.5px] sm:text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100/70">
                <Icon name={metric.trend.includes("down") ? "trendingDown" : "trending"} size={10} />
                <span>{(metric.trend === "up" || metric.trend === "down_good") ? "Tốt" : "Cảnh báo"}</span>
              </div>
            </div>
            <div>
              <h4 className="text-[9.5px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1 line-clamp-1">
                {metric.label}
              </h4>
              <p className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {metric.value}
              </p>
              <p className="text-[9px] sm:text-xs font-semibold text-slate-500 mt-1 sm:mt-2 flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{metric.detail}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* 3. Advanced Charts & System Health */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Biểu đồ Doanh Thu MRR (Responsive & Không bị chẹt viền phải) */}
        <Panel 
          variant="default" 
          padding="none" 
          className="lg:col-span-7 xl:col-span-8 rounded-[24px] sm:rounded-[30px] border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,.035)] flex flex-col min-h-[340px] sm:min-h-[400px]"
        >
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Xu Hướng Tăng Trưởng MRR</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <Icon name="trending" size={11} /> +18.2%
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Dòng tiền định kỳ hằng tháng qua chu kỳ 6 tháng gần nhất</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="flex items-center gap-1 text-[9.5px] sm:text-[10px] font-black text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> 2026
              </span>
            </div>
          </div>
          
          <div className="flex-1 flex items-end relative pt-6 pb-6">
            {/* Lưới Y-axis (Guide lines) */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
              {[100, 75, 50, 25, 0].map(pct => (
                <div key={pct} className="flex items-center w-full gap-2 sm:gap-3">
                  <span className="w-7 sm:w-11 text-[8px] sm:text-[9.5px] font-bold text-slate-400 text-right shrink-0">
                    {pct === 0 ? "0đ" : `${(maxRevenue * pct / 100 / 1000000).toFixed(1)}M`}
                  </span>
                  <div className="flex-1 border-b border-dashed border-slate-200/80" />
                </div>
              ))}
            </div>
            
            {/* Cột dữ liệu (Responsive width, không bao giờ tràn mép phải) */}
            <div className="flex-1 flex justify-around items-end h-full z-10 pl-8 sm:pl-14 pr-1 sm:pr-2">
              {revenueHistory.map((col) => {
                const isSelected = activeBar === col.month;
                return (
                  <div 
                    key={col.month} 
                    onClick={() => setActiveBar(isSelected ? null : col.month)}
                    className="group relative flex flex-col items-center w-7 sm:w-12 md:w-16 h-full justify-end cursor-pointer"
                  >
                    {/* Tooltip hiển thị khi hover hoặc chạm vào trên mobile */}
                    <div className={`absolute -top-9 sm:-top-11 bg-slate-900 text-white text-[9.5px] sm:text-[11px] font-bold px-2.5 py-1 sm:py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl z-20 transition-opacity duration-200 ${
                      isSelected ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100"
                    }`}>
                      {formatCurrency(col.value)}
                    </div>
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-lg sm:rounded-t-xl transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.25)] group-hover:brightness-110 ${
                        isSelected 
                          ? "bg-gradient-to-t from-emerald-500 to-teal-300 brightness-110 scale-x-105" 
                          : "bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400"
                      }`}
                      style={{ height: `${Math.max((col.value / maxRevenue) * 100, 6)}%` }}
                    />
                    {/* X-axis label */}
                    <span className={`absolute -bottom-6 text-[9.5px] sm:text-[11px] font-black transition-colors ${
                      isSelected ? "text-emerald-700" : "text-slate-500 group-hover:text-slate-800"
                    }`}>
                      {col.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>

        {/* Hạ Tầng & Phân Bổ Gói Cước */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sm:gap-6">
          {/* Hạ Tầng Dịch Vụ */}
          <Panel 
            variant="default" 
            padding="none" 
            className="rounded-[24px] sm:rounded-[30px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,.035)] flex-1"
          >
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Hạ Tầng Dịch Vụ</h3>
              <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 100% Hoạt động
              </span>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              {[
                { name: "PostgreSQL Database", status: "Healthy", ping: "8ms", color: "text-emerald-600", bg: "bg-emerald-500" },
                { name: "Node.js API Gateway", status: "Tải CPU: 42%", ping: "12ms", color: "text-emerald-600", bg: "bg-emerald-500" },
                { name: "WebSockets Server", status: "1,204 Kết nối", ping: "2ms", color: "text-blue-600", bg: "bg-blue-500" },
              ].map(sys => (
                <div key={sys.name} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${sys.bg}`} />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${sys.bg}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-slate-800 truncate">{sys.name}</p>
                      <p className="text-[9.5px] font-semibold text-slate-500 truncate">{sys.status}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-100 shrink-0 ${sys.color}`}>
                    {sys.ping}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Phân Bổ Gói Cước với Stacked Bar Visual */}
          <Panel 
            variant="default" 
            padding="none" 
            className="rounded-[24px] sm:rounded-[30px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,.035)] flex-1"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Phân Bổ Gói Cước</h3>
              <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Tổng: {planDistribution.total} quán
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-0.5 mb-3.5 shadow-inner">
              <div 
                style={{ width: `${(planDistribution.ENTERPRISE / planDistribution.total) * 100}%` }} 
                className="bg-violet-500 rounded-l-full h-full transition-all duration-500" 
                title={`Enterprise: ${planDistribution.ENTERPRISE}`} 
              />
              <div 
                style={{ width: `${(planDistribution.PRO / planDistribution.total) * 100}%` }} 
                className="bg-blue-500 h-full transition-all duration-500" 
                title={`Pro: ${planDistribution.PRO}`} 
              />
              <div 
                style={{ width: `${(planDistribution.STARTER / planDistribution.total) * 100}%` }} 
                className="bg-emerald-500 rounded-r-full h-full transition-all duration-500" 
                title={`Starter: ${planDistribution.STARTER}`} 
              />
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              {[
                { name: "ENTERPRISE", label: "Doanh Nghiệp", val: planDistribution.ENTERPRISE, color: "bg-violet-500", textCol: "text-violet-700", bgCol: "bg-violet-50" },
                { name: "PRO", label: "Chuyên Nghiệp", val: planDistribution.PRO, color: "bg-blue-500", textCol: "text-blue-700", bgCol: "bg-blue-50" },
                { name: "STARTER", label: "Khởi Đầu", val: planDistribution.STARTER, color: "bg-emerald-500", textCol: "text-emerald-700", bgCol: "bg-emerald-50" },
              ].map(plan => {
                const pct = Math.round((plan.val / planDistribution.total) * 100);
                return (
                  <div key={plan.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${plan.color}`} />
                      <span className="text-[10.5px] font-bold text-slate-700">{plan.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-800">{plan.val} quán</span>
                      <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded ${plan.bgCol} ${plan.textCol}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </section>

      {/* 4. Log Sự Kiện & Quán Gia Hạn */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Nhật Ký Nền Tảng (Audit Log) - Sửa triệt để bug "Invalid Date" & đa dạng icon */}
        <Panel 
          variant="default" 
          padding="none" 
          className="rounded-[24px] sm:rounded-[30px] border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,.035)] flex flex-col h-[380px] sm:h-[420px]"
        >
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3.5 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Nhật Ký Nền Tảng</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">Audit log truy vết thời gian thực ({auditLogs.length})</p>
            </div>
            <button 
              onClick={() => onSwitchTab("audit")} 
              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition active:scale-95"
            >
              Tất cả
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative before:absolute before:inset-y-2 before:left-3.5 sm:before:left-4 before:w-px before:bg-slate-200">
            {auditLogs.slice(0, 8).map((log) => {
              const style = getLogIcon(log.action);
              const formattedTime = formatLogTime(log.timestamp);
              return (
                <div key={log.id} className="relative flex gap-3 sm:gap-3.5 items-start group">
                  <div className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border ${style.bg} ${style.color} ${style.border} relative z-10 shadow-sm transition-transform group-hover:scale-105`}>
                    <Icon name={style.name as any} size={13} />
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50/70 p-2 sm:p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-white transition-all">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                      <span className="text-[9px] sm:text-[9.5px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                        {formattedTime}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[9px] sm:text-[9.5px] font-bold text-emerald-700 truncate max-w-[150px] sm:max-w-[200px]">
                        {log.storeName || "Hệ thống lõi"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Ưu Tiên Xử Lý (Gia Hạn / Quá Hạn) */}
        <Panel 
          variant="default" 
          padding="none" 
          className="rounded-[24px] sm:rounded-[30px] border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,.035)] flex flex-col h-[380px] sm:h-[420px]"
        >
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3.5 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Ưu Tiên Xử Lý</h3>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">
                Đối tác cần gia hạn ({priorityStores.length})
              </p>
            </div>
            <button 
              onClick={() => onSwitchTab("tenants")} 
              className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100/80 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-amber-100 transition active:scale-95"
            >
              Quản lý
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 sm:space-y-2.5">
            {priorityStores.map(store => (
              <button
                key={store.id}
                onClick={() => onViewStoreDetails(store)}
                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 bg-white hover:border-amber-200 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-sm">
                    {store.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{store.name}</p>
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5 truncate">{store.owner} · {store.phone}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black ${
                    store.status === "EXPIRED" 
                      ? "bg-rose-50 text-rose-700 border border-rose-200" 
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {store.status === "EXPIRED" ? "Đã khóa" : `Còn ${store.daysLeft} ngày`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết →
                  </span>
                </div>
              </button>
            ))}

            {priorityStores.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center mb-2.5">
                  <Icon name="checkCircle" size={22} className="text-emerald-500" />
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

