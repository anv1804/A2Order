import { checkLicense } from "../order/order.service.js";
import type { Prisma, MenuItem, Category } from "@prisma/client";
import { MenuInputSchema } from "@a2order/shared";
import type { FnbDishItem } from "@a2order/shared";
import type { Transaction } from "../../types/security.js";
import { requireValue } from "../../core/security/errors.js";

export function menuView(item: MenuItem & { category: Category }): FnbDishItem {
  return { id: item.id, name: item.name, category: item.category.name, price: item.price, costPrice: item.costPrice, station: item.station as FnbDishItem["station"], isAvailable: item.isAvailable && item.stockCount !== 0, stockCount: item.stockCount ?? undefined, image: item.image || undefined, description: item.description || undefined, isBestSeller: item.isBestSeller, variants: item.variants as unknown as FnbDishItem["variants"], modifiers: item.modifiers as unknown as FnbDishItem["modifiers"], customizationGroups: item.customizationGroups as unknown as FnbDishItem["customizationGroups"], majorCategory: item.majorCategory as FnbDishItem["majorCategory"], subCategory: item.subCategory || undefined };
}

export async function saveDish(tx: Transaction, storeId: string, body: unknown, id?: string) {
  await checkLicense(tx, storeId);
  const input = id ? MenuInputSchema.partial().parse(body) : MenuInputSchema.parse(body);
  if (id) requireValue(await tx.menuItem.findFirst({ where: { id, storeId, archivedAt: null } }));
  let categoryId: string | undefined;
  if (input.category) {
    const category = await tx.category.findFirst({ where: { storeId, name: input.category } }) || await tx.category.create({ data: { storeId, name: input.category } });
    categoryId = category.id;
  }
  if (input.modifiers?.length && !input.customizationGroups?.length) input.customizationGroups = [{ id: "legacy-modifiers", name: "Tùy chọn thêm", type: "MULTIPLE", options: input.modifiers.map((m, i) => ({ id: "modifier-" + i, name: m.name, priceModifier: m.price })) }];
  const { category: _category, ...values } = input;
  const data = { ...values, variants: input.variants as Prisma.InputJsonValue | undefined, modifiers: input.modifiers as Prisma.InputJsonValue | undefined, customizationGroups: input.customizationGroups as Prisma.InputJsonValue | undefined, categoryId };
  const item = id
    ? await tx.menuItem.update({ where: { id_storeId: { id, storeId } }, data, include: { category: true } })
    : await tx.menuItem.create({ data: { ...data, name: input.name!, price: input.price!, categoryId: categoryId!, storeId }, include: { category: true } });
  await tx.store.update({ where: { id: storeId }, data: { configVersion: "v-" + crypto.randomUUID() } });
  return menuView(item);
}
