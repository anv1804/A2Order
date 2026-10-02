import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { prisma } from "../../core/database/prismaClient.js";
import {
  PLAN_CONFIGS,
  APP_MODULE_CATALOG,
  DEFAULT_PERIOD_DISCOUNTS,
  DEFAULT_PROMO_VOUCHERS,
  PricingSystemConfig,
  PlanConfig,
  ModulePricingInfo,
  PeriodDiscountRule,
  PromoVoucher,
} from "@a2order/shared";

const CONFIG_KEYS = {
  PLANS: "pricing_plans",
  MODULES: "pricing_modules",
  DISCOUNTS: "pricing_discounts",
  VOUCHERS: "pricing_vouchers",
} as const;

export async function getOrSeedPricingConfig(): Promise<PricingSystemConfig> {
  const [plansRow, modulesRow, discountsRow, vouchersRow] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: CONFIG_KEYS.PLANS } }),
    prisma.systemConfig.findUnique({ where: { key: CONFIG_KEYS.MODULES } }),
    prisma.systemConfig.findUnique({ where: { key: CONFIG_KEYS.DISCOUNTS } }),
    prisma.systemConfig.findUnique({ where: { key: CONFIG_KEYS.VOUCHERS } }),
  ]);

  let plans: PlanConfig[] = Object.values(PLAN_CONFIGS);
  let modules: ModulePricingInfo[] = APP_MODULE_CATALOG;
  let periodDiscounts: PeriodDiscountRule[] = DEFAULT_PERIOD_DISCOUNTS;
  let vouchers: PromoVoucher[] = DEFAULT_PROMO_VOUCHERS;

  const upsertPromises: Promise<any>[] = [];

  if (plansRow?.value) {
    try {
      const parsed = JSON.parse(plansRow.value);
      plans = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      // Fallback
    }
  } else {
    upsertPromises.push(
      prisma.systemConfig.upsert({
        where: { key: CONFIG_KEYS.PLANS },
        update: {},
        create: {
          key: CONFIG_KEYS.PLANS,
          value: JSON.stringify(Object.values(PLAN_CONFIGS)),
          category: "PRICING",
          description: "Cấu hình 3 gói phần mềm SaaS: STARTER, GROWTH, PRO",
        },
      })
    );
  }

  if (modulesRow?.value) {
    try {
      modules = JSON.parse(modulesRow.value);
    } catch {
      // Fallback
    }
  } else {
    upsertPromises.push(
      prisma.systemConfig.upsert({
        where: { key: CONFIG_KEYS.MODULES },
        update: {},
        create: {
          key: CONFIG_KEYS.MODULES,
          value: JSON.stringify(APP_MODULE_CATALOG),
          category: "PRICING",
          description: "Bảng giá mua lẻ từng module tính năng",
        },
      })
    );
  }

  if (discountsRow?.value) {
    try {
      periodDiscounts = JSON.parse(discountsRow.value);
    } catch {
      // Fallback
    }
  } else {
    upsertPromises.push(
      prisma.systemConfig.upsert({
        where: { key: CONFIG_KEYS.DISCOUNTS },
        update: {},
        create: {
          key: CONFIG_KEYS.DISCOUNTS,
          value: JSON.stringify(DEFAULT_PERIOD_DISCOUNTS),
          category: "PRICING",
          description: "Khung chiết khấu theo kỳ hạn thuê (6 tháng, 12 tháng, 24 tháng)",
        },
      })
    );
  }

  if (vouchersRow?.value) {
    try {
      vouchers = JSON.parse(vouchersRow.value);
    } catch {
      // Fallback
    }
  } else {
    upsertPromises.push(
      prisma.systemConfig.upsert({
        where: { key: CONFIG_KEYS.VOUCHERS },
        update: {},
        create: {
          key: CONFIG_KEYS.VOUCHERS,
          value: JSON.stringify(DEFAULT_PROMO_VOUCHERS),
          category: "PRICING",
          description: "Danh sách mã khuyến mại và voucher giảm giá",
        },
      })
    );
  }

  if (upsertPromises.length > 0) {
    await Promise.all(upsertPromises);
  }

  return { plans, modules, periodDiscounts, vouchers };
}

