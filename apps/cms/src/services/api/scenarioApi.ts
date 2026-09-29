import { requestApi } from "./apiClient";
import { BusinessScenarioTemplate, BusinessType } from "@a2order/shared";

export const scenarioApi = {
  /**
   * Lấy danh sách 8 kịch bản F&B mẫu
   */
  async getAll(): Promise<BusinessScenarioTemplate[]> {
    return requestApi<BusinessScenarioTemplate[]>("/scenarios");
  },

  /**
   * Lấy chi tiết kịch bản theo businessType
   */
  async getByType(type: BusinessType): Promise<BusinessScenarioTemplate> {
    return requestApi<BusinessScenarioTemplate>(`/scenarios/${type}`);
  },

  /**
   * Áp dụng kịch bản vào menu quán (ghi đè hoặc thêm dồn)
   */
  async applyToStore(
    type: BusinessType,
    storeId: string,
    mode: "REPLACE" | "APPEND" = "REPLACE"
  ): Promise<{ dishes: any[]; appliedCount: number; message: string }> {
    return requestApi(`/scenarios/${type}/apply/${storeId}`, {
      method: "POST",
      body: JSON.stringify({ mode }),
    });
  },

  /**
   * Thêm món mẫu vào kịch bản F&B đề xuất (SuperAdmin)
   */
  async addDishTemplate(type: BusinessType, dish: any): Promise<any> {
    return requestApi(`/scenarios/${type}/dishes`, {
      method: "POST",
      body: JSON.stringify(dish),
    });
  },

  /**
   * Sửa món mẫu trong kịch bản F&B đề xuất (SuperAdmin)
   */
  async updateDishTemplate(type: BusinessType, dishId: string, dish: any): Promise<any> {
    return requestApi(`/scenarios/${type}/dishes/${dishId}`, {
      method: "PUT",
      body: JSON.stringify(dish),
    });
  },

  /**
   * Xóa món mẫu khỏi kịch bản F&B đề xuất (SuperAdmin)
   */
  async deleteDishTemplate(type: BusinessType, dishId: string): Promise<any> {
    return requestApi(`/scenarios/${type}/dishes/${dishId}`, {
      method: "DELETE",
    });
  },
};
