import { requestApi } from "./apiClient";

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

export const orderApi = {
  /**
   * Khách hàng gửi đơn hàng (chờ quán duyệt vào bếp)
   */
  async submitOrder(data: {
    storeId: string;
    tableId: string;
    tableCode?: string;
    tableName?: string;
    items: Array<{
      dishId?: string;
      name: string;
      price: number;
      quantity: number;
      notes?: string;
      category?: string;
    }>;
    voucherCode?: string;
    discountAmount?: number;
    customerPhone?: string;
    totalAmount: number;
    notes?: string;
  }): Promise<PendingOrder> {
    return requestApi("/orders/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Lấy danh sách đơn hàng chờ duyệt của quán
   */
  async getPendingOrders(storeId: string): Promise<PendingOrder[]> {
    const res = await requestApi<any>(`/orders/${storeId}/pending`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  /**
   * Nhân viên duyệt đơn vào bếp
   */
  async approveOrder(storeId: string, orderId: string): Promise<any> {
    return requestApi(`/orders/${storeId}/${orderId}/approve`, {
      method: "POST",
    });
  },

  /**
   * Nhân viên từ chối đơn hàng
   */
  async rejectOrder(storeId: string, orderId: string, reason?: string): Promise<any> {
    return requestApi(`/orders/${storeId}/${orderId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Khách hàng hủy món khi chưa chế biến (PENDING_APPROVAL)
   */
  async cancelOrderItem(
    storeId: string,
    data: { orderId?: string; itemId: string; tableId: string }
  ): Promise<any> {
    return requestApi(`/orders/${storeId}/cancel-item`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
