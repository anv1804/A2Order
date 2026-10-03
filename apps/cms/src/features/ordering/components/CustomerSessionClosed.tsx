import React from "react";
import { Icon } from "@/components/ui";

interface CustomerSessionClosedProps {
  storeName?: string;
  tableName?: string;
  tableCode?: string;
  onRestartSession: () => void;
}

export const CustomerSessionClosed: React.FC<CustomerSessionClosedProps> = ({
  storeName,
  tableName,
  tableCode,
  onRestartSession,
}) => {
  return (
    <div className="my-auto py-10 text-center space-y-5 animate-fadeIn">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-50 text-brand-900 border border-brand-200 flex items-center justify-center shadow-xs">
        <Icon name="check" size={36} />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-black text-ink-primary">
          Thanh Toán Hoàn Tất!
        </h2>
        <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
          Cảm ơn quý khách đã dùng bữa tại{" "}
          <strong className="text-ink-primary">{storeName || "A2Order"}</strong>! Chúc quý khách
          một ngày thật vui vẻ và hẹn sớm gặp lại.
        </p>
      </div>

      <div className="p-4 bg-white rounded-3xl border border-surface-border shadow-2xs max-w-xs mx-auto text-left space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>Bàn phục vụ:</span>
          <span className="font-bold text-ink-primary">
            {tableName || "Bàn"} ({tableCode})
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>Trạng thái phiên:</span>
          <span className="font-bold text-brand-900 flex items-center gap-1">
            <Icon name="check" size={12} />
            <span>Đã thanh toán & trả bàn</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRestartSession}
        className="px-6 py-3 rounded-2xl bg-brand-900 hover:bg-brand-800 text-white font-black text-xs shadow-md transition active:scale-95"
      >
        Bắt Đầu Lượt Gọi Mới
      </button>
    </div>
  );
};
