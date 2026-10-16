import type { FastifyPluginAsync } from "fastify";
import { PLAN_CONFIGS, APP_MODULE_CATALOG, DEFAULT_PERIOD_DISCOUNTS, DEFAULT_PROMO_VOUCHERS } from "@a2order/shared";
import { prisma } from "../../core/database/prismaClient.js";
import { currentStore } from "../../core/security/access.js";
import { command } from "../../core/security/commands.js";
import { AppError } from "../../core/security/errors.js";
import { getPricingConfig, PricingSchema } from "./pricing.service.js";

export const getOrSeedPricingConfig = getPricingConfig;
export const configRoutes: FastifyPluginAsync = async app => {
  app.get("/pricing", async () => ({ success: true, data: await getPricingConfig() }));
  app.put("/pricing", async request => {
    const data = await command(request, currentStore(request), "PRICING_UPDATE", async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('a2order:subscription-pricing'))`;
      const existing = await getPricingConfig(tx);
      const config = PricingSchema.parse({ ...existing, ...(request.body as object) });
      for (const row of config.vouchers) row.usageCount = existing.vouchers.find(v => v.id === row.id)?.usageCount || 0;
      if (existing.vouchers.some(v => v.usageCount && !config.vouchers.some(row => row.id === v.id && row.code.toUpperCase() === v.code.toUpperCase()))) throw new AppError(409, "Không thể xóa hoặc đổi mã voucher đã sử dụng");
      for (const [key, value] of Object.entries({ pricing_plans: config.plans, pricing_modules: config.modules, pricing_discounts: config.periodDiscounts, pricing_vouchers: config.vouchers })) await tx.systemConfig.upsert({ where: { key }, create: { key, value: JSON.stringify(value), category: "PRICING" }, update: { value: JSON.stringify(value) } });
      return config;
    });
    return { success: true, data };
  });
  app.post("/pricing/reset", async request => {
    const data = await command(request, currentStore(request), "PRICING_RESET", async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('a2order:subscription-pricing'))`;
      if ((await getPricingConfig(tx)).vouchers.some(v => v.usageCount)) throw new AppError(409, "Không thể đặt lại bảng giá khi voucher đã được sử dụng");
      for (const [key, value] of Object.entries({ pricing_plans: Object.values(PLAN_CONFIGS), pricing_modules: APP_MODULE_CATALOG, pricing_discounts: DEFAULT_PERIOD_DISCOUNTS, pricing_vouchers: DEFAULT_PROMO_VOUCHERS })) await tx.systemConfig.upsert({ where: { key }, create: { key, value: JSON.stringify(value), category: "PRICING" }, update: { value: JSON.stringify(value) } });
      return getPricingConfig(tx);
    });
    return { success: true, data };
  });
  app.get("/key/:key", async request => {
    const { key } = request.params as { key: string };
    if (!["pricing_plans", "pricing_modules", "pricing_discounts", "pricing_vouchers"].includes(key)) throw new AppError(404, "Không tìm thấy cấu hình");
    return { success: true, data: await prisma.systemConfig.findUnique({ where: { key } }) };
  });
};
