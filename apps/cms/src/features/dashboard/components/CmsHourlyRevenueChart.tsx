import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { CmsHourlyRevenueChartProps } from "@/types";

export const CmsHourlyRevenueChart: React.FC<CmsHourlyRevenueChartProps> = ({
  bills,
  liveStats,
}) => {
  return (
    <section className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon name="trending" size={15} />
            </span>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              Nhịp Độ Doanh Thu Theo Giờ Trong Ca
            </h4>
          </div>
          <p className="text-[11px] text-slate-400">Biểu đồ đối soát doanh số thực tế</p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon name="trending" size={28} className="text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-500">Chưa có dữ liệu doanh thu</p>
          <p className="text-xs text-slate-400 mt-1">Bắt đầu gọi món và thanh toán để hiện biểu đồ</p>
        </div>
      ) : (
        <div className="h-44 flex items-end justify-between gap-2 pt-4 pb-2 px-1 sm:px-2">
          {(() => {
            const hourlyMap: Record<string, number> = {};
            bills.forEach((b: any) => {
              const hour = b.closedAt ? b.closedAt.slice(0, 2) + ":00" : "?";
              hourlyMap[hour] = (hourlyMap[hour] || 0) + (b.finalAmount || 0);
            });
            const slots = Object.entries(hourlyMap).sort(([a], [b]) => a.localeCompare(b));
            const maxVal = Math.max(...slots.map(([, v]) => v), 1);
            return slots.map(([hour, amount]) => {
              const heightPct = Math.max((amount / maxVal) * 100, 12);
              return (
                <div key={hour} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                  <div
                    className="w-full max-w-[36px] rounded-t-xl bg-emerald-600 hover:bg-emerald-800 transition-all duration-300"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 mt-2">{hour}</span>
                </div>
              );
            });
          })()}
        </div>
      )}

      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 text-slate-500">
        <span>Tổng đơn: <strong className="text-slate-800">{liveStats.totalOrders}</strong></span>
        <span>Doanh thu: <strong className="text-slate-800">{liveStats.totalRevenue > 0 ? formatCurrency(liveStats.totalRevenue) : "—"}</strong></span>
      </div>
    </section>
  );
};
