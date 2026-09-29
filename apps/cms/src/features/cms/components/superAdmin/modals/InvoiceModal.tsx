import React from "react";
import { Button, Icon, Portal } from "@/components/ui";
import { SoftwareInvoiceRecord } from "@/types/cms.types";

export interface InvoiceModalProps {
  invoice: SoftwareInvoiceRecord | null;
  onClose: () => void;
  onConfirmPayment: (invoice: SoftwareInvoiceRecord) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  onClose,
  onConfirmPayment,
}) => {
  if (!invoice) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-primary/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp text-center">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h3 className="text-sm font-black text-ink-primary uppercase">
              HÓA ĐƠN THUÊ PHẦN MỀM SAAS
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 text-xs">
            <div className="font-black text-brand-900 text-base">{invoice.storeName}</div>
            <div className="font-mono text-ink-muted">{invoice.invoiceCode}</div>
            <div className="text-ink-secondary">{invoice.plan} • {invoice.durationMonths} tháng</div>
          </div>

          {/* QR VietQR thanh toán cước thuê */}
          <div className="p-4 bg-surface-canvas rounded-2xl border border-surface-border flex flex-col items-center">
            <div className="w-44 h-44 bg-white p-2 rounded-xl border border-surface-border shadow-sm flex items-center justify-center">
              <img
                src={`https://api.vietqr.io/image/970422-0912345678-qM0v76X.jpg?amount=${invoice.finalAmount}&addInfo=${encodeURIComponent(
                  invoice.invoiceCode
                )}&accountName=A2ORDER%20PLATFORM`}
                alt="VietQR SaaS"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-ink-muted mt-2">
              Nội dung CK: <strong className="text-brand-900">{invoice.invoiceCode}</strong>
            </span>
            <span className="text-sm font-black text-brand-950 mt-1">
              {invoice.finalAmount.toLocaleString("vi-VN")} đ
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-1/2 rounded-xl text-xs"
              onClick={onClose}
            >
              Đóng
            </Button>
            {invoice.status === "PENDING" && (
              <Button
                type="button"
                size="sm"
                className="w-1/2 rounded-xl bg-brand-900 text-white text-xs shadow-sm"
                onClick={() => onConfirmPayment(invoice)}
              >
                Duyệt Đã Thu Tiền
              </Button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
