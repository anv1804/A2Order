import React from "react";
import { Button, Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";
import { TableItem } from "@/types";

export interface ActiveTableActionModalProps {
  table: TableItem | null;
  onClose: () => void;
  onAddDish: (table: TableItem) => void;
  onNavigateToBilling: () => void;
}

export const ActiveTableActionModal: React.FC<ActiveTableActionModalProps> = ({
  table,
  onClose,
  onAddDish,
  onNavigateToBilling,
}) => {
  if (!table) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-surface-border space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h3 className="text-base font-black text-ink-primary">{table.name}</h3>
            <p className="text-xs text-ink-muted">
              Thời gian ngồi: {table.occupiedMinutes || 10} phút • Tạm tính:{" "}
              <strong className="text-brand-900">{formatCurrency(table.totalAmount || 180000)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <Button
            size="md"
            className="w-full rounded-2xl bg-brand-900 text-white font-black text-xs gap-2 justify-start h-11"
            onClick={() => {
              onAddDish(table);
              onClose();
            }}
          >
            <Icon name="plus" className="w-4 h-4 text-white" />
            <span>Gọi Thêm Món Ăn Vào Bếp</span>
          </Button>

          <Button
            size="md"
            variant="outline"
            className="w-full rounded-2xl border-surface-border text-ink-primary font-bold text-xs gap-2 justify-start h-11"
            onClick={() => {
              onClose();
              onNavigateToBilling();
            }}
          >
            <Icon name="cashier" className="w-4 h-4 text-brand-900" />
            <span>Thanh Toán / Xuất VietQR (Quầy Thu Ngân)</span>
          </Button>

          <Button
            size="md"
            variant="outline"
            className="w-full rounded-2xl border-surface-border text-ink-primary font-bold text-xs gap-2 justify-start h-11"
            onClick={() => {
              sound.playKitchenChime();
              toast.info(`Đang in phiếu tạm tính cho ${table.name}...`);
              onClose();
            }}
          >
            <Icon name="print" className="w-4 h-4 text-ink-muted" />
            <span>In Phiếu Tạm Tính Cho Khách Xem</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
