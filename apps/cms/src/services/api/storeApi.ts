import { requestApi } from "./apiClient";
import { TenantStoreRecord, SoftwareInvoiceRecord, AppModule } from "@a2order/shared";

export const storeApi = {
  /**
   * Lấy danh sách toàn bộ các quán
   */
  async getStores(): Promise<TenantStoreRecord[]> {
    return requestApi<TenantStoreRecord[]>("/stores");
  },

  /**
   * Lấy chi tiết 1 quán
   */
  async getStoreById(storeId: string): Promise<TenantStoreRecord> {
    return requestApi<TenantStoreRecord>(`/stores/${storeId}`);
  },

  /**
   * Đăng ký quán mới
   */
  async createStore(data: Partial<TenantStoreRecord>): Promise<TenantStoreRecord> {
    return requestApi("/stores", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Cập nhật thông tin quán
   */
  async updateStore(storeId: string, data: Partial<TenantStoreRecord>): Promise<{ message: string; data: TenantStoreRecord }> {
    return requestApi(`/stores/${storeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Xuất bản cấu hình quán cho POS
   */
  async publishStoreConfig(storeId: string): Promise<{ success: boolean; configVersion: string; message: string }> {
    return requestApi(`/stores/${storeId}/publish`, {
      method: "POST",
    });
  },

  /**
   * Lấy danh sách toàn bộ License
   */
  async getLicenses(): Promise<any[]> {
    return requestApi<any[]>("/licenses");
  },

  /**
   * Cấp mới License
   */
  async createLicense(data: any): Promise<any> {
    return requestApi("/licenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Gia hạn License
   */
  async renewLicense(keyCode: string, durationMonths: number = 12): Promise<any> {
    return requestApi(`/licenses/${keyCode}/renew`, {
      method: "POST",
      body: JSON.stringify({ durationMonths }),
    });
  },

  async revokeLicense(keyCode: string): Promise<any> {
    return requestApi(`/licenses/${encodeURIComponent(keyCode)}/revoke`, { method: "POST" });
  },

  /**
   * Lấy danh sách toàn bộ hóa đơn phần mềm
   */
  async getInvoices(): Promise<SoftwareInvoiceRecord[]> {
    return requestApi<SoftwareInvoiceRecord[]>("/licenses/invoices/all");
  },

  /** Confirm a subscription invoice and extend its license on the server. */
  async confirmInvoicePayment(invoiceId: string): Promise<{ success: boolean; newEndDate: string; message: string }> {
    return requestApi(`/licenses/invoice/${encodeURIComponent(invoiceId)}/confirm-payment`, {
      method: "POST",
    });
  },

  async createSubscriptionInvoice(data: {
    storeId: string;
    durationMonths: number;
    amount: number;
    enabledModules: AppModule[];
  }): Promise<{ success: boolean; message: string; invoice: unknown }> {
    return requestApi("/licenses/invoice/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Giám sát hạ tầng & telemetry
   */
  async getTelemetryStatus(): Promise<any> {
    return requestApi("/stores/telemetry/system-status");
  },
};
