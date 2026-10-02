import { requestApi } from "./apiClient";
import { PricingSystemConfig, PlanConfig, ModulePricingInfo, PeriodDiscountRule, PromoVoucher } from "@a2order/shared";

export const configApi = {
  /**
   * Lấy toàn bộ cấu hình bảng giá từ Database (plans, modules, periodDiscounts, vouchers)
   */
  async getPricingConfig(): Promise<PricingSystemConfig> {
    return requestApi<PricingSystemConfig>("/config/pricing");
  },

  /**
   * Lưu cập nhật cấu hình bảng giá vào Database
   */
  async updatePricingConfig(data: Partial<PricingSystemConfig>): Promise<PricingSystemConfig> {
    return requestApi<PricingSystemConfig>("/config/pricing", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Khôi phục cấu hình bảng giá mặc định chuẩn
   */
  async resetPricingConfig(): Promise<PricingSystemConfig> {
    return requestApi<PricingSystemConfig>("/config/pricing/reset", {
      method: "POST",
    });
  },
};
