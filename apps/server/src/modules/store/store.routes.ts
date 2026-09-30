import { FastifyInstance } from "fastify";
import { prisma } from "../../core/database/prismaClient.js";
import { storeRepository } from "../../core/database/repositoryFactory.js";
import { emitToStore, getStoreTelemetryStats } from "../../core/websocket/socketServer.js";
import { SocketEvents, TenantStoreRecord } from "@a2order/shared";
import { enforceDataPrivacy } from "../../core/middlewares/privacyMiddleware.js";

export async function storeRoutes(fastify: FastifyInstance) {
  // Áp dụng bảo vệ dữ liệu nhạy cảm
  fastify.addHook("preHandler", enforceDataPrivacy);

  /**
   * 1. LẤY DANH SÁCH TẤT CẢ CÁC QUÁN THUÊ (TENANTS)
   * GET /api/stores
   */
  fastify.get("/", async (_request, reply) => {
    try {
      const stores = await storeRepository.getAll();
      const storesWithLiveDevices = stores.map((store) => {
        const connections = getStoreTelemetryStats(store.id);
        return {
          ...store,
          activeDevices: connections.length,
          pingMs: connections.length
            ? Math.round(connections.reduce((sum, connection) => sum + connection.latencyMs, 0) / connections.length)
            : 0,
        };
      });
      return { success: true, count: storesWithLiveDevices.length, data: storesWithLiveDevices };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 2. LẤY CHI TIẾT 1 QUÁN
   * GET /api/stores/:storeId
   */
  fastify.get("/:storeId", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    try {
      const store = await storeRepository.getById(storeId);
      if (!store) {
        return reply.status(404).send({ success: false, error: "Quán không tồn tại" });
      }
      const connections = getStoreTelemetryStats(storeId);
      return {
        success: true,
        data: {
          ...store,
          activeDevices: connections.length,
          pingMs: connections.length
            ? Math.round(connections.reduce((sum, connection) => sum + connection.latencyMs, 0) / connections.length)
            : 0,
        },
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 3. ĐĂNG KÝ QUÁN MỚI (TỰ ĐỘNG SEED KỊCH BẢN)
   * POST /api/stores
   */
  fastify.post("/", async (request, reply) => {
    const body = request.body as Partial<TenantStoreRecord>;
    if (!body || !body.name || !body.phone) {
      return reply.status(400).send({ success: false, error: "Tên quán và số điện thoại là bắt buộc" });
    }

    try {
      const created = await storeRepository.create(body);
      return {
        success: true,
        message: `Đã khởi tạo quán "${created.name}" thành công với License Key [${created.licenseKey}]!`,
        data: created,
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 4. CẬP NHẬT THÔNG TIN QUÁN
   * PUT /api/stores/:storeId
   */
  fastify.put("/:storeId", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const body = request.body as Partial<TenantStoreRecord>;

    try {
      const updated = await storeRepository.update(storeId, body);
      if (!updated) {
        return reply.status(404).send({ success: false, error: "Quán không tồn tại" });
      }
      return { success: true, message: "Đã cập nhật thông tin quán thành công!", data: updated };
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  /**
   * 5. LẤY CẤU HÌNH ĐÃ XUẤT BẢN (PUBLISHED CONFIG) CỦA QUÁN
   */
  fastify.get("/:storeId/published-config", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };

    let store: any = null;
    try {
      store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          categories: { orderBy: { sortOrder: "asc" } },
          menuItems: true,
          tableZones: {
            include: {
              tables: true,
            },
          },
        },
      });
    } catch (e) {
      // Mock fallback
      store = await storeRepository.getById(storeId);
    }

    if (!store) {
      return reply.status(404).send({ error: "Store not found" });
    }

    const currentEtag = `W/"${store.id}-${store.configVersion || store.configVer || 'v1.0.0'}"`;
    const clientEtag = request.headers["if-none-match"];

    if (clientEtag === currentEtag) {
      return reply.status(304).send();
    }

    reply.header("ETag", currentEtag);
    reply.header("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");

    return {
      storeId: store.id,
      storeName: store.name,
      configVersion: store.configVersion || store.configVer || "v1.0.0",
      categories: store.categories || [],
      menuItems: store.menuItems || [],
      tableZones: store.tableZones || [],
    };
  });

  /**
   * 6. CHỦ QUÁN NHẤN "ÁP DỤNG THAY ĐỔI" (PUBLISH CONFIG)
   */
  fastify.post("/:storeId/publish", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };

    const store = await storeRepository.getById(storeId);
    if (!store) {
      return reply.status(404).send({ error: "Store not found" });
    }

    const currentVerParts = (store.configVer || "v1.0.0").replace("v", "").split(".").map(Number);
    const nextVer = `v${currentVerParts[0]}.${currentVerParts[1]}.${(currentVerParts[2] || 0) + 1}`;

    await storeRepository.update(storeId, { configVer: nextVer });

    emitToStore(storeId, SocketEvents.CONFIG_UPDATED, {
      storeId,
      version: nextVer,
      publishedAt: new Date().toISOString(),
      message: `Chủ quán đã áp dụng thay đổi cấu hình mới (${nextVer}).`,
    });

    return {
      success: true,
      message: "Đã xuất bản cấu hình mới thành công!",
      configVersion: nextVer,
    };
  });

  /**
   * 7. SUPER ADMIN: GIÁM SÁT TỐC ĐỘ ĐƯỜNG TRUYỀN & TELEMETRY
   */
  fastify.get("/telemetry/system-status", async (_request, _reply) => {
    const telemetryStats = getStoreTelemetryStats();
    const stores = await storeRepository.getAll();
    const activeStores = stores.filter((s) => s.status === "ACTIVE").length;
    const memoryUsage = process.memoryUsage();

    return {
      systemHealth: telemetryStats.length > 0 ? "OPERATIONAL" : "NO_ACTIVE_CONNECTIONS",
      timestamp: new Date().toISOString(),
      serverMetrics: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
      networkTelemetry: {
        activeConnectionsCount: telemetryStats.length,
        avgPingMs: telemetryStats.length > 0 
          ? Math.round(telemetryStats.reduce((sum, s) => sum + s.latencyMs, 0) / telemetryStats.length)
          : null,
        connections: telemetryStats,
      },
      tenantSummary: {
        totalStores: stores.length,
        activeStores,
      },
    };
  });
}
