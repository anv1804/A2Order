import { TableStatus, OrderItemStatus } from "@a2order/shared";
import { TableItem, KdsTicket, CartItem } from "@/types";
import { toast } from "@/stores/notificationStore";
import { sound } from "@/lib/sound";

interface UseTableActionsParams {
  tables: TableItem[];
  setTables: React.Dispatch<React.SetStateAction<TableItem[]>>;
  setKdsTickets: React.Dispatch<React.SetStateAction<KdsTicket[]>>;
  setMyStaffSales: React.Dispatch<React.SetStateAction<number>>;
  setMyServedTablesCount: React.Dispatch<React.SetStateAction<number>>;
  setActiveTableForOrder: React.Dispatch<React.SetStateAction<TableItem | null>>;
  setIsOrderModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTableMenuActions: React.Dispatch<React.SetStateAction<TableItem | null>>;
  setActiveTab: React.Dispatch<React.SetStateAction<"tables" | "kds" | "billing" | "menu" | "chat" | "schedule" | "settings">>;
  currentStaff: { role: string };
}

export function useTableActions(params: UseTableActionsParams) {
  const {
    tables, setTables, setKdsTickets,
    setMyStaffSales, setMyServedTablesCount,
    setActiveTableForOrder, setIsOrderModalOpen,
    setActiveTableMenuActions, setActiveTab, currentStaff,
  } = params;

  // Xử lý khi nhấn vào bàn ăn trên sơ đồ
  const handleTableClick = (table: TableItem) => {
    if (table.status === TableStatus.EMPTY) {
      setActiveTableForOrder(table);
      setIsOrderModalOpen(true);
    } else if (table.status === TableStatus.PAYMENT_PENDING) {
      const roleUpper = (currentStaff?.role || "").toUpperCase();
      const canBill = roleUpper.includes("THU NGÂN") || roleUpper.includes("QUẢN LÝ") || roleUpper.includes("CHỦ QUÁN");
      if (canBill) {
        setActiveTab("billing");
        toast.info(`Chuyển sang Quầy Thu Ngân để thanh toán ${table.name}`);
      } else {
        setActiveTableMenuActions(table);
        toast.info(`${table.name} đang chờ thanh toán tại Quầy Thu Ngân`);
      }
    } else {
      setActiveTableMenuActions(table);
    }
  };

  // Xác nhận gọi món và gửi đơn vào bếp KDS
  const handleOrderSubmitted = (tableName: string, items: CartItem[]) => {
    const sum = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    setMyStaffSales((prev) => prev + sum);
    setMyServedTablesCount((prev) => prev + 1);

    setTables((prev) =>
      prev.map((t) =>
        t.name === tableName
          ? {
              ...t,
              status: TableStatus.WAITING_FOOD,
              occupiedMinutes: t.occupiedMinutes ? t.occupiedMinutes : 1,
              totalAmount: (t.totalAmount || 0) + sum,
            }
          : t
      )
    );

    const newTicket: KdsTicket = {
      id: `t-${Date.now()}`,
      tableName,
      minutesAgo: 0,
      batchNumber: 1,
      items: items.map((i, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        name: i.name,
        quantity: i.quantity,
        notes: i.notes,
        status: OrderItemStatus.QUEUED,
      })),
    };
    setKdsTickets((prev) => [newTicket, ...prev]);

    sound.playKitchenChime();
    toast.success(`Đã gửi ${items.length} món của ${tableName} vào bếp KDS!`);
    setIsOrderModalOpen(false);
    setActiveTableMenuActions(null);
  };

  // Hoàn tất thu tiền bàn từ quầy thu ngân
  const handleFinishPayment = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, status: TableStatus.EMPTY, occupiedMinutes: 0, totalAmount: 0 }
          : t
      )
    );
  };

  // Computed values
  const occupiedCount = tables.filter((t) => t.status !== TableStatus.EMPTY).length;
  const emptyCount = tables.length - occupiedCount;
  const waitingFoodCount = tables.filter((t) => t.status === TableStatus.WAITING_FOOD).length;
  const currentTotalRevenue = tables.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  return {
    handleTableClick,
    handleOrderSubmitted,
    handleFinishPayment,
    occupiedCount,
    emptyCount,
    waitingFoodCount,
    currentTotalRevenue,
  };
}
