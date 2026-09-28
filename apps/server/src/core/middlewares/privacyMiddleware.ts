import { FastifyRequest, FastifyReply } from "fastify";
import { UserRole } from "@a2order/shared";

/**
 * Fastify PreHandler Hook: Bảo vệ dữ liệu nhạy cảm của từng nhà hàng (Zero-Knowledge)
 * SUPER_ADMIN KHÔNG ĐƯỢC PHÉP xem chi tiết doanh thu, doanh số, báo cáo tiền mặt của bất kỳ quán nào.
 * Chỉ có STORE_OWNER, ACCOUNTANT của chính quán đó mới được xem.
 */
export async function enforceDataPrivacy(request: FastifyRequest, reply: FastifyReply) {
  // Lấy role từ user đã giải mã qua JWT hoặc header
  const user = (request as any).user;
  if (!user) return; // Nếu chưa authenticate thì để authMiddleware xử lý 401

  if (user.role === UserRole.SUPER_ADMIN) {
    // Chặn hoàn toàn các endpoint tài chính / chi tiết hóa đơn
    const path = request.url.toLowerCase();
    const isSensitive = 
      path.includes("/api/billing/reports") ||
      path.includes("/api/billing/financials") ||
      path.includes("/api/orders/details") ||
      path.includes("/api/billing/revenue");

    if (isSensitive) {
      return reply.status(403).send({
        statusCode: 403,
        error: "Forbidden",
        message: "Chính sách bảo mật A2Order: Quản trị viên hệ thống (Super Admin) không có quyền xem dữ liệu tài chính và doanh thu riêng tư của nhà hàng.",
      });
    }
  }
}
