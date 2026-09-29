import { useState } from "react";
import { TableItem, KdsTicket, MenuItemData, StaffMember, AttendanceRecord } from "@/types";
import { INITIAL_TABLES, INITIAL_KDS_TICKETS, INITIAL_MENU, MOCK_STAFF, INITIAL_ATTENDANCE } from "@/data";

export function useAppState() {
  // Auth & Staff
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(MOCK_STAFF[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);

  // Navigation
  const [activeTab, setActiveTab] = useState<"tables" | "kds" | "billing" | "menu" | "chat" | "schedule" | "settings">("tables");

  // Data states
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES);
  const [kdsTickets, setKdsTickets] = useState<KdsTicket[]>(INITIAL_KDS_TICKETS);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);

  // Table filters
  const [tableSearch, setTableSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Doanh số cá nhân của nhân viên phục vụ ca trực hiện tại
  const [myStaffSales, setMyStaffSales] = useState<number>(2450000);
  const [myServedTablesCount, setMyServedTablesCount] = useState<number>(8);

  // Active table interaction modals
  const [activeTableForOrder, setActiveTableForOrder] = useState<TableItem | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activeTableMenuActions, setActiveTableMenuActions] = useState<TableItem | null>(null);

  return {
    // Auth
    isAuthModalOpen, setIsAuthModalOpen,
    currentStaff, setCurrentStaff,
    attendanceRecords, setAttendanceRecords,
    // Nav
    activeTab, setActiveTab,
    // Data
    tables, setTables,
    kdsTickets, setKdsTickets,
    menuItems, setMenuItems,
    // Filters
    tableSearch, setTableSearch,
    selectedZone, setSelectedZone,
    selectedStatus, setSelectedStatus,
    // Staff sales
    myStaffSales, setMyStaffSales,
    myServedTablesCount, setMyServedTablesCount,
    // Table modals
    activeTableForOrder, setActiveTableForOrder,
    isOrderModalOpen, setIsOrderModalOpen,
    activeTableMenuActions, setActiveTableMenuActions,
  };
}
