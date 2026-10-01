import React from "react";
import { Icon } from "@/components/ui";
import { SystemAuditLogRecord } from "@/types/cms.types";

export interface AuditDesktopTableProps {
  paginatedLogs: SystemAuditLogRecord[];
  onViewDetails: (log: SystemAuditLogRecord) => void;
}

export const AuditDesktopTable: React.FC<AuditDesktopTableProps> = ({
  paginatedLogs,
  onViewDetails,
}) => {
  const getActionBadge = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("AUTH") || act.includes("LOGIN")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    if (act.includes("LICENSE") || act.includes("KEY")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    if (act.includes("INVOICE") || act.includes("PAY")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (act.includes("MODULE") || act.includes("CONFIG")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (act.includes("STORE") || act.includes("TENANT")) {
      return "bg-sky-50 text-sky-700 border-sky-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="hidden lg:block w-full">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs shadow-2xs">
          <tr className="border-b border-surface-border text-slate-500 uppercase tracking-wider text-[10px] font-black">
            <th className="py-3 px-3 bg-slate-50/95">Thời Gian & IP</th>
            <th className="py-3 px-3 bg-slate-50/95">Người Thực Hiện</th>
            <th className="py-3 px-3 bg-slate-50/95">Quán Liên Quan</th>
            <th className="py-3 px-3 bg-slate-50/95">Hành Động</th>
            <th className="py-3 px-3 bg-slate-50/95">Nội Dung Chi Tiết</th>
            <th className="py-3 px-3 bg-slate-50/95">Trạng Thái</th>
            <th className="py-3 px-3.5 text-right bg-slate-50/95">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {paginatedLogs.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-bold">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Icon name="shield" size={24} />
                  </div>
                  <span>Không tìm thấy nhật ký kiểm toán nào phù hợp</span>
                </div>
              </td>
            </tr>
          ) : (
            paginatedLogs.map((log) => {
              return (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Thời gian & IP */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Icon name="history" size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs block">
                          {log.timestamp}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          {log.ipAddress || "Internal"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Người thực hiện */}
                  <td className="py-3.5 px-3">
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[140px]" title={log.actor}>
                        {log.actor}
                      </span>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200 mt-0.5">
                        {log.actorRole}
                      </span>
                    </div>
                  </td>

                  {/* Quán liên quan */}
                  <td className="py-3.5 px-3">
                    {log.storeName ? (
                      <div className="flex items-center gap-1.5">
                        <Icon name="store" size={12} className="text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-800 text-xs truncate max-w-[140px]" title={log.storeName}>
                          {log.storeName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium italic">
                        Toàn hệ thống
                      </span>
                    )}
                  </td>

                  {/* Hành động */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  {/* Nội dung chi tiết */}
                  <td className="py-3.5 px-3">
                    <p className="text-slate-600 text-xs line-clamp-2 max-w-[280px]" title={log.details}>
                      {log.details}
                    </p>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-3">
                    {log.status === "SUCCESS" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Thành Công
                      </span>
                    )}
                    {log.status === "WARNING" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Cảnh Báo
                      </span>
                    )}
                    {log.status === "FAILED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Thất Bại
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onViewDetails(log)}
                      className="inline-flex h-8 items-center gap-1 px-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-transparent transition cursor-pointer"
                      title="Xem chi tiết sự kiện"
                    >
                      <Icon name="eye" size={13} />
                      <span>Chi Tiết</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
