import { z } from "zod";
import { AppModule, PLAN_CONFIGS, APP_MODULE_CATALOG, DEFAULT_PERIOD_DISCOUNTS, DEFAULT_PROMO_VOUCHERS, calculateContractPrice, MoneySchema } from "@a2order/shared";
import type { PricingSystemConfig } from "@a2order/shared";
import type { Transaction } from "../../types/security.js";
import { prisma, applyScope } from "../../core/database/prismaClient.js";
import { AppError } from "../../core/security/errors.js";

export const PricingSchema = z.object({
  plans: z.array(z.object({ id: z.enum(["STARTER", "GROWTH", "PRO"]), name: z.string(), monthlyPrice: MoneySchema, maxTables: z.number().int().min(1).max(10000), maxStaff: z.number().int().min(1).max(10000), includedModules: z.array(z.nativeEnum(AppModule)).min(1), description: z.string(), targetAudience: z.string(), comparisonHighlights: z.array(z.string()), badge: z.string().optional() })).min(1),
  modules: z.array(z.object({ id: z.nativeEnum(AppModule), name: z.string(), monthlyPrice: MoneySchema, description: z.string(), isCore: z.boolean().optional(), category: z.enum(["OPERATION", "ADDON"]).optional() })).min(1),
  periodDiscounts: z.array(z.object({ durationMonths: z.number().int().min(1).max(120), discountPercent: z.number().min(0).max(100), label: z.string() })),
  vouchers: z.array(z.object({ id: z.string(), code: z.string().min(1), discountType: z.enum(["PERCENT", "FIXED_AMOUNT"]), discountValue: MoneySchema, minContractMonths: z.number().int().min(1), validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), usageCount: z.number().int().min(0), maxUsage: z.number().int().min(0), isActive: z.boolean() })),
}).superRefine((value, ctx) => {
  for (const [key, list] of [["plans", value.plans], ["modules", value.modules], ["vouchers", value.vouchers]] as const) if (new Set(list.map(i => i.id)).size !== list.length) ctx.addIssue({ code: "custom", message: "Mã bị trùng trong " + key });
  for (const voucher of value.vouchers) if (voucher.discountType === "PERCENT" && voucher.discountValue > 100) ctx.addIssue({ code: "custom", message: "Giảm phần trăm không được vượt 100" });
  if (new Set(value.vouchers.map(v => v.code.trim().toUpperCase())).size !== value.vouchers.length) ctx.addIssue({ code: "custom", message: "Mã voucher bị trùng" });
});

export async function reserveSubscriptionQuote(tx: Transaction, body: unknown) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('a2order:subscription-pricing'))`;
  const input = SubscriptionQuoteSchema.parse(body);
  const quote = await subscriptionQuote(tx, input);
  if (input.voucherCode) {
    const config = await getPricingConfig(tx);
    const voucher = config.vouchers.find(v => v.code.toUpperCase() === input.voucherCode!.toUpperCase())!;
    voucher.usageCount++;
    await tx.$executeRaw`SELECT set_config('app.system', 'true', true)`;
    await tx.systemConfig.upsert({ where: { key: "pricing_vouchers" }, create: { key: "pricing_vouchers", value: JSON.stringify(config.vouchers), category: "PRICING" }, update: { value: JSON.stringify(config.vouchers) } });
    await applyScope(tx);
  }
  return quote;
}

export async function releaseSubscriptionVoucher(tx: Transaction, code: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('a2order:subscription-pricing'))`;
  const config = await getPricingConfig(tx);
  const voucher = config.vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
  if (!voucher) return;
  voucher.usageCount = Math.max(0, voucher.usageCount - 1);
  await tx.$executeRaw`SELECT set_config('app.system', 'true', true)`;
  await tx.systemConfig.upsert({ where: { key: "pricing_vouchers" }, create: { key: "pricing_vouchers", value: JSON.stringify(config.vouchers), category: "PRICING" }, update: { value: JSON.stringify(config.vouchers) } });
  await applyScope(tx);
}

export async function getPricingConfig(db: Pick<Transaction, "systemConfig"> = prisma): Promise<PricingSystemConfig> {
  const rows = await db.systemConfig.findMany({ where: { key: { in: ["pricing_plans", "pricing_modules", "pricing_discounts", "pricing_vouchers"] } } });
  const read = (key: string, fallback: unknown) => { const row = rows.find(r => r.key === key); return row ? JSON.parse(row.value) : fallback; };
  const rawPlans = read("pricing_plans", Object.values(PLAN_CONFIGS));
  return PricingSchema.parse({ plans: Array.isArray(rawPlans) ? rawPlans : Object.values(rawPlans), modules: read("pricing_modules", APP_MODULE_CATALOG), periodDiscounts: read("pricing_discounts", DEFAULT_PERIOD_DISCOUNTS), vouchers: read("pricing_vouchers", DEFAULT_PROMO_VOUCHERS) });
}

export const SubscriptionQuoteSchema = z.object({ selectedModules: z.array(z.nativeEnum(AppModule)).min(1).max(20), durationMonths: z.number().int().min(1).max(120), voucherCode: z.string().max(50).optional() });

export async function subscriptionQuote(db: Pick<Transaction, "systemConfig">, body: unknown) {
  const input = SubscriptionQuoteSchema.parse(body);
  const selectedModules = [...new Set(input.selectedModules)];
  if (!selectedModules.includes(AppModule.CORE_POS)) throw new AppError(400, "Gói phải có Core POS");
  const config = await getPricingConfig(db);
  if (selectedModules.some(id => !config.modules.some(m => m.id === id))) throw new AppError(400, "Module không có trong bảng giá hiện hành");
  const voucher = input.voucherCode ? config.vouchers.find(v => v.code.toUpperCase() === input.voucherCode!.toUpperCase()) : undefined;
  if (input.voucherCode && (!voucher || !voucher.isActive || new Date(voucher.validUntil + "T23:59:59+07:00") < new Date() || voucher.usageCount >= voucher.maxUsage || input.durationMonths < voucher.minContractMonths)) throw new AppError(400, "Voucher không hợp lệ hoặc đã hết hạn");
  const result = calculateContractPrice(selectedModules, input.durationMonths, voucher, config.modules, config.periodDiscounts);
  return { ...result, selectedModules, durationMonths: input.durationMonths, monthlyTotal: result.monthlySum, discountPercent: result.periodDiscountPercent, discountAmount: result.periodDiscountAmount + result.voucherDiscountAmount, finalAmount: result.finalTotal, breakdown: selectedModules.map(id => config.modules.find(m => m.id === id)!) };
}

export function addMonths(date: Date, months: number) {
  const value = new Date(date);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + months);
  const end = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
  value.setUTCDate(Math.min(day, end));
  return value;
}
