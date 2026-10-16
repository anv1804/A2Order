import type { FastifyPluginAsync } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { MoneySchema } from "@a2order/shared";
import { prisma, transaction } from "../../core/database/prismaClient.js";
import { currentStore, requireRoles } from "../../core/security/access.js";
import { command } from "../../core/security/commands.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { checkLicense, lockTable, openSession } from "../order/order.service.js";
import { emitToStore } from "../../core/websocket/socketServer.js";
import type { AttendanceEntry, IntercomEntry, IngredientEntry, ReceiptEntry } from "../../types/operations.js";

export const workforceRoutes: FastifyPluginAsync = async app => {
  app.post("/reservation-arrive", async request => {
    requireRoles(request, ["STORE_OWNER", "CASHIER", "WAITER"]);
    const { reservationId, tableId } = z.object({ reservationId: z.string().min(1), tableId: z.string().min(1) }).parse(request.body);
    const storeId = currentStore(request);
    const result = await command(request, storeId, "RESERVATION_ARRIVE", async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${storeId + ":document:reservations_data"}))`;
      const doc = requireValue(await tx.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key: "reservations_data" } } }));
      const rows = doc.data as unknown as Array<Record<string, unknown>>;
      const row = requireValue(rows.find(r => r.id === reservationId), "Không tìm thấy lượt đặt bàn");
      if (row.status === "ARRIVED") return { reservationId, sessionId: row.sessionId, tableId: row.tableId };
      if (!["PENDING", "CONFIRMED"].includes(String(row.status))) throw new AppError(409, "Lượt đặt bàn không còn hiệu lực");
      const table = await lockTable(tx, storeId, tableId);
      if (table.status !== "EMPTY" || table.currentSessionId) throw new AppError(409, "Bàn đang có khách, vui lòng chọn bàn khác");
      const { session } = await openSession(tx, storeId, tableId, z.number().int().min(1).max(100).parse(row.guestCount));
      Object.assign(row, { status: "ARRIVED", sessionId: session.id, tableId, tableAssigned: table.name });
      await tx.workspaceDocument.update({ where: { storeId_key: { storeId, key: "reservations_data" } }, data: { data: rows as Prisma.InputJsonValue, version: { increment: 1 } } });
      return { reservationId, sessionId: session.id, tableId };
    });
    emitToStore(storeId, "WORKSPACE_UPDATED", { storeId, key: "reservations_data" });
    emitToStore(storeId, "TABLE_STATUS_UPDATED", { ...result, storeId });
    return { success: true, data: result };
  });
  app.get("/attendance", async request => {
    requireRoles(request, ["STORE_OWNER", "ACCOUNTANT", "CASHIER", "WAITER", "CHEF"]);
    const row = await prisma.workspaceDocument.findUnique({ where: { storeId_key: { storeId: currentStore(request), key: "attendance_logs" } } });
    const rows = (row?.data || []) as unknown as AttendanceEntry[];
    return { success: true, data: request.principal!.role === "STORE_OWNER" ? rows : rows.filter(r => r.staffId === request.principal!.userId) };
  });
  app.post("/attendance", async request => {
    const { action, staffId } = z.object({ action: z.enum(["IN", "OUT"]), staffId: z.string().optional() }).parse(request.body);
    const storeId = currentStore(request);
    requireRoles(request, ["STORE_OWNER", "ACCOUNTANT", "CASHIER", "WAITER", "CHEF"]);
    const target = staffId || request.principal!.userId;
    if (target !== request.principal!.userId && request.principal!.role !== "STORE_OWNER") throw new AppError(403, "Không được chấm công hộ");
    const result = await command(request, storeId, "ATTENDANCE_" + action, async tx => {
      await checkLicense(tx, storeId, "MODULE_ATTENDANCE_HRM");
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${storeId + ":attendance"}))`;
      const staff = requireValue(await tx.staff.findFirst({ where: { id: target, storeId, isActive: true } }));
      const doc = await tx.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key: "attendance_logs" } } });
      const rows = (doc?.data || []) as unknown as AttendanceEntry[];
      const active = rows.find(r => r.staffId === target && r.status === "ACTIVE");
      const now = new Date(), time = now.toISOString();
      if (action === "IN" && !active) rows.unshift({ id: crypto.randomUUID(), staffId: target, staffName: staff.name, role: staff.role, clockInTime: time, shiftName: staff.shift, date: new Date(now.getTime() + 25200000).toISOString().slice(0, 10), status: "ACTIVE" });
      if (action === "OUT") {
        if (!active) throw new AppError(409, "Nhân viên chưa vào ca");
        active.status = "COMPLETED"; active.clockOutTime = time;
        active.workHours = Math.round((now.getTime() - Date.parse(active.clockInTime)) / 3600000 * 100) / 100;
      }
      if (rows.length > 10000) throw new AppError(409, "Cần lưu trữ kỳ chấm công cũ trước khi mở kỳ mới");
      await tx.workspaceDocument.upsert({ where: { storeId_key: { storeId, key: "attendance_logs" } }, create: { storeId, key: "attendance_logs", data: rows as unknown as Prisma.InputJsonValue }, update: { data: rows as unknown as Prisma.InputJsonValue, version: { increment: 1 } } });
      return { staffId: target, action };
    });
    emitToStore(storeId, "attendance:updated", result);
    return { success: true, data: result };
  });
  app.get("/intercom", async request => {
    await transaction(tx => checkLicense(tx, currentStore(request), "MODULE_STAFF_INTERCOM"));
    requireRoles(request, ["STORE_OWNER", "CASHIER", "WAITER", "CHEF"]);
    const row = await prisma.workspaceDocument.findUnique({ where: { storeId_key: { storeId: currentStore(request), key: "intercom_messages" } } });
    return { success: true, data: row?.data || [] };
  });
  app.post("/intercom", async request => {
    requireRoles(request, ["STORE_OWNER", "CASHIER", "WAITER", "CHEF"]);
    const input = z.object({ targetRole: z.enum(["ALL", "KITCHEN", "CASHIER", "WAITER"]), content: z.string().trim().max(2000).default(""), type: z.enum(["TEXT", "QUICK_ALERT", "VOICE_NOTE"]), audioUrl: z.string().max(300000).regex(/^data:audio\/(?:webm|ogg|mp4)(?:;codecs=[a-z0-9,-]+)?;base64,[A-Za-z0-9+/=]+$/).optional(), audioDurationSec: z.number().int().min(1).max(30).optional() }).parse(request.body);
    if (input.type === "VOICE_NOTE" ? !input.audioUrl || !input.audioDurationSec : !input.content) throw new AppError(400, "Thiếu nội dung tin nhắn");
    const storeId = currentStore(request);
    const result = await command(request, storeId, "INTERCOM_SEND", async tx => {
      await checkLicense(tx, storeId, "MODULE_STAFF_INTERCOM");
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${storeId + ":intercom"}))`;
      const staff = requireValue(await tx.staff.findFirst({ where: { id: request.principal!.userId, storeId } }));
      const doc = await tx.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key: "intercom_messages" } } });
      const now = new Date();
      const message: IntercomEntry = { ...input, id: crypto.randomUUID(), senderId: staff.id, senderName: staff.name, senderRole: staff.role, timestamp: now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }), createdAt: now.toISOString() };
      const rows = [...((doc?.data || []) as unknown as IntercomEntry[]).filter(r => Date.parse(r.createdAt) > Date.now() - 86400000), message].slice(-50);
      while (JSON.stringify(rows).length > 2000000) rows.shift();
      await tx.workspaceDocument.upsert({ where: { storeId_key: { storeId, key: "intercom_messages" } }, create: { storeId, key: "intercom_messages", data: rows as unknown as Prisma.InputJsonValue }, update: { data: rows as unknown as Prisma.InputJsonValue, version: { increment: 1 } } });
      return { messageId: message.id };
    });
    emitToStore(storeId, "intercom:updated", result);
    return { success: true, data: result };
  });
  app.post("/inventory-receipt", async request => {
    requireRoles(request, ["STORE_OWNER", "ACCOUNTANT"]);
    const input = z.object({ supplierName: z.string().trim().min(1).max(200), notes: z.string().max(500).optional(), items: z.array(z.object({ ingredientId: z.string(), quantity: z.number().finite().positive().max(1000000), unitPrice: MoneySchema })).min(1).max(100) }).parse(request.body);
    if (new Set(input.items.map(i => i.ingredientId)).size !== input.items.length) throw new AppError(400, "Nguyên liệu bị trùng");
    const storeId = currentStore(request);
    const result = await command(request, storeId, "INVENTORY_RECEIPT", async tx => {
      await checkLicense(tx, storeId);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${storeId + ":inventory"}))`;
      const stockDoc = await tx.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key: "inventory_ingredients" } } });
      const receiptDoc = await tx.workspaceDocument.findUnique({ where: { storeId_key: { storeId, key: "inventory_receipts" } } });
      const stock = (stockDoc?.data || []) as unknown as IngredientEntry[];
      const receipts = (receiptDoc?.data || []) as unknown as ReceiptEntry[];
      const lines = input.items.map(line => {
        const ingredient = requireValue(stock.find(i => i.id === line.ingredientId), "Nguyên liệu không tồn tại");
        const subtotal = MoneySchema.parse(Math.round(line.quantity * line.unitPrice));
        const next = ingredient.currentStock + line.quantity;
        ingredient.avgCostPrice = Math.round((ingredient.currentStock * ingredient.avgCostPrice + subtotal) / next);
        ingredient.currentStock = Math.round(next * 1000) / 1000;
        ingredient.updatedAt = new Date().toISOString();
        return { ...line, ingredientName: ingredient.name, unit: ingredient.unit, subtotal };
      });
      const staff = requireValue(await tx.staff.findUnique({ where: { id: request.principal!.userId } }));
      const receipt: ReceiptEntry = { id: crypto.randomUUID(), code: "PNK-" + crypto.randomUUID().slice(0, 8).toUpperCase(), supplierName: input.supplierName, receivedDate: new Date().toISOString(), receivedBy: staff.name, items: lines, totalAmount: MoneySchema.parse(lines.reduce((s, l) => s + l.subtotal, 0)), paymentStatus: "UNPAID", notes: input.notes || "", createdAt: new Date().toISOString() };
      for (const [key, data] of [["inventory_ingredients", stock], ["inventory_receipts", [receipt, ...receipts]]] as const) await tx.workspaceDocument.upsert({ where: { storeId_key: { storeId, key } }, create: { storeId, key, data: data as unknown as Prisma.InputJsonValue }, update: { data: data as unknown as Prisma.InputJsonValue, version: { increment: 1 } } });
      return receipt;
    });
    emitToStore(storeId, "inventory:updated", { receiptId: result.id });
    return { success: true, data: result };
  });
};
