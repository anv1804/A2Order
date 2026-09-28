import { FastifyInstance, FastifyPluginAsync } from "fastify";

export const orderRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Gửi order mới (Phục vụ hoặc Khách quét QR)
  fastify.post("/submit", async (request, reply) => {
    return { success: true };
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
