import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { currentStore } from "../../core/security/access.js";
import { salesReport } from "./analytics.service.js";
import { transaction } from "../../core/database/prismaClient.js";
import { checkLicense } from "../order/order.service.js";

export const analyticsRoutes: FastifyPluginAsync = async app => {
  app.get("/:storeId/deep-reports", async request => {
    await transaction(tx => checkLicense(tx, currentStore(request), "MODULE_ADVANCED_ANALYTICS"));
    const { period } = z.object({ period: z.enum(["today", "yesterday", "week", "month"]).default("today") }).parse(request.query);
    return { success: true, data: await salesReport(currentStore(request), period) };
  });
  app.get("/:storeId/reports", async request => {
    const { period } = z.object({ period: z.enum(["today", "yesterday", "week", "month"]).default("today") }).parse(request.query);
    const { bills, canceledItems, summary, paymentDistribution, recognizedAt } = await salesReport(currentStore(request), period);
    return { success: true, data: { period, bills, canceledItems, summary, paymentDistribution, recognizedAt } };
  });
};
