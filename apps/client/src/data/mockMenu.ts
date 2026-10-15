import { MenuItemData, MenuDishItem } from "@/types";

/**
 * ĐÃ CHUYỂN TOÀN BỘ VÀO POSTGRESQL DATABASE & MENU API
 * Tải thực đơn động qua:
 * import { menuApi } from "@/services/api/menuApi";
 */
export const INITIAL_MENU: (MenuItemData & { category: string })[] = [];

export { QUICK_NOTES } from "./menuConstants";

export const MENU_DATABASE: MenuDishItem[] = [];
