import React from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { Reservation } from "@/types/cms.types";

export type DepositResolutionType = "FORFEIT_PENALTY" | "VOUCHER_CREDIT" | "REFUNDED";

interface NoShowModalProps {
  target: Reservation | null;
  onClose: () => void;
  onConfirm: () => void;
  depositResolution: DepositResolutionType;
  setDepositResolution: (res: DepositResolutionType) => void;
}

export const NoShowModal: React.FC<NoShowModalProps> = ({
  target,
  onClose,
  onConfirm,
  depositResolution,
  setDepositResolution,
}) => {
  if (!target) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated border border-surface-border p-5 sm:p-6 space-y-4 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Icon name="alert" size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">
                  Nhả Bàn & Xử Lý Cọc (No-Show SOP)
                </h3>
                <p className="text-xs text-ink-muted">
                  {target.guestName} ({target.phone}) • {target.tableAssigned || "Bàn chưa gán"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-canvas"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* Cảnh báo quy định giữ bàn */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            ⏳ <strong>Quy Định Thời Gian Ân Hạn (Grace Period 15p):</strong> Khách đã quá giờ hẹn {target.reservationTime}. Để tránh lãng phí công suất bàn trong khung giờ cao điểm, hệ thống sẽ <strong>giải phóng bàn về trạng thái TRỐNG</strong> để tiếp đón khách vãng lai đang chờ.
          </div>

          {/* Phần xử lý tiền cọc */}
          {(target.depositAmount || 0) > 0 && target.depositStatus === "PAID" ? (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-950 font-bold">Tiền cọc giữ chỗ của khách:</span>
                <span className="text-base font-black text-emerald-900">
                  {(target.depositAmount || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>

              <label className="text-xs font-black text-ink-primary block">
                Chọn nghiệp vụ xử lý tiền cọc:
              </label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setDepositResolution("FORFEIT_PENALTY")}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                    depositResolution === "FORFEIT_PENALTY"
                      ? "border-rose-500 bg-rose-50/50 shadow-2xs"
                      : "border-surface-border bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="p-1 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
                    <Icon name="trash" size={13} />
                  </span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="text-xs font-black text-rose-950">
                      1. Thu cọc vi phạm chính sách (Không hoàn lại)
                    </div>
                    <p className="text-[11px] text-rose-900/80 leading-snug">
                      Khách vắng mặt không báo trước làm trống bàn giờ vàng. Chuyển tiền cọc vào mục bồi hoàn doanh thu.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositResolution("VOUCHER_CREDIT")}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                    depositResolution === "VOUCHER_CREDIT"
                      ? "border-brand-600 bg-brand-50/50 shadow-2xs"
                      : "border-surface-border bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="p-1 rounded-lg bg-brand-800 text-white shrink-0 mt-0.5">
                    <Icon name="refresh" size={13} />
                  </span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="text-xs font-black text-brand-950">
                      2. Cấp Voucher Cọc Bảo Lưu 30 Ngày (Khuyên dùng)
                    </div>
                    <p className="text-[11px] text-brand-900/80 leading-snug">
                      Giữ chân khách hàng: Bảo lưu {(target.depositAmount || 0).toLocaleString("vi-VN")} đ thành mã giảm giá cho lần ghé quán tiếp theo.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositResolution("REFUNDED")}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                    depositResolution === "REFUNDED"
                      ? "border-slate-500 bg-slate-50 shadow-2xs"
                      : "border-surface-border bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="p-1 rounded-lg bg-slate-700 text-white shrink-0 mt-0.5">
                    <Icon name="refresh" size={13} />
                  </span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900">
                      3. Hoàn trả lại tiền cọc (Lý do bất khả kháng)
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Khách báo gặp sự cố khẩn cấp, thời tiết xấu hoặc lý do bất khả kháng. Quán hoàn lại 100% cọc qua tài khoản.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-surface-canvas rounded-2xl border border-surface-border text-xs text-ink-muted">
              ℹ️ Lịch đặt bàn này <strong>chưa đặt cọc</strong>. Sau khi xác nhận, bàn sẽ được chuyển về trạng thái TRỐNG ngay lập tức để tiếp đón khách mới.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onClose}
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs px-5 shadow-sm font-black"
              onClick={onConfirm}
            >
              Xác Nhận Nhả Bàn & Đổi Trạng Thái Trống
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
