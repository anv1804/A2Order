import { FnbDishItem } from "@a2order/shared";
export { INITIAL_CATEGORIES } from "./categories";
export { FOOD_TEMPLATE_DISHES } from "./foodDishes";
export { CAFE_TEA_TEMPLATE_DISHES } from "./cafeTeaDishes";
export { SOFT_DRINK_TEMPLATE_DISHES } from "./softDrinkDishes";
export { BEER_TEMPLATE_DISHES } from "./beerDishes";
export { ENERGY_WATER_TEMPLATE_DISHES } from "./energyWaterDishes";
export { DESSERT_TEMPLATE_DISHES } from "./dessertDishes";

import { FOOD_TEMPLATE_DISHES } from "./foodDishes";
import { CAFE_TEA_TEMPLATE_DISHES } from "./cafeTeaDishes";
import { SOFT_DRINK_TEMPLATE_DISHES } from "./softDrinkDishes";
import { BEER_TEMPLATE_DISHES } from "./beerDishes";
import { ENERGY_WATER_TEMPLATE_DISHES } from "./energyWaterDishes";
import { DESSERT_TEMPLATE_DISHES } from "./dessertDishes";

/**
 * Tổng hợp toàn bộ thực đơn mẫu F&B chuẩn hóa theo 3 Trụ Cột (FOOD | DRINK | DESSERT)
 */
export const INITIAL_TEMPLATE_DISHES: FnbDishItem[] = [
  ...FOOD_TEMPLATE_DISHES,
  ...CAFE_TEA_TEMPLATE_DISHES,
  ...SOFT_DRINK_TEMPLATE_DISHES,
  ...BEER_TEMPLATE_DISHES,
  ...ENERGY_WATER_TEMPLATE_DISHES,
  ...DESSERT_TEMPLATE_DISHES,
];
