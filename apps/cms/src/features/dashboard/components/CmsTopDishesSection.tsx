import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { CmsTopDishesSectionProps } from "@/types";

export const CmsTopDishesSection: React.FC<CmsTopDishesSectionProps> = ({
  bills,
  onNavigateTab,
}) => {
  return (
    <section className="lg:col-span-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Icon name="flame" size={15} />
            </span>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Top Món Bán Chạy Trong Ca</h4>
          </div>
          <p className="text-[11px] text-slate-400">Xếp hạng theo số lượng đã phục vụ</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab?.("menu")}
          className="text-xs font-black text-emerald-800 hover:underline"
        >
          Thực đơn →
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Icon name="flame" size={28} className="text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-500">Chưa có dữ liệu</p>
          <p className="text-xs text-slate-400 mt-1">Top món sẽ hiện khi có đơn hàng</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(() => {
            const dishCount: Record<string, { name: string; sold: number; revenue: number }> = {};
            bills.forEach((b: any) => {
              (b.items || []).forEach((item: any) => {
                if (!dishCount[item.name]) dishCount[item.name] = { name: item.name, sold: 0, revenue: 0 };
                dishCount[item.name].sold += item.quantity || 1;
                dishCount[item.name].revenue += item.totalPrice || 0;
              });
            });
            return Object.values(dishCount)
              .sort((a, b) => b.sold - a.sold)
              .slice(0, 5)
              .map((dish, idx) => (
                <div key={dish.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? "bg-amber-400 text-amber-950"
                          : idx === 1
                          ? "bg-slate-200 text-slate-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{dish.name}</p>
                      <p className="text-[10px] text-slate-400">Đã bán {dish.sold}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0">{formatCurrency(dish.revenue)}</span>
                </div>
              ));
          })()}
        </div>
      )}
    </section>
  );
};
