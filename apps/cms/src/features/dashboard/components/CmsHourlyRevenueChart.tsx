import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { CmsHourlyRevenueChartProps } from "@/types";

export const CmsHourlyRevenueChart: React.FC<CmsHourlyRevenueChartProps> = ({
  bills,
  liveStats,
}) => {
  const hourlyMap: Record<string, number> = {};
  bills.forEach((b: any) => {
    const hour = b.closedAt ? b.closedAt.slice(0, 2) + ":00" : b.createdAt ? new Date(b.createdAt).getHours().toString().padStart(2, "0") + ":00" : "12:00";
    hourlyMap[hour] = (hourlyMap[hour] || 0) + (b.finalAmount || 0);
  });

  // Default timeline slots if empty or sparse
  const defaultSlots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  defaultSlots.forEach((slot) => {
    if (hourlyMap[slot] === undefined) hourlyMap[slot] = 0;
  });

  const slots = Object.entries(hourlyMap).sort(([a], [b]) => a.localeCompare(b));
  const maxVal = Math.max(...slots.map(([, v]) => v), 1);

  return (
    <section className="lg:col-span-7 rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-surface-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
                <Icon name="trending" size={15} />
              </span>
              <h4 className="text-base font-black text-ink-primary tracking-tight">
                Nhịp Độ Doanh Thu Theo Giờ
              </h4>
            </div>
            <p className="text-xs text-ink-muted font-medium mt-0.5">
              Đối soát phân bổ doanh thu theo từng khung giờ bán hàng
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-canvas border border-surface-border text-ink-primary">
            <span>Ca hiện tại</span>
          </span>
        </div>

        {/* Bar Chart Area */}
        {bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-canvas text-ink-muted flex items-center justify-center mb-2.5">
              <Icon name="trending" size={22} />
            </div>
            <p className="text-sm font-bold text-ink-primary">Chưa có giao dịch hoàn tất</p>
            <p className="text-xs text-ink-muted mt-0.5 max-w-xs">
              Biểu đồ cột sẽ hiển thị nhịp độ doanh số theo giờ ngay khi có hóa đơn thanh toán đầu tiên.
            </p>
          </div>
        ) : (
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1 sm:px-2">
            {slots.map(([hour, amount]) => {
              const heightPct = amount > 0 ? Math.max((amount / maxVal) * 100, 10) : 4;
              return (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  title={`${hour}: ${formatCurrency(amount)}`}
                >
                  {/* Tooltip Hover Pill */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded-lg bg-brand-950 text-white text-[10px] font-black pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {formatCurrency(amount)}
                  </div>

                  <div
                    className={`w-full max-w-[32px] sm:max-w-[40px] rounded-t-xl transition-all duration-300 ${
                      amount > 0
                        ? "bg-brand-900 group-hover:bg-brand-700"
                        : "bg-surface-border/60 group-hover:bg-surface-border"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-bold text-ink-subtle mt-2 group-hover:text-ink-primary">
                    {hour}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Strip */}
      <div className="flex items-center justify-between text-xs border-t border-surface-border/50 pt-3 text-ink-muted font-semibold">
        <span>Tổng đơn trong ca: <strong className="text-ink-primary font-black">{liveStats.totalOrders} đơn</strong></span>
        <span>Tổng doanh thu: <strong className="text-brand-900 font-black">{liveStats.totalRevenue > 0 ? formatCurrency(liveStats.totalRevenue) : "0 đ"}</strong></span>
      </div>
    </section>
  );
};
