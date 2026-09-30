import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../database/prismaClient.js";

/**
 * Fastify PreHandler Hook: Kiểm tra hạn thuê phần mềm (License Guard)
 * Khi quán hết hạn thuê:
 * - Chặn thao tác tạo đơn mới, mở bàn mới (trả về 402 Payment Required)
 * - Cho phép xem dữ liệu cũ để đối soát (Grace period)
 */
export async function verifyStoreLicense(request: FastifyRequest, reply: FastifyReply) {
  const storeId = (request.params as any)?.storeId || (request.body as any)?.storeId || (request as any).user?.storeId;
  if (!storeId || storeId === "UNASSIGNED") return;

  const license = await prisma.storeLicense.findUnique({
    where: { storeId },
  });

  if (!license) return;

  const now = new Date();
  if (
    license.endDate < now ||
    license.status === "EXPIRED" ||
    license.status === "SUSPENDED" ||
    license.status === "REVOKED"
  ) {
    // Chỉ chặn các hành động ghi/vận hành (POST, PUT, DELETE) liên quan đến bàn ăn và đơn hàng
    if (request.method !== "GET") {
      return reply.status(402).send({
        statusCode: 402,
        error: "Payment Required",
        code: license.status === "REVOKED" ? "LICENSE_REVOKED" : "LICENSE_EXPIRED",
        message: license.status === "REVOKED"
          ? "License của quán đã bị thu hồi. Vui lòng liên hệ quản trị viên để được hỗ trợ."
          : "Thời hạn thuê phần mềm A2Order của quán đã kết thúc. Vui lòng thanh toán hóa đơn gia hạn để tiếp tục mở bàn và nhận đơn mới.",
        licenseKey: license.licenseKey,
        endDate: license.endDate,
      });
    }
  }
}
