import { TableStatus } from "@a2order/shared";
import { TableItem } from "@/types";

export const INITIAL_TABLES: TableItem[] = [
  { id: "1", name: "Bàn 01", status: TableStatus.EMPTY, zone: "T1" },
  { id: "2", name: "Bàn 02", status: TableStatus.OCCUPIED, occupiedMinutes: 12, totalAmount: 184000, zone: "T1" },
  { id: "3", name: "Bàn 03", status: TableStatus.WAITING_FOOD, occupiedMinutes: 18, totalAmount: 193000, zone: "T1" },
  { id: "4", name: "Bàn 04", status: TableStatus.SERVED, occupiedMinutes: 35, totalAmount: 388000, zone: "T1" },
  { id: "5", name: "Bàn 05", status: TableStatus.PAYMENT_PENDING, occupiedMinutes: 45, totalAmount: 250000, zone: "T2" },
  { id: "6", name: "Bàn 06", status: TableStatus.EMPTY, zone: "T2" },
  { id: "7", name: "Bàn 07 (VIP 1)", status: TableStatus.OCCUPIED, occupiedMinutes: 28, totalAmount: 650000, zone: "VIP" },
  { id: "8", name: "Bàn 08 (Sân Vườn)", status: TableStatus.EMPTY, zone: "SAN_VUON" },
];
