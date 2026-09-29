import React from "react";
import { Button, Icon } from "@/components/ui";
import { TableItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";

interface TableActionsDialogProps {
  table: TableItem;
  currentStaffRole: string;
  onClose: () => void;
  onOrderMore: () => void;
  onGoToBilling: () => void;
  onPrintPreBill: () => void;
}

export const TableActionsDialog: React.FC<TableActionsDialogProps> = ({
  table,
  currentStaffRole,
  onClose,
  onOrderMore,
  onGoToBilling,
  onPrintPreBill,
}) => {
  const roleUpper = currentStaffRole.toUpperCase();
  const canBill = roleUpper.includes("THU NGÂN") || roleUpper.includes("QUẢN LÝ") || roleUpper.includes("CHỦ QUÁN");

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
            onClick={onOrderMore}
          >
            <Icon name="plus" className="w-4 h-4 text-white" />
            <span>Gọi Thêm Món Ăn Vào Bếp</span>
          </Button>

          {canBill ? (
            <Button
              size="md"
              variant="outline"
              className="w-full rounded-2xl border-surface-border text-ink-primary font-bold text-xs gap-2 justify-start h-11"
              onClick={onGoToBilling}
            >
              <Icon name="cashier" className="w-4 h-4 text-brand-900" />
              <span>Thanh Toán / Xuất VietQR (Quầy Thu Ngân)</span>
            </Button>
          ) : (
            <Button
              size="md"
              variant="outline"
              className="w-full rounded-2xl border-surface-border text-ink-muted font-medium text-xs gap-2 justify-start h-11 opacity-60 cursor-not-allowed"
              onClick={() => {
                toast.warning("Chỉ Thu ngân hoặc Quản lý mới có quyền vào quầy thanh toán!");
              }}
            >
              <Icon name="lock" className="w-4 h-4 text-ink-subtle" />
              <span>Thanh Toán (Yêu cầu Thu Ngân)</span>
            </Button>
          )}

          <Button
            size="md"
            variant="outline"
            className="w-full rounded-2xl border-surface-border text-ink-primary font-bold text-xs gap-2 justify-start h-11"
            onClick={() => {
              sound.playKitchenChime();
              onPrintPreBill();
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
