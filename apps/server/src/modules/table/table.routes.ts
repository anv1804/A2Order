import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../../core/database/prismaClient.js";
import { emitToStore } from "../../core/websocket/socketServer.js";
import { SocketEvents } from "@a2order/shared";
import { clearOrdersForTable } from "../order/order.routes.js";

// Bộ đệm lưu trữ tạm thời các yêu cầu mở bàn chờ nhân viên duyệt (Staff Confirmation Gate)
interface PendingSessionRequest {
  tableId: string;
  tableName: string;
  tableCode: string;
  zoneName: string;
  storeId: string;
  requestedAt: number;
  guestCount?: number;
}
const pendingSessionRequests = new Map<string, PendingSessionRequest>();

export function generateDefaultTableCode(name: string, id?: string): string {
  if (!name || !name.trim()) return "";
  const clean = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Tìm cụm số trong tên
  const numMatch = clean.match(/\d+/);
  const numStr = numMatch ? numMatch[0].padStart(2, "0") : "";

  const upper = clean.toUpperCase();
  if (upper.startsWith("VIP")) {
    return numStr ? `VIP-${numStr}` : `VIP-${upper.replace(/[^A-Z0-9]/g, "").slice(3) || "01"}`;
  }
  if (upper.startsWith("BAN") || upper.startsWith("TB") || upper.startsWith("TABLE")) {
    return numStr ? `TB-${numStr}` : `TB-${upper.replace(/[^A-Z0-9]/g, "").slice(3) || "01"}`;
  }

  // Tên có nhiều từ, ví dụ "Sân Thượng 2" -> chữ cái đầu các từ: ST-02
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 1 && numStr) {
    const nonNumWords = words.filter((w) => !/^\d+$/.test(w));
    if (nonNumWords.length > 0) {
      const acronym = nonNumWords.map((w) => w[0].toUpperCase()).join("");
      return `${acronym}-${numStr}`;
    }
  }

  if (numStr) {
    const textPart = clean.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4);
    return textPart ? `${textPart}-${numStr}` : `TB-${numStr}`;
  }

  const slug = clean.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  return slug ? `TB-${slug}` : `TB-${(id || Math.random().toString(36).slice(2, 6)).slice(0, 4).toUpperCase()}`;
}

export function getTablePin(table: { id: string; qrSecret?: string | null }): string {
  const secret = table.qrSecret || table.id;
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    hash = (hash * 31 + secret.charCodeAt(i)) >>> 0;
  }
  return ((hash % 9000) + 1000).toString();
}

export function buildTableOrderQr(storeId: string, tableCode: string, tableId: string) {
  const baseUrl = (process.env.ORDER_BASE_URL || process.env.APP_URL || "http://localhost:3001").replace(/\/$/, "");
  const orderUrl = `${baseUrl}/order?store=${storeId}&table=${encodeURIComponent(tableCode)}&tableId=${tableId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(orderUrl)}&margin=12`;
  return { orderUrl, qrCodeUrl };
}

