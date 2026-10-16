import React from "react";
import { Icon } from "@/components/ui";
import type { ReservationKpiCardsProps } from "@/types";

export const ReservationKpiCards: React.FC<ReservationKpiCardsProps> = ({
  totalGuestsToday,
  pendingCount,
  confirmedCount,
  totalDeposits,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-xs hover:border-brand-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-muted">Khách Hôm Nay</span>
          <div className="w-8 h-8 rounded-xl bg-surface-canvas flex items-center justify-center text-ink-muted group-hover:text-brand-900 group-hover:bg-brand-50 transition-colors">
            <Icon name="users" size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-ink-primary tracking-tight">{totalGuestsToday}</span>
          <span className="text-xs font-medium text-ink-muted">khách đã ghi nhận</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-xs hover:border-amber-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-muted">Chờ Xác Nhận</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50/70 flex items-center justify-center text-amber-700 group-hover:bg-amber-100 transition-colors">
            <Icon name="clock" size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-amber-700 tracking-tight">{pendingCount}</span>
          <span className="text-xs font-medium text-amber-700/80">yêu cầu cần duyệt</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-xs hover:border-emerald-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-muted">Bàn Đã Giữ</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50/70 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-100 transition-colors">
            <Icon name="calendarCheck" size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-emerald-800 tracking-tight">{confirmedCount}</span>
          <span className="text-xs font-medium text-ink-muted">bàn sẵn sàng đón</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-xs hover:border-brand-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-muted">Tiền Cọc Đã Thu</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50/70 flex items-center justify-center text-blue-700 group-hover:bg-blue-100 transition-colors">
            <Icon name="vietqr" size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-brand-950 tracking-tight">
            {totalDeposits.toLocaleString("vi-VN")}
          </span>
          <span className="text-xs font-bold text-ink-muted">đ</span>
        </div>
      </div>
    </div>
  );
};
