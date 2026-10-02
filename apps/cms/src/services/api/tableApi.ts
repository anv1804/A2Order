import { requestApi } from "./apiClient";
import { TableZoneData } from "@/types/cms.types";

export const tableApi = {
  /**
   * Lấy sơ đồ bàn & khu vực từ Database theo storeId
   */
  async getTableZones(storeId: string): Promise<TableZoneData[]> {
    const res = await requestApi<any>(`/tables/${storeId}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  /**
   * Tạo khu vực mới trong Database
   */
  async createZone(storeId: string, name: string): Promise<any> {
    return requestApi(`/tables/${storeId}/zones`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  /**
   * Đổi tên khu vực
   */
  async updateZone(storeId: string, zoneId: string, name: string): Promise<any> {
    return requestApi(`/tables/${storeId}/zones/${zoneId}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  },

  /**
   * Xóa khu vực
   */
  async deleteZone(storeId: string, zoneId: string): Promise<any> {
    return requestApi(`/tables/${storeId}/zones/${zoneId}`, {
      method: "DELETE",
    });
  },

  /**
   * Thêm bàn ăn mới vào khu vực trong Database
   */
  async createTable(storeId: string, zoneId: string, name: string, code?: string): Promise<any> {
    return requestApi(`/tables/${storeId}/tables`, {
      method: "POST",
      body: JSON.stringify({ zoneId, name, code }),
    });
  },

  /**
   * Cập nhật thông tin bàn ăn (tên bàn, mã bàn, khu vực, trạng thái)
   */
  async updateTable(
    storeId: string,
    tableId: string,
    data: { name?: string; code?: string; status?: string; zoneId?: string }
  ): Promise<any> {
    return requestApi(`/tables/${storeId}/tables/${tableId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Xóa bàn ăn
   */
  async deleteTable(storeId: string, tableId: string): Promise<any> {
    return requestApi(`/tables/${storeId}/tables/${tableId}`, {
      method: "DELETE",
    });
  },

  /**
   * Kiểm tra phiên bàn cho khách quét QR
   */
  async checkTableSession(storeId: string, tableCode: string): Promise<any> {
    return requestApi(`/tables/${storeId}/session/${encodeURIComponent(tableCode)}`);
  },

  /**
   * Khách gửi yêu cầu mở bàn
   */
  async requestTableSession(
    storeId: string,
    data: { tableId?: string; tableCode?: string; guestCount?: number }
  ): Promise<any> {
    return requestApi(`/tables/${storeId}/session/request`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Nhân viên duyệt mở bàn
   */
  async approveTableSession(storeId: string, tableId: string, guestCount?: number): Promise<any> {
    return requestApi(`/tables/${storeId}/session/approve`, {
      method: "POST",
      body: JSON.stringify({ tableId, guestCount }),
    });
  },

  /**
   * Nhân viên từ chối yêu cầu mở bàn
   */
  async rejectTableSession(storeId: string, tableId: string, reason?: string): Promise<any> {
    return requestApi(`/tables/${storeId}/session/reject`, {
      method: "POST",
      body: JSON.stringify({ tableId, reason }),
    });
  },

  /**
   * Đóng phiên bàn khi thanh toán / dọn bàn
   */
  async closeTableSession(storeId: string, tableId: string): Promise<any> {
    return requestApi(`/tables/${storeId}/session/close`, {
      method: "POST",
      body: JSON.stringify({ tableId }),
    });
  },

  /**
   * Lấy danh sách yêu cầu mở bàn đang chờ duyệt
   */
  async getPendingRequests(storeId: string): Promise<any> {
    return requestApi(`/tables/${storeId}/pending-requests`);
  },

  /**
   * Khách tự mở bàn bằng mã PIN bảo mật
   */
  async unlockWithPin(
    storeId: string,
    data: { tableId?: string; tableCode?: string; pin: string; guestCount?: number }
  ): Promise<any> {
    return requestApi(`/tables/${storeId}/session/unlock-pin`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Xoay mã PIN mới cho bàn theo yêu cầu
   */
  async rotatePin(storeId: string, tableId: string): Promise<any> {
    return requestApi(`/tables/${storeId}/tables/${tableId}/rotate-pin`, {
      method: "POST",
    });
  },

  /**
   * Khách gửi yêu cầu hỗ trợ nhanh (đá, giấy, dọn bàn...)
   */
  async sendServiceRequest(
    storeId: string,
    data: { tableId?: string; tableCode?: string; tableName?: string; type: string; note?: string }
  ): Promise<any> {
    return requestApi(`/tables/${storeId}/service-request`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Khách hủy món chưa chế biến
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
