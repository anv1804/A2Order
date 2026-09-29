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
  isPinned?: boolean;
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
}

export interface TableGridProps {
  tables: TableItem[];
  onTableClick: (table: TableItem) => void;
  pinnedTables?: string[];
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
}
