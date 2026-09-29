import { OrderItemStatus } from "@a2order/shared";
import { KdsTicket } from "@/types";

export const INITIAL_KDS_TICKETS: KdsTicket[] = [
  {
    id: "t1",
    tableName: "Bàn 03",
    minutesAgo: 14,
    batchNumber: 1,
    items: [
      { id: "i1", name: "Phở Bò Tái Nạm", quantity: 2, notes: "Không hành, nhiều nước béo", status: OrderItemStatus.COOKING },
      { id: "i2", name: "Trứng Gà Trần", quantity: 2, status: OrderItemStatus.DONE },
      { id: "i3", name: "Quẩy Giòn Phở", quantity: 1, status: OrderItemStatus.DONE },
    ],
  },
  {
    id: "t2",
    tableName: "Bàn 02",
    minutesAgo: 5,
    batchNumber: 1,
    items: [
      { id: "i4", name: "Bún Chả Hà Nội Đặc Biệt", quantity: 1, status: OrderItemStatus.QUEUED },
      { id: "i5", name: "Nem Rán Hải Sản", quantity: 2, status: OrderItemStatus.QUEUED },
    ],
  },
  {
    id: "t3",
    tableName: "Bàn 07 (VIP 1)",
    minutesAgo: 8,
    batchNumber: 2,
    items: [
      { id: "i6", name: "Lẩu Đuôi Bò Nồi Đất", quantity: 1, notes: "Cay vừa", status: OrderItemStatus.COOKING },
    ],
  },
];
