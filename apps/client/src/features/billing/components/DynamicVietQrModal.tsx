import React from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button, Modal, Icon } from "@/components/ui";
import { DynamicVietQrModalProps } from "@/types";

export const DynamicVietQrModal: React.FC<DynamicVietQrModalProps> = ({
  isOpen,
  tableName,
  totalAmount,
  qrUrl,
  bankName,
  accountNumber,
  accountName,
  transferContent,
  isPaid,
  onClose,
  onConfirmCash,
  onPrintBill,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Thanh toán: ${tableName}`} maxWidth="sm">
      <div className="text-center">
        <div className="text-2xl font-black text-brand-900 mb-3">
          {formatCurrency(totalAmount)}
        </div>

        <div className="mb-4 p-4 rounded-2xl bg-surface-canvas border border-surface-border flex flex-col items-center justify-center min-h-[240px]">
          {isPaid ? (
            <div className="flex flex-col items-center gap-2 text-emerald-700 animate-in zoom-in">
              <Icon name="checkCircle" className="w-16 h-16 text-emerald-600" size={64} />
              <p className="font-black text-lg">ĐÃ NHẬN TIỀN THÀNH CÔNG!</p>
              <p className="text-xs text-ink-muted">Bàn đã được cập nhật tự động</p>
            </div>
          ) : qrUrl ? (
            <div className="flex flex-col items-center">
              <img src={qrUrl} alt="VietQR" className="w-44 h-44 rounded-xl shadow-sm border border-surface-border" />
              <div className="flex items-center gap-2 mt-3 text-xs text-brand-900 font-bold">
                <Icon name="refresh" className="w-3.5 h-3.5 animate-spin text-brand-800" size={14} />
                <span>Đang chờ chuyển khoản...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-ink-muted">
              <Icon name="vietqr" className="w-16 h-16 text-ink-subtle" size={64} />
              <p className="text-xs">Đang sinh mã VietQR...</p>
            </div>
          )}
        </div>

        <div className="text-left text-xs bg-surface-muted p-3 rounded-2xl space-y-1 text-ink-muted mb-4 border border-surface-border">
          <div>Ngân hàng: <span className="font-bold text-ink-primary">{bankName}</span></div>
          <div>Số TK: <span className="font-bold text-ink-primary">{accountNumber}</span></div>
          <div>Chủ TK: <span className="font-bold text-ink-primary">{accountName}</span></div>
          <div>Nội dung CK: <span className="font-bold text-brand-900">{transferContent}</span></div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1.5 rounded-xl text-xs font-bold" onClick={onPrintBill}>
              <Icon name="print" className="w-4 h-4" size={16} />
              In Bill
            </Button>
            {!isPaid && (
              <Button className="flex-1 rounded-xl bg-brand-900 text-white font-bold text-xs" onClick={onConfirmCash}>
                Thu Tiền Mặt
              </Button>
            )}
          </div>
          <Button variant="ghost" className="rounded-xl text-xs" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
