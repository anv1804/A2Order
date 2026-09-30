import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { initSocketServer } from "./core/websocket/socketServer.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { tableRoutes } from "./modules/table/table.routes.js";
import { orderRoutes } from "./modules/order/order.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { storeRoutes } from "./modules/store/store.routes.js";
import { licenseRoutes } from "./modules/license/license.routes.js";
import { landingRoutes } from "./modules/landing/landing.routes.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { scenarioRoutes } from "./modules/scenario/scenario.routes.js";
import { menuRoutes } from "./modules/menu/menu.routes.js";

const fastify = Fastify({
  logger: false,
});

async function main() {
  await fastify.register(cors, {
    origin: "*",
  });

  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "a2order-secret-production-key-2026",
  });

  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(tableRoutes, { prefix: "/api/tables" });
  await fastify.register(orderRoutes, { prefix: "/api/orders" });
  await fastify.register(billingRoutes, { prefix: "/api/billing" });
  await fastify.register(storeRoutes, { prefix: "/api/stores" });
  await fastify.register(licenseRoutes, { prefix: "/api/licenses" });
  await fastify.register(landingRoutes, { prefix: "/api/landing" });
  await fastify.register(analyticsRoutes, { prefix: "/api/analytics" });
  await fastify.register(scenarioRoutes, { prefix: "/api/scenarios" });
  await fastify.register(menuRoutes, { prefix: "/api/menu" });

  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  const port = Number(process.env.PORT) || 4000;

  // Khởi tạo Socket.io trên http server nội tại của Fastify
  initSocketServer(fastify.server);

  await fastify.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 [A2Order Server] Running at http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
