import { TableItem } from "./table.types.js";

export interface CashierBillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface CashierTableRecord {
  table: TableItem;
  billCode: string;
  openedAt: string;
  items: CashierBillItem[];
}

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
