import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { SocketEvents, AdjustmentSchema } from "@a2order/shared";
import { command } from "../../core/security/commands.js";
import { currentStore, requireRoles } from "../../core/security/access.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { prisma } from "../../core/database/prismaClient.js";
import { emitToStore } from "../../core/websocket/socketServer.js";
import { submitBatch, changeBatch, cancelItem, tableSnapshot, pendingOrders, customerOrders, lockTable, checkLicense, transferSession } from "./order.service.js";

export const orderRoutes: FastifyPluginAsync = async app => {
  app.post("/:storeId/transfer", async request => {
    const input = z.object({ fromTableId: z.string(), toTableId: z.string(), mode: z.enum(["MOVE", "MERGE"]) }).parse(request.body);
    const storeId = currentStore(request);
    const result = await command(request, storeId, "TABLE_TRANSFER", tx => transferSession(tx, storeId, input.fromTableId, input.toTableId, input.mode));
    emitToStore(storeId, SocketEvents.TABLE_STATUS_UPDATED, result);
    return { success: true, data: result };
  });
  app.post("/:storeId/adjustment", async request => {
    requireRoles(request, ["STORE_OWNER"]);
    const { tableId, adjustment } = z.object({ tableId: z.string(), adjustment: AdjustmentSchema }).parse(request.body);
    const storeId = currentStore(request);
    const result = await command(request, storeId, "TABLE_ADJUSTMENT", async tx => {
      await checkLicense(tx, storeId);
      await lockTable(tx, storeId, tableId);
      const session = requireValue(await tx.orderSession.findFirst({ where: { storeId, tableId, status: "ACTIVE" } }));
      if (await tx.bill.count({ where: { orderSessionId: session.id, paymentStatus: { in: ["PENDING", "PAID"] } } })) throw new AppError(409, "Không đổi điều chỉnh sau khi lập hóa đơn");
      if ((adjustment.fixedDiscount || adjustment.discountPercent || adjustment.surchargeAmount) && !adjustment.discountReason) throw new AppError(400, "Cần lý do điều chỉnh tiền");
      await tx.orderSession.update({ where: { id: session.id }, data: { adjustments: adjustment } });
      return { tableId, adjustment };
    });
    emitToStore(storeId, SocketEvents.TABLE_STATUS_UPDATED, result);
    return { success: true, data: result };
  });
  app.post("/:storeId/remake", async request => {
    requireRoles(request, ["STORE_OWNER"]);
    const { itemId, reason } = z.object({ itemId: z.string(), reason: z.string().trim().min(1).max(300) }).parse(request.body);
    const storeId = currentStore(request);
    const result = await command(request, storeId, "ITEM_REMAKE", async tx => {
      await checkLicense(tx, storeId);
      const item = requireValue(await tx.orderItem.findFirst({ where: { id: itemId, orderBatch: { orderSession: { storeId, status: "ACTIVE" } } }, include: { orderBatch: { include: { orderSession: true } }, menuItem: true } }));
      await lockTable(tx, storeId, item.orderBatch.orderSession.tableId);
      if (item.status !== "SERVED" && item.status !== "DONE") throw new AppError(409, "Chỉ làm lại món đã hoàn thành");
      if (await tx.bill.count({ where: { orderSessionId: item.orderBatch.orderSessionId, paymentStatus: { in: ["PAID", "PENDING"] } } })) throw new AppError(409, "Bàn đã lập hóa đơn");
      if (item.menuItem.stockCount !== null) {
        const stock = await tx.menuItem.updateMany({ where: { id: item.menuItemId, storeId, stockCount: { gte: item.quantity } }, data: { stockCount: { decrement: item.quantity } } });
        if (!stock.count) throw new AppError(409, "Không đủ tồn kho để làm lại");
      }
      await tx.orderItem.update({ where: { id: itemId }, data: { status: "QUEUED", costSnapshot: item.costSnapshot + item.menuItem.costPrice, notes: [item.notes, "Làm lại: " + reason].filter(Boolean).join(" · ") } });
      return { itemId, reason, tableId: item.orderBatch.orderSession.tableId };
    });
    emitToStore(storeId, SocketEvents.ORDER_ITEM_STATUS_CHANGED, result);
    return { success: true, data: result };
  });
  app.post("/submit", async request => {
    const storeId = currentStore(request);
    const result = await command(request, storeId, "ORDER_SUBMIT", tx => submitBatch(tx, request.principal!, request.body));
    emitToStore(storeId, result.status === "PENDING_APPROVAL" ? SocketEvents.ORDER_APPROVAL_REQUESTED : SocketEvents.ORDER_SUBMITTED, result);
    return { success: true, data: result };
  });
  app.get("/:storeId/pending", async request => { requireRoles(request, ["STORE_OWNER", "CASHIER", "WAITER"]); return { success: true, data: await pendingOrders(currentStore(request)) }; });
  app.get("/:storeId/snapshot", async request => { requireRoles(request, ["STORE_OWNER", "CASHIER", "WAITER", "ACCOUNTANT"]); return { success: true, data: await tableSnapshot(currentStore(request)) }; });
  app.get("/:storeId/customer-snapshot", async request => ({ success: true, data: await customerOrders(request.principal!) }));
  app.post("/:storeId/:orderId/approve", async request => {
    const { orderId } = z.object({ orderId: z.string().min(1) }).parse(request.params);
    const storeId = currentStore(request);
    const result = await command(request, storeId, "ORDER_APPROVE", tx => changeBatch(tx, storeId, orderId, "APPROVED"));
    emitToStore(storeId, SocketEvents.ORDER_APPROVED, result);
    emitToStore(storeId, SocketEvents.ORDER_SUBMITTED, result);
    return { success: true, data: result };
  });
  app.post("/:storeId/:orderId/reject", async request => {
    const { orderId } = z.object({ orderId: z.string().min(1) }).parse(request.params);
    const { reason } = z.object({ reason: z.string().trim().max(300).optional() }).parse(request.body || {});
    const storeId = currentStore(request);
    const result = await command(request, storeId, "ORDER_REJECT", tx => changeBatch(tx, storeId, orderId, "REJECTED", reason));
    emitToStore(storeId, SocketEvents.ORDER_REJECTED, { ...result, reason });
    return { success: true, data: result };
  });
  app.post("/:storeId/cancel-item", async request => {
    const { itemId, reason } = z.object({ itemId: z.string().min(1), reason: z.string().max(300).optional() }).parse(request.body);
    const storeId = currentStore(request);
    const result = await command(request, storeId, "ORDER_CANCEL_ITEM", tx => cancelItem(tx, request.principal!, itemId, reason));
    emitToStore(storeId, SocketEvents.ORDER_ITEM_CANCELLED, { ...result, storeId });
    return { success: true, data: result };
  });
  app.get("/kds/tickets", async request => {
    const storeId = currentStore(request);
    const license = await prisma.storeLicense.findUnique({ where: { storeId } });
    if (!license?.enabledModules.split(",").includes("MODULE_KDS")) throw new AppError(403, "Gói hiện tại chưa có KDS");
    const batches = await prisma.orderBatch.findMany({ where: { status: "APPROVED", orderSession: { storeId }, items: { some: { status: { in: ["QUEUED", "COOKING", "DONE"] } } } }, include: { orderSession: { include: { table: true } }, items: { where: { status: { in: ["QUEUED", "COOKING", "DONE"] } } } }, orderBy: { createdAt: "asc" } });
    const tickets = batches.flatMap(batch => {
      const stations = [...new Set(batch.items.map(i => i.station))];
      return stations.map(station => {
        const items = batch.items.filter(i => i.station === station);
        return { id: batch.id + ":" + station, ticketCode: "#" + batch.orderSession.table.code + "-" + batch.batchNumber, tableId: batch.orderSession.tableId, tableName: batch.orderSession.table.name, orderTime: batch.createdAt.toISOString(), orderTimestamp: batch.createdAt.getTime(), status: items.every(i => i.status === "DONE") ? "DONE" : items.some(i => i.status !== "QUEUED") ? "IN_PROGRESS" : "NEW", station, waiterName: "", priority: "NORMAL", items: items.map(i => ({ id: i.id, dishId: i.menuItemId, dishName: i.nameSnapshot, quantity: i.quantity, notes: i.notes, status: i.status === "QUEUED" ? "WAITING" : i.status === "DONE" ? "READY" : i.status, station })) };
      });
    });
    return { success: true, data: tickets };
  });
  app.get("/kds/metrics", async request => {
    const storeId = currentStore(request);
    const now = new Date(Date.now() + 25200000);
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 25200000);
    const logs = await prisma.auditLog.findMany({ where: { storeId, action: "ITEM_DONE", createdAt: { gte: start } } });
    const completions = new Map<string, number>();
    for (const row of logs) { try { const id = JSON.parse(row.details || "{}").itemId; if (typeof id === "string" && !completions.has(id)) completions.set(id, row.createdAt.getTime()); } catch {} }
    const items = await prisma.orderItem.findMany({ where: { id: { in: [...completions.keys()] }, orderBatch: { orderSession: { storeId } } } });
    const durations = items.map(i => Math.max(0, (completions.get(i.id)! - i.createdAt.getTime()) / 60000));
    return { success: true, data: { completedCount: new Set(items.map(i => i.orderBatchId + ":" + i.station)).size, averageMinutes: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10 : null } };
  });
  app.patch("/items/:itemId/status", async request => {
    const { itemId } = z.object({ itemId: z.string().min(1) }).parse(request.params);
    const { status } = z.object({ status: z.enum(["COOKING", "DONE", "SERVED"]) }).parse(request.body);
    if (status === "SERVED") requireRoles(request, ["STORE_OWNER", "WAITER", "CASHIER", "CHEF"]);
    else requireRoles(request, ["STORE_OWNER", "CHEF"]);
    const storeId = currentStore(request);
    const result = await command(request, storeId, "ITEM_" + status, async tx => {
      await checkLicense(tx, storeId);
      const item = requireValue(await tx.orderItem.findFirst({ where: { id: itemId, orderBatch: { status: "APPROVED", orderSession: { storeId, status: { in: ["ACTIVE", "COMPLETED"] } } } }, include: { orderBatch: { include: { orderSession: true } } } }));
      await lockTable(tx, storeId, item.orderBatch.orderSession.tableId);
      const transitions: Record<string, string> = { QUEUED: "COOKING", COOKING: "DONE", DONE: "SERVED" };
      if (item.status !== status && transitions[item.status] !== status) throw new AppError(409, "Trạng thái món đã thay đổi, vui lòng tải lại");
      await tx.orderItem.update({ where: { id: itemId }, data: { status } });
      if (status === "SERVED" && item.orderBatch.orderSession.status === "ACTIVE") {
        const remaining = await tx.orderItem.count({ where: { status: { notIn: ["SERVED", "CANCELLED"] }, orderBatch: { status: "APPROVED", orderSessionId: item.orderBatch.orderSessionId } } });
        if (!remaining) await tx.table.updateMany({ where: { id: item.orderBatch.orderSession.tableId, storeId, currentSessionId: item.orderBatch.orderSessionId, status: { not: "PAYMENT_PENDING" } }, data: { status: "SERVED" } });
      }
      return { itemId, status, tableId: item.orderBatch.orderSession.tableId, sessionId: item.orderBatch.orderSessionId, storeId };
    });
    emitToStore(storeId, SocketEvents.ORDER_ITEM_STATUS_CHANGED, result);
    return { success: true, data: result };
  });
};
