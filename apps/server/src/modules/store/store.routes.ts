import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { AppModule, SocketEvents } from "@a2order/shared";
import { prisma } from "../../core/database/prismaClient.js";
import { storeRepository } from "../../core/database/repositoryFactory.js";
import { command } from "../../core/security/commands.js";
import { currentStore } from "../../core/security/access.js";
import { AppError, requireValue } from "../../core/security/errors.js";
import { emitToStore, getStoreTelemetryStats } from "../../core/websocket/socketServer.js";

const settingsSchema = z.object({ name: z.string().trim().min(1).max(200).optional(), phone: z.string().max(30).optional(), address: z.string().max(500).optional(), bankAccount: z.string().regex(/^[0-9]{6,30}$/).or(z.literal("")).optional(), bankBin: z.string().regex(/^[0-9]{6}$/).or(z.literal("")).optional(), bankOwnerName: z.string().max(100).optional(), vatRate: z.number().int().min(0).max(100).optional() });
const createSchema = z.object({ name: z.string().trim().min(1).max(200), owner: z.string().trim().min(1).max(100), ownerEmail: z.string().trim().email(), ownerPassword: z.string().min(10).max(128), ownerPin: z.string().regex(/^\d{4,8}$/).optional(), phone: z.string().min(6).max(30), address: z.string().max(500).optional(), tableCount: z.number().int().min(1).max(10000), plan: z.enum(["STARTER", "GROWTH", "PRO"]), durationMonths: z.number().int().min(1).max(120), modules: z.array(z.nativeEnum(AppModule)).min(1), businessType: z.string().optional(), scale: z.string().optional() });
export const storeRoutes: FastifyPluginAsync = async app => {
  app.get("/", async () => ({ success: true, data: (await storeRepository.getAll()).map(store => ({ ...store, activeDevices: getStoreTelemetryStats(store.id).length })) }));
  app.get("/:storeId", async request => {
    const { storeId } = request.params as { storeId: string };
    const dto = requireValue(await storeRepository.getById(storeId));
    const row = requireValue(await prisma.store.findUnique({ where: { id: storeId }, select: { bankAccount: true, bankBin: true, bankOwnerName: true, vatRate: true } }));
    if (!["STORE_OWNER", "SUPER_ADMIN"].includes(request.principal!.role)) { const { ownerEmail: _email, staffList: _staff, licenseKey: _key, ...publicStore } = dto; return { success: true, data: { ...publicStore, ...row } }; }
    return { success: true, data: { ...dto, ...row } };
  });
  app.post("/", async request => {
    const input = createSchema.extend({ voucherCode: z.string().max(50).optional() }).parse(request.body);
    const data = await command(request, currentStore(request), "STORE_CREATE", tx => storeRepository.create(input as Parameters<typeof storeRepository.create>[0], tx));
    return { success: true, message: "Đã tạo cửa hàng và hóa đơn chờ thanh toán", data };
  });
  app.put("/:storeId", async request => {
    const { storeId } = request.params as { storeId: string };
    const admin = request.principal!.role === "SUPER_ADMIN";
    const schema = admin ? settingsSchema.extend({ status: z.enum(["ACTIVE", "SUSPENDED"]).optional(), modules: z.array(z.nativeEnum(AppModule)).optional(), plan: z.enum(["STARTER", "GROWTH", "PRO"]).optional() }).strict() : settingsSchema.strict();
    const input = schema.parse(request.body);
    const data = await command(request, storeId, "STORE_UPDATE", async tx => {
      const { modules, plan, ...settings } = input as z.infer<typeof settingsSchema> & { modules?: AppModule[]; plan?: string; status?: string };
      const row = await tx.store.update({ where: { id: storeId }, data: { ...settings, configVersion: "v-" + crypto.randomUUID() } });
      if (modules) await tx.storeLicense.update({ where: { storeId }, data: { enabledModules: modules.join(","), ...(plan ? { planType: plan } : {}) } });
      return { id: row.id, name: row.name };
    });
    emitToStore(storeId, SocketEvents.CONFIG_UPDATED, { storeId });
    return { success: true, data };
  });
  app.delete("/:storeId", async request => {
    const { storeId } = request.params as { storeId: string };
    const row = requireValue(await prisma.store.findUnique({ where: { id: storeId } }));
    if (row.slug === "a2order-platform") throw new AppError(403, "Không thể xóa trụ sở hệ thống");
    await command(request, storeId, "STORE_ARCHIVE", async tx => {
      await tx.store.update({ where: { id: storeId }, data: { status: "ARCHIVED" } });
      await tx.staff.updateMany({ where: { storeId }, data: { isActive: false, sessionVersion: { increment: 1 } } });
      await tx.storeLicense.updateMany({ where: { storeId }, data: { status: "REVOKED" } });
      return { success: true };
    });
    return { success: true, message: "Đã ngừng hoạt động cửa hàng; lịch sử giao dịch được bảo toàn" };
  });
  app.get("/:storeId/published-config", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const row = requireValue(await prisma.store.findUnique({ where: { id: storeId }, include: { categories: { orderBy: { sortOrder: "asc" } }, menuItems: { where: { archivedAt: null } }, tableZones: { include: { tables: { where: { archivedAt: null }, select: { id: true, name: true, code: true, capacity: true, status: true } } } } } }));
    const etag = 'W/"' + row.id + "-" + row.configVersion + '"';
    reply.header("ETag", etag).header("Cache-Control", "private, no-cache");
    if (request.headers["if-none-match"] === etag) return reply.status(304).send();
    return { storeId, storeName: row.name, configVersion: row.configVersion, categories: row.categories.map(c => ({ id: c.id, name: c.name, sortOrder: c.sortOrder })), menuItems: row.menuItems.map(m => ({ id: m.id, name: m.name, price: m.price, categoryId: m.categoryId, image: m.image, isAvailable: m.isAvailable, station: m.station })), tableZones: row.tableZones.map(z => ({ id: z.id, name: z.name, tables: z.tables })) };
  });
  app.post("/:storeId/publish", async request => {
    const { storeId } = request.params as { storeId: string };
    const data = await command(request, storeId, "STORE_PUBLISH", async tx => {
      const row = await tx.store.update({ where: { id: storeId }, data: { configVersion: "v-" + crypto.randomUUID() } });
      return { configVersion: row.configVersion };
    });
    emitToStore(storeId, SocketEvents.CONFIG_UPDATED, { storeId, version: data.configVersion });
    return { success: true, ...data };
  });
  app.get("/telemetry/system-status", async () => {
    const stores = await storeRepository.getAll();
    const stats = getStoreTelemetryStats();
    return { systemHealth: "OPERATIONAL", timestamp: new Date().toISOString(), serverMetrics: { uptimeSeconds: process.uptime(), memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024) }, networkTelemetry: { activeConnectionsCount: stats.length, avgPingMs: null, connections: stats }, tenantSummary: { totalStores: stores.length, activeStores: stores.filter(s => s.status === "ACTIVE").length } };
  });
  app.get("/audit/system", async () => {
    const rows = await prisma.auditLog.findMany({ include: { store: { select: { name: true } }, staff: { select: { name: true, role: true } } }, orderBy: { createdAt: "desc" }, take: 1000 });
    return { success: true, data: rows.map(row => ({ id: row.id, action: row.action, storeName: row.store.name, actor: row.staff?.name || "Hệ thống", actorRole: row.staff?.role || "SYSTEM", ipAddress: "", timestamp: row.createdAt.toISOString(), details: row.details || "", status: "SUCCESS" })) };
  });
};
