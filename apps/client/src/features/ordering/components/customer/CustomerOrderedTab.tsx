import React from "react";
import { Icon } from "@/components/ui";
import { CustomerOrderedItem } from "@/types";

export interface CustomerOrderedTabProps {
  orderedItems: CustomerOrderedItem[];
  onViewMenu: () => void;
  onCancelItem: (item: CustomerOrderedItem) => void;
}

export const CustomerOrderedTab: React.FC<CustomerOrderedTabProps> = ({
  orderedItems,
  onViewMenu,
  onCancelItem,
}) => {
  const activeTotal = orderedItems
    .filter((it) => it.status !== "CANCELLED")
    .reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Món Đã Đặt Tại Bàn</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {orderedItems.length} món trong phiên này
            </p>
          </div>
          <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-100 shadow-2xs">
            {activeTotal.toLocaleString("vi-VN")} đ
          </span>
        </div>
      </div>

      {orderedItems.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-slate-100 text-center space-y-3 p-6 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icon name="clipboard" size={28} />
          </div>
          <p className="text-sm font-bold text-slate-700">Bàn chưa gửi món nào vào bếp</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">Chọn các món yêu thích trong thực đơn và gửi vào bếp nhé!</p>
          <button
            type="button"
            onClick={onViewMenu}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-900/20 transition active:scale-95"
          >
            Xem Thực Đơn Để Chọn Món
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orderedItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 bg-white rounded-3xl border shadow-xs space-y-2.5 transition-all ${
                item.status === "CANCELLED"
                  ? "opacity-50 border-slate-200 bg-slate-50/50"
                  : item.status === "PENDING_APPROVAL"
                  ? "border-amber-300 ring-1 ring-amber-200"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {item.quantity}x {item.name}
                    </span>
                    {item.orderedAt && (
                      <span className="text-[10px] text-slate-400 font-medium">({item.orderedAt})</span>
                    )}
                  </div>
                  <p className="text-xs font-black text-emerald-700 mt-0.5">
                    {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                  </p>
                  {item.notes && (
                    <p className="text-[11px] text-amber-800 italic mt-0.5 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                      Ghi chú: {item.notes}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {item.status === "PENDING_APPROVAL" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-black animate-pulse">
                      ⏳ Chờ Quán Duyệt
                    </span>
                  )}
                  {item.status === "COOKING" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-black">
                      <Icon name="flame" size={12} />
                      <span>Bếp Đang Nấu</span>
                    </span>
                  )}
                  {item.status === "SERVED" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black">
                      <Icon name="check" size={12} />
                      <span>Đã Phục Vụ</span>
                    </span>
                  )}
                  {item.status === "CANCELLED" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-500 text-[11px] font-bold line-through">
                      Đã Hủy
                    </span>
                  )}
                </div>
              </div>

              {/* Nút Hủy Món nếu quán chưa duyệt */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                {item.status === "PENDING_APPROVAL" ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-amber-800 font-semibold">
                      Quán chưa duyệt, bạn có thể hủy:
                    </span>
                    <button
                      type="button"
                      onClick={() => onCancelItem(item)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                    >
                      <Icon name="trash" size={12} />
                      <span>Hủy Món</span>
                    </button>
                  </div>
                ) : item.status === "COOKING" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                    <Icon name="lock" size={12} />
                    <span>Bếp đã nấu món này, không thể hủy</span>
                  </span>
                ) : item.status === "SERVED" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <Icon name="check" size={12} />
                    <span>Chúc quý khách ngon miệng!</span>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
