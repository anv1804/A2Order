import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { prisma } from "../../core/database/prismaClient.js";
import { emitToStore } from "../../core/websocket/socketServer.js";
import { SocketEvents } from "@a2order/shared";
import { clearOrdersForTable } from "../order/order.routes.js";
import { antiSpamMiddleware } from "../../core/middlewares/antiSpamMiddleware.js";

export const billingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * 1. TẠO MÃ DYNAMIC VIETQR NAPAS 247 CHUẨN
   * POST /api/billing/generate-vietqr
   */
  fastify.post("/generate-vietqr", async (request, reply) => {
    const { storeId, tableId, tableName, amount, orderSessionId } = (request.body || {}) as {
      storeId?: string;
      tableId?: string;
      tableName?: string;
      amount?: number;
      orderSessionId?: string;
    };

    if (!amount || amount <= 0) {
      return reply.status(400).send({ success: false, error: "Số tiền thanh toán không hợp lệ" });
    }

    let bankBin = "970422"; // MB Bank mặc định
    let bankAccount = "0903111222";
    let bankOwnerName = "A2ORDER FNB VIETNAM";

    if (storeId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { bankBin: true, bankAccount: true, bankOwnerName: true },
      });
      if (store?.bankBin && store?.bankAccount) {
        bankBin = store.bankBin;
        bankAccount = store.bankAccount;
        if (store.bankOwnerName) bankOwnerName = store.bankOwnerName;
      }
    }

    const cleanTableName = (tableName || "Ban").replace(/[^a-zA-Z0-9]/g, "");
    const addInfo = `${cleanTableName}_${Date.now().toString().slice(-4)}`;
    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(addInfo)}`;

    return {
      success: true,
      qrUrl,
      bankBin,
      bankAccount,
      bankOwnerName,
      amount: Math.round(amount),
      addInfo,
    };
  });

  /**
   * 2. TẠO HÓA ĐƠN & GHI NHẬN DOANH THU THỰC TẾ XUỐNG POSTGRESQL (PRISMA)
   * POST /api/billing/create-bill
   */
  fastify.post(
    "/create-bill",
    {
      preHandler: [async (req, rep) => antiSpamMiddleware(req, rep, "billing")],
    },
    async (request, reply) => {
      const {
        storeId,
        tableId,
        orderSessionId,
        totalAmount = 0,
        discountAmount = 0,
        finalAmount = 0,
        paymentMethod = "CASH",
        transactionCode,
      } = (request.body || {}) as {
        storeId: string;
        tableId: string;
        orderSessionId?: string;
        totalAmount: number;
        discountAmount?: number;
        finalAmount: number;
        paymentMethod?: "CASH" | "VIETQR" | "CARD";
        transactionCode?: string;
      };

      if (!storeId || !tableId) {
        return reply.status(400).send({ success: false, error: "Thiếu storeId hoặc tableId" });
      }

      try {
        // 1. Tìm hoặc xác định phiên bàn (OrderSession)
        let sessionId = orderSessionId;
        if (!sessionId) {
          const table = await prisma.table.findUnique({
            where: { id: tableId },
            select: { currentSessionId: true },
          });
          sessionId = table?.currentSessionId || undefined;
        }

        if (!sessionId) {
          const activeSession = await prisma.orderSession.findFirst({
            where: { storeId, tableId, status: "ACTIVE" },
            orderBy: { checkInAt: "desc" },
          });
          sessionId = activeSession?.id;
        }

        if (!sessionId) {
          const newSession = await prisma.orderSession.create({
            data: {
              storeId,
              tableId,
              status: "COMPLETED",
              checkOutAt: new Date(),
            },
          });
          sessionId = newSession.id;
        }

        // 2. Tạo bản ghi Hóa đơn (Bill) bền bỉ trong Database
        const bill = await prisma.bill.create({
          data: {
            storeId,
            orderSessionId: sessionId,
            totalAmount: Math.round(totalAmount),
            discountAmount: Math.round(discountAmount),
            finalAmount: Math.round(finalAmount > 0 ? finalAmount : totalAmount - discountAmount),
            paymentMethod,
            paymentStatus: "PAID",
            transactionCode: transactionCode || `TX-${Date.now().toString().slice(-6)}`,
          },
        });

        // 3. Đóng phiên bàn & giải phóng bàn
        await prisma.orderSession.updateMany({
          where: { id: sessionId },
          data: { status: "COMPLETED", checkOutAt: new Date() },
        }).catch(() => {});

        const table = await prisma.table.update({
          where: { id: tableId },
          data: { status: "EMPTY", currentSessionId: null },
        });

        // 4. Xóa bộ đệm pending orders của bàn
        clearOrdersForTable(storeId, tableId, table.code || undefined);

        // 5. Bắn WebSocket thông báo đã thanh toán tới mọi thiết bị
        emitToStore(storeId, SocketEvents.PAYMENT_CONFIRMED, {
          storeId,
          tableId,
          tableCode: table.code,
          tableName: table.name,
          billId: bill.id,
          finalAmount: bill.finalAmount,
          paymentMethod: bill.paymentMethod,
          paidAt: Date.now(),
        });

        emitToStore(storeId, SocketEvents.TABLE_STATUS_UPDATED, {
          storeId,
          tableId,
          status: "EMPTY",
        });

        emitToStore(storeId, SocketEvents.SESSION_CLOSED, {
          storeId,
          tableId,
          tableCode: table.code,
          tableName: table.name,
        });

        return {
          success: true,
          message: `Thanh toán thành công cho bàn ${table.name}`,
          data: bill,
        };
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          error: "DATABASE_ERROR",
          message: err?.message || "Lỗi lưu trữ hóa đơn",
        });
      }
    }
  );

  /**
   * 3. LỊCH SỬ HÓA ĐƠN CỦA QUÁN
   * GET /api/billing/:storeId/history
   */
  fastify.get("/:storeId/history", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { limit = "30" } = (request.query || {}) as { limit?: string };

    const bills = await prisma.bill.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: Math.min(100, Math.max(1, parseInt(limit, 10))),
      include: {
        orderSession: {
          include: { table: { select: { name: true, code: true } } },
        },
      },
    });

    return { success: true, count: bills.length, data: bills };
  });

  /**
   * 4. WEBHOOK TỪ CỔNG THANH TOÁN (PayOS / SePay / VietQR)
   * POST /api/billing/webhook/payment
   */
  fastify.post("/webhook/payment", async (request, reply) => {
    const body = (request.body || {}) as any;
    const content = String(body.content || body.description || body.orderCode || "");
    const amount = Number(body.amount || body.transferAmount || 0);

    console.log(`[Billing Webhook] Nhận biến động số dư: ${amount} đ - Nội dung: "${content}"`);

    // Bắn WebSocket thông báo tức thì cho POS
    if (body.storeId) {
      emitToStore(body.storeId, SocketEvents.PAYMENT_CONFIRMED, {
        storeId: body.storeId,
        amount,
        content,
        timestamp: Date.now(),
      });
    }

    return { success: true, message: "Webhook processed" };
  });
};