export const configRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 1. GET /api/config/pricing - Lấy toàn bộ cấu hình bảng giá từ DB (tự động seed nếu chưa có)
  fastify.get("/pricing", async (request, reply) => {
    try {
      const config = await getOrSeedPricingConfig();
      return reply.send({ success: true, data: config });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ success: false, message: "Lỗi tải cấu hình từ database", error: err.message });
    }
  });

  // 2. PUT /api/config/pricing - Cập nhật cấu hình bảng giá vào DB
  fastify.put<{
    Body: Partial<PricingSystemConfig>;
  }>("/pricing", async (request, reply) => {
    try {
      const { plans, modules, periodDiscounts, vouchers } = request.body || {};
      const updates: Promise<any>[] = [];

      if (plans && Array.isArray(plans)) {
        updates.push(
          prisma.systemConfig.upsert({
            where: { key: CONFIG_KEYS.PLANS },
            update: { value: JSON.stringify(plans) },
            create: {
              key: CONFIG_KEYS.PLANS,
              value: JSON.stringify(plans),
              category: "PRICING",
              description: "Cấu hình 3 gói phần mềm SaaS: STARTER, GROWTH, PRO",
            },
          })
        );
      }

      if (modules && Array.isArray(modules)) {
        updates.push(
          prisma.systemConfig.upsert({
            where: { key: CONFIG_KEYS.MODULES },
            update: { value: JSON.stringify(modules) },
            create: {
              key: CONFIG_KEYS.MODULES,
              value: JSON.stringify(modules),
              category: "PRICING",
              description: "Bảng giá mua lẻ từng module tính năng",
            },
          })
        );
      }

      if (periodDiscounts && Array.isArray(periodDiscounts)) {
        updates.push(
          prisma.systemConfig.upsert({
            where: { key: CONFIG_KEYS.DISCOUNTS },
            update: { value: JSON.stringify(periodDiscounts) },
            create: {
              key: CONFIG_KEYS.DISCOUNTS,
              value: JSON.stringify(periodDiscounts),
              category: "PRICING",
              description: "Khung chiết khấu theo kỳ hạn thuê",
            },
          })
        );
      }

      if (vouchers && Array.isArray(vouchers)) {
        updates.push(
          prisma.systemConfig.upsert({
            where: { key: CONFIG_KEYS.VOUCHERS },
            update: { value: JSON.stringify(vouchers) },
            create: {
              key: CONFIG_KEYS.VOUCHERS,
              value: JSON.stringify(vouchers),
              category: "PRICING",
              description: "Danh sách mã khuyến mại và voucher",
            },
          })
        );
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      const updated = await getOrSeedPricingConfig();
      return reply.send({ success: true, message: "Đã lưu cấu hình lên database thành công", data: updated });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ success: false, message: "Lỗi lưu cấu hình vào database", error: err.message });
    }
  });

  // 3. POST /api/config/pricing/reset - Khôi phục cấu hình bảng giá chuẩn mặc định
  fastify.post("/pricing/reset", async (request, reply) => {
    try {
      await Promise.all([
        prisma.systemConfig.upsert({
          where: { key: CONFIG_KEYS.PLANS },
          update: { value: JSON.stringify(Object.values(PLAN_CONFIGS)) },
          create: { key: CONFIG_KEYS.PLANS, value: JSON.stringify(Object.values(PLAN_CONFIGS)), category: "PRICING" },
        }),
        prisma.systemConfig.upsert({
          where: { key: CONFIG_KEYS.MODULES },
          update: { value: JSON.stringify(APP_MODULE_CATALOG) },
          create: { key: CONFIG_KEYS.MODULES, value: JSON.stringify(APP_MODULE_CATALOG), category: "PRICING" },
        }),
        prisma.systemConfig.upsert({
          where: { key: CONFIG_KEYS.DISCOUNTS },
          update: { value: JSON.stringify(DEFAULT_PERIOD_DISCOUNTS) },
          create: { key: CONFIG_KEYS.DISCOUNTS, value: JSON.stringify(DEFAULT_PERIOD_DISCOUNTS), category: "PRICING" },
        }),
        prisma.systemConfig.upsert({
          where: { key: CONFIG_KEYS.VOUCHERS },
          update: { value: JSON.stringify(DEFAULT_PROMO_VOUCHERS) },
          create: { key: CONFIG_KEYS.VOUCHERS, value: JSON.stringify(DEFAULT_PROMO_VOUCHERS), category: "PRICING" },
        }),
      ]);

      const resetData = await getOrSeedPricingConfig();
      return reply.send({ success: true, message: "Đã khôi phục bảng giá mặc định chuẩn thành công", data: resetData });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ success: false, message: "Lỗi khôi phục cấu hình", error: err.message });
    }
  });

  // 4. GET /api/config/key/:key - Lấy giá trị cấu hình đơn lẻ
  fastify.get<{ Params: { key: string } }>("/key/:key", async (request, reply) => {
    try {
      const { key } = request.params;
      const config = await prisma.systemConfig.findUnique({ where: { key } });
      if (!config) {
        return reply.status(404).send({ success: false, message: `Không tìm thấy cấu hình với key '${key}'` });
      }
      return reply.send({ success: true, data: config });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: "Lỗi truy vấn", error: err.message });
    }
  });
};
