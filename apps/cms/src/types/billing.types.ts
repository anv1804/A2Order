export interface DynamicVietQrModalProps {
  isOpen: boolean;
  tableName: string;
  totalAmount: number;
  qrUrl?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  isPaid: boolean;
  onClose: () => void;
  onConfirmCash: () => void;
  onPrintBill: () => void;
}
