import React from "react";
import { Icon } from "@/components/ui";
import { CustomerOrderedItem } from "@/types";

interface CustomerOrderedTabProps {
  orderedItems: CustomerOrderedItem[];
  isBillRequested: boolean;
  onNavigateToMenu: () => void;
  onCancelOrderItem: (item: CustomerOrderedItem) => void;
  onRequestBill: () => void;
}

export const CustomerOrderedTab: React.FC<CustomerOrderedTabProps> = ({
  orderedItems,
  isBillRequested,
  onNavigateToMenu,
  onCancelOrderItem,
  onRequestBill,
}) => {
  const pendingCount = orderedItems.filter((i) => i.status === "PENDING_APPROVAL").length;
  const cookingCount = orderedItems.filter((i) => i.status === "COOKING").length;
  const servedCount = orderedItems.filter((i) => i.status === "SERVED").length;
  const totalOrderedAmount = orderedItems
    .filter((it) => it.status !== "CANCELLED")
    .reduce((s, it) => s + it.price * it.quantity, 0);
  const totalItemQty = orderedItems
    .filter((i) => i.status !== "CANCELLED")
    .reduce((s, it) => s + it.quantity, 0);

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Stepper tiến độ chế biến món */}
      <div className="bg-white p-4 rounded-3xl border border-surface-border shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-ink-primary">Tiến Độ Chế Biến Món</h3>
            <p className="text-[11px] text-ink-muted">Cập nhật trực tiếp thời gian thực từ quầy & bếp</p>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-brand-50 text-brand-900 border border-brand-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
            Live Sync
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div
            className={`p-2.5 rounded-2xl border transition-all ${
              pendingCount > 0
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-100"
                : "bg-surface-canvas border-surface-border"
            }`}
          >
            <div className="text-base mb-0.5">
              <Icon name="clock" size={16} className="mx-auto text-amber-700" />
            </div>
            <div className="text-[11px] font-black text-ink-primary">1. Chờ duyệt</div>
            <div className="text-[11px] font-extrabold text-amber-700">
              {pendingCount} món
            </div>
          </div>

          <div
            className={`p-2.5 rounded-2xl border transition-all ${
              cookingCount > 0
                ? "bg-orange-50 border-orange-300 ring-2 ring-orange-100"
                : "bg-surface-canvas border-surface-border"
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center mx-auto mb-1">
              <Icon name="kitchen" size={13} />
            </div>
            <div className="text-[11px] font-black text-ink-primary">2. Đang nấu</div>
            <div className="text-[11px] font-extrabold text-orange-700">
              {cookingCount} món
            </div>
          </div>

          <div
            className={`p-2.5 rounded-2xl border transition-all ${
              servedCount > 0
                ? "bg-brand-50 border-brand-300 ring-2 ring-brand-100"
                : "bg-surface-canvas border-surface-border"
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-brand-100 text-brand-900 flex items-center justify-center mx-auto mb-1">
              <Icon name="utensils" size={13} />
            </div>
            <div className="text-[11px] font-black text-ink-primary">3. Đã lên bàn</div>
            <div className="text-[11px] font-extrabold text-brand-900">
              {servedCount} món
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-surface-border shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-ink-primary">Chi Tiết Các Món Đã Đặt</h3>
            <p className="text-[11px] text-ink-muted mt-0.5">
              {orderedItems.length} món trong phiên này
            </p>
          </div>
          <span className="text-sm font-black text-brand-900 bg-brand-50 px-3 py-1.5 rounded-2xl border border-brand-200 shadow-2xs">
            {totalOrderedAmount.toLocaleString("vi-VN")} đ
          </span>
        </div>
      </div>

      {orderedItems.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-surface-border text-center space-y-3 p-6 shadow-2xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand-900 border border-brand-200 flex items-center justify-center">
            <Icon name="clipboard" size={28} />
          </div>
          <p className="text-sm font-bold text-ink-primary">Bàn chưa gửi món nào vào bếp</p>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">Chọn các món yêu thích trong thực đơn và gửi vào bếp nhé!</p>
          <button
            type="button"
            onClick={onNavigateToMenu}
            className="px-5 py-2.5 rounded-2xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-black shadow-md transition active:scale-95"
          >
            Xem Thực Đơn Để Chọn Món
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orderedItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 bg-white rounded-3xl border shadow-2xs space-y-2.5 transition-all ${
                item.status === "CANCELLED"
                  ? "opacity-50 border-surface-border bg-surface-canvas"
                  : item.status === "PENDING_APPROVAL"
                  ? "border-amber-300 ring-1 ring-amber-200"
                  : "border-surface-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm text-ink-primary truncate">
                      {item.quantity}x {item.name}
                    </span>
                    {item.orderedAt && (
                      <span className="text-[10px] text-ink-muted font-medium">({item.orderedAt})</span>
                    )}
                  </div>
                  <p className="text-xs font-black text-brand-900 mt-0.5">
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-black animate-pulse">
                      <Icon name="clock" size={11} />
                      <span>Chờ Quán Duyệt</span>
                    </span>
                  )}
                  {item.status === "COOKING" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-black">
                      <Icon name="kitchen" size={11} />
                      <span>Bếp Đang Nấu</span>
                    </span>
                  )}
                  {item.status === "SERVED" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-[11px] font-black">
                      <Icon name="check" size={11} />
                      <span>Đã Phục Vụ</span>
                    </span>
                  )}
                  {item.status === "CANCELLED" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-canvas border border-surface-border text-ink-muted text-[11px] font-bold line-through">
                      Đã Hủy
                    </span>
                  )}
                </div>
              </div>

              {/* Nút Hủy Món nếu quán chưa duyệt */}
              <div className="flex items-center justify-between border-t border-surface-border pt-2.5">
                {item.status === "PENDING_APPROVAL" ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-amber-800 font-semibold">
                      Quán chưa duyệt, bạn có thể hủy:
                    </span>
                    <button
                      type="button"
                      onClick={() => onCancelOrderItem(item)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                    >
                      <Icon name="trash" size={12} />
                      <span>Hủy Món</span>
                    </button>
                  </div>
                ) : item.status === "COOKING" ? (
                  <span className="text-[11px] text-ink-muted italic flex items-center gap-1">
                    <Icon name="lock" size={11} />
                    <span>Bếp đã nấu món này, không thể hủy</span>
                  </span>
                ) : item.status === "SERVED" ? (
                  <span className="text-[11px] text-brand-800 font-medium">
                    Chúc quý khách ngon miệng!
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {orderedItems.length > 0 && (
        <div className="bg-white p-4 rounded-3xl border border-surface-border shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-secondary">
            <span>Số lượng món đang gọi:</span>
            <span className="font-extrabold text-ink-primary">{totalItemQty} phần</span>
          </div>

          {isBillRequested && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-900 animate-pulse">
              <Icon name="clock" size={14} className="text-amber-700 shrink-0" />
              <span>Đã gửi yêu cầu tính tiền. Nhân viên quầy đang mang bill tới bàn...</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onNavigateToMenu}
              className="py-3 px-3 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>+</span>
              <span>Gọi Thêm Món</span>
            </button>

            <button
              type="button"
              disabled={isBillRequested}
              onClick={onRequestBill}
              className={`py-3 px-3 rounded-2xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                isBillRequested
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25"
              }`}
            >
              <Icon name="creditCard" size={15} />
              <span>{isBillRequested ? "Đang Chờ Bill..." : "Yêu Cầu Tính Tiền"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
