import React, { useState } from "react";
import { Icon, Button } from "@/components/ui";
import { SystemAuditLogRecord } from "@/types/cms.types";
import { toast } from "@/stores/notificationStore";

export interface AuditDetailModalProps {
  log: SystemAuditLogRecord | null;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    toast.success("Đã sao chép dữ liệu JSON sự kiện");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-5 sm:p-6 space-y-4 border border-slate-200 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                log.status === "FAILED"
                  ? "bg-rose-50 text-rose-600"
                  : log.status === "WARNING"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Icon name="shield" size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Chi Tiết Nhật Ký Kiểm Toán</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {log.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Thông tin chính */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Hành Động:</span>
            <span className="font-mono font-black text-slate-900 text-xs mt-0.5 block">{log.action}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Trạng Thái:</span>
            <span
              className={`font-black text-xs mt-0.5 inline-block ${
                log.status === "FAILED"
                  ? "text-rose-600"
                  : log.status === "WARNING"
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {log.status}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Người Thực Hiện:</span>
            <span className="font-bold text-slate-800 text-xs mt-0.5 block">
              {log.actor} ({log.actorRole})
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Địa Chỉ IP:</span>
            <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{log.ipAddress}</span>
          </div>
        </div>

        {/* Nội dung chi tiết */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Mô Tả Chi Tiết:</span>
          <p className="text-slate-700 leading-relaxed font-medium">{log.details}</p>
        </div>

        {/* Raw JSON viewer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Dữ Liệu JSON Thô:</span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              <Icon name={copied ? "check" : "copy"} size={12} />
              <span>{copied ? "Đã chép" : "Sao chép JSON"}</span>
            </button>
          </div>
          <pre className="bg-slate-900 text-slate-200 text-[11px] font-mono p-3 rounded-xl max-h-40 overflow-auto border border-slate-800">
            {JSON.stringify(log, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
