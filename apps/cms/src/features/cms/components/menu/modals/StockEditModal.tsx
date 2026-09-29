import React, { useState, useEffect } from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { FnbDishItem } from "@/types/cms.types";

export interface StockEditModalProps {
  dish: FnbDishItem | null;
  onClose: () => void;
  onSave: (dishId: string, newStock: number) => void;
}

export const StockEditModal: React.FC<StockEditModalProps> = ({
  dish,
  onClose,
  onSave,
}) => {
  const [stockCount, setStockCount] = useState<number>(10);

  useEffect(() => {
    if (dish) {
      setStockCount(dish.stockCount ?? 10);
    }
  }, [dish]);

  if (!dish) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(dish.id, stockCount);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-2xl sm:rounded-3xl shadow-elevated p-4 sm:p-5 space-y-4 border border-surface-border animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
            <h3 className="text-sm font-bold text-ink-primary">
              Cập Nhật Suất Phục Vụ: {dish.name}
            </h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                Số suất nguyên liệu còn lại có thể chế biến:
              </label>
              <input
                type="number"
                min={0}
                value={stockCount}
                onChange={(e) => setStockCount(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-sm font-bold text-center text-brand-900 focus:border-brand-800 focus:outline-none"
              />
              <p className="text-[10px] text-ink-muted mt-1 text-center">
                Nếu nhập về 0, hệ thống sẽ tự động chuyển sang trạng thái Tạm Hết Hàng trên POS và mã QR
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-4 font-bold shadow-sm"
              >
                Lưu Số Suất
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
