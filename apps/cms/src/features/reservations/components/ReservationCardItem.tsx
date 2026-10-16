import React from "react";
import { Icon } from "@/components/ui";
import type { ReservationCardItemProps } from "@/types";

export const ReservationCardItem: React.FC<ReservationCardItemProps> = ({
  reservation: res,
  onConfirm,
  onArrive,
  onExtend,
  onMarkLate,
  onOpenNoShow,
  onOpenAssignTable,
  onToggleDeposit,
  onReject,
}) => {
  const isPending = res.status === "PENDING";
  const isConfirmed = res.status === "CONFIRMED";
  const isArrived = res.status === "ARRIVED";
  const isLate = res.status === "LATE";
  const isNoShow = res.status === "NO_SHOW";
  const isCancelled = res.status === "CANCELLED";

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all relative overflow-hidden shadow-2xs hover:shadow-md ${
        isArrived
          ? "border-emerald-200/80 bg-linear-to-r from-emerald-50/20 to-white"
          : isLate
          ? "border-amber-300 bg-amber-50/20 hover:border-amber-500"
          : isPending
          ? "border-amber-200/80 hover:border-amber-400"
          : "border-surface-border hover:border-brand-400"
      }`}
    >
      {/* Viền trạng thái bên trái thanh lịch */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1.5 ${
          isArrived
            ? "bg-emerald-500"
            : isConfirmed
            ? "bg-brand-800"
            : isLate
            ? "bg-amber-500 animate-pulse"
            : isPending
            ? "bg-amber-400"
            : isNoShow
            ? "bg-slate-400"
            : "bg-rose-400"
        }`}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pl-2">
        {/* Cột 1: Thời gian & Thông tin khách */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
          {/* Badge Giờ Hẹn Sang Trọng Chuẩn Khách Sạn / Luxury Dining */}
          <div className="shrink-0 w-28 sm:w-32 py-2.5 px-3 rounded-2xl bg-surface-canvas/90 border border-surface-border flex flex-col items-center justify-center text-center shadow-2xs">
            <span className="text-[10px] font-black tracking-widest text-ink-muted uppercase">
              {res.reservationTime.includes("-") ? res.reservationTime.split("-")[1].trim() : "Hẹn Giờ"}
            </span>
            <span className="text-base sm:text-lg font-black text-brand-950 tracking-tight mt-0.5">
              {res.reservationTime.includes("-") ? res.reservationTime.split("-")[0].trim() : res.reservationTime}
            </span>
          </div>

          {/* Chi tiết khách hàng & Bàn gán */}
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="font-black text-base text-ink-primary tracking-tight">
                {res.guestName}
              </h4>

              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-surface-canvas text-ink-primary border border-surface-border/70">
                {res.guestCount} khách
              </span>

              <a
                href={`tel:${res.phone}`}
                className="text-xs font-semibold text-ink-muted hover:text-brand-900 inline-flex items-center gap-1.5 transition-colors"
              >
                <Icon name="phone" size={13} className="text-ink-muted/80" />
                <span>{res.phone}</span>
              </a>

              {/* Tag trạng thái chuẩn cao cấp */}
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 ${
                  isArrived
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
                    : isConfirmed
                    ? "bg-brand-50 text-brand-900 border border-brand-200 shadow-2xs"
                    : isLate
                    ? "bg-amber-50 text-amber-900 border border-amber-400 shadow-2xs animate-pulse"
                    : isPending
                    ? "bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs"
                    : isNoShow
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {isLate && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping inline-block" />}
                {isArrived
                  ? "Đang tại quán"
                  : isConfirmed
                  ? "Đã giữ bàn"
                  : isLate
                  ? "Trễ giờ (>15p Grace)"
                  : isPending
                  ? "Chờ xác nhận"
                  : isNoShow
                  ? "Vắng mặt"
                  : "Đã hủy"}
              </span>

              {Boolean(res.extendedMinutes && res.extendedMinutes > 0) && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                  +{res.extendedMinutes}p gia hạn
                </span>
              )}

              {res.depositResolution && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                  {res.depositResolution === "FORFEIT_PENALTY"
                    ? "Thu cọc vi phạm"
                    : res.depositResolution === "VOUCHER_CREDIT"
                    ? "Voucher cọc 30 ngày"
                    : "Đã hoàn cọc"}
                </span>
              )}
            </div>

            {/* Chi tiết vị trí bàn, tiền cọc & nguồn */}
            <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
              <div className="flex items-center gap-1.5">
                <Icon name="table" size={13} className="text-ink-muted/70" />
                <span className="text-ink-subtle">Bàn:</span>
                <span className={`font-bold ${res.tableAssigned && res.tableAssigned !== "Chưa gán bàn" ? "text-ink-primary" : "text-amber-700 font-extrabold"}`}>
                  {res.tableAssigned || "Chưa gán bàn"}
                </span>
                {!isCancelled && !isNoShow && (
                  <button
                    onClick={() => onOpenAssignTable(res)}
                    className="text-[11px] font-bold text-brand-800 hover:text-brand-950 underline underline-offset-2 ml-0.5"
                  >
                    {res.tableAssigned && res.tableAssigned !== "Chưa gán bàn" ? "Đổi" : "Gán ngay"}
                  </button>
                )}
              </div>

              {(res.depositAmount ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-muted/40">•</span>
                  <button
                    type="button"
                    onClick={() => onToggleDeposit(res)}
                    className={`flex items-center gap-1 font-bold ${
                      res.depositStatus === "PAID" ? "text-emerald-700" : "text-amber-700"
                    }`}
                    title="Bấm để đổi trạng thái cọc"
                  >
                    <Icon name="checkCircle" size={13} className={res.depositStatus === "PAID" ? "text-emerald-600" : "text-amber-600"} />
                    <span>
                      Cọc {(res.depositAmount ?? 0).toLocaleString("vi-VN")} đ
                    </span>
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-surface-canvas border border-surface-border">
                      {res.depositStatus === "PAID" ? "Đã cọc" : "Chưa cọc"}
                    </span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1 text-ink-muted">
                <span className="text-ink-muted/40">•</span>
                <span>{res.source === "LANDING_PAGE" ? "Website" : "Hotline"}</span>
              </div>
            </div>

            {/* Ghi chú */}
            {res.notes && (
              <div className="flex items-start gap-1.5 mt-1 text-xs text-ink-muted bg-amber-50/50 border border-amber-200/50 px-2.5 py-1 rounded-lg">
                <Icon name="info" size={13} className="text-amber-700 mt-0.5 shrink-0" />
                <span className="font-medium text-amber-900">
                  {res.notes}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cột 2: Cụm Nút Thao Tác Chuyên Nghiệp */}
        <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-surface-border/50 justify-end flex-wrap">
          {isPending && (
            <>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-brand-950 text-white text-xs font-black shadow-xs hover:bg-black active:scale-95 transition-all flex items-center gap-1.5"
                onClick={() => onConfirm(res)}
              >
                <Icon name="check" size={13} className="text-emerald-400" />
                <span>Giữ Bàn</span>
              </button>

              <button
                type="button"
                onClick={() => onReject(res)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-ink-muted hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
              >
                Từ Chối
              </button>
            </>
          )}

          {(isConfirmed || isLate) && (
            <>
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-black shadow-xs hover:bg-emerald-800 active:scale-95 transition-all flex items-center gap-1.5"
                onClick={() => onArrive(res)}
              >
                <Icon name="checkCircle" size={14} />
                <span>Đón Khách</span>
              </button>

              <button
                type="button"
                onClick={() => onExtend(res)}
                className="px-2.5 py-2 rounded-xl text-xs font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 active:scale-95 transition-all flex items-center gap-1"
                title="Gia hạn giữ bàn thêm +15 phút"
              >
                <Icon name="clock" size={13} />
                <span>+15p Gia Hạn</span>
              </button>

              {isConfirmed && !isLate && (
                <button
                  type="button"
                  onClick={() => onMarkLate(res)}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50 active:scale-95 transition-all"
                  title="Quá giờ hẹn: Đánh dấu trễ giờ"
                >
                  Báo Trễ
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenNoShow(res)}
                className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 active:scale-95 transition-all flex items-center gap-1"
                title="Khách không đến: Giải phóng bàn & xử lý cọc"
              >
                <Icon name="alert" size={13} />
                <span>Nhả Bàn (No-Show)</span>
              </button>
            </>
          )}

          {isArrived && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
              <Icon name="checkCircle" size={14} className="text-emerald-600" />
              <span>Đang dùng bữa tại bàn</span>
            </div>
          )}

          {(isNoShow || isCancelled) && (
            <span className="text-xs font-bold text-ink-muted px-3 py-1 bg-surface-canvas rounded-lg border border-surface-border">
              {isNoShow ? "Đã ghi nhận vắng mặt" : "Đã hủy giữ chỗ"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
