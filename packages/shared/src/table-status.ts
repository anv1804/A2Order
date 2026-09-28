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
    bgClass: "bg-[#E8F5EE] border-[#A3DBCE] text-[#194B3A]",
  },
  [TableStatus.OCCUPIED]: {
    label: "Đang chọn món",
    color: "#B45309",
    bgClass: "bg-amber-50 border-amber-200 text-amber-800",
  },
  [TableStatus.WAITING_FOOD]: {
    label: "Đang chờ bếp",
    color: "#C2410C",
    bgClass: "bg-orange-50 border-orange-200 text-orange-800",
  },
  [TableStatus.SERVED]: {
    label: "Đã lên đủ món",
    color: "#1D4ED8",
    bgClass: "bg-blue-50 border-blue-200 text-blue-800",
  },
  [TableStatus.PAYMENT_PENDING]: {
    label: "Chờ thanh toán",
    color: "#B91C1C",
    bgClass: "bg-rose-50 border-rose-200 text-rose-800",
  },
};
