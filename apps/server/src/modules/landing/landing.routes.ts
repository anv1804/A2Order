import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../core/database/prismaClient.js";
import { command } from "../../core/security/commands.js";
import { currentStore } from "../../core/security/access.js";
import { requireValue } from "../../core/security/errors.js";
import { checkLicense } from "../order/order.service.js";

const url = z.string().max(2000).refine(value => !value || /^https?:\/\//i.test(value), "Đường dẫn phải dùng http hoặc https").optional();
const landingInput = z.object({ customDomain: z.string().trim().max(200).regex(/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$|^$/).optional(), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,100}$/), heroTitle: z.string().trim().min(1).max(200), heroSubtitle: z.string().max(500).optional(), heroBannerUrl: url, storyContent: z.string().max(10000).optional(), openingHours: z.string().max(100).optional(), hotline: z.string().max(30).optional(), address: z.string().max(500).optional(), googleMapsUrl: url, facebookUrl: url, zaloPhone: z.string().max(30).optional(), isBookingOpen: z.boolean().default(false), isPublished: z.boolean().default(false) });
export const landingRoutes: FastifyPluginAsync = async app => {
  app.get("/public/:slugOrDomain", async request => {
    const { slugOrDomain } = request.params as { slugOrDomain: string };
    const page = requireValue(await prisma.storeLandingPage.findFirst({ where: { isPublished: true, OR: [{ slug: slugOrDomain }, { customDomain: slugOrDomain }], store: { status: "ACTIVE" } }, include: { store: { include: { categories: { include: { menuItems: { where: { isAvailable: true, archivedAt: null }, select: { id: true, name: true, price: true, image: true, description: true } } }, orderBy: { sortOrder: "asc" } } } } } }), "Trang chưa được xuất bản");
    return { storeId: page.storeId, storeName: page.store.name, slug: page.slug, customDomain: page.customDomain, heroTitle: page.heroTitle, heroSubtitle: page.heroSubtitle, heroBannerUrl: page.heroBannerUrl, storyContent: page.storyContent, openingHours: page.openingHours, hotline: page.hotline, address: page.address, googleMapsUrl: page.googleMapsUrl, facebookUrl: page.facebookUrl, zaloPhone: page.zaloPhone, isBookingOpen: page.isBookingOpen, isPublished: page.isPublished, publicMenuCategories: page.store.categories.map(c => ({ name: c.name, items: c.menuItems })) };
  });
  app.get("/cms/:storeId", async request => {
    const storeId = currentStore(request);
    return { success: true, data: await prisma.storeLandingPage.findUnique({ where: { storeId } }) };
  });
  app.put("/cms/:storeId/update", async request => {
    const storeId = currentStore(request);
    const input = landingInput.parse(request.body);
    const landingPage = await command(request, storeId, "LANDING_SAVE", async tx => {
      await checkLicense(tx, storeId, "MODULE_LANDING_PAGE");
      const data = { ...input, customDomain: input.customDomain || null };
      return tx.storeLandingPage.upsert({ where: { storeId }, create: { storeId, ...data }, update: data });
    });
    return { success: true, data: landingPage };
  });
};
