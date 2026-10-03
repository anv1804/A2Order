import React from "react";
import { Portal, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

export interface SelectedQrTableData {
  id: string;
  name: string;
  code?: string;
  qrUrl: string;
  pin?: string;
  orderUrl: string;
}

export interface TableQrModalProps {
  selectedQrTable: SelectedQrTableData | null;
  onClose: () => void;
  onRotatePin: (tableId: string) => void;
}

export const TableQrModal: React.FC<TableQrModalProps> = ({
  selectedQrTable,
  onClose,
  onRotatePin,
}) => {
  if (!selectedQrTable) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-sm select-none animate-fadeIn">
        <div className="w-full max-w-sm bg-surface-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center shadow-elevated border border-surface-border animate-scaleUp space-y-3.5">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="text-left">
              <h3 className="text-base font-black text-ink-primary">{selectedQrTable.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10.5px] font-mono font-black uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                  Mã Bàn: {selectedQrTable.code || "TB-01"}
                </span>
                <span className="text-[10px] text-ink-muted">QR Gọi Món</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-muted transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <p className="text-xs text-ink-muted text-left">
            Khách quét mã này bằng camera điện thoại để vào đúng bàn gọi món trực tiếp.
          </p>

          <div className="w-52 h-52 mx-auto p-3 bg-white rounded-2xl border-2 border-brand-800 shadow-md flex items-center justify-center">
            <img
              src={selectedQrTable.qrUrl}
              alt={`QR Gọi Món ${selectedQrTable.name}`}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Box Mã PIN Bảo Mật Của Bàn */}
          <div className="bg-brand-50/70 p-3 rounded-2xl border border-brand-200/80 text-left space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-950">
                <Icon name="key" size={14} className="text-brand-700" />
                <span>Mã PIN Mở Bàn Tại Quán:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-white text-brand-800 border border-brand-300 shadow-2xs tracking-wider">
                  {selectedQrTable.pin || "----"}
                </span>
                <button
                  type="button"
                  onClick={() => onRotatePin(selectedQrTable.id)}
                  title="Đổi mã PIN mới ngẫu nhiên"
                  className="text-[10px] font-bold text-brand-800 bg-brand-100 hover:bg-brand-200 border border-brand-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition active:scale-95"
                >
                  <Icon name="refresh" size={10} />
                  <span>Đổi PIN</span>
                </button>
              </div>
            </div>
            <p className="text-[10.5px] text-brand-800/80 leading-relaxed">
              <span className="font-bold text-brand-900">Mã PIN động bảo mật:</span> Tự động thay đổi sau mỗi lượt khách (khi nhân viên bấm Đóng bàn) hoặc khi bấm "Đổi PIN" để chống kẻ xấu lưu mã từ xa.
            </p>
          </div>

          <div className="bg-surface-subtle p-2.5 rounded-xl border border-surface-border text-left space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-ink-muted">Link gọi món tại bàn:</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedQrTable.orderUrl) {
                    navigator.clipboard.writeText(selectedQrTable.orderUrl);
                    toast.success("Đã sao chép link gọi món vào bộ nhớ tạm!");
                  }
                }}
                className="text-[10.5px] font-bold text-brand-700 hover:underline flex items-center gap-1"
              >
                <Icon name="copy" size={11} />
                <span>Sao chép link</span>
              </button>
            </div>
            <p className="text-[10.5px] font-mono text-ink-muted truncate select-all">
              {selectedQrTable.orderUrl}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-card transition active:scale-95"
              onClick={() => {
                toast.success(`Đang tải ảnh mã QR ${selectedQrTable.name} để in thẻ để bàn...`);
                const a = document.createElement("a");
                a.href = selectedQrTable.qrUrl;
                a.download = `QR_${selectedQrTable.code || selectedQrTable.name}.png`;
                a.target = "_blank";
                a.click();
              }}
            >
              <Icon name="download" size={15} />
              <span>Tải Mã QR In Thẻ Để Bàn</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-xs font-bold text-ink-muted hover:text-ink-primary py-1 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
