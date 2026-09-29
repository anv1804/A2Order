import { requestApi } from "./apiClient";
import { FnbDishItem } from "@a2order/shared";

export const menuApi = {
  /**
   * Lấy danh sách món ăn theo quán
   */
  async getDishes(storeId: string): Promise<FnbDishItem[]> {
    return requestApi<FnbDishItem[]>(`/menu/${storeId}`);
  },

  /**
   * Lấy chi tiết món ăn
   */
  async getDish(storeId: string, dishId: string): Promise<FnbDishItem> {
    return requestApi<FnbDishItem>(`/menu/${storeId}/dishes/${dishId}`);
  },

  /**
   * Thêm món mới vào menu
   */
  async createDish(storeId: string, dish: Partial<FnbDishItem>): Promise<FnbDishItem> {
    return requestApi<FnbDishItem>(`/menu/${storeId}/dishes`, {
      method: "POST",
      body: JSON.stringify(dish),
    });
  },

  /**
   * Cập nhật món ăn
   */
  async updateDish(storeId: string, dishId: string, dish: Partial<FnbDishItem>): Promise<FnbDishItem> {
    return requestApi<FnbDishItem>(`/menu/${storeId}/dishes/${dishId}`, {
      method: "PUT",
      body: JSON.stringify(dish),
    });
  },

  /**
   * Cập nhật tồn kho món ăn
   */
  async updateStock(
    storeId: string,
    dishId: string,
    stockCount: number | null,
    isAvailable?: boolean
  ): Promise<FnbDishItem> {
    return requestApi<FnbDishItem>(`/menu/${storeId}/dishes/${dishId}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stockCount, isAvailable }),
    });
  },

  /**
   * Xóa món ăn khỏi menu
   */
  async deleteDish(storeId: string, dishId: string): Promise<{ success: boolean }> {
    return requestApi<{ success: boolean }>(`/menu/${storeId}/dishes/${dishId}`, {
      method: "DELETE",
    });
  },
};
