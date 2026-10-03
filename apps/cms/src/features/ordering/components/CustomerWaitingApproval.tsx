import React from "react";
import { Icon } from "@/components/ui";

interface CustomerWaitingApprovalProps {
  tableName?: string;
  onOpenPinModal: () => void;
  onCancelRequest: () => void;
}

export const CustomerWaitingApproval: React.FC<CustomerWaitingApprovalProps> = ({
  tableName,
  onOpenPinModal,
  onCancelRequest,
}) => {
  return (
    <div className="my-auto py-10 text-center space-y-6 animate-fadeIn">
      <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-30 animate-ping" />
        <div className="w-20 h-20 rounded-full bg-brand-900 text-white flex items-center justify-center shadow-lg relative z-10">
          <Icon name="clock" size={32} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-black text-ink-primary">
          Đang đợi nhân viên quán xác nhận...
        </h2>
        <p className="text-xs text-ink-muted leading-relaxed max-w-xs mx-auto">
          Yêu cầu mở <strong className="text-brand-900 font-extrabold">{tableName}</strong> đã được gửi tới quầy POS của nhân viên.
        </p>
      </div>

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-left flex items-start gap-2.5">
        <Icon name="alert" size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Nhân viên tại quầy sẽ bấm <strong>"Duyệt Mở Bàn"</strong>. Màn hình điện thoại này sẽ tự động mở khóa thực đơn ngay lập tức.
        </p>
      </div>

      <div className="pt-1 space-y-2">
        <button
          type="button"
          onClick={onOpenPinModal}
          className="w-full py-2.5 rounded-2xl bg-white border border-brand-800/40 text-brand-900 hover:bg-brand-50 text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition"
        >
          <Icon name="key" size={14} />
          <span>Có mã PIN thẻ bàn? Nhập mở ngay</span>
        </button>

        <div>
          <button
            type="button"
            onClick={onCancelRequest}
            className="text-xs font-bold text-ink-muted hover:text-ink-primary py-1 transition"
          >
            Hủy yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
};
