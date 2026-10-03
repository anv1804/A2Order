import React from "react";
import { Icon, Portal } from "@/components/ui";

interface CustomerPinModalProps {
  isOpen: boolean;
  tableName?: string;
  tableCode?: string;
  pinInput: string;
  onChangePinInput: (val: string) => void;
  pinError: string | null;
  lockoutRemaining: number;
  isSubmittingPin: boolean;
  onClose: () => void;
  onSubmit: (e?: React.FormEvent, directPin?: string) => void;
}

export const CustomerPinModal: React.FC<CustomerPinModalProps> = ({
  isOpen,
  tableName,
  tableCode,
  pinInput,
  onChangePinInput,
  pinError,
  lockoutRemaining,
  isSubmittingPin,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/70 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-elevated border border-surface-border space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center shadow-2xs border border-brand-200">
                <Icon name="key" size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink-primary">Mở Bàn Bằng Mã PIN</h3>
                <p className="text-[10.5px] text-ink-muted font-bold">{tableName || "Bàn ăn"} ({tableCode})</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface-canvas transition"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="p-3 bg-brand-50/70 rounded-2xl border border-brand-200/80 text-left space-y-1">
            <p className="text-xs font-bold text-brand-950">
              Nhập mã PIN 4 chữ số trên thẻ bàn:
            </p>
            <p className="text-[10.5px] text-brand-900/80 leading-relaxed">
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
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <input
                  type="tel"
                  maxLength={6}
                  autoFocus
                  disabled={lockoutRemaining > 0}
                  value={pinInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    onChangePinInput(v);
                    if (v.length === 4) {
                      onSubmit(undefined, v);
                    }
                  }}
                  placeholder="• • • •"
                  className="w-full text-center tracking-[0.5em] font-mono font-black text-2xl h-14 rounded-2xl border-2 border-brand-800/30 focus:border-brand-800 bg-surface-canvas focus:bg-white text-ink-primary focus:outline-none transition shadow-inner disabled:opacity-50"
                />
                {pinError && (
                  <div className="p-2.5 mt-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold text-center flex items-center justify-center gap-1.5 animate-shake">
                    <Icon name="alert" size={14} className="shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-ink-muted text-center leading-relaxed">
                * Mã PIN bàn là mã động bảo mật, tự động thay đổi sau mỗi lượt khách để chống lưu mã từ xa.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-surface-border text-ink-muted font-bold text-xs hover:bg-surface-canvas transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPin || !pinInput.trim() || lockoutRemaining > 0}
                  className="flex-1 py-3 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50"
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
