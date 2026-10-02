import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { prisma } from "../../core/database/prismaClient.js";
import { emitToStore } from "../../core/websocket/socketServer.js";
import { SocketEvents } from "@a2order/shared";

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

export const orderRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * 1. KHÁCH GỬI ĐƠN GỌI MÓN (Chờ quán duyệt trước khi vào bếp)
   * POST /api/orders/submit
   */
  fastify.post("/submit", async (request, reply) => {
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

  // Màn hình KDS Bếp: Lấy danh sách món đang cần nấu
  fastify.get("/kds/tickets", async (request, reply) => {
    return { success: true, data: [] };
  });

  // Bếp cập nhật trạng thái món: Đang nấu -> Xong
  fastify.patch("/items/:itemId/status", async (request, reply) => {
    return { success: true };
  });
};
