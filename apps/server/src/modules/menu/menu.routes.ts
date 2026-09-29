import { FastifyInstance } from "fastify";
import { menuRepository } from "../../core/database/repositoryFactory.js";
import { FnbDishItem } from "@a2order/shared";

export async function menuRoutes(fastify: FastifyInstance) {
  /**
   * 1. LẤY THỰC ĐƠN CỦA QUÁN
   * GET /api/menu/:storeId
   */
  fastify.get("/:storeId", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    try {
      const dishes = await menuRepository.getDishesByStoreId(storeId);
      return { success: true, count: dishes.length, data: dishes };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 2. LẤY CHI TIẾT 1 MÓN ĂN
   * GET /api/menu/:storeId/dishes/:dishId
   */
  fastify.get("/:storeId/dishes/:dishId", async (request, reply) => {
    const { storeId, dishId } = request.params as { storeId: string; dishId: string };
    try {
      const dish = await menuRepository.getDishById(storeId, dishId);
      if (!dish) {
        return reply.status(404).send({ success: false, error: "Món ăn không tồn tại" });
      }
      return { success: true, data: dish };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 3. THÊM MÓN MỚI VÀO THỰC ĐƠN
   * POST /api/menu/:storeId/dishes
   */
  fastify.post("/:storeId/dishes", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const body = request.body as Omit<FnbDishItem, "id">;

    if (!body || !body.name || !body.price) {
      return reply.status(400).send({ success: false, error: "Tên món và giá bán là bắt buộc" });
    }

    try {
      const newDish = await menuRepository.createDish(storeId, body);
      return { success: true, message: `Đã thêm món "${newDish.name}" thành công!`, data: newDish };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 4. CẬP NHẬT THÔNG TIN MÓN ĂN (GIÁ, BIẾN THỂ SIZE, TOPPING, TRẠM)
   * PUT /api/menu/:storeId/dishes/:dishId
   */
  fastify.put("/:storeId/dishes/:dishId", async (request, reply) => {
    const { storeId, dishId } = request.params as { storeId: string; dishId: string };
    const body = request.body as Partial<FnbDishItem>;

    try {
      const updated = await menuRepository.updateDish(storeId, dishId, body);
      if (!updated) {
        return reply.status(404).send({ success: false, error: "Không tìm thấy món ăn để cập nhật" });
      }
      return { success: true, message: `Đã cập nhật món "${updated.name}" thành công!`, data: updated };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 5. CẬP NHẬT NHANH SỐ SUẤT (BÁO HẾT MÓN 86)
   * PATCH /api/menu/:storeId/dishes/:dishId/stock
   */
  fastify.patch("/:storeId/dishes/:dishId/stock", async (request, reply) => {
    const { storeId, dishId } = request.params as { storeId: string; dishId: string };
    const { stockCount } = request.body as { stockCount: number };

    try {
      const isAvailable = Number(stockCount) > 0;
      const updated = await menuRepository.updateDish(storeId, dishId, {
        stockCount: Number(stockCount),
        isAvailable,
      });
      if (!updated) {
        return reply.status(404).send({ success: false, error: "Món ăn không tồn tại" });
      }
      return {
        success: true,
        message: isAvailable ? `Đã cập nhật còn ${stockCount} suất` : "Đã chuyển sang trạng thái Hết Hàng",
        data: updated,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 6. XÓA MÓN KHỎI THỰC ĐƠN
   * DELETE /api/menu/:storeId/dishes/:dishId
   */
  fastify.delete("/:storeId/dishes/:dishId", async (request, reply) => {
    const { storeId, dishId } = request.params as { storeId: string; dishId: string };
    try {
      const deleted = await menuRepository.deleteDish(storeId, dishId);
      if (!deleted) {
        return reply.status(404).send({ success: false, error: "Món ăn không tồn tại hoặc đã bị xóa" });
      }
      return { success: true, message: "Đã xóa món ăn thành công" };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
