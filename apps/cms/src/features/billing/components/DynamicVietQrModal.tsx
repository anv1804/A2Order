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
        <div className="text-2xl font-black text-blue-600 mb-3">
          {formatCurrency(totalAmount)}
        </div>

        <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center min-h-[240px]">
          {isPaid ? (
            <div className="flex flex-col items-center gap-2 text-emerald-600 animate-in zoom-in">
              <Icon name="checkCircle" className="w-16 h-16" size={64} />
              <p className="font-black text-lg">ĐÃ NHẬN TIỀN THÀNH CÔNG!</p>
              <p className="text-xs text-slate-500">Bàn đã được cập nhật tự động</p>
            </div>
          ) : qrUrl ? (
            <div className="flex flex-col items-center">
              <img src={qrUrl} alt="VietQR" className="w-44 h-44 rounded-xl shadow-sm" />
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 font-medium">
                <Icon name="loader" className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Đang chờ chuyển khoản...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Icon name="vietqr" className="w-16 h-16" size={64} />
              <p className="text-xs">Đang sinh mã VietQR...</p>
            </div>
          )}
        </div>

        <div className="text-left text-xs bg-slate-100 p-3 rounded-xl space-y-1 text-slate-600 mb-4">
          <div>Ngân hàng: <span className="font-bold text-slate-800">{bankName}</span></div>
          <div>Số TK: <span className="font-bold text-slate-800">{accountNumber}</span></div>
          <div>Chủ TK: <span className="font-bold text-slate-800">{accountName}</span></div>
          <div>Nội dung CK: <span className="font-bold text-blue-600">{transferContent}</span></div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1" onClick={onPrintBill}>
              <Icon name="print" className="w-4 h-4" />
              In Bill
            </Button>
            {!isPaid && (
              <Button variant="secondary" className="flex-1" onClick={onConfirmCash}>
                Thu Tiền Mặt
              </Button>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
