import React from "react";
import { Icon, Button, Portal } from "@/components/ui";
import { WaiterTableOrder } from "@/types";
import { toast } from "@/stores/notificationStore";

interface OfflinePaymentModalProps {
  isOpen: boolean;
  activeTable: WaiterTableOrder;
  finalPayableAmount: number;
  cashGivenAmount: number;
  onChangeCashGivenAmount: (amount: number) => void;
  onClose: () => void;
  onConfirmOfflinePaid: () => void;
}

export const OfflinePaymentModal: React.FC<OfflinePaymentModalProps> = ({
  isOpen,
  activeTable,
  finalPayableAmount,
  cashGivenAmount,
  onChangeCashGivenAmount,
  onClose,
  onConfirmOfflinePaid,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div className="bg-[#081712] text-white w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 border border-brand-500/40 animate-scaleUp">
          {/* Header Khẩn Cấp Chống Chói & Nổi Bật Trong Bóng Tối */}
          <div className="flex items-center justify-between border-b border-brand-900/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Icon name="wifi" size={18} className="animate-pulse text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-amber-300">
                  Chế Độ Mất Điện / Rớt Mạng
                </h3>
                <p className="text-[11px] text-brand-200/80">
                  Thanh toán VietQR tĩnh & Lưu bộ nhớ thiết bị POS
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Thông tin bàn & Số tiền khổng lồ, siêu rõ trong bóng tối */}
          <div className="p-3.5 rounded-2xl bg-brand-950/60 border border-brand-500/30 text-center space-y-1">
            <div className="text-xs font-bold text-brand-200 uppercase tracking-widest">
              {activeTable.tableName} ({activeTable.zoneName})
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {finalPayableAmount.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[10px] text-brand-400 font-semibold">
              Gồm {activeTable.items.length} món ăn đã phục vụ
            </div>
          </div>

          {/* VietQR Tĩnh Của Chủ Quán */}
          <div className="bg-white p-3.5 rounded-2xl text-center space-y-2.5 shadow-md">
            <img
              src={`https://img.vietqr.io/image/970422-0903111222-compact2.png?amount=${finalPayableAmount}&addInfo=Ban${activeTable.tableName.replace(/\s+/g, "")}_Offline`}
              alt="VietQR Tĩnh Chủ Quán"
              className="w-48 h-48 mx-auto rounded-xl border border-slate-200"
            />

            <div className="space-y-0.5 text-slate-800 text-xs text-left px-1">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Ngân hàng:</span>
                <strong className="text-slate-900">MB BANK (Quân Đội)</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-500">Số tài khoản:</span>
                <strong className="text-brand-900 font-black">0903 111 222</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <strong className="text-slate-900">NGUYEN VAN CHU QUAN</strong>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Nội dung CK:</span>
                <strong className="text-brand-900 font-black">TT BAN {activeTable.tableName.toUpperCase()}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText("0903111222");
                toast.success("Đã sao chép số tài khoản MB Bank!");
              }}
              className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Icon name="copy" size={13} />
              <span>Sao Chép Số Tài Khoản</span>
            </button>
          </div>

          {/* Tính tiền thối nhanh nếu khách đưa tiền mặt */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block">
              Tính tiền thối nhanh (nếu khách trả tiền mặt):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[200000, 500000, 1000000, 2000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onChangeCashGivenAmount(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    cashGivenAmount === amt
                      ? "bg-amber-400 text-slate-950 font-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {(amt / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
            {cashGivenAmount > 0 && (
              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300">Tiền thối lại:</span>
                <span className="text-base font-black text-amber-300">
                  {Math.max(0, cashGivenAmount - finalPayableAmount).toLocaleString("vi-VN")} đ
                </span>
              </div>
            )}
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-900/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs text-slate-300 border-white/20 hover:bg-white/10"
              onClick={onClose}
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs px-5 shadow-lg font-black flex items-center gap-1.5"
              onClick={onConfirmOfflinePaid}
            >
              <Icon name="check" size={14} />
              <span>Xác Nhận Đã Thu (Lưu Sổ Offline)</span>
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
