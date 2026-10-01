import { FastifyInstance, FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { OwnerLoginSchema, PinLoginSchema } from "@a2order/shared";
import { staffRepository } from "../../core/database/repositoryFactory.js";

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * 1. Đăng nhập Admin / Chủ quán bằng Email & Password
   * POST /api/auth/login-owner
   */
  fastify.post("/login-owner", async (request, reply) => {
    const parseResult = OwnerLoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || "Dữ liệu đăng nhập không hợp lệ",
      });
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Tìm tài khoản trong Supabase
      const staff = await staffRepository.getByEmail(cleanEmail);

      if (!staff || !staff.isActive) {
        return reply.status(401).send({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      // 2. Xác thực mật khẩu bằng bcrypt hash từ database Supabase
      let isMatch = false;
      if (staff.passwordHash) {
        try {
          isMatch = await bcrypt.compare(password, staff.passwordHash);
        } catch {
          isMatch = false;
        }
      }

      if (!isMatch) {
        return reply.status(401).send({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      // 3. Cấp Token JWT
      const tokenPayload = {
        userId: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        storeId: staff.storeId,
        storeName: staff.storeName || null,
      };

      const token = (fastify as any).jwt.sign(tokenPayload, { expiresIn: "7d" });

      return {
        success: true,
        message: "Đăng nhập thành công",
        token,
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          storeId: staff.storeId,
          storeName: staff.storeName || null,
        },
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Lỗi máy chủ nội bộ khi xử lý đăng nhập",
        error: err.message,
      });
    }
  });

  /**
   * 2. Lấy thông tin tài khoản hiện tại từ Token JWT (Dùng cho Remember Me / Refresh trang)
   * GET /api/auth/me
   */
  fastify.get("/me", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply.status(401).send({ success: false, message: "Chưa đăng nhập" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = (fastify as any).jwt.verify(token) as any;

      if (!decoded || !decoded.userId) {
        return reply.status(401).send({ success: false, message: "Token không hợp lệ" });
      }

      const staff = await staffRepository.getById(decoded.userId);

      if (!staff || !staff.isActive) {
        return reply.status(401).send({ success: false, message: "Tài khoản không tồn tại hoặc đã bị khóa" });
      }

      return {
        success: true,
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          storeId: staff.storeId,
          storeName: staff.storeName || null,
        },
      };
    } catch (err: any) {
      return reply.status(401).send({ success: false, message: "Phiên đăng nhập đã hết hạn" });
    }
  });

  /**
   * 3. Đăng nhập Nhân viên bàn/bếp bằng mã Fast-PIN 4 số
   * POST /api/auth/login-pin
   */
  fastify.post("/login-pin", async (request, reply) => {
    const parseResult = PinLoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || "Mã PIN không hợp lệ",
      });
    }

    const { storeId, staffId, pinCode } = parseResult.data;

    try {
      const staff = await staffRepository.findByPin(storeId, staffId, pinCode);

      if (!staff) {
        return reply.status(401).send({
          success: false,
          message: "Mã PIN không chính xác",
        });
      }

      const token = (fastify as any).jwt.sign(
        {
          userId: staff.id,
          name: staff.name,
          role: staff.role,
          storeId: staff.storeId,
          storeName: staff.storeName || null,
        },
        { expiresIn: "12h" }
      );

      return {
        success: true,
        message: "Xác thực ca làm thành công",
        token,
        user: {
          id: staff.id,
          name: staff.name,
          role: staff.role,
          storeId: staff.storeId,
          storeName: staff.storeName || null,
        },
      };
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        message: "Lỗi xác thực PIN",
        error: err.message,
      });
    }
  });
};
