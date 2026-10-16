import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { CmsTopDishesSectionProps } from "@/types";

export const CmsTopDishesSection: React.FC<CmsTopDishesSectionProps> = ({
  bills,
  onNavigateTab,
}) => {
  const dishCount: Record<string, { name: string; sold: number; revenue: number }> = {};
  let totalDishesSold = 0;

  bills.forEach((b: any) => {
    (b.items || []).forEach((item: any) => {
      const name = item.name || "Món chưa đặt tên";
      const qty = item.quantity || 1;
      const price = item.totalPrice || item.price * qty || 0;
      if (!dishCount[name]) {
        dishCount[name] = { name, sold: 0, revenue: 0 };
      }
      dishCount[name].sold += qty;
      dishCount[name].revenue += price;
      totalDishesSold += qty;
    });
  });

  const sortedDishes = Object.values(dishCount)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return (
    <section className="lg:col-span-5 rounded-3xl border border-surface-border bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header (Coinest Watchlist Style) */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-surface-border/60">
          <div>
            <h4 className="text-base font-black text-ink-primary tracking-tight">
              Món Bán Chạy Nhất (Watchlist)
            </h4>
            <p className="text-xs text-ink-muted font-medium mt-0.5">
              Xếp hạng theo lượt gọi trong ca hôm nay
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.("menu")}
            className="text-xs font-bold text-brand-800 hover:text-brand-900 hover:underline shrink-0"
          >
            Xem Thực Đơn →
          </button>
        </div>

        {/* Dish List */}
        {sortedDishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center mb-2.5">
              <Icon name="flame" size={22} />
            </div>
            <p className="text-sm font-bold text-ink-primary">Chưa có món nào được gọi</p>
            <p className="text-xs text-ink-muted mt-0.5 max-w-xs">
              Khi khách gọi món hoặc thu ngân tạo đơn, các món bán chạy nhất sẽ tự động hiển thị ở đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDishes.map((dish, idx) => {
              const sharePct = totalDishesSold > 0 ? Math.round((dish.sold / totalDishesSold) * 100) : 0;
              return (
                <div
                  key={dish.name}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-surface-canvas/60 hover:bg-surface-canvas border border-surface-border/60 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Dish avatar */}
                    <span
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : idx === 1
                          ? "bg-brand-100 text-brand-900 border border-brand-200/50"
                          : "bg-surface-canvas text-ink-primary border border-surface-border"
                      }`}
                    >
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-ink-primary truncate">{dish.name}</p>
                      <p className="text-[11px] text-ink-muted mt-0.5 font-medium">
                        {dish.sold} phần • {sharePct}% tổng lượng gọi
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <p className="text-xs sm:text-sm font-black text-ink-primary">
                      {formatCurrency(dish.revenue)}
                    </p>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-black bg-[#E8F5EE] text-brand-900">
                      <span>Top {idx + 1}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="pt-3.5 mt-3.5 border-t border-surface-border/50 flex items-center justify-between text-xs font-semibold text-ink-muted">
        <span>Tổng lượt phục vụ: <strong className="text-ink-primary font-black">{totalDishesSold} phần</strong></span>
        <button
          type="button"
          onClick={() => onNavigateTab?.("analytics")}
          className="text-brand-800 font-bold hover:underline"
        >
          Báo cáo món chi tiết →
        </button>
      </div>
    </section>
  );
};
