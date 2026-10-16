import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@a2order/shared";
import { prisma } from "../../core/database/prismaClient.js";
import { currentStore } from "../../core/security/access.js";
import { command } from "../../core/security/commands.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { checkLicense } from "../order/order.service.js";
import { disconnectStaff } from "../../core/websocket/socketServer.js";

const inputSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional(),
  shift: z.enum(["MORNING", "EVENING", "FULL_TIME"]).optional(),
  email: z.string().trim().email().nullable().optional(),
  password: z.string().min(10).max(128).optional(),
  pinCode: z.string().regex(/^\d{4,8}$/).optional(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().optional(),
});
export const staffRoutes: FastifyPluginAsync = async app => {
  app.get("/", async request => {
    const query = z.object({ storeId: z.string().optional(), role: z.string().optional(), status: z.string().optional(), search: z.string().max(200).optional() }).parse(request.query);
    const admin = request.principal!.role === "SUPER_ADMIN";
    const storeId = admin ? query.storeId === "ALL" ? undefined : query.storeId : currentStore(request);
    const list = await prisma.staff.findMany({ where: { ...(storeId ? { storeId } : {}), ...(query.role && query.role !== "ALL" ? { role: query.role } : {}), ...(query.status === "ACTIVE" ? { isActive: true } : ["INACTIVE", "SUSPENDED"].includes(query.status || "") ? { isActive: false } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { email: { contains: query.search, mode: "insensitive" } }] } : {}) }, include: { store: { include: { license: true } } }, orderBy: { createdAt: "desc" } });
    return { success: true, data: list.map(staff => ({ id: staff.id, storeId: staff.storeId, name: staff.name, email: staff.email, phone: staff.phone, shift: staff.shift, role: staff.role, isActive: staff.isActive, createdAt: staff.createdAt, pinCode: "", hasPin: !!staff.pinCode, hasPassword: !!staff.passwordHash, storeName: staff.store.name, storeStatus: staff.store.status, storePlan: staff.store.license?.planType })) };
  });
  app.post("/", async request => {
    const input = inputSchema.parse(request.body);
    const admin = request.principal!.role === "SUPER_ADMIN";
    if (input.role === "SUPER_ADMIN" && !admin) throw new AppError(403, "Không được cấp vai trò quản trị nền tảng");
    if (["WAITER", "CASHIER", "CHEF"].includes(input.role) && !input.pinCode) throw new AppError(400, "Cần mã PIN riêng cho nhân viên");
    if (["SUPER_ADMIN", "STORE_OWNER", "ACCOUNTANT"].includes(input.role) && (!input.email || !input.password)) throw new AppError(400, "Cần email và mật khẩu cho tài khoản quản lý");
    const storeId = admin ? input.storeId : currentStore(request);
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;
    const pinHash = input.pinCode ? await bcrypt.hash(input.pinCode, 12) : null;
    const result = await command(request, storeId, "STAFF_CREATE", async tx => {
      const store = await checkLicense(tx, storeId);
      if (await tx.staff.count({ where: { storeId, isActive: true } }) >= store.license!.maxStaff) throw new AppError(403, "Đã đạt giới hạn nhân viên của gói");
      const row = await tx.staff.create({ data: { storeId, name: input.name, phone: input.phone, shift: input.shift, email: input.email?.toLowerCase(), passwordHash, pinCode: pinHash, role: input.role, isActive: input.isActive ?? true } });
      return { id: row.id, storeId, name: row.name, email: row.email, phone: row.phone, shift: row.shift, role: row.role, isActive: row.isActive, createdAt: row.createdAt, hasPassword: !!passwordHash, pinCode: "" };
    });
    return { success: true, data: result };
  });
  app.put("/:id", async request => {
    const { id } = request.params as { id: string };
    const input = inputSchema.omit({ password: true }).partial().parse(request.body);
    const admin = request.principal!.role === "SUPER_ADMIN";
    const target = requireValue(await prisma.staff.findFirst({ where: { id, ...(!admin ? { storeId: currentStore(request) } : {}) } }));
    if (!admin && (input.role === "SUPER_ADMIN" || target.role === "SUPER_ADMIN" || (input.storeId && input.storeId !== target.storeId))) throw new AppError(403, "Không có quyền đổi vai trò hoặc cửa hàng");
    const pinHash = input.pinCode ? await bcrypt.hash(input.pinCode, 12) : undefined;
    const row = await command(request, target.storeId, "STAFF_UPDATE", async tx => {
      const current = requireValue(await tx.staff.findFirst({ where: { id, storeId: target.storeId } }));
      const securityChanged = !!pinHash || (input.email !== undefined && input.email !== current.email) || (input.role !== undefined && input.role !== current.role) || (input.isActive !== undefined && input.isActive !== current.isActive);
      if (id === request.principal!.userId && (input.isActive === false || input.role && input.role !== current.role)) throw new AppError(409, "Không thể tự khóa hoặc đổi vai trò tài khoản đang dùng");
      if (current.role === "STORE_OWNER" && (input.isActive === false || input.role && input.role !== "STORE_OWNER") && !await tx.staff.count({ where: { storeId: current.storeId, id: { not: id }, role: "STORE_OWNER", isActive: true } })) throw new AppError(409, "Cần giữ ít nhất một chủ quán đang hoạt động");
      if (!current.isActive && input.isActive) { const store = await checkLicense(tx, current.storeId); if (await tx.staff.count({ where: { storeId: current.storeId, isActive: true } }) >= store.license!.maxStaff) throw new AppError(403, "Đã đạt giới hạn nhân viên"); }
      if (input.role && ["STORE_OWNER", "SUPER_ADMIN", "ACCOUNTANT"].includes(input.role) && (!(input.email || current.email) || !current.passwordHash)) throw new AppError(400, "Tài khoản quản lý cần email và mật khẩu riêng");
      if (input.role && ["WAITER", "CASHIER", "CHEF"].includes(input.role) && !pinHash && !current.pinCode) throw new AppError(400, "Thiết lập mã PIN trước khi đổi vai trò");
      const saved = await tx.staff.update({ where: { id_storeId: { id, storeId: current.storeId } }, data: { name: input.name, phone: input.phone, shift: input.shift, email: input.email?.toLowerCase(), role: input.role, isActive: input.isActive, pinCode: pinHash, ...(securityChanged ? { sessionVersion: { increment: 1 } } : {}) }, select: { id: true, name: true, phone: true, shift: true, email: true, role: true, storeId: true, isActive: true, createdAt: true } });
      return { ...saved, sessionInvalidated: securityChanged };
    });
    if (row.sessionInvalidated) disconnectStaff(id);
    return { success: true, data: row };
  });
  app.patch("/:id/toggle-status", async request => {
    const { id } = request.params as { id: string };
    const target = requireValue(await prisma.staff.findFirst({ where: { id, ...(request.principal!.role !== "SUPER_ADMIN" ? { storeId: currentStore(request) } : {}) } }));
    if (id === request.principal!.userId) throw new AppError(409, "Không thể tự khóa tài khoản đang dùng");
    const row = await command(request, target.storeId, "STAFF_TOGGLE", async tx => {
      const current = requireValue(await tx.staff.findFirst({ where: { id, storeId: target.storeId } }));
      if (current.isActive && current.role === "STORE_OWNER" && !await tx.staff.count({ where: { storeId: current.storeId, id: { not: id }, role: "STORE_OWNER", isActive: true } })) throw new AppError(409, "Cần giữ ít nhất một chủ quán đang hoạt động");
      if (!current.isActive) { const store = await checkLicense(tx, current.storeId); if (await tx.staff.count({ where: { storeId: current.storeId, isActive: true } }) >= store.license!.maxStaff) throw new AppError(403, "Đã đạt giới hạn nhân viên"); }
      return tx.staff.update({ where: { id_storeId: { id, storeId: current.storeId } }, data: { isActive: !current.isActive, sessionVersion: { increment: 1 } }, select: { id: true, isActive: true } });
    });
    disconnectStaff(id);
    return { success: true, data: row };
  });
  app.post("/:id/reset-credentials", async request => {
    const { id } = request.params as { id: string };
    const input = inputSchema.pick({ password: true, pinCode: true }).refine(data => !!data.password || !!data.pinCode, "Cần mật khẩu hoặc PIN mới").parse(request.body);
    const target = requireValue(await prisma.staff.findFirst({ where: { id, ...(request.principal!.role !== "SUPER_ADMIN" ? { storeId: currentStore(request) } : {}) } }));
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;
    const pinCode = input.pinCode ? await bcrypt.hash(input.pinCode, 12) : undefined;
    await command(request, target.storeId, "STAFF_RESET", async tx => { await tx.staff.update({ where: { id_storeId: { id, storeId: target.storeId } }, data: { passwordHash, pinCode, sessionVersion: { increment: 1 } } }); return { success: true }; });
    disconnectStaff(id);
    return { success: true };
  });
  app.delete("/:id", async request => {
    const { id } = request.params as { id: string };
    const target = requireValue(await prisma.staff.findFirst({ where: { id, ...(request.principal!.role !== "SUPER_ADMIN" ? { storeId: currentStore(request) } : {}) } }));
    if (id === request.principal!.userId || target.role === "STORE_OWNER") throw new AppError(409, "Không thể xóa chủ quán hoặc tài khoản đang dùng");
    await command(request, target.storeId, "STAFF_ARCHIVE", async tx => { await tx.staff.update({ where: { id_storeId: { id, storeId: target.storeId } }, data: { isActive: false, sessionVersion: { increment: 1 } } }); return { success: true }; });
    disconnectStaff(id);
    return { success: true };
  });
};
