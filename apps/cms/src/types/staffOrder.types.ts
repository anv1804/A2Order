import type {
  WaiterOrderItem,
  WaiterTableOrder,
  OrderSurcharge,
  OrderDiscount,
  PendingSessionRequest,
  StaffOrderDishItem as DishItem,
} from "./cms.types";

export interface NewOrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  modifiers?: string[];
}

export interface StaffOrderTableListProps {
  tables: WaiterTableOrder[];
  activeTableId: string;
  setActiveTableId: (id: string) => void;
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  pendingRequests: PendingSessionRequest[];
  isApprovingId: string | null;
  onApproveSession: (req: PendingSessionRequest) => Promise<void>;
  onNavigateTab?: (tab: string) => void;
  setMobileStep: (step: "TABLES" | "MENU" | "CART") => void;
  formatTableName: (name?: string) => string;
}

export interface StaffOrderMenuSectionProps {
  activeTable: WaiterTableOrder;
  dishes: DishItem[];
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  newOrderCart: NewOrderItem[];
  onQuickAddDish: (dish: DishItem) => void;
  onOpenCustomize: (dish: DishItem) => void;
  mobileStep: "TABLES" | "MENU" | "CART";
  setMobileStep: (step: "TABLES" | "MENU" | "CART") => void;
}

export interface StaffOrderCartSectionProps {
  activeTable: WaiterTableOrder;
  activeTab: "MENU" | "SERVED_ITEMS";
  setActiveTab: (tab: "MENU" | "SERVED_ITEMS") => void;
  newOrderCart: NewOrderItem[];
  setNewOrderCart: React.Dispatch<React.SetStateAction<NewOrderItem[]>>;
  cartTotalAmount: number;
  cartTotalQuantity: number;
  foodTotalAmount: number;
  surchargesTotalAmount: number;
  discountTotalAmount: number;
  finalPayableAmount: number;
  isSubmittingOrder: boolean;
  onSendToKitchen: () => void;
  onUpdateCartQuantity: (index: number, delta: number) => void;
  onCloseTableSession: (tableId: string, tableName: string) => void;
  onRotateTablePin: (tableId: string, tableName: string) => void;
  onOpenManualTableModal: () => void;
  onCancelWaitingItem: (itemIndex: number) => void;
  onOpenVoidCooking: (itemIndex: number) => void;
  onOpenServedAction: (itemIndex: number) => void;
  onOpenSplitBill: () => void;
  onOpenTransferTable: () => void;
  onOpenSurchargeModal: () => void;
  onOpenOfflineModal: () => void;
  onRequestBill: () => void;
  onNavigateTab?: (tab: string) => void;
  setMobileStep: (step: "TABLES" | "MENU" | "CART") => void;
  formatElapsed: (openedAtMs?: number) => string;
  currentRole?: string;
  isCashier?: boolean;
}
