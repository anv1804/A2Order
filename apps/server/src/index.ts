import "dotenv/config";
import { buildApp } from "./app.js";

const app = await buildApp();
const shutdown = async () => { await app.close(); };
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
try {
  await app.listen({ port: Number(process.env.PORT) || 4000, host: "0.0.0.0" });
} catch (error) {
  app.log.error({ code: (error as { code?: string }).code }, "Server startup failed");
  process.exitCode = 1;
  await app.close();
}
