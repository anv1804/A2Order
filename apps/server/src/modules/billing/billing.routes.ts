import { FastifyInstance, FastifyPluginAsync } from "fastify";

export const billingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Tạo hóa đơn & mã VietQR động
  fastify.post("/generate-vietqr", async (request, reply) => {
    return { success: true, qrDataUrl: "" };
  });

  // Webhook từ ngân hàng (PayOS / SePay / VietQR) bắn về khi tiền vào tài khoản
  fastify.post("/webhook/payment", async (request, reply) => {
    // TODO: Xác thực webhook signature và bắn Socket PAYMENT_CONFIRMED về quán
    return { success: true };
  });
};
