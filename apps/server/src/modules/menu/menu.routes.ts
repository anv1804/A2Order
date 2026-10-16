import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../core/database/prismaClient.js";
import { currentStore } from "../../core/security/access.js";
import { command } from "../../core/security/commands.js";
import { requireValue } from "../../core/security/errors.js";
import { menuView, saveDish } from "./menu.service.js";
import { checkLicense } from "../order/order.service.js";
import { emitToStore } from "../../core/websocket/socketServer.js";

export const menuRoutes: FastifyPluginAsync = async app => {
  app.get("/:storeId", async request => ({ success: true, data: (await prisma.menuItem.findMany({ where: { storeId: currentStore(request), archivedAt: null }, include: { category: true }, orderBy: { name: "asc" } })).map(menuView) }));
  app.get("/:storeId/dishes/:dishId", async request => {
    const { dishId } = request.params as { dishId: string };
    return { success: true, data: menuView(requireValue(await prisma.menuItem.findFirst({ where: { id: dishId, storeId: currentStore(request), archivedAt: null }, include: { category: true } }))) };
  });
  app.post("/:storeId/dishes", async request => {
    const storeId = currentStore(request);
    const data = await command(request, storeId, "MENU_CREATE", async tx => { await checkLicense(tx, storeId); return saveDish(tx, storeId, request.body); });
    emitToStore(storeId, "store:config_updated", { storeId });
    return { success: true, data };
  });
  app.put("/:storeId/dishes/:dishId", async request => {
    const { dishId } = request.params as { dishId: string };
    const storeId = currentStore(request);
    const data = await command(request, storeId, "MENU_UPDATE", tx => saveDish(tx, storeId, request.body, dishId));
    emitToStore(storeId, "store:config_updated", { storeId });
    return { success: true, data };
  });
  app.patch("/:storeId/dishes/:dishId/stock", async request => {
    const { dishId } = request.params as { dishId: string };
    const input = z.object({ stockCount: z.number().int().min(0).max(1000000).optional(), isAvailable: z.boolean().optional() }).refine(v => v.stockCount !== undefined || v.isAvailable !== undefined).parse(request.body);
    const storeId = currentStore(request);
    const data = await command(request, storeId, "MENU_STOCK", tx => saveDish(tx, storeId, { ...input, ...(input.stockCount !== undefined ? { isAvailable: input.stockCount > 0 } : {}) }, dishId));
    emitToStore(storeId, "store:config_updated", { storeId });
    return { success: true, data };
  });
  app.delete("/:storeId/dishes/:dishId", async request => {
    const { dishId } = request.params as { dishId: string };
    const storeId = currentStore(request);
    await command(request, storeId, "MENU_ARCHIVE", async tx => { await tx.menuItem.update({ where: { id_storeId: { id: dishId, storeId } }, data: { archivedAt: new Date(), isAvailable: false } }); await tx.store.update({ where: { id: storeId }, data: { configVersion: "v-" + crypto.randomUUID() } }); return { success: true }; });
    emitToStore(storeId, "store:config_updated", { storeId });
    return { success: true };
  });
};
