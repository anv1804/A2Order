import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppModule } from "@a2order/shared";
import { prisma } from "../../core/database/prismaClient.js";
import { command } from "../../core/security/commands.js";
import { currentStore } from "../../core/security/access.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { licenseRepository, invoiceRepository } from "../../core/database/repositoryFactory.js";
import { subscriptionQuote, reserveSubscriptionQuote, releaseSubscriptionVoucher, addMonths } from "../config/pricing.service.js";

export const licenseRoutes: FastifyPluginAsync = async app => {
  app.get("/", async () => ({ success: true, data: await licenseRepository.getAll() }));
  app.post("/", async request => {
    const input = z.object({ keyCode: z.string().trim().min(8).max(100), storeId: z.string().optional(), plan: z.enum(["STARTER", "GROWTH", "PRO"]), maxDevices: z.number().int().min(1).max(10000), durationMonths: z.number().int().min(1).max(120) }).parse(request.body);
    const data = await command(request, input.storeId || currentStore(request), "LICENSE_CREATE", async tx => {
      if (input.storeId && await tx.storeLicense.findUnique({ where: { storeId: input.storeId } })) throw new AppError(409, "Cửa hàng đã có license");
      const row = await tx.storeLicense.create({ data: { licenseKey: input.keyCode, storeId: input.storeId, planType: input.plan, enabledModules: "CORE_POS", maxTables: input.maxDevices, endDate: addMonths(new Date(), input.durationMonths), status: input.storeId ? "EXPIRED" : "UNASSIGNED" }, include: { store: true } });
      return { id: row.id, keyCode: row.licenseKey, storeId: row.storeId, storeName: row.store?.name, plan: row.planType, maxDevices: row.maxTables, durationMonths: input.durationMonths, status: row.status, issuedAt: row.startDate, expiresAt: row.endDate };
    });
    return { success: true, data };
  });
  app.post("/:keyCode/renew", async () => { throw new AppError(409, "Vui lòng lập hóa đơn gia hạn và xác nhận đã nhận tiền", "INVOICE_REQUIRED"); });
  app.post("/:keyCode/revoke", async request => {
    const { keyCode } = request.params as { keyCode: string };
    const target = requireValue(await prisma.storeLicense.findUnique({ where: { licenseKey: keyCode } }));
    const data = await command(request, target.storeId || currentStore(request), "LICENSE_REVOKE", async tx => {
      const row = await tx.storeLicense.update({ where: { id: target.id }, data: { status: "REVOKED" } });
      return { id: row.id, keyCode: row.licenseKey, storeId: row.storeId, plan: row.planType, status: row.status };
    });
    return { success: true, data };
  });
  app.get("/invoices/all", async () => ({ success: true, data: await invoiceRepository.getAll() }));
  app.get("/:storeId/info", async request => {
    const { storeId } = request.params as { storeId: string };
    const row = requireValue(await prisma.storeLicense.findUnique({ where: { storeId }, include: { invoices: { orderBy: { createdAt: "desc" }, take: 10 } } }), "Cửa hàng chưa có license");
    const expired = row.endDate <= new Date();
    return { storeId, licenseKey: row.licenseKey, planType: row.planType, enabledModules: row.enabledModules.split(","), status: ["REVOKED", "SUSPENDED"].includes(row.status) ? row.status : expired ? "EXPIRED" : row.status, daysRemaining: Math.max(0, Math.ceil((row.endDate.getTime() - Date.now()) / 86400000)), startDate: row.startDate, endDate: row.endDate, maxTables: row.maxTables, maxStaff: row.maxStaff, recentInvoices: row.invoices };
  });
  app.post("/calculate-pricing", async request => ({ success: true, data: await subscriptionQuote(prisma, request.body) }));
  app.post("/invoice/create", async request => {
    const input = z.object({ storeId: z.string(), durationMonths: z.number().int().min(1).max(120), enabledModules: z.array(z.nativeEnum(AppModule)).min(1), voucherCode: z.string().optional() }).parse(request.body);
    const invoice = await command(request, input.storeId, "SUBSCRIPTION_INVOICE_CREATE", async tx => {
      const license = requireValue(await tx.storeLicense.findUnique({ where: { storeId: input.storeId } }));
      const quote = await reserveSubscriptionQuote(tx, { selectedModules: input.enabledModules, durationMonths: input.durationMonths, voucherCode: input.voucherCode });
      return tx.softwareInvoice.create({ data: { storeLicenseId: license.id, invoiceCode: "INV-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase(), amount: quote.finalAmount, durationMonths: input.durationMonths, periodStart: new Date(), periodEnd: addMonths(new Date(), input.durationMonths), status: "PENDING", requestedModules: input.enabledModules.join(","), voucherCode: input.voucherCode } });
    });
    return { success: true, data: invoice };
  });
  app.post("/invoice/:invoiceId/confirm-payment", async request => {
    const { invoiceId } = request.params as { invoiceId: string };
    const target = requireValue(await prisma.softwareInvoice.findUnique({ where: { id: invoiceId }, include: { license: true } }));
    const result = await command(request, target.license.storeId || currentStore(request), "SUBSCRIPTION_PAYMENT_CONFIRM", async tx => {
      await tx.$queryRaw`SELECT id FROM "StoreLicense" WHERE id = ${target.storeLicenseId} FOR UPDATE`;
      const invoice = requireValue(await tx.softwareInvoice.findUnique({ where: { id: invoiceId }, include: { license: true } }));
      if (invoice.status === "PAID") return { newEndDate: invoice.license.endDate, alreadyPaid: true };
      if (invoice.status !== "PENDING" || !invoice.license.storeId) throw new AppError(409, "Hóa đơn không thể xác nhận");
      const start = new Date(Math.max(Date.now(), invoice.license.endDate.getTime()));
      const endDate = addMonths(start, invoice.durationMonths);
      await tx.softwareInvoice.update({ where: { id: invoiceId }, data: { status: "PAID", paidAt: new Date(), periodStart: start, periodEnd: endDate } });
      await tx.storeLicense.update({ where: { id: invoice.license.id }, data: { endDate, status: "ACTIVE", ...(invoice.requestedModules ? { enabledModules: invoice.requestedModules } : {}) } });
      return { newEndDate: endDate, alreadyPaid: false };
    });
    return { success: true, message: "Đã ghi nhận thanh toán và cập nhật bản quyền", ...result };
  });
  app.post("/invoice/:invoiceId/cancel", async request => {
    const { invoiceId } = z.object({ invoiceId: z.string().min(1) }).parse(request.params);
    const target = requireValue(await prisma.softwareInvoice.findUnique({ where: { id: invoiceId }, include: { license: true } }));
    const data = await command(request, target.license.storeId || currentStore(request), "SUBSCRIPTION_CANCEL", async tx => {
      await tx.$queryRaw`SELECT id FROM "StoreLicense" WHERE id = ${target.storeLicenseId} FOR UPDATE`;
      const invoice = requireValue(await tx.softwareInvoice.findUnique({ where: { id: invoiceId } }));
      if (invoice.status === "CANCELLED") return { invoiceId };
      if (invoice.status !== "PENDING") throw new AppError(409, "Chỉ có thể hủy hóa đơn chưa thanh toán");
      if (invoice.voucherCode) await releaseSubscriptionVoucher(tx, invoice.voucherCode);
      await tx.softwareInvoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED" } });
      return { invoiceId };
    });
    return { success: true, data };
  });
};
