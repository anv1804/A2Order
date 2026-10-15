import React from "react";
import { Icon, Portal } from "@/components/ui";
import { toast } from "@/stores/notificationStore";

export interface SelectedQrTableItem {
  id: string;
  name: string;
  code?: string;
  qrUrl: string;
  orderUrl?: string;
  pin?: string;
}

export interface TableSingleQrModalProps {
  selectedQrTable: SelectedQrTableItem | null;
  onClose: () => void;
  onRotatePin: (tableId: string) => void;
}

export const TableSingleQrModal: React.FC<TableSingleQrModalProps> = ({
  selectedQrTable,
  onClose,
  onRotatePin,
}) => {
  if (!selectedQrTable) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm select-none animate-fadeIn">
        <div className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center shadow-2xl border border-slate-200/80 animate-scaleUp space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-left">
              <h3 className="text-base font-black text-slate-900">{selectedQrTable.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10.5px] font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Mã Bàn: {selectedQrTable.code || "TB-01"}
                </span>
                <span className="text-[10px] text-slate-400">QR Gọi Món</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <p className="text-xs text-slate-500 text-left">
            Khách quét mã này bằng camera điện thoại để vào đúng bàn gọi món trực tiếp.
          </p>

          <div className="w-52 h-52 mx-auto p-3 bg-white rounded-2xl border-2 border-emerald-800 shadow-md flex items-center justify-center">
            <img src={selectedQrTable.qrUrl} alt={`QR Gọi Món ${selectedQrTable.name}`} className="w-full h-full object-contain" />
          </div>

          {/* Box Mã PIN Bảo Mật Của Bàn */}
          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 text-left space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Icon name="key" size={14} className="text-emerald-700" />
                <span>Mã PIN Mở Bàn Tại Quán:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-white text-emerald-800 border border-emerald-300 shadow-2xs tracking-wider">
                  {selectedQrTable.pin || "----"}
                </span>
                <button
                  type="button"
                  onClick={() => onRotatePin(selectedQrTable.id)}
                  title="Đổi mã PIN mới ngẫu nhiên"
                  className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition active:scale-95"
                >
                  <Icon name="refresh" size={10} />
                  <span>Đổi PIN</span>
                </button>
              </div>
            </div>
            <p className="text-[10.5px] text-emerald-800/80 leading-relaxed">
              <span className="font-bold text-emerald-900">Mã PIN động bảo mật:</span> Tự động thay đổi sau mỗi lượt khách (khi nhân viên bấm Đóng bàn) hoặc khi bấm "Đổi PIN" để chống kẻ xấu lưu mã từ xa.
            </p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-left space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-600">Link gọi món tại bàn:</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedQrTable.orderUrl) {
                    navigator.clipboard.writeText(selectedQrTable.orderUrl);
                    toast.success("Đã sao chép link gọi món vào bộ nhớ tạm!");
                  }
                }}
                className="text-[10.5px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Icon name="copy" size={11} />
                <span>Sao chép link</span>
              </button>
            </div>
            <p className="text-[10.5px] font-mono text-slate-500 truncate select-all">
              {selectedQrTable.orderUrl}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-95"
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
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 py-1 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
