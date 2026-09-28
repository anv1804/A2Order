import { FastifyInstance, FastifyPluginAsync } from "fastify";

export const tableRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Lấy danh sách sơ đồ bàn của quán
  fastify.get("/", async (request, reply) => {
    return { success: true, data: [] };
  });

  // Cập nhật trạng thái bàn (Đang có khách, Chờ món, Đang ăn, Chờ tính tiền)
  fastify.patch("/:tableId/status", async (request, reply) => {
    return { success: true };
  });

  // Chuyển bàn / Ghép bàn
  fastify.post("/transfer", async (request, reply) => {
    return { success: true };
  });
};
