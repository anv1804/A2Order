export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface CreateStaffPayload {
  storeId: string;
  name: string;
  email?: string;
  password?: string;
  pinCode?: string;
  role: string;
  isActive?: boolean;
}

export interface UpdateStaffPayload {
  name?: string;
  email?: string;
  role?: string;
  pinCode?: string;
  isActive?: boolean;
  storeId?: string;
}

export interface PendingOrderItem {
  id: string;
  dishId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category?: string;
  status: "PENDING_APPROVAL" | "COOKING" | "SERVED" | "CANCELLED";
}

export interface PendingOrder {
  orderId: string;
  storeId: string;
  tableId: string;
  tableCode: string;
  tableName: string;
  items: PendingOrderItem[];
  voucherCode?: string;
  discountAmount?: number;
  customerPhone?: string;
  totalAmount: number;
  finalAmount: number;
  submittedAt: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
}
