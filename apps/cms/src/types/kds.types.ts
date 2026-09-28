import { OrderItemStatus } from "@a2order/shared";

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
