import { requestApi } from "./apiClient";
import { PlatformStoreUserRecord, CreateStaffPayload, UpdateStaffPayload, PasswordResetRequest } from "@/types";


export const staffApi = {
  async getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    return requestApi<PasswordResetRequest[]>("/staff/password-reset-requests");
  },
  /**
   * Lấy danh sách toàn bộ tài khoản user quán
   */
  async getStaff(params?: {
    storeId?: string;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<PlatformStoreUserRecord[]> {
    const query = new URLSearchParams();
    if (params?.storeId) query.append("storeId", params.storeId);
    if (params?.role) query.append("role", params.role);
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    return requestApi<PlatformStoreUserRecord[]>(`/staff${qs}`);
  },

  /**
   * Tạo tài khoản mới
   */
  async createStaff(payload: CreateStaffPayload): Promise<PlatformStoreUserRecord> {
    return requestApi<PlatformStoreUserRecord>("/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cập nhật thông tin tài khoản
   */
  async updateStaff(id: string, payload: UpdateStaffPayload): Promise<PlatformStoreUserRecord> {
    return requestApi<PlatformStoreUserRecord>(`/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Khóa hoặc mở khóa tài khoản
   */
  async toggleStaffStatus(id: string): Promise<{ id: string; isActive: boolean }> {
    return requestApi<{ id: string; isActive: boolean }>(`/staff/${id}/toggle-status`, {
      method: "PATCH",
    });
  },

  /**
   * Đặt lại mật khẩu hoặc mã PIN
   */
  async resetCredentials(id: string, payload: { password?: string; pinCode?: string }): Promise<{ success: boolean; message: string }> {
    return requestApi<{ success: boolean; message: string }>(`/staff/${id}/reset-credentials`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Xóa tài khoản
   */
  async deleteStaff(id: string): Promise<{ success: boolean; message: string }> {
    return requestApi<{ success: boolean; message: string }>(`/staff/${id}`, {
      method: "DELETE",
    });
  },
};
