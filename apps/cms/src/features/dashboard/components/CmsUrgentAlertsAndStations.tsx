import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { CmsUrgentAlertsAndStationsProps } from "@/types";

export const CmsUrgentAlertsAndStations: React.FC<CmsUrgentAlertsAndStationsProps> = ({
  liveStats,
  onNavigateTab,
}) => {
  return (
    <div className="flex flex-col justify-between gap-3.5 sm:gap-5 h-full">
      {/* Cảnh báo việc cần xử lý ngay */}
      <section className="rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Icon name="bell" size={15} />
              </span>
              <h3 className="font-black text-xs sm:text-sm text-ink-primary">
                Cảnh Báo Vận Hành Ca
              </h3>
              {liveStats.lowStockCount > 0 && (
                <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  {liveStats.lowStockCount} cảnh báo kho
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-[11px] font-medium text-ink-muted">
              Đồng bộ từ dữ liệu thực tế
            </span>
          </div>

          {liveStats.lowStockCount === 0 && liveStats.pendingTickets === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center mb-2">
                <Icon name="checkCircle" size={20} className="text-brand-800" />
              </div>
              <p className="text-sm font-bold text-ink-primary">Không có cảnh báo phát sinh</p>
              <p className="text-xs text-ink-muted mt-0.5">Vận hành ca làm việc diễn ra suôn sẻ</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {liveStats.lowStockCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                      <Icon name="alert" size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs text-ink-primary">{liveStats.lowStockCount} nguyên liệu dưới ngưỡng an toàn!</h5>
                      <p className="text-[11px] text-ink-muted mt-0.5">Cần nhập kho sớm để không gián đoạn chế biến</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.("inventory")}
                    className="rounded-xl border border-amber-300 text-amber-900 bg-white hover:bg-amber-50 text-xs px-3.5 py-2 shrink-0 font-black shadow-xs whitespace-nowrap active:scale-95 transition"
                  >
                    Nhập Kho
                  </button>
                </div>
              )}

              {liveStats.pendingTickets > 0 && (
                <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-200/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-900 flex items-center justify-center shrink-0">
                      <Icon name="kitchen" size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs text-ink-primary">{liveStats.pendingTickets} ticket KDS đang chế biến</h5>
                      <p className="text-[11px] text-ink-muted mt-0.5">Theo dõi thời gian ra món tại trạm bếp KDS</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.("kds")}
                    className="rounded-xl border border-brand-300 text-brand-900 bg-white hover:bg-brand-50 text-xs px-3.5 py-2 shrink-0 font-black shadow-xs whitespace-nowrap active:scale-95 transition"
                  >
                    Xem KDS
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Phân Luồng Trạm: KDS & Bán Hàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <section className="rounded-3xl border border-surface-border bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-800 shrink-0" />
              <h4 className="font-black text-xs text-ink-primary uppercase tracking-wide truncate">Trạm Bếp Nấu (KDS)</h4>
            </div>
            <span className="text-[11px] font-black text-brand-900 bg-brand-100 px-2 py-0.5 rounded-md shrink-0">
              {liveStats.pendingTickets} ticket
            </span>
          </div>
          {liveStats.pendingTickets === 0 ? (
            <div className="py-4 text-center text-ink-muted text-xs">
              <Icon name="checkCircle" size={18} className="mx-auto mb-1 text-brand-700" />
              Bếp trống – Đang sẵn sàng
            </div>
          ) : (
            <p className="text-xs text-ink-muted py-2 text-center">
              {liveStats.pendingTickets} vé đang nấu.{" "}
              <button type="button" onClick={() => onNavigateTab?.("kds")} className="text-brand-800 font-bold underline">
                Mở KDS →
              </button>
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-surface-border bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <h4 className="font-black text-xs text-ink-primary uppercase tracking-wide truncate">Đơn Hàng Ca Bán</h4>
            </div>
            <span className="text-[11px] font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
              {liveStats.totalOrders} đơn
            </span>
          </div>
          {liveStats.totalOrders === 0 ? (
            <div className="py-4 text-center text-ink-muted text-xs">
              <Icon name="cart" size={18} className="mx-auto mb-1 text-ink-subtle" />
              Chưa có đơn hàng trong ca
            </div>
          ) : (
            <p className="text-xs text-ink-muted py-2 text-center">
              {liveStats.totalOrders} đơn • {formatCurrency(liveStats.totalRevenue)}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
