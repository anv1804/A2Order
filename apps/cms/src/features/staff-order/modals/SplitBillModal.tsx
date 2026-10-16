import React, { useEffect, useState } from "react";
import { browserRequest, type BillView } from "@a2order/shared";
import { useAntiSpamAction } from "@a2order/shared/react";
import { Icon, Button, Portal } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { WaiterTableOrder } from "@/types/cms.types";

export interface SplitBillModalProps {
  storeId: string;
  isOpen: boolean;
  activeTable: WaiterTableOrder;
  finalPayableAmount: number;
  splitBillTab: "ITEMIZED" | "EQUAL";
  onSplitBillTabChange: (tab: "ITEMIZED" | "EQUAL") => void;
  splitItemCounts: Record<number, number>;
  setSplitItemCounts: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  equalSplitGuests: number;
  setEqualSplitGuests: (n: number) => void;
  equalSplitPaid: Record<number, boolean>;
  setEqualSplitPaid: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  activePersonQr: number | null;
  setActivePersonQr: (idx: number | null) => void;
  onExecuteItemizedSplit: () => void;
  onClose: () => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  storeId,
  isOpen,
  activeTable,
  finalPayableAmount,
  splitBillTab,
  onSplitBillTabChange,
  splitItemCounts,
  setSplitItemCounts,
  equalSplitGuests,
  setEqualSplitGuests,
  equalSplitPaid,
  setEqualSplitPaid,
  activePersonQr,
  setActivePersonQr,
  onExecuteItemizedSplit,
  onClose,
}) => {
  const [bill, setBill] = useState<BillView | null>(null);
  const cashPart = useAntiSpamAction("split-cash", (index: number, key) => browserRequest<any>("/billing/checkout", { method: "POST", headers: { "x-idempotency-key": key }, body: JSON.stringify({ billId: bill?.id, method: "CASH", partIndex: index, cashTendered: bill?.shares?.[index] }) }));
  useEffect(() => {
    if (!isOpen || splitBillTab !== "EQUAL") { setBill(null); return; }
    let active = true;
    browserRequest<BillView>("/billing/generate-vietqr", { method: "POST", body: JSON.stringify({ tableId: activeTable.tableId, splitCount: equalSplitGuests }) }).then(value => { if (active) setBill(value); }, e => toast.error(e.message));
    return () => { active = false; };
  }, [isOpen, splitBillTab, activeTable.tableId, equalSplitGuests]);
  useEffect(() => {
    if (!bill || !isOpen) return;
    const timer = setInterval(() => { browserRequest<BillView>(`/billing/bills/${bill.id}`).then(setBill, () => undefined); }, 4000);
    return () => clearInterval(timer);
  }, [bill?.id, isOpen]);
  const collect = async (index: number) => {
    if (!bill) return;
    try { const result = await cashPart.execute(index); if (result) { setBill(result.bill); toast.success("Đã ghi nhận tiền mặt"); } } catch (e: any) { toast.error(e.message); }
  };
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink-primary/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-elevated p-5 sm:p-6 space-y-4 border border-surface-border animate-scaleUp max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center font-bold">
                <Icon name="table" size={16} />
              </div>
              <div>
                <h3 className="text-base font-black text-ink-primary">
                  Tách Hóa Đơn • {activeTable.tableName}
                </h3>
                <p className="text-xs text-ink-muted">
                  Tổng bill hiện tại: <strong className="text-brand-950">{finalPayableAmount.toLocaleString("vi-VN")} đ</strong> ({activeTable.items.length} món)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab Selector: Itemized vs Equal */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-canvas rounded-2xl border border-surface-border text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => onSplitBillTabChange("ITEMIZED")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                splitBillTab === "ITEMIZED"
                  ? "bg-white text-brand-900 shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Icon name="list" size={13} />
              <span>Tách Theo Món (Bill B)</span>
            </button>
            <button
              type="button"
              onClick={() => onSplitBillTabChange("EQUAL")}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                splitBillTab === "EQUAL"
                  ? "bg-white text-brand-900 shadow-xs font-black"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Icon name="users" size={13} />
              <span>Chia Đều Đầu Người</span>
            </button>
          </div>

          {/* Tab 1: Itemized Split */}
          {splitBillTab === "ITEMIZED" && (
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              <p className="text-xs text-ink-muted">
                Chọn số lượng món muốn tách sang <strong>Hóa Đơn B</strong> để khách thanh toán trước:
              </p>

              <div className="space-y-2">
                {activeTable.items.map((item, idx) => {
                  const count = splitItemCounts[idx] || 0;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        count > 0
                          ? "border-brand-500 bg-brand-50/30"
                          : "border-surface-border bg-surface-canvas/50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs text-ink-primary">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-ink-muted mt-0.5">
                          {item.price.toLocaleString("vi-VN")} đ • Bàn có: <strong>{item.quantity}</strong>
                        </div>
                      </div>

                      {/* Bộ tăng giảm số lượng tách */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-ink-muted">Tách:</span>
                        <div className="flex items-center gap-1.5 bg-white border border-surface-border rounded-xl p-1 shadow-2xs">
                          <button
                            type="button"
                            disabled={count <= 0}
                            onClick={() =>
                              setSplitItemCounts((prev) => ({
                                ...prev,
                                [idx]: Math.max(0, (prev[idx] || 0) - 1),
                              }))
                            }
                            className="w-6 h-6 rounded-lg bg-surface-canvas flex items-center justify-center text-ink-primary font-bold disabled:opacity-30 hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-black text-brand-950">
                            {count}
                          </span>
                          <button
                            type="button"
                            disabled={count >= item.quantity}
                            onClick={() =>
                              setSplitItemCounts((prev) => ({
                                ...prev,
                                [idx]: Math.min(item.quantity, (prev[idx] || 0) + 1),
                              }))
                            }
                            className="w-6 h-6 rounded-lg bg-surface-canvas flex items-center justify-center text-ink-primary font-bold disabled:opacity-30 hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bảng so sánh 2 Bill Trực Quan */}
              {(() => {
                let billBSum = 0;
                let billASum = 0;
                let billBCount = 0;
                activeTable.items.forEach((item, idx) => {
                  const c = splitItemCounts[idx] || 0;
                  billBSum += c * item.price;
                  billASum += (item.quantity - c) * item.price;
                  if (c > 0) billBCount += c;
                });

                return (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-700">Bill A (Còn lại bàn):</div>
                      <div className="text-sm font-black text-slate-900">
                        {billASum.toLocaleString("vi-VN")} đ
                      </div>
                      <div className="text-[10px] text-slate-500">Giữ lại tiếp tục phục vụ</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 space-y-1">
                      <div className="font-bold text-brand-900">Bill B (Tách ra thanh toán):</div>
                      <div className="text-sm font-black text-brand-950">
                        {billBSum.toLocaleString("vi-VN")} đ
                      </div>
                      <div className="text-[10px] text-brand-800 font-bold">{billBCount} món tách riêng</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab 2: Equal Split (Chia đều đầu người) */}
          {splitBillTab === "EQUAL" && (() => {
            const perPerson = bill?.shares?.[0] || 0;
            const paidCount = bill?.paidParts?.length || 0;

            return (
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {/* Chọn số người chia */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-secondary block">
                    Chọn số người chia đều hóa đơn:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setEqualSplitGuests(num);
                          setEqualSplitPaid({});
                          setActivePersonQr(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          equalSplitGuests === num
                            ? "bg-brand-900 text-white shadow-xs font-black"
                            : "bg-surface-canvas border border-surface-border text-ink-primary hover:border-brand-300"
                        }`}
                      >
                        {num} người
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thẻ hiển thị số tiền mỗi người */}
                <div className="p-3.5 rounded-2xl bg-linear-to-r from-emerald-500/10 via-brand-50 to-white border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-ink-muted font-bold block">Mỗi khách thanh toán:</span>
                    <span className="text-lg font-black text-emerald-950">
                      {perPerson.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {paidCount}/{equalSplitGuests} khách đã trả
                  </span>
                </div>

                {/* Danh sách từng khách kèm nút QR động */}
                <div className="space-y-2">
                  {Array.from({ length: equalSplitGuests }).map((_, i) => {
                    const isPaid = bill?.paymentStatus === "PAID" || bill?.paidParts?.includes(i);
                    const personAmount = bill?.shares?.[i] || 0;
                    const isShowingQr = activePersonQr === i;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl border transition-all ${
                          isPaid
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-surface-border bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${isPaid ? "bg-emerald-600 text-white" : "bg-surface-canvas text-ink-muted"}`}>
                              {i + 1}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-ink-primary">
                                Khách #{i + 1}
                              </div>
                              <div className="text-[11px] font-black text-brand-900">
                                {personAmount.toLocaleString("vi-VN")} đ
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActivePersonQr(isShowingQr ? null : i)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                                isShowingQr
                                  ? "bg-brand-900 text-white border-brand-900"
                                  : "bg-surface-canvas text-brand-900 border-brand-200 hover:bg-brand-50"
                              }`}
                            >
                              <Icon name="vietqr" size={13} />
                              <span>{isShowingQr ? "Ẩn QR" : "Mã QR"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void collect(i)} disabled={isPaid || !bill || cashPart.isSubmitting}
                              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                                isPaid
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-surface-canvas text-ink-muted border border-surface-border hover:text-emerald-700"
                              }`}
                            >
                              <Icon name="check" size={12} />
                              <span>{isPaid ? "Đã Thu" : "Thu Tiền"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Mã QR riêng của khách này */}
                        {isShowingQr && (
                          <div className="mt-3 p-3 bg-surface-canvas rounded-2xl border border-surface-border text-center space-y-2 animate-fadeIn">
                            <img
                              src={bill?.qrUrl ? bill.qrUrl.replace(/amount=\d+/, "amount=" + personAmount).replace(/addInfo=[^&]+/, "addInfo=" + encodeURIComponent(bill.transferContent + "P" + i)) : undefined}
                              alt={`VietQR Khách ${i + 1}`}
                              className="w-48 h-48 mx-auto rounded-xl shadow-xs border bg-white p-1"
                            />
                            <div className="text-[11px] text-ink-muted font-bold">
                              Khách #{i + 1} quét mã chuyển đúng: <strong className="text-brand-950">{personAmount.toLocaleString("vi-VN")} đ</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Footer Modal */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onClose}
            >
              Đóng
            </Button>

            {splitBillTab === "ITEMIZED" ? (
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-brand-900 text-white text-xs px-5 shadow-sm font-bold"
                onClick={onExecuteItemizedSplit}
              >
                Xác Nhận Tách & In Bill B
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-5 shadow-sm font-bold"
                onClick={() => {
                  if (bill?.paymentStatus !== "PAID") { toast.info("Hóa đơn vẫn còn phần chưa thanh toán"); return; }
                  onClose();
                }}
              >
                Hoàn Tất Thu Tiền
              </Button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
