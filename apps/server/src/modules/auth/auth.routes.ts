import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { OwnerLoginSchema, PinLoginSchema, staffPinRole } from "@a2order/shared";
import { prisma, systemQuery } from "../../core/database/prismaClient.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { limitAttempts } from "../../core/security/access.js";

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const userView = (staff: { id: string; name: string; email: string | null; role: string; storeId: string; store: { name: string; phone: string | null; address: string | null; slug: string } }) => ({ id: staff.id, name: staff.name, email: staff.email, role: staff.role, storeId: staff.storeId, storeName: staff.store.name, phone: staff.store.phone || undefined, address: staff.store.address || undefined, slug: staff.store.slug });
  const issue = (staff: Parameters<typeof userView>[0] & { sessionVersion: number }) => ({
    success: true,
    token: app.jwt.sign({ userId: staff.id, storeId: staff.storeId, role: staff.role, kind: "staff", sessionVersion: staff.sessionVersion }, { expiresIn: "12h" }),
    user: userView(staff),
  });

  app.get("/staff/:storeId", async request => {
    const { storeId } = z.object({ storeId: z.string().min(1).max(100) }).parse(request.params);
    const staff = await systemQuery(() => prisma.staff.findMany({ where: { storeId, isActive: true, role: { in: ["WAITER", "CASHIER", "CHEF"] } }, select: { id: true, name: true, role: true }, take: 100 }));
    return { success: true, data: staff };
  });
  app.post("/login-owner", async request => {
    const { email, password } = OwnerLoginSchema.parse(request.body);
    const cleanEmail = email.trim().toLowerCase();
    const isLocal = process.env.NODE_ENV !== "production" || request.ip === "127.0.0.1" || request.ip === "::1";
    limitAttempts("email:" + cleanEmail, isLocal ? 200 : 30, isLocal ? 10000 : 60000);
    const staff = await systemQuery(() => prisma.staff.findUnique({ where: { email: cleanEmail }, include: { store: true } }));
    const valid = staff?.passwordHash ? await bcrypt.compare(password, staff.passwordHash) : false;
    if (!staff?.isActive || !valid) throw new AppError(401, "Email hoặc mật khẩu không chính xác", "UNAUTHORIZED");
    return issue(staff);
  });
  app.post("/password-reset-request", async request => {
    const { email, storeId } = z.object({ email: z.string().trim().email().max(254), storeId: z.string().max(100).optional() }).parse(request.body);
    limitAttempts("password-reset:" + request.ip, 5, 900000);
    const target = await systemQuery(() => prisma.staff.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, storeId: true, isActive: true } }));
    if (target?.isActive && (!storeId || storeId === target.storeId)) {
      const recent = await systemQuery(() => prisma.auditLog.findFirst({ where: { storeId: target.storeId, staffId: target.id, action: "PASSWORD_RESET_REQUEST", createdAt: { gte: new Date(Date.now() - 900000) } } }));
      if (!recent) await systemQuery(() => prisma.auditLog.create({ data: { storeId: target.storeId, staffId: target.id, action: "PASSWORD_RESET_REQUEST" } }));
    }
    return { success: true };
  });
  app.post("/login-pin", async request => {
    const { storeId, pinCode } = PinLoginSchema.parse(request.body);
    const isLocalPin = process.env.NODE_ENV !== "production" || request.ip === "127.0.0.1" || request.ip === "::1";
    limitAttempts("pin:" + storeId + ":" + request.ip, isLocalPin ? 500 : 120, isLocalPin ? 10000 : 60000);
    const role = staffPinRole(pinCode);
    const candidates = await systemQuery(() => prisma.staff.findMany({ where: { storeId, isActive: true, role: role || "__INVALID__", pinCode: { not: null } }, include: { store: true }, take: 100 }));
    const matches = (await Promise.all(candidates.map(async staff => staff.pinCode?.startsWith("$2") && await bcrypt.compare(pinCode, staff.pinCode) ? staff : null))).filter((staff): staff is NonNullable<typeof staff> => staff !== null);
    if (matches.length !== 1) throw new AppError(401, "Mã PIN không chính xác", "UNAUTHORIZED");
    return issue(matches[0]);
  });
  app.get("/me", async request => {
    const staff = requireValue(await prisma.staff.findFirst({ where: { id: request.principal!.userId, isActive: true }, include: { store: true } }));
    return { success: true, user: userView(staff) };
  });
  app.post("/logout", async request => {
    await prisma.staff.update({ where: { id: request.principal!.userId }, data: { sessionVersion: { increment: 1 } } });
    return { success: true };
  });
};
