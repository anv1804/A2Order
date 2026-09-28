import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { OwnerLoginSchema, PinLoginSchema } from "@a2order/shared";

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Đăng nhập Chủ quán / Super Admin bằng Email & Password
  fastify.post("/login-owner", async (request, reply) => {
    // TODO: Triển khai kiểm tra mật khẩu & cấp token JWT
    return { success: true, message: "Base auth ready" };
  });

  // Đăng nhập Nhân viên bàn/bếp bằng mã Fast-PIN 4 số
  fastify.post("/login-pin", async (request, reply) => {
    // TODO: Triển khai xác thực PIN theo storeId + staffId
    return { success: true, message: "Base PIN auth ready" };
  });
};
