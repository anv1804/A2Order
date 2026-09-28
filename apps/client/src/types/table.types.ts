import { TableStatus } from "@a2order/shared";

export interface TableItem {
  id: string;
  name: string;
  status: TableStatus;
  zone?: string;
  zoneName?: string;
  occupiedMinutes?: number;
  totalAmount?: number;
}

export interface TableCardProps {
  table: TableItem;
  onClick: (table: TableItem) => void;
}

export interface TableGridProps {
  tables: TableItem[];
  onTableClick: (table: TableItem) => void;
}
