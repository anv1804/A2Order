import { FastifyInstance } from "fastify";
import { scenarioRepository, menuRepository } from "../../core/database/repositoryFactory.js";
import { BusinessType } from "@a2order/shared";

export async function scenarioRoutes(fastify: FastifyInstance) {
  /**
   * 1. LẤY DANH SÁCH TẤT CẢ 8 KỊCH BẢN F&B MẪU
   * GET /api/scenarios
   */
  fastify.get("/", async (_request, reply) => {
    try {
      const scenarios = await scenarioRepository.getAll();
      return { success: true, count: scenarios.length, data: scenarios };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 2. LẤY CHI TIẾT 1 KỊCH BẢN THEO LOẠI HÌNH
   * GET /api/scenarios/:type
   */
  fastify.get("/:type", async (request, reply) => {
    const { type } = request.params as { type: string };
    try {
      const scenario = await scenarioRepository.getByType(type as BusinessType);
      if (!scenario) {
        return reply.status(404).send({ success: false, error: `Kịch bản "${type}" không tồn tại` });
      }
      return { success: true, data: scenario };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 3. ÁP DỤNG KỊCH BẢN VÀO QUÁN (GHI ĐÈ HOẶC NỐI TIẾP MENU)
   * POST /api/scenarios/:type/apply/:storeId
   */
  fastify.post("/:type/apply/:storeId", async (request, reply) => {
    const { type, storeId } = request.params as { type: string; storeId: string };
    const { mode = "REPLACE" } = (request.body as { mode?: "REPLACE" | "APPEND" }) || {};

    try {
      const result = await menuRepository.applyScenarioToStore(
        storeId,
        type as BusinessType,
        mode
      );
      return {
        success: true,
        message: `Đã áp dụng kịch bản "${type}" vào quán "${storeId}" theo chế độ ${mode}!`,
        appliedCount: result.appliedCount,
        dishes: result.dishes,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 4. THÊM MÓN MẪU ĐỀ XUẤT VÀO KỊCH BẢN (SUPERADMIN)
   * POST /api/scenarios/:type/dishes
   */
  fastify.post("/:type/dishes", async (request, reply) => {
    const { type } = request.params as { type: string };
    const dishData = request.body as any;

    try {
      const createdDish = await scenarioRepository.addDishTemplate(type as BusinessType, dishData);
      return {
        success: true,
        message: `Đã thêm món mẫu "${createdDish.name}" vào kịch bản ${type}!`,
        data: createdDish,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 5. SỬA MÓN MẪU ĐỀ XUẤT TRONG KỊCH BẢN (SUPERADMIN)
   * PUT /api/scenarios/:type/dishes/:dishId
   */
  fastify.put("/:type/dishes/:dishId", async (request, reply) => {
    const { type, dishId } = request.params as { type: string; dishId: string };
    const dishData = request.body as any;

    try {
      const updatedDish = await scenarioRepository.updateDishTemplate(
        type as BusinessType,
        dishId,
        dishData
      );
      if (!updatedDish) {
        return reply.status(404).send({ success: false, error: "Không tìm thấy món mẫu để sửa" });
      }
      return {
        success: true,
        message: `Đã cập nhật món mẫu "${updatedDish.name}"!`,
        data: updatedDish,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 6. XÓA MÓN MẪU ĐỀ XUẤT KHỎI KỊCH BẢN (SUPERADMIN)
   * DELETE /api/scenarios/:type/dishes/:dishId
   */
  fastify.delete("/:type/dishes/:dishId", async (request, reply) => {
    const { type, dishId } = request.params as { type: string; dishId: string };

    try {
      const deleted = await scenarioRepository.deleteDishTemplate(type as BusinessType, dishId);
      if (!deleted) {
        return reply.status(404).send({ success: false, error: "Không tìm thấy món mẫu để xóa" });
      }
      return {
        success: true,
        message: `Đã xóa món mẫu khỏi kịch bản ${type}!`,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
