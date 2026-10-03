import { requestApi } from "./apiClient";

export interface CreateBillPayload {
  storeId: string;
  tableId: string;
  orderSessionId?: string;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  paymentMethod?: "CASH" | "VIETQR" | "CARD";
  transactionCode?: string;
}

export interface BillRecord {
  id: string;
  storeId: string;
  orderSessionId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionCode?: string;
  createdAt: string;
}

export const billingApi = {
  /**
   * Tạo mã VietQR động chuẩn Napas 247
   */
  async generateVietQr(data: {
    storeId: string;
    tableId?: string;
    tableName?: string;
    amount: number;
    orderSessionId?: string;
  }): Promise<{
    success: boolean;
    qrUrl: string;
    bankBin: string;
    bankAccount: string;
    bankOwnerName: string;
    amount: number;
    addInfo: string;
  }> {
    return requestApi("/billing/generate-vietqr", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Tạo hóa đơn và lưu doanh thu xuống Database PostgreSQL (Prisma)
   */
  async createBill(data: CreateBillPayload): Promise<{ success: boolean; data: BillRecord }> {
    return requestApi("/billing/create-bill", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Lấy lịch sử hóa đơn thanh toán của quán
   */
  async getBillHistory(storeId: string, limit = 30): Promise<{ success: boolean; data: BillRecord[] }> {
    return requestApi(`/billing/${storeId}/history?limit=${limit}`);
  },
};
