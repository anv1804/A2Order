import { workforceRoutes } from "./modules/workforce/workforce.routes.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { initSocketServer } from "./core/websocket/socketServer.js";
import { registerAccess } from "./core/security/access.js";
import { safeError } from "./core/security/errors.js";
import { prisma } from "./core/database/prismaClient.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { tableRoutes } from "./modules/table/table.routes.js";
import { orderRoutes } from "./modules/order/order.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { storeRoutes } from "./modules/store/store.routes.js";
import { licenseRoutes } from "./modules/license/license.routes.js";
import { landingRoutes } from "./modules/landing/landing.routes.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { menuRoutes } from "./modules/menu/menu.routes.js";
import { staffRoutes } from "./modules/staff/staff.routes.js";
import { configRoutes } from "./modules/config/config.routes.js";
import { workspaceRoutes } from "./modules/workspace/workspace.routes.js";

export async function buildApp(options: { logger?: boolean; secret?: string; sockets?: boolean } = {}) {
  if (process.env.USE_MOCK_DB === "true") throw new Error("USE_MOCK_DB=true is not supported by transactional operations. Use an isolated PostgreSQL database for development.");
  const secret = options.secret || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters. Run npm run setup.");
  if (process.env.NODE_ENV === "production") {
    const roles = await prisma.$queryRaw<Array<{ rolbypassrls: boolean; rolsuper: boolean }>>`SELECT rolbypassrls,rolsuper FROM pg_roles WHERE rolname=current_user`;
    if (roles[0]?.rolbypassrls || roles[0]?.rolsuper) throw new Error("DATABASE_URL must use a NOBYPASSRLS application role in production. See npm run db:runtime.");
  }
  const app = Fastify({ logger: options.logger ?? true, bodyLimit: 3000000, requestTimeout: 30000 });
  const origins = (process.env.APP_ORIGINS || "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",").map(s => s.trim());
  await app.register(cors, { origin: origins, methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], exposedHeaders: ["ETag"], allowedHeaders: ["Authorization", "Content-Type", "x-idempotency-key", "x-client-id", "x-session-request", "If-None-Match"] });
  await app.register(fastifyJwt, { secret });
  registerAccess(app);
  app.setErrorHandler((error, request, reply) => {
    const result = safeError(error);
    if (result.status >= 500) request.log.error({ errorType: error instanceof Error ? error.name : "Unknown", requestId: request.id }, "Request failed");
    return reply.status(result.status).send({ success: false, code: result.code, error: result.message, requestId: request.id });
  });
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(tableRoutes, { prefix: "/api/tables" });
  await app.register(orderRoutes, { prefix: "/api/orders" });
  await app.register(billingRoutes, { prefix: "/api/billing" });
  await app.register(storeRoutes, { prefix: "/api/stores" });
  await app.register(staffRoutes, { prefix: "/api/staff" });
  await app.register(licenseRoutes, { prefix: "/api/licenses" });
  await app.register(landingRoutes, { prefix: "/api/landing" });
  await app.register(analyticsRoutes, { prefix: "/api/analytics" });
  await app.register(menuRoutes, { prefix: "/api/menu" });
  await app.register(configRoutes, { prefix: "/api/config" });
  await app.register(workspaceRoutes, { prefix: "/api/workspace" });
  await app.register(workforceRoutes, { prefix: "/api/workforce" });
  app.addHook("onSend", async (request, reply) => { if (request.url.startsWith("/api/")) reply.header("Cache-Control", "private, no-store"); });
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async (_request, reply) => {
    try { await prisma.$queryRaw`SELECT "discountAmount", "promotionSnapshot" FROM "OrderBatch" LIMIT 0`; await prisma.$queryRaw`SELECT "version" FROM "WorkspaceDocument" LIMIT 0`; return { status: "ready" }; }
    catch { return reply.status(503).send({ status: "unavailable" }); }
  });
  if (options.sockets !== false) {
    const io = initSocketServer(app.server, app, origins);
    app.addHook("onClose", async () => { await io.close(); });
  }
  return app;
}
