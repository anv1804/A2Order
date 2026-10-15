import { TableItem } from "./table.types.js";
import { MenuItemData, MenuDishItem } from "./menu.types.js";
import { IconName } from "./icon.types.js";

export type OrderStepType = "TABLE_INFO" | "SELECT_MENU" | "REVIEW_CART";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedVariant?: string;
  selectedOptions?: string[];
}

export interface SelectedDishItem {
  id: string;
  dish: MenuDishItem;
  quantity: number;
  notes: string;
  selectedVariant?: string;
  selectedOptions?: string[];
  unitPrice?: number;
}

export interface CartDrawerProps {
  tableName: string;
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSubmitOrder: () => void;
}

export interface CartSidebarProps {
  orderList: SelectedDishItem[];
  totalQuantity: number;
  totalAmount: number;
  onIncreaseQuantity: (itemId: string) => void;
  onDecreaseQuantity: (itemId: string) => void;
  onSetNote: (itemId: string, note: string) => void;
  onClearAll: () => void;
  activeNoteItemId: string | null;
  setActiveNoteItemId: (itemId: string | null) => void;
  onOpenDishDetail?: (dish: MenuDishItem, existingItem?: SelectedDishItem) => void;
  onGoToReview: () => void;
  onGoToTableInfo: () => void;
}

export interface OrderStepNavProps {
  orderStep: OrderStepType;
  setOrderStep: (step: OrderStepType) => void;
  totalQuantity: number;
  totalAmount: number;
}

export interface DishCardProps {
  dish: MenuDishItem;
  totalQuantityInCart: number;
  distinctCount: number;
  latestNote?: string;
  latestVariant?: string;
  onQuickAdd: (dish: MenuDishItem) => void;
  onQuickDecrease: (dish: MenuDishItem) => void;
  onOpenDetail: (dish: MenuDishItem) => void;
}

export interface DishDetailModalPayload {
  dish: MenuDishItem;
  quantity: number;
  notes: string;
  selectedVariant?: string;
  selectedOptions?: string[];
  priceWithExtras: number;
}

export interface DishDetailModalProps {
  isOpen: boolean;
  dish: MenuDishItem | null;
  initialQuantity?: number;
  initialNotes?: string;
  initialVariant?: string;
  initialOptions?: string[];
  onClose: () => void;
  onConfirm: (payload: DishDetailModalPayload) => void;
}

export interface OrderReviewStepProps {
  table: TableItem;
  orderList: SelectedDishItem[];
  totalQuantity: number;
  totalAmount: number;
  onGoBackToMenu: () => void;
  onConfirmSubmit: () => void;
}

export interface OrderMenuDetailContext {
  dish: MenuDishItem;
  editingItemId?: string;
}

export interface OrderMenuModalProps {
  isOpen: boolean;
  table: TableItem | null;
  onClose: () => void;
  onSubmitOrder: (tableName: string, items: CartItem[]) => void;
}


export interface CustomerMenuItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
}

export interface CustomerCategory {
  id: string;
  name: string;
  menuItems: CustomerMenuItem[];
}

export interface CustomerCartItem {
  menuItem: CustomerMenuItem;
  quantity: number;
  notes?: string;
}

export interface CustomerOrderedItem {
  id: string;
  dishId?: string;
  name: string;
  price: number;
  quantity: number;
  status: "PENDING_APPROVAL" | "COOKING" | "SERVED" | "CANCELLED";
  orderId?: string;
  orderedAt: string;
  notes?: string;
}

export interface VoucherItem {
  code: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  description: string;
  minOrder?: number;
}

export interface ServiceOptionItem {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
}

