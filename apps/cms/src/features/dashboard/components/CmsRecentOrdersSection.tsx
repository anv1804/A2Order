import React from "react";
import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { CmsRecentOrdersSectionProps } from "@/types";

export const CmsRecentOrdersSection: React.FC<CmsRecentOrdersSectionProps & { onNavigateTab?: (tab: string) => void }> = ({
  bills,
  onNavigateTab,
}) => {
  return (
    <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon name="cart" size={15} />
            </span>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              Dòng Đơn Hàng Gọi & Thanh Toán Gần Nhất
            </h4>
          </div>
          <p className="text-[11px] text-slate-400">Theo dõi trạng thái phục vụ và thanh toán các bàn đang ăn</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab?.("tables")}
          className="text-xs font-black text-emerald-800 hover:underline"
        >
          Sơ đồ bàn →
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Icon name="cart" size={28} className="text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-500">Chưa có đơn hàng</p>
          <p className="text-xs text-slate-400 mt-1">Đơn hàng mới sẽ hiện ở đây khi được tạo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...bills].reverse().slice(0, 4).map((b: any) => (
            <div
              key={b.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-2xs transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900">{b.tableName || "—"}</span>
                <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {b.status === "COMPLETED" ? "Đã trả tiền" : "Đang ăn"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {(b.items || []).slice(0, 2).map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <span className="font-black text-slate-900">{formatCurrency(b.finalAmount || 0)}</span>
                <span className="text-[10px] text-slate-400">{b.paymentMethod}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
