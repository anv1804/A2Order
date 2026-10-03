import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { prisma } from "../../core/database/prismaClient.js";
import { emitToStore } from "../../core/websocket/socketServer.js";
import { SocketEvents } from "@a2order/shared";
import { antiSpamMiddleware } from "../../core/middlewares/antiSpamMiddleware.js";

// Bộ đệm lưu trữ các đơn chờ duyệt từ khách QR
interface PendingOrder {
  orderId: string;
  storeId: string;
  tableId: string;
  tableCode: string;
  tableName: string;
  items: Array<{
    id: string;
    dishId?: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
    category?: string;
    status: "PENDING_APPROVAL" | "COOKING" | "SERVED" | "CANCELLED";
  }>;
  voucherCode?: string;
  discountAmount?: number;
  customerPhone?: string;
  totalAmount: number;
  finalAmount: number;
  submittedAt: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
}

const pendingOrders = new Map<string, PendingOrder>();

async function persistApprovedOrderToDb(order: PendingOrder) {
  try {
    let session = await prisma.orderSession.findFirst({
      where: {
        storeId: order.storeId,
        tableId: order.tableId,
        status: "ACTIVE",
      },
      include: { batches: true },
    });

    if (!session) {
      session = await prisma.orderSession.create({
        data: {
          storeId: order.storeId,
          tableId: order.tableId,
          status: "ACTIVE",
        },
        include: { batches: true },
      });
      await prisma.table.update({
        where: { id: order.tableId },
        data: { currentSessionId: session.id, status: "OCCUPIED" },
      }).catch(() => {});
    }

    const nextBatchNum = (session.batches?.length || 0) + 1;
    const batch = await prisma.orderBatch.create({
      data: {
        orderSessionId: session.id,
        batchNumber: nextBatchNum,
        isCustomerQr: true,
      },
    });

    const sampleMenuItem = await prisma.menuItem.findFirst({
      where: { storeId: order.storeId },
      select: { id: true },
    });

    for (const item of order.items) {
      let validMenuItemId = item.dishId;
      if (validMenuItemId) {
        const exists = await prisma.menuItem.findUnique({
          where: { id: validMenuItemId },
          select: { id: true },
        });
        if (!exists) validMenuItemId = sampleMenuItem?.id;
      } else {
        validMenuItemId = sampleMenuItem?.id;
      }

      if (validMenuItemId) {
        await prisma.orderItem.create({
          data: {
            id: item.id,
            orderBatchId: batch.id,
            menuItemId: validMenuItemId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || null,
            status: "COOKING",
          },
        }).catch((err) => {
          console.warn("[Prisma] Lỗi tạo OrderItem:", err?.message);
        });
      }
    }
  } catch (err: any) {
    console.warn("[Prisma] Lỗi lưu trữ Order xuống DB:", err?.message);
  }
}

