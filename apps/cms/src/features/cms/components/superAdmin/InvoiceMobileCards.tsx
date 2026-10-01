import React, { useState } from "react";
import { Icon, Checkbox } from "@/components/ui";
import { SoftwareInvoiceRecord } from "@/types/cms.types";
import { formatCurrency } from "@/lib/formatters";

export interface InvoiceMobileCardsProps {
  paginatedInvoices: SoftwareInvoiceRecord[];
  selectedInvoiceIds: string[];
  onToggleSelectInvoice: (id: string) => void;
  setViewingInvoice: (inv: SoftwareInvoiceRecord) => void;
  handleConfirmInvoice: (inv: SoftwareInvoiceRecord) => void;
  confirmingInvoiceId: string | null;
}

export const InvoiceMobileCards: React.FC<InvoiceMobileCardsProps> = ({
  paginatedInvoices,
  selectedInvoiceIds,
  onToggleSelectInvoice,
  setViewingInvoice,
  handleConfirmInvoice,
  confirmingInvoiceId,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const onCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="block lg:hidden w-full">
      {paginatedInvoices.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-bold bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Icon name="fileText" size={20} />
            </div>
            <span>Không tìm thấy hóa đơn nào phù hợp</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {paginatedInvoices.map((inv) => {
            const isSelected = selectedInvoiceIds.includes(inv.id);
            const codeDisplay = inv.invoiceCode || inv.id;
            const isCopied = copiedCode === codeDisplay;
            const isConfirming = confirmingInvoiceId === inv.id;

            return (
              <div
                key={inv.id}
                className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                  isSelected
                    ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                    : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                }`}
              >
                {/* Row 1: Checkbox + Tên quán + Số tiền */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelectInvoice(inv.id)}
                      title={`Chọn ${codeDisplay}`}
                      size="sm"
                    />
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Icon name="store" size={13} className="text-emerald-700 shrink-0" />
                      <span className="text-xs font-black text-slate-900 truncate">
                        {inv.storeName}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0">
                    {formatCurrency(inv.finalAmount)}
                  </span>
                </div>

                {/* Row 2: Mã hóa đơn + Kỳ cước + Gói + Ngày */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pl-6">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setViewingInvoice(inv)}
                      className="font-mono text-[10px] font-black text-slate-800 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 hover:text-emerald-800"
                    >
                      {codeDisplay}
                    </button>
                    <button
                      type="button"
                      onClick={() => onCopy(codeDisplay)}
                      className="p-0.5 text-slate-400 hover:text-emerald-700"
                      title="Sao chép mã"
                    >
                      <Icon name={isCopied ? "check" : "copy"} size={11} className={isCopied ? "text-emerald-600" : ""} />
                    </button>
                    <span className="truncate text-slate-400">• {inv.durationMonths}th • {inv.plan.replace("Gói ", "")}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{inv.createdAt}</span>
                </div>

                {/* Row 3: Trạng thái + Nút hành động */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 pl-6 text-xs">
                  <div>
                    {inv.status === "PAID" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đã Thu
                      </span>
                    )}
                    {inv.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Chờ Duyệt
                      </span>
                    )}
                    {inv.status === "CANCELLED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Quá Hạn
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingInvoice(inv)}
                      className="h-6 px-2 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Xem QR
                    </button>
                    {inv.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => handleConfirmInvoice(inv)}
                        disabled={isConfirming}
                        className="h-6 px-2.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                      >
                        {isConfirming ? "Đang xử lý..." : "Duyệt Thu"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
