import React, { useMemo } from "react";
import { Panel, Icon } from "@/components/ui";
import { SystemAuditLogRecord } from "@/types/cms.types";

export interface AuditLogViewerProps {
  auditLogs: SystemAuditLogRecord[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ auditLogs }) => {
  // Nhóm log theo ngày
  const groupedLogs = useMemo(() => {
    const groups: Record<string, SystemAuditLogRecord[]> = {};
    auditLogs.forEach(log => {
      let date = "Hôm nay";
      const ts = log.timestamp || "";
      if (ts.includes("Hôm qua")) date = "Hôm qua";
      else if (ts.includes("/")) date = ts.split(" ")[0];
      else if (ts.includes("-")) {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) date = d.toLocaleDateString("vi-VN");
      }
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [auditLogs]);

  const getLogStyle = (action: string, status: string) => {
    if (status === "FAILED" || status === "CRITICAL") return { bg: "bg-rose-50", border: "border-rose-200", iconCol: "text-rose-600", icon: "alert" };
    if (status === "WARNING") return { bg: "bg-amber-50", border: "border-amber-200", iconCol: "text-amber-600", icon: "alert" };
    
    const act = (action || "").toUpperCase();
    if (act.includes("LICENSE") || act.includes("KEY")) return { bg: "bg-indigo-50", border: "border-indigo-200", iconCol: "text-indigo-600", icon: "key" };
    if (act.includes("INVOICE") || act.includes("PAY") || act.includes("VIETQR")) return { bg: "bg-emerald-50", border: "border-emerald-200", iconCol: "text-emerald-600", icon: "banknote" };
    if (act.includes("CREATE") || act.includes("APPROVE") || act.includes("ONBOARD")) return { bg: "bg-blue-50", border: "border-blue-200", iconCol: "text-blue-600", icon: "plus" };
    if (act.includes("UPDATE") || act.includes("MODIFY") || act.includes("CONFIG")) return { bg: "bg-amber-50", border: "border-amber-200", iconCol: "text-amber-600", icon: "edit" };
    if (act.includes("DELETE") || act.includes("REVOKE") || act.includes("EXPIRED")) return { bg: "bg-rose-50", border: "border-rose-200", iconCol: "text-rose-600", icon: "trash" };
    if (act.includes("LOGIN") || act.includes("AUTH")) return { bg: "bg-purple-50", border: "border-purple-200", iconCol: "text-purple-600", icon: "shield" };
    
    return { bg: "bg-teal-50", border: "border-teal-200", iconCol: "text-teal-600", icon: "activity" };
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* HEADER DASHBOARD */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Tổng sự kiện (24h)", val: auditLogs.length, icon: "activity", tone: "blue" },
          { label: "Cảnh báo bảo mật", val: auditLogs.filter(l => l.status === "WARNING" || l.status === "FAILED").length, icon: "shield", tone: "amber" },
          { label: "Lỗi hệ thống", val: auditLogs.filter(l => l.status === "FAILED").length, icon: "alert", tone: "rose" },
        ].map((m, i) => (
          <article key={i} className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,.035)] flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{m.label}</h4>
              <p className={`text-2xl font-black tracking-tight ${m.tone === "rose" && m.val > 0 ? "text-rose-600" : "text-slate-900"}`}>
                {m.val}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-${m.tone}-50 text-${m.tone}-600`}>
              <Icon name={m.icon as any} size={24} />
            </div>
          </article>
        ))}
      </section>

      {/* TIMELINE */}
      <Panel variant="default" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Icon name="history" className="w-5 h-5 text-slate-700" />
              Nhật Ký Truy Vết (Audit Trail)
            </h3>
            <p className="text-xs text-slate-500 mt-1">Lưu trữ bất biến mọi thao tác quan trọng trên toàn bộ hệ thống.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Tìm theo IP, tên..." className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 w-full sm:w-48" />
            </div>
            <button className="h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition flex items-center gap-1.5">
              <Icon name="filter" size={14} /> Lọc
            </button>
          </div>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[27px] before:w-0.5 before:bg-slate-100 pl-2">
          {Object.entries(groupedLogs).map(([date, logs]) => (
            <div key={date} className="relative">
              <div className="sticky top-14 z-10 bg-white/90 backdrop-blur py-2 mb-4 -ml-2 pl-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black tracking-wide border border-slate-200/50">
                  <Icon name="calendar" size={12} /> {date}
                </span>
              </div>
              
              <div className="space-y-6">
                {logs.map((log) => {
                  const style = getLogStyle(log.action, log.status);
                  const time = (log.timestamp.includes("Hôm nay") || log.timestamp.includes("Hôm qua"))
                    ? log.timestamp.split(" ")[0]
                    : (log.timestamp.includes(" ") ? log.timestamp.split(" ")[1] : log.timestamp);
                  
                  return (
                    <div key={log.id} className="relative flex gap-4 sm:gap-6 group">
                      {/* Timeline Dot */}
                      <div className="relative mt-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 bg-white ${style.border} ${style.iconCol} z-10 relative shadow-sm group-hover:scale-110 transition-transform`}>
                          <Icon name={style.icon as any} size={18} />
                        </div>
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-black text-slate-900">{log.action}</h4>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : log.status === "WARNING" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                                {log.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.details}</p>
                          </div>
                          <div className="flex items-center gap-1.5 sm:flex-col sm:items-end shrink-0">
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{time}</span>
                          </div>
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 text-[10px] font-bold text-slate-500">
                            <Icon name="users" size={12} className="text-slate-400" />
                            {log.actor}
                          </div>
                          {log.storeName && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100 text-[10px] font-bold text-emerald-700">
                              <Icon name="building" size={12} className="text-emerald-500" />
                              {log.storeName}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 text-[10px] font-bold text-slate-500">
                            <Icon name="globe" size={12} className="text-slate-400" />
                            {log.ipAddress}
                          </div>
                          <button className="ml-auto text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition">Xem chi tiết JSON →</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {auditLogs.length === 0 && (
          <div className="text-center py-16">
            <Icon name="checkCircle" size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-sm font-black text-slate-900">Không có nhật ký nào</h3>
          </div>
        )}
      </Panel>
    </div>
  );
};
