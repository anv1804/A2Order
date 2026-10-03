import React from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { CustomerRecord } from "@/types/cms.types";

interface AdjustPointsModalProps {
  customer: CustomerRecord | null;
  onClose: () => void;
  onConfirm: () => void;
  pointDelta: number;
  setPointDelta: (delta: number) => void;
  pointReason: string;
  setPointReason: (reason: string) => void;
}

export const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
  customer,
  onClose,
  onConfirm,
  pointDelta,
  setPointDelta,
  pointReason,
  setPointReason,
}) => {
  if (!customer) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scaleUp">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <h3 className="font-black text-ink-primary text-base">Điều Chỉnh Điểm Tích Lũy</h3>
              <p className="text-xs text-ink-muted">Khách hàng: {customer.name} (Hiện có: {customer.points} điểm)</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-ink-subtle hover:text-ink-primary hover:bg-surface-canvas"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mt-3">
            <div>
              <label className="text-xs font-bold text-ink-muted mb-1.5 block">
                Số điểm điều chỉnh (Dấu + hoặc -):
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[20, 50, 100, -50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPointDelta(val)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ${
                      pointDelta === val
                        ? "bg-brand-900 text-white"
                        : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-brand-300"
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={pointDelta}
                onChange={(e) => setPointDelta(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-bold text-center focus:outline-none focus:border-brand-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted mb-1 block">Lý do điều chỉnh:</label>
              <input
                type="text"
                value={pointReason}
                onChange={(e) => setPointReason(e.target.value)}
                placeholder="Lý do tặng hoặc trừ điểm..."
                className="w-full h-9 px-3 rounded-xl border border-surface-border text-xs font-medium focus:outline-none focus:border-brand-800"
              />
            </div>

            <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-xs flex justify-between font-bold text-brand-950">
              <span>Điểm sau khi điều chỉnh:</span>
              <span>{Math.max(0, customer.points + pointDelta)} điểm</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border mt-3">
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
              type="button"
              size="sm"
              className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
              onClick={onConfirm}
            >
              Cập Nhật Điểm
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