export const tableRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * 1. LẤY SƠ ĐỒ BÀN & KHU VỰC CỦA QUÁN
   * GET /api/tables/:storeId
   */
  fastify.get("/:storeId", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    try {
      const zones = await prisma.tableZone.findMany({
        where: { storeId },
        include: {
          tables: {
            orderBy: { name: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      // Chuẩn hóa định dạng tương thích với giao diện CMS
      const formattedZones = zones.map((z) => ({
        id: z.id,
        name: z.name,
        sortOrder: z.sortOrder,
        tables: z.tables.map((t) => {
          const code = t.code || generateDefaultTableCode(t.name, t.id);
          const pin = getTablePin(t);
          const { orderUrl, qrCodeUrl } = buildTableOrderQr(storeId, code, t.id);
          return {
            id: t.id,
            name: t.name,
            code,
            pin,
            orderUrl,
            capacity: 4,
            status: t.status as any,
            qrCodeUrl,
          };
        }),
      }));

      return { success: true, count: formattedZones.length, data: formattedZones };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 2. TẠO KHU VỰC MỚI
   * POST /api/tables/:storeId/zones
   */
  fastify.post("/:storeId/zones", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { name } = request.body as { name: string };
    if (!name || !name.trim()) {
      return reply.status(400).send({ success: false, error: "Tên khu vực là bắt buộc" });
    }

    try {
      const zone = await prisma.tableZone.create({
        data: {
          storeId,
          name: name.trim(),
        },
        include: { tables: true },
      });
      return { success: true, message: `Đã tạo khu vực "${zone.name}"`, data: zone };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 3. SỬA TÊN KHU VỰC
   * PUT /api/tables/:storeId/zones/:zoneId
   */
  fastify.put("/:storeId/zones/:zoneId", async (request, reply) => {
    const { zoneId } = request.params as { storeId: string; zoneId: string };
    const { name } = request.body as { name: string };
    if (!name || !name.trim()) {
      return reply.status(400).send({ success: false, error: "Tên khu vực là bắt buộc" });
    }

    try {
      const zone = await prisma.tableZone.update({
        where: { id: zoneId },
        data: { name: name.trim() },
        include: { tables: true },
      });
      return { success: true, message: `Đã đổi tên khu vực thành "${zone.name}"`, data: zone };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 4. XÓA KHU VỰC
   * DELETE /api/tables/:storeId/zones/:zoneId
   */
  fastify.delete("/:storeId/zones/:zoneId", async (request, reply) => {
    const { zoneId } = request.params as { storeId: string; zoneId: string };
    try {
      await prisma.tableZone.delete({
        where: { id: zoneId },
      });
      return { success: true, message: "Đã xóa khu vực thành công" };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 5. THÊM BÀN ĂN MỚI
   * POST /api/tables/:storeId/tables
   */
  fastify.post("/:storeId/tables", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { zoneId, name, code } = request.body as { zoneId: string; name: string; code?: string };

    if (!zoneId || !name || !name.trim()) {
      return reply.status(400).send({ success: false, error: "Khu vực và tên bàn là bắt buộc" });
    }

    const trimmedName = name.trim();
    const finalCode = code && code.trim() ? code.trim().toUpperCase() : generateDefaultTableCode(trimmedName);

    try {
      const table = await prisma.table.create({
        data: {
          storeId,
          zoneId,
          name: trimmedName,
          code: finalCode,
          status: "EMPTY",
        },
      });
      const { orderUrl, qrCodeUrl } = buildTableOrderQr(storeId, finalCode, table.id);
      return {
        success: true,
        message: `Đã thêm "${table.name}" (Mã: ${finalCode})`,
        data: { ...table, code: finalCode, pin: getTablePin(table), orderUrl, qrCodeUrl },
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 6. CẬP NHẬT TRẠNG THÁI / ĐỔI TÊN BÀN / MÃ BÀN
   * PATCH /api/tables/:storeId/tables/:tableId
   */
  fastify.patch("/:storeId/tables/:tableId", async (request, reply) => {
    const { tableId } = request.params as { storeId: string; tableId: string };
    const { name, status, zoneId, code } = request.body as { name?: string; status?: string; zoneId?: string; code?: string };

    try {
      const updated = await prisma.table.update({
        where: { id: tableId },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(status ? { status } : {}),
          ...(zoneId ? { zoneId } : {}),
          ...(code !== undefined ? { code: code.trim().toUpperCase() } : {}),
        },
      });
      const finalCode = updated.code || generateDefaultTableCode(updated.name, updated.id);
      const { orderUrl, qrCodeUrl } = buildTableOrderQr(updated.storeId, finalCode, updated.id);
      return {
        success: true,
        data: { ...updated, code: finalCode, pin: getTablePin(updated), orderUrl, qrCodeUrl },
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 7. XÓA BÀN ĂN
   * DELETE /api/tables/:storeId/tables/:tableId
   */
  fastify.delete("/:storeId/tables/:tableId", async (request, reply) => {
    const { tableId } = request.params as { storeId: string; tableId: string };
    try {
      await prisma.table.delete({
        where: { id: tableId },
      });
      return { success: true, message: "Đã xóa bàn ăn thành công" };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 8. KIỂM TRA TRẠNG THÁI PHIÊN BÀN (Dành cho khách quét QR vào /order)
   * GET /api/tables/:storeId/session/:tableCode
   */
  fastify.get("/:storeId/session/:tableCode", async (request, reply) => {
    const { storeId, tableCode } = request.params as { storeId: string; tableCode: string };

    try {
      let table = await prisma.table.findFirst({
        where: {
          storeId,
          OR: [
            { code: tableCode.toUpperCase() },
            { id: tableCode },
            { name: { equals: tableCode, mode: "insensitive" } },
          ],
        },
        include: {
          zone: true,
          orderSessions: {
            where: { status: "ACTIVE" },
            orderBy: { checkInAt: "desc" },
            take: 1,
          },
        },
      });

      // Nếu chưa tìm thấy theo code trong DB, duyệt tìm theo mã mặc định
      if (!table) {
        const allStoreTables = await prisma.table.findMany({
          where: { storeId },
          include: {
            zone: true,
            orderSessions: {
              where: { status: "ACTIVE" },
              orderBy: { checkInAt: "desc" },
              take: 1,
            },
          },
        });
        const matched = allStoreTables.find((t) => {
          const defCode = generateDefaultTableCode(t.name, t.id);
          return (
            defCode.toUpperCase() === tableCode.toUpperCase() ||
            t.name.toLowerCase().includes(tableCode.toLowerCase()) ||
            t.id === tableCode
          );
        });
        if (matched) {
          table = matched;
          if (!table.code) {
            const autoCode = generateDefaultTableCode(table.name, table.id);
            await prisma.table.update({ where: { id: table.id }, data: { code: autoCode } }).catch(() => {});
            table.code = autoCode;
          }
        }
      }

      if (!table) {
        return reply.status(404).send({ success: false, error: "Không tìm thấy thông tin bàn tương ứng" });
      }

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, name: true, phone: true, address: true },
      });

      const categories = await prisma.category.findMany({
        where: { storeId },
        include: {
          menuItems: {
            where: { isAvailable: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      const activeSession = table.orderSessions[0] || null;
      const isSessionActive = Boolean(
        table.status !== "EMPTY" && (activeSession || table.currentSessionId)
      );
      const isPending = pendingSessionRequests.has(`${storeId}:${table.id}`);

      return {
        success: true,
        data: {
          table: {
            id: table.id,
            name: table.name,
            code: table.code || generateDefaultTableCode(table.name, table.id),
            zoneName: table.zone.name,
            status: table.status,
            currentSessionId: activeSession?.id || table.currentSessionId,
          },
          store: store || { id: storeId, name: "A2Order Bistro" },
          isSessionActive,
          isPendingApproval: isPending,
          categories,
        },
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 9. KHÁCH QUÉT QR GỬI YÊU CẦU MỞ BÀN (Staff Confirmation Gate)
   * POST /api/tables/:storeId/session/request
   */
  fastify.post("/:storeId/session/request", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { tableId, tableCode, guestCount } = request.body as {
      tableId?: string;
      tableCode?: string;
      guestCount?: number;
    };

    try {
      let table = await prisma.table.findFirst({
        where: {
          storeId,
          OR: [
            ...(tableId ? [{ id: tableId }] : []),
            ...(tableCode ? [{ code: tableCode.toUpperCase() }] : []),
          ],
        },
        include: { zone: true },
      });

      if (!table && tableCode) {
        const allStoreTables = await prisma.table.findMany({
          where: { storeId },
          include: { zone: true },
        });
        const matched = allStoreTables.find((t) => {
          const defCode = generateDefaultTableCode(t.name, t.id);
          return defCode.toUpperCase() === tableCode.toUpperCase() || t.id === tableCode;
        });
        if (matched) {
          table = matched;
        }
      }

      if (!table) {
        return reply.status(404).send({ success: false, error: "Bàn không tồn tại" });
      }

      // Nếu bàn đã mở phiên sẵn (ví dụ nhân viên đã mở trước)
      if (table.currentSessionId && table.status !== "EMPTY") {
        return {
          success: true,
          isSessionActive: true,
          message: "Bàn đã ở trạng thái phục vụ",
          data: { tableId: table.id, sessionId: table.currentSessionId },
        };
      }

      // Lưu vào danh sách chờ duyệt
      const reqKey = `${storeId}:${table.id}`;
      const payload: PendingSessionRequest = {
        tableId: table.id,
        tableName: table.name,
        tableCode: table.code || generateDefaultTableCode(table.name, table.id),
        zoneName: table.zone.name,
        storeId,
        requestedAt: Date.now(),
        guestCount: guestCount || 2,
      };
      pendingSessionRequests.set(reqKey, payload);

      // Phát WebSocket thông báo tới nhân viên / thu ngân quán
      emitToStore(storeId, SocketEvents.SESSION_REQUESTED, payload);

      return {
        success: true,
        message: "Đã gửi yêu cầu mở bàn. Vui lòng đợi nhân viên xác nhận.",
        data: payload,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 10. NHÂN VIÊN BẤM DUYỆT MỞ BÀN (1-Chạm)
   * POST /api/tables/:storeId/session/approve
   */
  fastify.post("/:storeId/session/approve", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { tableId, guestCount } = request.body as { tableId: string; guestCount?: number };

    try {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: { zone: true },
      });

      if (!table) {
        return reply.status(404).send({ success: false, error: "Bàn không tồn tại" });
      }

      // Tạo OrderSession mới trong PostgreSQL
      const session = await prisma.orderSession.create({
        data: {
          storeId,
          tableId,
          status: "ACTIVE",
          checkInAt: new Date(),
        },
      });

      // Cập nhật trạng thái bàn sang OCCUPIED và gắn currentSessionId
      await prisma.table.update({
        where: { id: tableId },
        data: {
          status: "OCCUPIED",
          currentSessionId: session.id,
        },
      });

      // Xóa khỏi danh sách chờ
      pendingSessionRequests.delete(`${storeId}:${tableId}`);

      const approvedPayload = {
        storeId,
        tableId,
        sessionId: session.id,
        tableName: table.name,
        tableCode: table.code || generateDefaultTableCode(table.name, table.id),
        zoneName: table.zone.name,
        guestCount: guestCount || 2,
      };

      // Bắn WebSocket để điện thoại khách tự động nhảy vào menu ngay tức thì
      emitToStore(storeId, SocketEvents.SESSION_APPROVED, approvedPayload);
      emitToStore(storeId, SocketEvents.TABLE_STATUS_UPDATED, { storeId, tableId, status: "OCCUPIED" });

      return {
        success: true,
        message: `Đã mở ${table.name} thành công`,
        data: approvedPayload,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 11. NHÂN VIÊN TỪ CHỐI YÊU CẦU MỞ BÀN (Ví dụ không có khách ngồi, spam từ bên ngoài)
   * POST /api/tables/:storeId/session/reject
   */
  fastify.post("/:storeId/session/reject", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { tableId, reason } = request.body as { tableId: string; reason?: string };

    pendingSessionRequests.delete(`${storeId}:${tableId}`);

    emitToStore(storeId, SocketEvents.SESSION_REJECTED, {
      storeId,
      tableId,
      reason: reason || "Nhân viên xác nhận bàn hiện chưa có khách ngồi thực tế",
    });

    return { success: true, message: "Đã từ chối yêu cầu mở bàn" };
  });

  /**
   * 12. ĐÓNG PHIÊN BÀN (Khi thanh toán / Dọn bàn / Trả bàn)
   * POST /api/tables/:storeId/session/close
   */
  fastify.post("/:storeId/session/close", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { tableId } = request.body as { tableId: string };

    try {
      const table = await prisma.table.findUnique({ where: { id: tableId } });
      if (!table) {
        return reply.status(404).send({ success: false, error: "Bàn không tồn tại" });
      }

      if (table.currentSessionId) {
        await prisma.orderSession
          .update({
            where: { id: table.currentSessionId },
            data: { status: "CLOSED", checkOutAt: new Date() },
          })
          .catch(() => {});
      }

      const updatedTable = await prisma.table.update({
        where: { id: tableId },
        data: {
          status: "EMPTY",
          currentSessionId: null,
          qrSecret: randomUUID(),
        },
      });
      const newPin = getTablePin(updatedTable);

      pendingSessionRequests.delete(`${storeId}:${tableId}`);
      clearOrdersForTable(storeId, tableId, table.code || undefined);

      // Bắn WebSocket thông báo phiên đã đóng -> khách ở nhà hoặc link cũ bị văng ra
      emitToStore(storeId, SocketEvents.SESSION_CLOSED, {
        storeId,
        tableId,
        tableCode: table.code,
        tableName: table.name,
      });
      emitToStore(storeId, SocketEvents.TABLE_STATUS_UPDATED, { storeId, tableId, status: "EMPTY", pin: newPin });

      return { success: true, message: `Đã đóng phiên ${table.name}`, pin: newPin };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 13. LẤY DANH SÁCH YÊU CẦU MỞ BÀN ĐANG CHỜ DUYỆT
   * GET /api/tables/:storeId/pending-requests
   */
  fastify.get("/:storeId/pending-requests", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const requests = Array.from(pendingSessionRequests.values()).filter((r) => r.storeId === storeId);
    return { success: true, count: requests.length, data: requests };
  });

  /**
   * 14. KHÁCH TỰ MỞ BÀN BẰNG MÃ PIN BẢO MẬT (Anti-Squatting / Bypass Staff Wait)
   * POST /api/tables/:storeId/session/unlock-pin
   */
  fastify.post("/:storeId/session/unlock-pin", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { tableId, tableCode, pin, guestCount } = request.body as {
      tableId?: string;
      tableCode?: string;
      pin?: string;
      guestCount?: number;
    };

    if (!pin || typeof pin !== "string" || !pin.trim()) {
      return reply.status(400).send({ success: false, error: "Vui lòng nhập mã PIN mở bàn" });
    }

    try {
      let table = await prisma.table.findFirst({
        where: {
          storeId,
          OR: [
            ...(tableId ? [{ id: tableId }] : []),
            ...(tableCode ? [{ code: tableCode.toUpperCase() }] : []),
          ],
        },
        include: { zone: true },
      });

      if (!table && tableCode) {
        const allStoreTables = await prisma.table.findMany({
          where: { storeId },
          include: { zone: true },
        });
        const matched = allStoreTables.find((t) => {
          const defCode = generateDefaultTableCode(t.name, t.id);
          return defCode.toUpperCase() === tableCode.toUpperCase() || t.id === tableCode;
        });
        if (matched) {
          table = matched;
        }
      }

      if (!table) {
        return reply.status(404).send({ success: false, error: "Bàn không tồn tại" });
      }

      const expectedPin = getTablePin(table);
      if (pin.trim() !== expectedPin) {
        return reply.status(400).send({
          success: false,
          error: "Mã PIN không chính xác. Vui lòng kiểm tra lại thẻ bàn hoặc hỏi nhân viên.",
        });
      }

      // Nếu bàn đã có session ACTIVE thì dùng lại session đó, nếu chưa thì tạo mới
      let sessionId = table.currentSessionId;
      if (!sessionId || table.status === "EMPTY") {
        const session = await prisma.orderSession.create({
          data: {
            storeId,
            tableId: table.id,
            status: "ACTIVE",
            checkInAt: new Date(),
          },
        });
        sessionId = session.id;

        await prisma.table.update({
          where: { id: table.id },
          data: {
            status: "OCCUPIED",
            currentSessionId: sessionId,
          },
        });
      }

      // Xóa khỏi danh sách chờ nếu có yêu cầu pending trước đó
      pendingSessionRequests.delete(`${storeId}:${table.id}`);

      const approvedPayload = {
        storeId,
        tableId: table.id,
        sessionId,
        tableName: table.name,
        tableCode: table.code || generateDefaultTableCode(table.name, table.id),
        zoneName: table.zone.name,
        guestCount: guestCount || 2,
        unlockedVia: "PIN",
      };

      // Bắn WebSocket thông báo tới mọi client & POS
      emitToStore(storeId, SocketEvents.SESSION_APPROVED, approvedPayload);
      emitToStore(storeId, SocketEvents.TABLE_STATUS_UPDATED, { storeId, tableId: table.id, status: "OCCUPIED" });

      return {
        success: true,
        message: `Mở ${table.name} thành công bằng mã PIN`,
        data: approvedPayload,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 15. ĐỔI MÃ PIN MỚI CHO BÀN (Rotate PIN on Demand)
   * POST /api/tables/:storeId/tables/:tableId/rotate-pin
   */
  fastify.post("/:storeId/tables/:tableId/rotate-pin", async (request, reply) => {
    const { storeId, tableId } = request.params as { storeId: string; tableId: string };
    try {
      const updatedTable = await prisma.table.update({
        where: { id: tableId },
        data: { qrSecret: randomUUID() },
        include: { zone: true },
      });
      const newPin = getTablePin(updatedTable);
      emitToStore(storeId, SocketEvents.TABLE_STATUS_UPDATED, {
        storeId,
        tableId,
        status: updatedTable.status,
        pin: newPin,
      });
      return { success: true, pin: newPin, message: `Đã đổi mã PIN mới cho ${updatedTable.name}: ${newPin}` };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 16. KHÁCH YÊU CẦU HỖ TRỢ NHANH TẠI BÀN (Quick Service Request)
   * POST /api/tables/:storeId/service-request
   */
  fastify.post("/:storeId/service-request", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { tableId, tableCode, tableName, type, note } = (request.body || {}) as any;

    const serviceTypeLabels: Record<string, string> = {
      ICE: "Xin thêm đá 🧊",
      TISSUE: "Xin thêm khăn giấy 🧻",
      CLEAN: "Yêu cầu dọn bàn 🧹",
      UTENSILS: "Xin thêm chén / muỗng / đũa 🥢",
      WAITER: "Gọi nhân viên lại bàn 🙋",
      BILL: "Yêu cầu tính tiền 💳",
    };

    const payload = {
      id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      storeId,
      tableId,
      tableCode,
      tableName: tableName || "Bàn",
      type: type || "WAITER",
      label: serviceTypeLabels[type] || "Yêu cầu hỗ trợ",
      note: note || "",
      requestedAt: Date.now(),
    };

    emitToStore(storeId, SocketEvents.SERVICE_REQUESTED, payload);
    return { success: true, message: `Đã gửi yêu cầu: ${payload.label}`, data: payload };
  });
};
