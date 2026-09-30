import React from "react";
import { Panel, Icon } from "@/components/ui";
import { SystemAuditLogRecord } from "@/types/cms.types";

export interface AuditLogViewerProps {
  auditLogs: SystemAuditLogRecord[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  auditLogs,
}) => {
  return (
        <Panel variant="default" padding="lg" className="space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="font-black text-sm sm:text-base text-ink-primary flex items-center gap-2">
                <Icon name="history" className="w-4 h-4 text-brand-800 shrink-0" />
                <span className="sm:hidden">Nhật Ký Kiểm Toán</span>
                <span className="hidden sm:inline">Nhật Ký Kiểm Toán Toàn Nền Tảng (System Audit Trail)</span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
                Theo dõi minh bạch mọi thao tác gia hạn license, cấp quyền, cấu hình và bảo mật
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-amber-800">Dữ liệu minh họa</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500"
                          : log.status === "WARNING"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <span className="font-black text-ink-primary">{log.action}</span>
                    <span className="text-ink-muted">• {log.storeName}</span>
                  </div>
                  <p className="text-ink-secondary mt-0.5">{log.details}</p>
                  <div className="flex items-center gap-3 text-[10px] text-ink-muted mt-1">
                    <span>{log.timestamp}</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-md w-fit">
                  {log.actor}
                </span>
              </div>
            ))}
          </div>
        </Panel>
  );
};
