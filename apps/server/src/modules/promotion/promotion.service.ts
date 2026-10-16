import type { FoodPromotion } from "@a2order/shared";
import { PromotionSchema } from "@a2order/shared";
import type { Prisma } from "@prisma/client";
import type { Transaction } from "../../types/security.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { prisma } from "../../core/database/prismaClient.js";

export function promotionDate(value: string, end = false) {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : value.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (_m, day: string, month: string, year: string) => year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0"));
  const date = new Date(iso + (end ? "T23:59:59+07:00" : "T00:00:00+07:00"));
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime() + 25200000).toISOString().slice(0, 10) !== iso) throw new AppError(400, "Ngày khuyến mãi không hợp lệ");
  return date;
}
export function promotionActive(promotion: FoodPromotion, now = new Date()) {
  if (!promotion.isActive || now < promotionDate(promotion.startDate) || now > promotionDate(promotion.endDate, true) || promotion.usedCount >= promotion.usageLimit) return false;
  if (promotion.happyHourOnly) {
    const match = promotion.happyHourTimeRange?.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (!match) return false;
    const [, h1, m1, h2, m2] = match.map(Number), start = h1 * 60 + m1, end = h2 * 60 + m2;
    if (h1 > 23 || h2 > 23 || m1 > 59 || m2 > 59 || start === end) return false;
    const vn = new Date(now.getTime() + 25200000), minutes = vn.getUTCHours() * 60 + vn.getUTCMinutes();
    if (start < end ? minutes < start || minutes >= end : minutes < start && minutes >= end) return false;
  }
  return true;
}
export function promotionDiscount(promotion: FoodPromotion, subtotal: number) {
  if (subtotal < promotion.minOrderAmount) return 0;
  const discount = promotion.discountType === "PERCENTAGE" ? Math.round(subtotal * promotion.discountValue / 100) : promotion.discountValue;
  return Math.min(subtotal, discount, promotion.maxDiscountAmount ?? subtotal);
}
export function validatePromotions(value: unknown) {
  const rows = PromotionSchema.array().max(1000).parse(value);
  if (new Set(rows.map(r => r.code)).size !== rows.length || new Set(rows.map(r => r.id)).size !== rows.length) throw new AppError(400, "Mã khuyến mãi bị trùng");
  for (const row of rows) if (promotionDate(row.startDate) > promotionDate(row.endDate, true)) throw new AppError(400, "Ngày kết thúc phải sau ngày bắt đầu");
  return rows;
}
export async function takePromotion(tx: Transaction, storeId: string, code: string, subtotal: number) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${storeId + ":document:promotions_list"}))`;
  const doc = requireValue(await tx.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key: "promotions_list" } } }), "Voucher không tồn tại");
  const rows = validatePromotions(doc.data);
  const promotion = requireValue(rows.find(r => r.code === code.trim().toUpperCase()), "Voucher không tồn tại");
  if (!promotionActive(promotion)) throw new AppError(400, "Voucher hết hiệu lực hoặc hết lượt");
  const discountAmount = promotionDiscount(promotion, subtotal);
  if (!discountAmount) throw new AppError(400, "Đơn chưa đạt điều kiện khuyến mãi");
  promotion.usedCount++;
  await tx.workspaceDocument.update({ where: { storeId_key: { storeId, key: "promotions_list" } }, data: { data: rows as Prisma.InputJsonValue, version: { increment: 1 } } });
  return { promotion, discountAmount };
}
export async function releasePromotion(tx: Transaction, storeId: string, code: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${storeId + ":document:promotions_list"}))`;
  const doc = await tx.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key: "promotions_list" } } });
  if (!doc) return;
  const rows = validatePromotions(doc.data), promotion = rows.find(r => r.code === code);
  if (promotion) { promotion.usedCount = Math.max(0, promotion.usedCount - 1); await tx.workspaceDocument.update({ where: { storeId_key: { storeId, key: "promotions_list" } }, data: { data: rows as Prisma.InputJsonValue, version: { increment: 1 } } }); }
}
export async function publicPromotions(storeId: string) {
  const doc = await prisma.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key: "promotions_list" } } });
  return validatePromotions(doc?.data || []).filter(p => promotionActive(p)).map(p => ({ code: p.code, discountType: p.discountType === "PERCENTAGE" ? "PERCENT" : "FIXED", value: p.discountValue, description: p.description || p.title, minOrder: p.minOrderAmount, maxDiscount: p.maxDiscountAmount }));
}
