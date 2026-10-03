export enum TableStatus {
  EMPTY = "EMPTY",
  OCCUPIED = "OCCUPIED",
  WAITING_FOOD = "WAITING_FOOD",
  SERVED = "SERVED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
}

export const TableStatusConfig: Record<TableStatus, { label: string; color: string; bgClass: string }> = {
  [TableStatus.EMPTY]: {
    label: "Bàn trống",
    color: "#194B3A",
    bgClass: "bg-status-empty-bg border-status-empty-border text-status-empty-text",
  },
  [TableStatus.OCCUPIED]: {
    label: "Đang chọn món",
    color: "#B45309",
    bgClass: "bg-status-selecting-bg border-status-selecting-border text-status-selecting-text",
  },
  [TableStatus.WAITING_FOOD]: {
    label: "Đang chờ bếp",
    color: "#C2410C",
    bgClass: "bg-status-waiting-bg border-status-waiting-border text-status-waiting-text",
  },
  [TableStatus.SERVED]: {
    label: "Đã lên đủ món",
    color: "#1D4ED8",
    bgClass: "bg-status-served-bg border-status-served-border text-status-served-text",
  },
  [TableStatus.PAYMENT_PENDING]: {
    label: "Chờ thanh toán",
    color: "#B91C1C",
    bgClass: "bg-status-billing-bg border-status-billing-border text-status-billing-text",
  },
};
