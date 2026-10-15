import React from "react";
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

export interface ZoneFilterOption {
  id: string;
  label: string;
}

export interface StatusFilterOption {
  id: TableStatus | "ALL";
  label: string;
}


export interface TableZoneData {
  id: string;
  name: string;
  tables: TableItem[];
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

export interface TablesDashboardProps {
  tables: TableItem[];
  tableSearch: string;
  setTableSearch: (v: string) => void;
  selectedZone: string;
  setSelectedZone: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  onTableClick: (table: TableItem) => void;
  myStaffSales: number;
  myServedTablesCount: number;
  occupiedCount: number;
  emptyCount: number;
  waitingFoodCount: number;
  currentTotalRevenue: number;
}

export interface TableActionsDialogProps {
  table: TableItem;
  currentStaffRole: string;
  onClose: () => void;
  onOrderMore: () => void;
  onGoToBilling: () => void;
  onPrintPreBill: () => void;
}

export interface UseTableActionsParams {
  tables: TableItem[];
  setTables: React.Dispatch<React.SetStateAction<TableItem[]>>;
  setKdsTickets: React.Dispatch<React.SetStateAction<any[]>>;
  setMyStaffSales: React.Dispatch<React.SetStateAction<number>>;
  setMyServedTablesCount: React.Dispatch<React.SetStateAction<number>>;
  setActiveTableForOrder: React.Dispatch<React.SetStateAction<TableItem | null>>;
  setIsOrderModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTableMenuActions: React.Dispatch<React.SetStateAction<TableItem | null>>;
  setActiveTab: React.Dispatch<React.SetStateAction<"tables" | "kds" | "billing" | "menu" | "chat" | "schedule" | "settings">>;
  currentStaff: { role: string };
}


