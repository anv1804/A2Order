import React from "react";
import { Icon } from "@/components/ui";

interface CustomerTableWelcomeProps {
  tableName?: string;
  zoneName?: string;
  guestCount: number;
  onSelectGuestCount: (count: number) => void;
  onRequestSession: () => void;
  onOpenPinModal: () => void;
}

export const CustomerTableWelcome: React.FC<CustomerTableWelcomeProps> = ({
  tableName,
  zoneName,
  guestCount,
  onSelectGuestCount,
  onRequestSession,
  onOpenPinModal,
}) => {
  return (
    <div className="animate-fadeIn space-y-4">
      {/* Hero card */}
      <div className="rounded-3xl bg-brand-900 text-white p-6 text-center shadow-lg relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center mx-auto mb-4 shadow-md border border-white/20">
            <Icon name="vietqr" size={32} />
          </div>
          <h2 className="text-xl font-black mb-1.5 tracking-tight">
            Chào mừng quý khách!
          </h2>
          <p className="text-brand-100 text-sm leading-relaxed">
            {tableName || "Bàn ăn"} · {zoneName || ""}
          </p>
          <p className="text-brand-200/80 text-xs mt-2 leading-relaxed">
            Để bắt đầu gọi món, vui lòng yêu cầu nhân viên mở bàn hoặc nhập mã PIN trên thẻ bàn.
          </p>
        </div>
      </div>

      {/* Chọn số khách */}
      <div className="bg-white rounded-2xl p-4 shadow-2xs border border-surface-border">
        <label className="text-xs font-bold text-ink-secondary mb-2.5 flex items-center gap-1.5">
          <Icon name="users" size={13} />
          <span>Số người tại bàn:</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 4, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onSelectGuestCount(num)}
              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                guestCount === num
                  ? "bg-brand-900 text-white border-brand-900 shadow-xs scale-105 font-black"
                  : "bg-surface-canvas text-ink-primary border-surface-border hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Nút yêu cầu mở bàn */}
      <button
        type="button"
        onClick={onRequestSession}
        className="w-full py-4 rounded-2xl bg-brand-900 hover:bg-brand-800 active:scale-98 text-white font-black text-base flex items-center justify-center gap-2.5 shadow-md transition"
      >
        <Icon name="bell" size={20} />
        <span>Gọi Nhân Viên Mở Bàn</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-surface-border" />
        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">hoặc</span>
        <div className="flex-1 border-t border-surface-border" />
      </div>

      {/* Nút PIN */}
      <button
        type="button"
        onClick={onOpenPinModal}
        className="w-full py-3.5 rounded-2xl bg-white border-2 border-brand-800/30 hover:border-brand-800 hover:bg-brand-50/50 text-brand-900 font-black text-sm flex items-center justify-center gap-2 shadow-2xs transition"
      >
        <Icon name="key" size={16} />
        <span>Nhập Mã PIN Thẻ Bàn</span>
      </button>

      <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-200/60 flex items-start gap-2.5">
        <Icon name="lock" size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <strong>Mã PIN động:</strong> Mã thay đổi sau mỗi lượt khách để bảo vệ bàn của bạn. Không lưu mã cho lần sau.
        </p>
      </div>
    </div>
  );
};