export const orderRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * 1. KHÁCH GỬI ĐƠN GỌI MÓN (Chờ quán duyệt trước khi vào bếp)
   * POST /api/orders/submit
   */
  fastify.post(
    "/submit",
    {
      preHandler: [async (req, rep) => antiSpamMiddleware(req, rep, "order")],
    },
    async (request, reply) => {
    const {
      storeId,
      tableId,
      tableCode,
      tableName,
      items,
      voucherCode,
      discountAmount = 0,
      customerPhone,
      totalAmount,
      notes,
    } = (request.body || {}) as any;

    if (!storeId || !tableId || !items || !Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({ success: false, error: "Thông tin đơn hàng không hợp lệ" });
    }

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const finalAmount = Math.max(0, (totalAmount || 0) - (discountAmount || 0));

    const formattedItems = items.map((it: any, idx: number) => ({
      id: it.id || `item-${Date.now()}-${idx}`,
      dishId: it.dishId,
      name: it.name,
      price: it.price,
      quantity: it.quantity || 1,
      notes: it.notes || notes || "",
      category: it.category || "Món gọi",
      status: "PENDING_APPROVAL" as const,
    }));

    const newOrder: PendingOrder = {
      orderId,
      storeId,
      tableId,
      tableCode: tableCode || "TB",
      tableName: tableName || "Bàn",
      items: formattedItems,
      voucherCode: voucherCode || undefined,
      discountAmount: discountAmount || 0,
      customerPhone: customerPhone || undefined,
      totalAmount: totalAmount || 0,
      finalAmount,
      submittedAt: Date.now(),
      status: "PENDING_APPROVAL",
    };

    pendingOrders.set(orderId, newOrder);

    // Bắn WebSocket thông báo tới nhân viên / POS: Có đơn cần duyệt!
    emitToStore(storeId, SocketEvents.ORDER_APPROVAL_REQUESTED, newOrder);

    return {
      success: true,
      message: "Đơn hàng đã gửi thành công, đang chờ nhân viên quán xác nhận vào bếp",
      data: newOrder,
    };
  });

  /**
   * 2. LẤY DANH SÁCH ĐƠN CHỜ DUYỆT CỦA QUÁN
   * GET /api/orders/:storeId/pending
   */
  fastify.get("/:storeId/pending", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const orders = Array.from(pendingOrders.values()).filter(
      (o) => o.storeId === storeId && o.status === "PENDING_APPROVAL"
    );
    return { success: true, count: orders.length, data: orders };
  });

  /**
   * 3. NHÂN VIÊN DUYỆT ĐƠN VÀO BẾP
   * POST /api/orders/:storeId/:orderId/approve
   */
  fastify.post("/:storeId/:orderId/approve", async (request, reply) => {
    const { storeId, orderId } = request.params as { storeId: string; orderId: string };
    const order = pendingOrders.get(orderId);

    if (!order) {
      return reply.status(404).send({ success: false, error: "Đơn hàng không tồn tại hoặc đã xử lý" });
    }

    order.status = "APPROVED";
    order.items = order.items.map((i) =>
      i.status === "PENDING_APPROVAL" ? { ...i, status: "COOKING" } : i
    );

    // Bắn WebSocket tới mọi máy (POS, Khách, KDS Bếp)
    emitToStore(storeId, SocketEvents.ORDER_APPROVED, {
      ...order,
      approvedAt: Date.now(),
    });

    // Cũng bắn ORDER_SUBMITTED cho POS và KDS tương thích
    emitToStore(storeId, SocketEvents.ORDER_SUBMITTED, {
      storeId,
      tableId: order.tableId,
      tableName: order.tableName,
      tableCode: order.tableCode,
      items: order.items.filter((i) => i.status === "COOKING"),
      voucherCode: order.voucherCode,
      discountAmount: order.discountAmount,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
    });

    // Ghi nhận đơn hàng bền bỉ xuống database PostgreSQL qua Prisma
    persistApprovedOrderToDb(order).catch((err) => {
      console.warn("[Order] Lỗi lưu DB ngầm:", err?.message);
    });

    return { success: true, message: `Đã duyệt đơn ${order.tableName} vào bếp`, data: order };
  });

  /**
   * 4. NHÂN VIÊN TỪ CHỐI ĐƠN
   * POST /api/orders/:storeId/:orderId/reject
   */
  fastify.post("/:storeId/:orderId/reject", async (request, reply) => {
    const { storeId, orderId } = request.params as { storeId: string; orderId: string };
    const { reason } = (request.body || {}) as { reason?: string };
    const order = pendingOrders.get(orderId);

    if (!order) {
      return reply.status(404).send({ success: false, error: "Đơn hàng không tồn tại" });
    }

    order.status = "REJECTED";
    pendingOrders.delete(orderId);

    emitToStore(storeId, SocketEvents.ORDER_REJECTED, {
      orderId,
      storeId,
      tableId: order.tableId,
      tableName: order.tableName,
      reason: reason || "Quán không thể phục vụ đơn này vào thời điểm hiện tại",
    });

    return { success: true, message: "Đã từ chối đơn hàng", data: { orderId } };
  });

  /**
   * 5. KHÁCH HỦY MÓN KHI CHƯA CHẾ BIẾN (Nếu bếp chưa làm)
   * POST /api/orders/:storeId/cancel-item
   */
  fastify.post("/:storeId/cancel-item", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { orderId, itemId, tableId } = (request.body || {}) as {
      orderId?: string;
      itemId: string;
      tableId: string;
    };

    if (orderId && pendingOrders.has(orderId)) {
      const order = pendingOrders.get(orderId)!;
      const targetItem = order.items.find((i) => i.id === itemId);

      if (!targetItem) {
        return reply.status(404).send({ success: false, error: "Món không tồn tại trong đơn" });
      }

      if (targetItem.status !== "PENDING_APPROVAL") {
        return reply.status(400).send({
          success: false,
          error: "Bếp đã bắt đầu chế biến món này, không thể hủy. Vui lòng liên hệ nhân viên phục vụ.",
        });
      }

      targetItem.status = "CANCELLED";

      emitToStore(storeId, SocketEvents.ORDER_ITEM_CANCELLED, {
        orderId,
        itemId,
        dishName: targetItem.name,
        tableId,
        tableName: order.tableName,
        storeId,
      });

      return {
        success: true,
        message: `Đã hủy món ${targetItem.name}`,
        data: { itemId, orderId },
      };
    }

    // Nếu không có orderId tạm, vẫn phát socket để POS đồng bộ
    emitToStore(storeId, SocketEvents.ORDER_ITEM_CANCELLED, {
      orderId,
      itemId,
      tableId,
      storeId,
    });

    return { success: true, message: "Đã gửi yêu cầu hủy món" };
  });

  /**
   * 6. LẤY TẤT CẢ MÓN ĐÃ ĐẶT CỦA BÀN TRONG PHIÊN HIỆN TẠI (Đồng bộ đa thiết bị & sau khi F5)
   * GET /api/orders/:storeId/table/:tableId
   */
  fastify.get("/:storeId/table/:tableId", async (request, reply) => {
    const { storeId, tableId } = request.params as { storeId: string; tableId: string };
    const { tableCode } = (request.query || {}) as { tableCode?: string };

    const orders = Array.from(pendingOrders.values()).filter(
      (o) =>
        o.storeId === storeId &&
        (o.tableId === tableId ||
          (tableCode && o.tableCode.toUpperCase() === tableCode.toUpperCase())) &&
        o.status !== "REJECTED"
    );

    let allItems = orders.flatMap((o) =>
      o.items.map((it) => ({
        ...it,
        orderId: o.orderId,
        orderedAt: new Date(o.submittedAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }))
    );

    // Nếu in-memory không có (ví dụ server vừa restart), fallback truy vấn từ PostgreSQL
    if (allItems.length === 0) {
      try {
        const activeSession = await prisma.orderSession.findFirst({
          where: {
            storeId,
            tableId,
            status: "ACTIVE",
          },
          include: {
            batches: {
              include: {
                items: {
                  include: { menuItem: true },
                },
              },
            },
          },
        });

        if (activeSession && activeSession.batches.length > 0) {
          allItems = activeSession.batches.flatMap((b) =>
            b.items.map((it) => ({
              id: it.id,
              dishId: it.menuItemId,
              name: it.menuItem?.name || "Món ăn",
              price: it.price,
              quantity: it.quantity,
              notes: it.notes || "",
              category: "Món đã gọi",
              status: (it.status === "QUEUED" ? "PENDING_APPROVAL" : it.status) as any,
              orderId: b.id,
              orderedAt: new Date(it.createdAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))
          );
        }
      } catch (err: any) {
        console.warn("[Prisma] Lỗi đọc OrderSession từ DB:", err?.message);
      }
    }

    return {
      success: true,
      orders,
      items: allItems,
      totalAmount: allItems
        .filter((it) => it.status !== "CANCELLED")
        .reduce((sum, it) => sum + it.price * it.quantity, 0),
    };
  });

  // Màn hình KDS Bếp: Lấy danh sách vé món đang cần nấu (Hỗ trợ cả /kds/tickets và /:storeId/kds/tickets)
  const handleGetKdsTickets = async (request: any) => {
    const storeId = request.params?.storeId || request.query?.storeId;
    const allOrders = Array.from(pendingOrders.values()).filter(
      (o) => (!storeId || o.storeId === storeId) && o.status !== "REJECTED"
    );

    const tickets = allOrders
      .filter((o) => o.items.some((i) => i.status === "COOKING" || i.status === "PENDING_APPROVAL"))
      .map((o) => {
        const cookingItems = o.items.filter((i) => i.status !== "CANCELLED");
        return {
          id: o.orderId,
          ticketCode: o.orderId.slice(-6).toUpperCase(),
          tableName: o.tableName || `Bàn ${o.tableCode}`,
          tableCode: o.tableCode,
          station: "KITCHEN",
          status: o.items.some((i) => i.status === "COOKING") ? "IN_PROGRESS" : "NEW",
          createdAt: o.submittedAt,
          priority: "NORMAL",
          items: cookingItems.map((it) => ({
            id: it.id,
            name: it.name,
            quantity: it.quantity,
            notes: it.notes,
            status: it.status === "COOKING" ? "COOKING" : "QUEUED",
          })),
        };
      });

    return { success: true, count: tickets.length, data: tickets };
  };

  fastify.get("/kds/tickets", handleGetKdsTickets);
  fastify.get("/:storeId/kds/tickets", handleGetKdsTickets);

  // Bếp hoặc Quán cập nhật trạng thái món: COOKING -> SERVED hoặc CANCELLED
  fastify.patch("/items/:itemId/status", async (request, reply) => {
    const { itemId } = request.params as { itemId: string };
    const { storeId, tableId, tableCode, status, dishName } = (request.body || {}) as {
      storeId?: string;
      tableId?: string;
      tableCode?: string;
      status: "PENDING_APPROVAL" | "COOKING" | "SERVED" | "CANCELLED";
      dishName?: string;
    };

    let updated = false;
    for (const [_, order] of pendingOrders) {
      if (storeId && order.storeId !== storeId) continue;
      const targetItem = order.items.find((i) => i.id === itemId || (dishName && i.name === dishName));
      if (targetItem) {
        targetItem.status = status;
        updated = true;
      }
    }

    if (storeId) {
      emitToStore(storeId, SocketEvents.ORDER_ITEM_STATUS_CHANGED, {
        storeId,
        tableId,
        tableCode,
        itemId,
        dishName,
        status,
      });
    }

    return { success: true, updated, message: `Đã cập nhật trạng thái món thành ${status}` };
  });
};

export function clearOrdersForTable(storeId: string, tableId?: string, tableCode?: string) {
  for (const [orderId, order] of pendingOrders) {
    if (order.storeId === storeId) {
      if (
        (tableId && order.tableId === tableId) ||
        (tableCode && order.tableCode.toUpperCase() === tableCode.toUpperCase())
      ) {
        pendingOrders.delete(orderId);
      }
    }
  }
}
