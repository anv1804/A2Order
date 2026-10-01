import { OrderItemStatus } from "@a2order/shared";

// Legacy KdsTicket for KdsTicketCard
export interface KdsItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status: OrderItemStatus;
}

export interface KdsTicket {
  id: string;
  tableName: string;
  minutesAgo: number;
  batchNumber: number;
  items: KdsItem[];
}

export interface KdsTicketCardProps {
  ticket: KdsTicket;
  onItemStatusToggle: (itemId: string) => void;
  onCompleteTicket: (ticketId: string) => void;
}

// Full-featured CMS KDS types
export type KdsStation = "KITCHEN" | "BAR" | "DESSERT";
export type KdsStatus = "NEW" | "IN_PROGRESS" | "DONE";

export interface KdsOrderItem {
  dishName: string;
  quantity: number;
  notes?: string;
  isCanceled?: boolean;
}

export interface CmsKdsTicket {
  id: string;
  ticketCode: string;
  tableName: string;
  orderTime: string;
  orderTimestamp: number;
  status: KdsStatus;
  station: KdsStation;
  items: KdsOrderItem[];
  waiterName: string;
  priority?: "URGENT" | "NORMAL" | "REMAKE";
  remakeReason?: string;
  isCanceled?: boolean;
  cancelReason?: string;
}
