import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button, Icon } from "@/components/ui";
import { TableItem } from "@/types";
import { SelectedDishItem } from "./CartSidebar";

interface OrderReviewStepProps {
  table: TableItem;
  orderList: SelectedDishItem[];
  totalQuantity: number;
  totalAmount: number;
  onGoBackToMenu: () => void;
  onConfirmSubmit: () => void;
}

export const OrderReviewStep: React.FC<OrderReviewStepProps> = ({
  table,
  orderList,
  totalQuantity,
  totalAmount,
  onGoBackToMenu,
  onConfirmSubmit,
}) => {
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-surface-canvas/50 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-surface-border shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-base font-black text-ink-primary">Kiểm Tra Lại Thực Đơn Gửi Bếp</h3>
              <p className="text-xs text-ink-muted">
                Bàn: <strong className="text-brand-900">{table.name}</strong> • Tổng: <strong>{totalQuantity} món</strong>
              </p>
            </div>
            <button
              onClick={onGoBackToMenu}
              className="text-xs font-bold text-brand-800 hover:underline flex items-center gap-1"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              <span>Chọn thêm món</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {orderList.length === 0 ? (
              <div className="text-center py-8 text-ink-muted text-xs">
                Chưa có món nào được chọn. Vui lòng quay lại bước 2 để chọn món.
              </div>
            ) : (
              orderList.map((item) => {
                const itemTotal = (item.unitPrice || item.dish.price) * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-ink-primary">{item.dish.name}</span>
                        <span className="font-extrabold text-xs text-brand-900 font-mono">x{item.quantity}</span>
                      </div>

                      {/* Phân loại và Tuỳ chọn kèm theo */}
                      {(item.selectedVariant || (item.selectedOptions && item.selectedOptions.length > 0)) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedVariant && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-100 text-brand-900">
                              Phân loại: {item.selectedVariant}
                            </span>
                          )}
                          {item.selectedOptions && item.selectedOptions.map((opt) => (
                            <span key={opt} className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-surface-muted text-ink-muted">
                              +{opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Ghi chú chi tiết bếp */}
                      {item.notes ? (
                        <p className="text-[11px] font-bold text-amber-800 mt-1">📝 Ghi chú bếp: {item.notes}</p>
                      ) : (
                        <p className="text-[10px] text-ink-subtle mt-0.5 italic">Không có ghi chú đặc biệt</p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-black text-xs sm:text-sm text-brand-950 block">
                        {formatCurrency(itemTotal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-ink-muted font-bold">Tổng tiền thanh toán dự kiến:</span>
            <span className="text-xl font-black text-brand-900">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full pt-4 flex items-center justify-between gap-3 border-t border-surface-border">
        <Button
          size="md"
          variant="outline"
          className="rounded-2xl text-xs gap-1.5"
          onClick={onGoBackToMenu}
        >
          <span>Quay Lại Chọn Thêm</span>
        </Button>

        <Button
          size="md"
          disabled={orderList.length === 0}
          className="flex-1 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-black text-xs sm:text-sm gap-2 shadow-lg py-3"
          onClick={onConfirmSubmit}
        >
          <Icon name="send" className="w-4 h-4 text-white" />
          <span>XÁC NHẬN GỬI VÀO BẾP KDS ({totalQuantity} Món)</span>
        </Button>
      </div>
    </div>
  );
};
