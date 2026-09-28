import Fastify from "fastify";
import cors from "@fastify/cors";
import { initSocketServer } from "./core/websocket/socketServer.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { tableRoutes } from "./modules/table/table.routes.js";
import { orderRoutes } from "./modules/order/order.routes.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";

const fastify = Fastify({
  logger: false,
});

async function main() {
  await fastify.register(cors, {
    origin: "*",
  });

  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(tableRoutes, { prefix: "/api/tables" });
  await fastify.register(orderRoutes, { prefix: "/api/orders" });
  await fastify.register(billingRoutes, { prefix: "/api/billing" });

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
