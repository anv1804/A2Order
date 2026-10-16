import type { FastifyPluginAsync } from "fastify";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { SocketEvents } from "@a2order/shared";
import { prisma } from "../../core/database/prismaClient.js";
import { command } from "../../core/security/commands.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { currentStore, requireRoles } from "../../core/security/access.js";
import { emitToStore, disconnectSession } from "../../core/websocket/socketServer.js";
import { checkLicense, lockTable, openSession, closeEmptySession } from "../order/order.service.js";
import type { Principal } from "../../types/security.js";
import { publicPromotions } from "../promotion/promotion.service.js";

const nameInput = z.object({ name: z.string().trim().min(1).max(100) });
const tableInput = z.object({ zoneId: z.string().min(1), name: z.string().trim().min(1).max(100), code: z.string().trim().min(1).max(30).optional(), capacity: z.number().int().min(1).max(100).optional() });
const sessionInput = z.object({ tableId: z.string().min(1), guestCount: z.number().int().min(1).max(100).default(2) });

export function generateDefaultTableCode(name: string, id?: string) {
  const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").trim().toUpperCase();
  const number = clean.match(/\d+/)?.[0];
  return number ? (clean.startsWith("VIP") ? "VIP-" : "TB-") + number.padStart(2, "0") : "TB-" + (clean.replace(/[^A-Z0-9]/g, "").slice(0, 8) || (id || randomUUID()).slice(0, 8));
}
export function getTablePin(table: { id: string; qrSecret?: string | null }) {
  return String(1000 + createHash("sha256").update(table.qrSecret || table.id).digest().readUInt32BE(0) % 9000);
}
export function buildTableOrderQr(storeId: string, tableCode: string, tableId: string) {
  const base = (process.env.ORDER_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const orderUrl = base + "/order?store=" + encodeURIComponent(storeId) + "&table=" + encodeURIComponent(tableCode) + "&tableId=" + encodeURIComponent(tableId);
  return { orderUrl, qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" + encodeURIComponent(orderUrl) };
}
export const tableRoutes: FastifyPluginAsync = async app => {
  const customerToken = (storeId: string, tableId: string, sessionId: string, guestId: string = randomUUID()) => app.jwt.sign({ kind: "customer", userId: "guest:" + guestId, role: "CUSTOMER", storeId, tableId, sessionId }, { expiresIn: "4h" });
  app.get("/:storeId", async request => {
    const storeId = currentStore(request);
    const zones = await prisma.tableZone.findMany({ where: { storeId }, include: { tables: { where: { archivedAt: null }, orderBy: { name: "asc" } } }, orderBy: { sortOrder: "asc" } });
    const canReadPin = ["STORE_OWNER", "CASHIER", "WAITER"].includes(request.principal!.role);
    return { success: true, data: zones.map(zone => ({ id: zone.id, name: zone.name, sortOrder: zone.sortOrder, tables: zone.tables.map(table => ({ id: table.id, name: table.name, code: table.code || generateDefaultTableCode(table.name, table.id), capacity: table.capacity, status: table.status, ...(canReadPin ? { pin: getTablePin(table) } : {}), ...buildTableOrderQr(storeId, table.code || generateDefaultTableCode(table.name), table.id) })) })) };
  });
  app.post("/:storeId/zones", async request => {
    const { name } = nameInput.parse(request.body);
    const storeId = currentStore(request);
    return { success: true, data: await command(request, storeId, "ZONE_CREATE", async tx => { await checkLicense(tx, storeId); return tx.tableZone.create({ data: { name, storeId }, include: { tables: true } }); }) };
  });
  app.put("/:storeId/zones/:zoneId", async request => {
    const { zoneId } = request.params as { zoneId: string };
    const { name } = nameInput.parse(request.body);
    const storeId = currentStore(request);
    return { success: true, data: await command(request, storeId, "ZONE_UPDATE", tx => tx.tableZone.update({ where: { id_storeId: { id: zoneId, storeId } }, data: { name }, include: { tables: true } })) };
  });
  app.delete("/:storeId/zones/:zoneId", async request => {
    const { zoneId } = request.params as { zoneId: string };
    const storeId = currentStore(request);
    return command(request, storeId, "ZONE_DELETE", async tx => { await tx.tableZone.delete({ where: { id_storeId: { id: zoneId, storeId } } }); return { success: true }; });
  });
  app.post("/:storeId/tables", async request => {
    const input = tableInput.parse(request.body);
    const storeId = currentStore(request);
    return { success: true, data: await command(request, storeId, "TABLE_CREATE", async tx => {
      const store = await checkLicense(tx, storeId);
      requireValue(await tx.tableZone.findFirst({ where: { id: input.zoneId, storeId } }), "Khu vực không tồn tại");
      const count = await tx.table.count({ where: { storeId, archivedAt: null } });
      if (count >= store.license!.maxTables) throw new AppError(403, "Đã đạt giới hạn số bàn của gói");
      const table = await tx.table.create({ data: { ...input, code: (input.code || generateDefaultTableCode(input.name)).toUpperCase(), storeId } });
      return { id: table.id, name: table.name, code: table.code, capacity: table.capacity, status: table.status, pin: getTablePin(table), ...buildTableOrderQr(storeId, table.code!, table.id) };
    }) };
  });
  app.patch("/:storeId/tables/:tableId", async request => {
    const { tableId } = request.params as { tableId: string };
    const input = tableInput.partial().extend({ status: z.enum(["EMPTY", "OCCUPIED", "WAITING_FOOD", "SERVED", "PAYMENT_PENDING"]).optional() }).parse(request.body);
    const storeId = currentStore(request);
    return { success: true, data: await command(request, storeId, "TABLE_UPDATE", async tx => {
      const table = await lockTable(tx, storeId, tableId);
      if (input.status && input.status !== table.status) throw new AppError(409, "Đổi trạng thái bàn qua thao tác mở bàn hoặc thanh toán");
      if (input.zoneId) requireValue(await tx.tableZone.findFirst({ where: { id: input.zoneId, storeId } }));
      const updated = await tx.table.update({ where: { id_storeId: { id: tableId, storeId } }, data: { ...input, code: input.code?.toUpperCase() } });
      return { id: updated.id, name: updated.name, code: updated.code, status: updated.status, capacity: updated.capacity, pin: getTablePin(updated), ...buildTableOrderQr(storeId, updated.code || generateDefaultTableCode(updated.name), updated.id) };
    }) };
  });
  app.delete("/:storeId/tables/:tableId", async request => {
    const { tableId } = request.params as { tableId: string };
    const storeId = currentStore(request);
    return command(request, storeId, "TABLE_ARCHIVE", async tx => {
      const table = await lockTable(tx, storeId, tableId);
      if (table.currentSessionId) throw new AppError(409, "Không thể xóa bàn đang phục vụ");
      await tx.table.update({ where: { id_storeId: { id: tableId, storeId } }, data: { archivedAt: new Date(), code: null } });
      return { success: true };
    });
  });
  app.get("/:storeId/session/:tableCode", async request => {
    const { storeId, tableCode } = request.params as { storeId: string; tableCode: string };
    const table = requireValue(await prisma.table.findFirst({ where: { storeId, archivedAt: null, OR: [{ code: tableCode.toUpperCase() }, { id: tableCode }] }, include: { zone: true } }), "Không tìm thấy bàn");
    const store = requireValue(await prisma.store.findUnique({ where: { id: storeId }, select: { id: true, name: true, phone: true, address: true } }));
    const categories = await prisma.category.findMany({ where: { storeId }, include: { menuItems: { where: { isAvailable: true, archivedAt: null, OR: [{ stockCount: null }, { stockCount: { gt: 0 } }] }, select: { id: true, name: true, price: true, image: true, description: true, variants: true, customizationGroups: true } } }, orderBy: { sortOrder: "asc" } });
    let sessionId = request.principal?.kind === "customer" && request.principal.tableId === table.id ? request.principal.sessionId : undefined;
    let pending = false;
    const proof = request.headers["x-session-request"];
    if (typeof proof === "string") {
      try {
        const decoded = app.jwt.verify<Principal>(proof);
        if (decoded.kind === "request" && decoded.tableId === table.id && decoded.storeId === storeId) {
          const row = await prisma.serviceRequest.findFirst({ where: { id: decoded.requestId, storeId, tableId: table.id, type: "SESSION" } });
          if (row?.status === "APPROVED" && row.sessionId === table.currentSessionId) sessionId = row.sessionId || undefined;
          pending = row?.status === "PENDING";
        }
      } catch { /* Invalid requests never grant session access. */ }
    }
    const session = sessionId ? await prisma.orderSession.findFirst({ where: { id: sessionId, storeId, tableId: table.id, status: "ACTIVE" } }) : null;
    return { success: true, data: { table: { id: table.id, name: table.name, code: table.code, zoneName: table.zone.name, status: table.status, currentSessionId: session?.id }, store, categories, offers: await publicPromotions(storeId), sessionStartedAt: session?.checkInAt.getTime(), isSessionActive: !!session, isPendingApproval: pending, ...(session ? { customerToken: customerToken(storeId, table.id, session.id, request.principal?.userId), sessionId: session.id } : {}) } };
  });
  app.post("/:storeId/session/request", async request => {
    const { storeId } = request.params as { storeId: string };
    const input = sessionInput.parse(request.body);
    const result = await command(request, storeId, "SESSION_REQUEST", async tx => {
      await checkLicense(tx, storeId, "MODULE_QR_ORDER");
      const table = await lockTable(tx, storeId, input.tableId);
      const row = await tx.serviceRequest.create({ data: { storeId, tableId: table.id, type: "SESSION", note: String(input.guestCount) } });
      return { tableId: table.id, tableCode: table.code, tableName: table.name, zoneName: table.zone.name, storeId, requestedAt: row.requestedAt.getTime(), guestCount: input.guestCount, requestId: row.id };
    });
    emitToStore(storeId, SocketEvents.SESSION_REQUESTED, result);
    return { success: true, data: { ...result, requestToken: app.jwt.sign({ kind: "request", userId: "request:" + result.requestId, role: "REQUEST", storeId, tableId: result.tableId, requestId: result.requestId }, { expiresIn: "12h" }) } };
  });
  app.post("/:storeId/session/approve", async request => {
    const storeId = currentStore(request);
    const input = sessionInput.parse(request.body);
    const result = await command(request, storeId, "SESSION_OPEN", async tx => {
      const { table, session } = await openSession(tx, storeId, input.tableId, input.guestCount);
      await tx.serviceRequest.updateMany({ where: { storeId, tableId: table.id, type: "SESSION", status: "PENDING" }, data: { status: "APPROVED", sessionId: session.id } });
      return { storeId, tableId: table.id, tableName: table.name, tableCode: table.code, zoneName: table.zone.name, sessionId: session.id, guestCount: session.guestCount };
    });
    emitToStore(storeId, SocketEvents.SESSION_APPROVED, result);
    emitToStore(storeId, SocketEvents.TABLE_STATUS_UPDATED, { ...result, status: "OCCUPIED" });
    return { success: true, data: result };
  });
  app.post("/:storeId/session/reject", async request => {
    const storeId = currentStore(request);
    const { tableId, reason } = z.object({ tableId: z.string(), reason: z.string().max(300).optional() }).parse(request.body);
    await command(request, storeId, "SESSION_REJECT", async tx => { await lockTable(tx, storeId, tableId); await tx.serviceRequest.updateMany({ where: { storeId, tableId, type: "SESSION", status: "PENDING" }, data: { status: "REJECTED" } }); return { success: true }; });
    emitToStore(storeId, SocketEvents.SESSION_REJECTED, { storeId, tableId, reason });
    return { success: true };
  });
  app.post("/:storeId/session/close", async request => {
    const storeId = currentStore(request);
    const { tableId } = sessionInput.parse(request.body);
    const result = await command(request, storeId, "SESSION_CLOSE_EMPTY", tx => closeEmptySession(tx, storeId, tableId));
    emitToStore(storeId, SocketEvents.SESSION_CLOSED, { ...result, storeId });
    if (result.sessionId) await disconnectSession(result.sessionId);
    return { success: true, data: result };
  });
  app.get("/:storeId/pending-requests", async request => {
    const storeId = currentStore(request);
    const rows = await prisma.serviceRequest.findMany({ where: { storeId, type: "SESSION", status: "PENDING", requestedAt: { gt: new Date(Date.now() - 3600000) } } });
    const tables = await prisma.table.findMany({ where: { storeId, id: { in: rows.map(r => r.tableId) } }, include: { zone: true } });
    return { success: true, data: rows.map(row => { const table = tables.find(t => t.id === row.tableId); return { tableId: row.tableId, tableName: table?.name, tableCode: table?.code, zoneName: table?.zone.name, storeId, guestCount: Number(row.note) || 2, requestedAt: row.requestedAt.getTime() }; }) };
  });
  app.post("/:storeId/session/unlock-pin", async request => {
    const { storeId } = request.params as { storeId: string };
    const input = sessionInput.extend({ pin: z.string().regex(/^\d{4}$/) }).parse(request.body);
    const result = await command(request, storeId, "SESSION_UNLOCK", async tx => {
      const table = await lockTable(tx, storeId, input.tableId);
      if (!timingSafeEqual(Buffer.from(input.pin), Buffer.from(getTablePin(table)))) throw new AppError(400, "Mã PIN không chính xác");
      const { session } = await openSession(tx, storeId, table.id, input.guestCount);
      return { storeId, tableId: table.id, tableName: table.name, tableCode: table.code, sessionId: session.id, guestCount: session.guestCount };
    });
    emitToStore(storeId, SocketEvents.SESSION_APPROVED, result);
    return { success: true, data: { ...result, customerToken: customerToken(storeId, result.tableId, result.sessionId) } };
  });
  app.post("/:storeId/tables/:tableId/rotate-pin", async request => {
    requireRoles(request, ["STORE_OWNER", "CASHIER"]);
    const storeId = currentStore(request);
    const { tableId } = request.params as { tableId: string };
    return { success: true, data: await command(request, storeId, "TABLE_ROTATE_PIN", async tx => { await lockTable(tx, storeId, tableId); const table = await tx.table.update({ where: { id_storeId: { id: tableId, storeId } }, data: { qrSecret: randomUUID() } }); return { pin: getTablePin(table) }; }) };
  });
  app.get("/:storeId/service-requests", async request => {
    const storeId = currentStore(request);
    const rows = await prisma.serviceRequest.findMany({ where: { storeId, type: { not: "SESSION" }, status: "PENDING", sessionId: { not: null } }, orderBy: { requestedAt: "desc" } });
    const tables = await prisma.table.findMany({ where: { storeId } });
    return { success: true, data: rows.map(r => ({ ...r, tableName: tables.find(t => t.id === r.tableId)?.name, time: r.requestedAt.toISOString() })) };
  });
  app.post("/:storeId/service-requests/:requestId/ack", async request => {
    const storeId = currentStore(request);
    const { requestId } = request.params as { requestId: string };
    return { success: true, data: await command(request, storeId, "SERVICE_ACK", async tx => {
      const row = requireValue(await tx.serviceRequest.findFirst({ where: { id: requestId, storeId, type: { not: "SESSION" } } }));
      return tx.serviceRequest.update({ where: { id: row.id }, data: { status: "COMPLETED" } });
    }) };
  });
  app.post("/:storeId/service-request", async request => {
    const storeId = currentStore(request);
    const input = z.object({ tableId: z.string(), type: z.enum(["ICE", "TISSUE", "CLEAN", "UTENSILS", "WAITER", "BILL"]), note: z.string().trim().max(300).optional() }).parse(request.body);
    const result = await command(request, storeId, "SERVICE_REQUEST", async tx => {
      const table = await lockTable(tx, storeId, input.tableId);
      const row = await tx.serviceRequest.create({ data: { storeId, tableId: table.id, sessionId: table.currentSessionId, type: input.type, note: input.note } });
      return { ...row, tableName: table.name, requestedAt: row.requestedAt.getTime() };
    });
    emitToStore(storeId, SocketEvents.SERVICE_REQUESTED, result);
    return { success: true, data: result };
  });
};
