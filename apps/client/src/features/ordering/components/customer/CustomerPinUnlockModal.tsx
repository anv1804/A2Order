import React from "react";
import { Icon, Portal } from "@/components/ui";

export interface CustomerPinUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  tableCode: string;
  lockoutRemaining: number;
  pinInput: string;
  setPinInput: (val: string) => void;
  pinError: string | null;
  setPinError: (val: string | null) => void;
  isSubmittingPin: boolean;
  onUnlockWithPin: (e?: React.FormEvent, customPin?: string) => Promise<void> | void;
}

export const CustomerPinUnlockModal: React.FC<CustomerPinUnlockModalProps> = ({
  isOpen,
  onClose,
  tableName,
  tableCode,
  lockoutRemaining,
  pinInput,
  setPinInput,
  pinError,
  setPinError,
  isSubmittingPin,
  onUnlockWithPin,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                <Icon name="key" size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Mở Bàn Bằng Mã PIN</h3>
                <p className="text-[10.5px] text-slate-400 font-bold">{tableName || "Bàn ăn"} ({tableCode})</p>
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

          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-left space-y-1">
            <p className="text-xs font-bold text-emerald-950">
              Nhập mã PIN 4 chữ số trên thẻ bàn:
            </p>
            <p className="text-[10.5px] text-emerald-800/80 leading-relaxed">
              Mã PIN được in kèm thẻ để bàn hoặc do nhân viên phục vụ gửi. Nhập đúng mã sẽ mở khóa menu ngay tức thì.
            </p>
          </div>

          {/* Thông báo khóa tạm thời nếu nhập sai quá 10 lần */}
          {lockoutRemaining > 0 ? (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center space-y-2 animate-shake">
              <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <Icon name="lock" size={20} />
              </div>
              <h4 className="text-xs font-black text-rose-900">Tạm Khóa Bảo Mật Bàn</h4>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Bạn đã nhập sai mã PIN quá 10 lần. Vui lòng đợi hết thời gian khóa hoặc nhờ nhân viên quầy mở bàn:
              </p>
              <div className="text-2xl font-black font-mono text-rose-600 tracking-wider">
                00:{String(lockoutRemaining).padStart(2, "0")}s
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => onUnlockWithPin(e)} className="space-y-4">
              <div>
                <input
                  type="tel"
                  maxLength={6}
                  autoFocus
                  disabled={lockoutRemaining > 0}
                  value={pinInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setPinInput(v);
                    setPinError(null);
                    if (v.length === 4) {
                      onUnlockWithPin(undefined, v);
                    }
                  }}
                  placeholder="• • • •"
                  className="w-full text-center tracking-[0.5em] font-mono font-black text-2xl h-14 rounded-2xl border-2 border-emerald-600/30 focus:border-emerald-600 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none transition shadow-inner disabled:opacity-50"
                />
                {pinError && (
                  <div className="p-2.5 mt-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold text-center flex items-center justify-center gap-1.5 animate-shake">
                    <Icon name="alert" size={14} className="shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                * Mã PIN bàn là mã động bảo mật, tự động thay đổi sau mỗi lượt khách để chống lưu mã từ xa.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPin || !pinInput.trim() || lockoutRemaining > 0}
                  className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmittingPin ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Icon name="key" size={14} />
                      <span>Mở Bàn Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Portal>
  );
};
