import React from "react";
import { Icon } from "@/components/ui";
import { SystemAuditLogRecord } from "@/types/cms.types";

export interface AuditMobileCardsProps {
  paginatedLogs: SystemAuditLogRecord[];
  onViewDetails: (log: SystemAuditLogRecord) => void;
}

export const AuditMobileCards: React.FC<AuditMobileCardsProps> = ({
  paginatedLogs,
  onViewDetails,
}) => {
  return (
    <div className="block lg:hidden w-full">
      {paginatedLogs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-bold bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Icon name="shield" size={20} />
            </div>
            <span>Không tìm thấy nhật ký kiểm toán nào phù hợp</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {paginatedLogs.map((log) => {
            return (
              <div
                key={log.id}
                className="p-2.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:border-slate-300 transition-all space-y-1.5"
              >
                {/* Row 1: Action code + Actor + Status */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                    <span className="font-mono text-[10px] font-black text-slate-900 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 shrink-0">
                      {log.action}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      {log.actor}
                    </span>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      ({log.actorRole})
                    </span>
                  </div>

                  <div className="shrink-0">
                    {log.status === "SUCCESS" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Thành Công
                      </span>
                    )}
                    {log.status === "WARNING" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Cảnh Báo
                      </span>
                    )}
                    {log.status === "FAILED" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Thất Bại
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Details + Store name */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 gap-2">
                  <p className="truncate font-medium flex-1">
                    {log.details}
                  </p>
                  {log.storeName && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 shrink-0 truncate max-w-[120px]">
                      {log.storeName}
                    </span>
                  )}
                </div>

                {/* Row 3: Timestamp + IP & View details button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>{log.timestamp}</span>
                    <span>•</span>
                    <span className="font-mono">{log.ipAddress || "Internal"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewDetails(log)}
                    className="h-6 px-2 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Chi Tiết</span>
                    <Icon name="arrowRight" size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
