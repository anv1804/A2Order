import type { FastifyPluginAsync } from "fastify";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { AdjustmentSchema, MoneySchema, SocketEvents } from "@a2order/shared";
import { prisma, systemQuery, transaction } from "../../core/database/prismaClient.js";
import { command } from "../../core/security/commands.js";
import { currentStore } from "../../core/security/access.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { quoteBill, settleBill, billView } from "./billing.service.js";
import { emitToStore, disconnectSession } from "../../core/websocket/socketServer.js";

const quoteSchema = z.object({ tableId: z.string().min(1), adjustment: AdjustmentSchema.optional(), splitCount: z.number().int().min(1).max(100).default(1), allocation: z.array(z.object({ itemId: z.string(), quantity: z.number().int().min(1).max(999) })).min(1).max(100).optional() });
const gatewayBins: Record<string, string> = { Vietcombank: "970436", BIDV: "970418", VietinBank: "970415", Agribank: "970405", MBBank: "970422", Techcombank: "970407", ACB: "970416", VPBank: "970432", TPBank: "970423", Sacombank: "970403", HDBank: "970437", VIB: "970441", MSB: "970426", OCB: "970448" };
export const billingRoutes: FastifyPluginAsync = async app => {
  const announce = async (storeId: string, result: Awaited<ReturnType<typeof settleBill>>) => {
    emitToStore(storeId, SocketEvents.PAYMENT_CONFIRMED, { storeId, billId: result.bill.id, sessionId: result.sessionId, tableId: result.bill.tableId, closed: result.closed });
    if (result.closed) {
      emitToStore(storeId, SocketEvents.SESSION_CLOSED, { storeId, sessionId: result.sessionId, tableId: result.bill.tableId });
      await disconnectSession(result.sessionId);
    }
  };
  app.post("/generate-vietqr", async request => {
    const input = quoteSchema.parse(request.body);
    const storeId = currentStore(request);
    if (input.adjustment && (input.adjustment.discountPercent || input.adjustment.fixedDiscount || input.adjustment.surchargeAmount) && request.principal?.role !== "STORE_OWNER") throw new AppError(403, "Điều chỉnh tiền cần quyền chủ quán");
    const bill = await command(request, storeId, "BILL_QUOTE", tx => quoteBill(tx, storeId, input.tableId, input.adjustment, input.splitCount, input.allocation));
    return { success: true, data: bill };
  });
  app.get("/bills/:billId", async request => {
    const { billId } = request.params as { billId: string };
    const bill = requireValue(await prisma.bill.findFirst({ where: { id: billId, storeId: currentStore(request) }, include: { payments: true, store: true, orderSession: { include: { table: true } } } }));
    return { success: true, data: billView(bill, bill.store, bill.orderSession.table) };
  });
  app.post("/bills/:billId/cancel", async request => {
    const storeId = currentStore(request);
    const { billId } = request.params as { billId: string };
    return { success: true, data: await command(request, storeId, "BILL_CANCEL", async tx => {
      const bill = requireValue(await tx.bill.findFirst({ where: { id: billId, storeId }, include: { payments: true, orderSession: true } }));
      await tx.$queryRaw`SELECT id FROM "Table" WHERE id = ${bill.orderSession.tableId} FOR UPDATE`;
      if (bill.paymentStatus !== "PENDING" || bill.payments.length) throw new AppError(409, "Chỉ hủy được bill chưa thu tiền");
      await tx.bill.update({ where: { id: bill.id }, data: { paymentStatus: "CANCELLED" } });
      await tx.table.update({ where: { id: bill.orderSession.tableId }, data: { status: "SERVED" } });
      return { billId };
    }) };
  });
  app.post("/checkout", async request => {
    const input = z.object({ billId: z.string(), method: z.literal("CASH"), cashTendered: MoneySchema, partIndex: z.number().int().min(0).optional() }).parse(request.body);
    const storeId = currentStore(request);
    const result = await command(request, storeId, "BILL_CASH_PAYMENT", async tx => {
      const bill = requireValue(await tx.bill.findFirst({ where: { id: input.billId, storeId }, include: { payments: true } }));
      const due = input.partIndex === undefined ? bill.finalAmount - bill.payments.reduce((s, p) => s + p.amount, 0) : Math.floor(bill.finalAmount / bill.splitCount) + (input.partIndex < bill.finalAmount % bill.splitCount ? 1 : 0);
      if (input.cashTendered < due) throw new AppError(400, "Số tiền khách đưa chưa đủ");
      return settleBill(tx, storeId, bill.id, "CASH", request.principal!.userId, undefined, input.partIndex);
    });
    await announce(storeId, result);
    return { success: true, data: result };
  });
  app.post("/webhook/payment", async request => {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret || secret.length < 24) throw new AppError(503, "Chưa cấu hình đối soát ngân hàng", "PROVIDER_NOT_CONFIGURED");
    const supplied = request.headers.authorization?.replace(/^Apikey\s+/i, "") || "";
    if (!/^Apikey\s+/i.test(request.headers.authorization || "") || !timingSafeEqual(createHash("sha256").update(supplied).digest(), createHash("sha256").update(secret).digest())) throw new AppError(401, "Webhook không hợp lệ");
    const input = z.object({ id: z.number().int().positive(), gateway: z.string(), accountNumber: z.string(), transferType: z.enum(["in", "out"]), transferAmount: z.number().int().positive(), content: z.string().max(1000), code: z.string().nullable().optional() }).parse(request.body);
    if (input.transferType !== "in") return { success: true };
    const match = (input.code || input.content).toUpperCase().match(/(A2O[A-F0-9]{20})(?:P(\d{1,3}))?/);
    const code = match?.[1];
    const partIndex = match?.[2] === undefined ? undefined : Number(match[2]);
    if (!code) return { success: true };
    const result = await systemQuery(async () => {
      const bill = await prisma.bill.findFirst({ where: { transactionCode: code }, include: { store: true } });
      if (!bill) return null;
      if (bill.store.bankAccount !== input.accountNumber || gatewayBins[input.gateway] !== bill.store.bankBin) throw new AppError(409, "Tài khoản nhận tiền không khớp hóa đơn", "PAYMENT_MISMATCH");
      return transaction(async tx => {
        const existing = await tx.payment.findUnique({ where: { transactionRef: "sepay:" + input.id } });
        if (existing) {
          if (existing.billId !== bill.id || existing.amount !== input.transferAmount) throw new AppError(409, "Giao dịch đã được ghi nhận với dữ liệu khác");
          const current = requireValue(await tx.bill.findUnique({ where: { id: bill.id }, include: { payments: true, orderSession: { include: { table: true } } } }));
          return { storeId: bill.storeId, bill: billView(current, bill.store, current.orderSession.table), sessionId: current.orderSessionId, closed: current.orderSession.status === "COMPLETED" };
        }
        const settled = await settleBill(tx, bill.storeId, bill.id, "VIETQR", null, "sepay:" + input.id, partIndex, input.transferAmount);
        await tx.auditLog.create({ data: { storeId: bill.storeId, action: "BANK_PAYMENT_CONFIRMED", details: JSON.stringify({ billId: bill.id, providerId: input.id, amount: input.transferAmount }) } });
        return { storeId: bill.storeId, ...settled };
      });
    });
    if (result) await announce(result.storeId, result);
    return { success: true };
  });
};
