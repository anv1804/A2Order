import { FastifyInstance, FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../../core/database/prismaClient.js";

export const staffRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * 1. GET /api/staff
   * Lấy danh sách toàn bộ nhân sự / tài khoản user của các quán
   * Hỗ trợ query params: storeId, role, status (ACTIVE/INACTIVE/ALL), search
   */
  fastify.get("/", async (request, reply) => {
    const { storeId, role, status, search } = request.query as {
      storeId?: string;
      role?: string;
      status?: string;
      search?: string;
    };

    try {
      const whereClause: any = {};

      if (storeId && storeId !== "ALL") {
        whereClause.storeId = storeId;
      }

      if (role && role !== "ALL") {
        whereClause.role = role;
      }

      if (status === "ACTIVE") {
        whereClause.isActive = true;
      } else if (status === "INACTIVE" || status === "SUSPENDED") {
        whereClause.isActive = false;
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        whereClause.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { pinCode: { contains: q } },
          { store: { name: { contains: q, mode: "insensitive" } } },
        ];
      }

      const staffList = await prisma.staff.findMany({
        where: whereClause,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              phone: true,
              license: {
                select: {
                  planType: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [{ store: { name: "asc" } }, { createdAt: "desc" }],
      });

      const formatted = staffList.map((st) => ({
        id: st.id,
        name: st.name,
        email: st.email || "",
        pinCode: st.pinCode || "",
        role: st.role,
        isActive: st.isActive,
        createdAt: st.createdAt.toISOString(),
        storeId: st.storeId,
        storeName: st.store.name,
        storeStatus: st.store.status,
        storePlan: st.store.license?.planType || "STARTER",
        hasPassword: !!st.passwordHash,
      }));

      return {
        success: true,
        count: formatted.length,
        data: formatted,
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "Không thể tải danh sách tài khoản: " + err.message,
      });
    }
  });

  /**
   * 2. POST /api/staff
   * Tạo tài khoản nhân sự / chủ quán mới
   */
  fastify.post("/", async (request, reply) => {
    const body = request.body as {
      storeId: string;
      name: string;
      email?: string;
      password?: string;
      pinCode?: string;
      role: string;
      isActive?: boolean;
    };

    if (!body || !body.storeId || !body.name || !body.role) {
      return reply.status(400).send({
        success: false,
        error: "Vui lòng cung cấp đầy đủ: Quán trực thuộc, Họ tên và Vai trò.",
      });
    }

    try {
      // 1. Kiểm tra quán có tồn tại không
      const store = await prisma.store.findUnique({
        where: { id: body.storeId },
      });
      if (!store) {
        return reply.status(404).send({
          success: false,
          error: "Cửa hàng không tồn tại.",
        });
      }

      // 2. Nếu có email, kiểm tra trùng lặp
      const cleanEmail = body.email ? body.email.trim().toLowerCase() : null;
      if (cleanEmail) {
        const existing = await prisma.staff.findUnique({
          where: { email: cleanEmail },
        });
        if (existing) {
          return reply.status(400).send({
            success: false,
            error: `Email "${cleanEmail}" đã được sử dụng bởi một tài khoản khác.`,
          });
        }
      }

      // 3. Xử lý passwordHash
      let passwordHash: string | null = null;
      if (body.password && body.password.trim()) {
        passwordHash = await bcrypt.hash(body.password.trim(), 10);
      }

      // 4. Xử lý PIN code (mặc định 1111 nếu không nhập)
      const pinCode = body.pinCode && body.pinCode.trim() ? body.pinCode.trim() : "1111";

      const created = await prisma.staff.create({
        data: {
          storeId: body.storeId,
          name: body.name.trim(),
          email: cleanEmail,
          passwordHash,
          pinCode,
          role: body.role,
          isActive: body.isActive !== undefined ? body.isActive : true,
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              license: { select: { planType: true } },
            },
          },
        },
      });

      return {
        success: true,
        message: `Đã tạo tài khoản cho "${created.name}" thành công!`,
        data: {
          id: created.id,
          name: created.name,
          email: created.email || "",
          pinCode: created.pinCode || "",
          role: created.role,
          isActive: created.isActive,
          createdAt: created.createdAt.toISOString(),
          storeId: created.storeId,
          storeName: created.store.name,
          storePlan: created.store.license?.planType || "STARTER",
          hasPassword: !!created.passwordHash,
        },
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "Lỗi tạo tài khoản: " + err.message,
      });
    }
  });

  /**
   * 3. PUT /api/staff/:id
   * Cập nhật thông tin tài khoản nhân sự
   */
  fastify.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      email?: string;
      role?: string;
      pinCode?: string;
      isActive?: boolean;
      storeId?: string;
    };

    try {
      const existing = await prisma.staff.findUnique({
        where: { id },
      });
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: "Không tìm thấy tài khoản nhân sự.",
        });
      }

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.role !== undefined) updateData.role = body.role;
      if (body.pinCode !== undefined) updateData.pinCode = body.pinCode.trim();
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.storeId !== undefined) updateData.storeId = body.storeId;

      if (body.email !== undefined) {
        const cleanEmail = body.email ? body.email.trim().toLowerCase() : null;
        if (cleanEmail && cleanEmail !== existing.email) {
          const duplicate = await prisma.staff.findUnique({
            where: { email: cleanEmail },
          });
          if (duplicate && duplicate.id !== id) {
            return reply.status(400).send({
              success: false,
              error: `Email "${cleanEmail}" đã được tài khoản khác sử dụng.`,
            });
          }
        }
        updateData.email = cleanEmail;
      }

      const updated = await prisma.staff.update({
        where: { id },
        data: updateData,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              license: { select: { planType: true } },
            },
          },
        },
      });

      return {
        success: true,
        message: `Đã cập nhật tài khoản "${updated.name}" thành công!`,
        data: {
          id: updated.id,
          name: updated.name,
          email: updated.email || "",
          pinCode: updated.pinCode || "",
          role: updated.role,
          isActive: updated.isActive,
          createdAt: updated.createdAt.toISOString(),
          storeId: updated.storeId,
          storeName: updated.store.name,
          storePlan: updated.store.license?.planType || "STARTER",
          hasPassword: !!updated.passwordHash,
        },
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "Lỗi cập nhật: " + err.message,
      });
    }
  });

  /**
   * 4. PATCH /api/staff/:id/toggle-status
   * Khóa hoặc mở khóa tài khoản
   */
  fastify.patch("/:id/toggle-status", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const existing = await prisma.staff.findUnique({
        where: { id },
      });
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: "Không tìm thấy tài khoản nhân sự.",
        });
      }

      const updated = await prisma.staff.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });

      return {
        success: true,
        message: updated.isActive
          ? `Đã mở khóa tài khoản "${updated.name}" thành công.`
          : `Đã khóa tài khoản "${updated.name}". Nhân viên sẽ không thể đăng nhập.`,
        data: { id: updated.id, isActive: updated.isActive },
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "Lỗi thay đổi trạng thái: " + err.message,
      });
    }
  });

  /**
   * 5. POST /api/staff/:id/reset-credentials
   * Đặt lại mật khẩu hoặc mã PIN
   */
  fastify.post("/:id/reset-credentials", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      password?: string;
      pinCode?: string;
    };

    try {
      const existing = await prisma.staff.findUnique({
        where: { id },
      });
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: "Không tìm thấy tài khoản nhân sự.",
        });
      }

      const updateData: any = {};
      if (body.password && body.password.trim()) {
        updateData.passwordHash = await bcrypt.hash(body.password.trim(), 10);
      }
      if (body.pinCode && body.pinCode.trim()) {
        updateData.pinCode = body.pinCode.trim();
      }

      await prisma.staff.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        message: `Đã đặt lại thông tin bảo mật cho tài khoản "${existing.name}" thành công.`,
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "Lỗi đặt lại thông tin: " + err.message,
      });
    }
  });

  /**
   * 6. DELETE /api/staff/:id
   * Xóa tài khoản nhân viên
   */
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const existing = await prisma.staff.findUnique({
        where: { id },
      });
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: "Không tìm thấy tài khoản nhân sự.",
        });
      }

      await prisma.staff.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Đã xóa tài khoản "${existing.name}" khỏi hệ thống.`,
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "Lỗi xóa tài khoản: " + err.message,
      });
    }
  });
};
