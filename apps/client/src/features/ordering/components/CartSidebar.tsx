import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button, Icon } from "@/components/ui";
import { MenuDishItem, QUICK_NOTES } from "@/data/mockMenu";

export interface SelectedDishItem {
  id: string; // Unique cart item ID (ví dụ: dishId + variant + options + timestamp)
  dish: MenuDishItem;
  quantity: number;
  notes: string;
  selectedVariant?: string;
  selectedOptions?: string[];
  unitPrice?: number;
}

interface CartSidebarProps {
  orderList: SelectedDishItem[];
  totalQuantity: number;
  totalAmount: number;
  onIncreaseQuantity: (itemId: string) => void;
  onDecreaseQuantity: (itemId: string) => void;
  onSetNote: (itemId: string, note: string) => void;
  onClearAll: () => void;
  activeNoteItemId: string | null;
  setActiveNoteItemId: (itemId: string | null) => void;
  onOpenDishDetail?: (dish: MenuDishItem, existingItem?: SelectedDishItem) => void;
  onGoToReview: () => void;
  onGoToTableInfo: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  orderList,
  totalQuantity,
  totalAmount,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onSetNote,
  onClearAll,
  activeNoteItemId,
  setActiveNoteItemId,
  onOpenDishDetail,
  onGoToReview,
  onGoToTableInfo,
}) => {
  return (
    <>
      {/* Sticky Mobile Floating Cart Bar (z-20 nằm dưới modal chi tiết z-50) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-surface-border shadow-lg flex items-center justify-between gap-3 z-20">
        <div>
          <span className="text-[10px] text-ink-muted uppercase tracking-wider font-bold block">Đã chọn:</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-ink-primary">{totalQuantity} món</span>
            <span className="text-xs font-black text-brand-900">• {formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <Button
          size="md"
          disabled={orderList.length === 0}
          className="rounded-2xl bg-brand-900 text-white font-black text-xs gap-1.5 px-4 shadow-sm"
          onClick={onGoToReview}
        >
          <span>Xem Giỏ & Gửi Bếp</span>
          <Icon name="arrowRight" className="w-3.5 h-3.5 text-white" />
        </Button>
      </div>

      {/* Right: Selected Order Basket Summary (Desktop) */}
      <div className="hidden md:flex w-80 lg:w-96 bg-white border-l border-surface-border flex-col justify-between shrink-0">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h4 className="font-black text-sm text-ink-primary">Giỏ Gọi Món</h4>
            <p className="text-[11px] text-ink-muted">{totalQuantity} phần ăn đang chọn</p>
          </div>
          {orderList.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {orderList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-muted">
              <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mb-2">
                <Icon name="cart" className="w-6 h-6 text-ink-subtle" />
              </div>
              <p className="text-xs font-bold text-ink-primary">Chưa có món nào được chọn</p>
              <p className="text-[11px] text-ink-subtle mt-0.5">Chạm vào món ăn ở bảng thực đơn bên trái để thêm</p>
            </div>
          ) : (
            orderList.map((item) => {
              const itemPrice = (item.unitPrice || item.dish.price) * item.quantity;
              return (
                <div key={item.id} className="p-3 rounded-2xl bg-surface-canvas border border-surface-border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-xs text-ink-primary truncate">{item.dish.name}</div>
                      
                      {/* Biến thể & Option đã chọn */}
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.selectedVariant && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-100 text-brand-900">
                            {item.selectedVariant}
                          </span>
                        )}
                        {item.selectedOptions && item.selectedOptions.map((opt) => (
                          <span key={opt} className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-surface-muted text-ink-primary">
                            +{opt}
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] font-black text-brand-900 mt-1">{formatCurrency(itemPrice)}</div>
                    </div>

                    {/* Bộ tăng giảm số lượng to bản */}
                    <div className="flex items-center gap-1 bg-white border border-surface-border rounded-xl px-1.5 py-0.5 shadow-sm">
                      <button
                        onClick={() => onDecreaseQuantity(item.id)}
                        className="w-6 h-6 flex items-center justify-center text-sm font-black text-ink-muted hover:text-rose-600 active:scale-90"
                        title="Giảm"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-black text-ink-primary">{item.quantity}</span>
                      <button
                        onClick={() => onIncreaseQuantity(item.id)}
                        className="w-6 h-6 flex items-center justify-center text-sm font-black text-ink-muted hover:text-brand-900 active:scale-90"
                        title="Tăng"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-surface-border/50">
                    {activeNoteItemId === item.id ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => onSetNote(item.id, e.target.value)}
                          placeholder="Gõ ghi chú bếp..."
                          className="w-full h-7 px-2 text-[11px] rounded-lg border border-brand-800 bg-white focus:outline-none font-medium"
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-1">
                          {QUICK_NOTES.map((n) => (
                            <button
                              key={n}
                              onClick={() => {
                                const newNote = item.notes ? `${item.notes}, ${n}` : n;
                                onSetNote(item.id, newNote);
                              }}
                              className="px-1.5 py-0.5 rounded-md bg-white border border-surface-border text-[9px] font-bold text-ink-muted hover:text-brand-900"
                            >
                              {n}
                            </button>
                          ))}
                          <button
                            onClick={() => setActiveNoteItemId(null)}
                            className="text-[9px] font-bold text-brand-800 ml-auto hover:underline"
                          >
                            Xong
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <div
                          onClick={() => setActiveNoteItemId(item.id)}
                          className="text-[10px] text-ink-muted hover:text-brand-900 cursor-pointer flex-1 flex items-center justify-between"
                        >
                          <span className={item.notes ? "font-bold text-amber-700 truncate max-w-[170px]" : "italic"}>
                            {item.notes ? `📝 ${item.notes}` : "+ Thêm ghi chú bếp..."}
                          </span>
                          <Icon name="edit" className="w-3 h-3 text-ink-subtle" />
                        </div>

                        {onOpenDishDetail && (
                          <button
                            onClick={() => onOpenDishDetail(item.dish, item)}
                            className="text-[9px] font-bold text-brand-800 bg-brand-50 px-1.5 py-0.5 rounded hover:bg-brand-100"
                          >
                            Đổi option
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-surface-border bg-surface-canvas space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted font-bold">Tổng cộng:</span>
            <span className="text-lg font-black text-brand-950">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="md"
              variant="outline"
              className="rounded-2xl text-xs w-1/3"
              onClick={onGoToTableInfo}
            >
              Bàn
            </Button>

            <Button
              size="md"
              disabled={orderList.length === 0}
              className="flex-1 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-black text-xs gap-2 shadow-sm"
              onClick={onGoToReview}
            >
              <span>Xem Giỏ & Gửi Bếp</span>
              <Icon name="arrowRight" className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
