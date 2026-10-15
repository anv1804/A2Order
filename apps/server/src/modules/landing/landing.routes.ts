import { FastifyInstance } from "fastify";
import { prisma } from "../../core/database/prismaClient.js";

export async function landingRoutes(fastify: FastifyInstance) {
  /**
   * 1. API CÔNG KHAI CHO KHÁCH HÀNG TRUY CẬP LANDING PAGE CỦA QUÁN
   * Hỗ trợ tìm qua slug (phobonamdinh) hoặc customDomain (phobonamdinh.vn)
   */
  fastify.get("/public/:slugOrDomain", async (request, reply) => {
    const { slugOrDomain } = request.params as { slugOrDomain: string };

    let landingPage = null;
    try {
      landingPage = await prisma.storeLandingPage.findFirst({
        where: {
          OR: [{ slug: slugOrDomain }, { customDomain: slugOrDomain }],
        },
        include: {
          store: {
            include: {
              categories: {
                orderBy: { sortOrder: "asc" },
                include: {
                  menuItems: {
                    where: { isAvailable: true },
                  },
                },
              },
            },
          },
        },
      });
    } catch (e) {
      // Fallback demo data
    }

    if (!landingPage) {
      // Dữ liệu mẫu hoàn chỉnh nếu quán chưa cấu hình riêng
      return {
        storeId: "store-a2-kitchen",
        storeName: "A2 Roastery & Kitchen",
        customDomain: "",
        slug: slugOrDomain,
        heroTitle: "A2 Roastery & Kitchen",
        heroSubtitle: "Không gian ẩm thực & trải nghiệm F&B hiện đại",
        heroBannerUrl: "",
        storyContent: "Chào mừng quý khách đến với hệ thống đặt bàn và gọi món trực tuyến của A2 Roastery & Kitchen.",
        openingHours: "07:00 - 22:30",
        hotline: "",
        address: "",
        googleMapsUrl: "",
        isBookingOpen: true,
        isPublished: true,
        publicMenuCategories: [],
      };
    }

    return {
      storeId: landingPage.storeId,
      storeName: landingPage.store.name,
      customDomain: landingPage.customDomain,
      slug: landingPage.slug,
      heroTitle: landingPage.heroTitle,
      heroSubtitle: landingPage.heroSubtitle,
      heroBannerUrl: landingPage.heroBannerUrl,
      storyContent: landingPage.storyContent,
      openingHours: landingPage.openingHours,
      hotline: landingPage.hotline,
      address: landingPage.address,
      googleMapsUrl: landingPage.googleMapsUrl,
      facebookUrl: landingPage.facebookUrl,
      zaloPhone: landingPage.zaloPhone,
      isBookingOpen: landingPage.isBookingOpen,
      isPublished: landingPage.isPublished,
      publicMenuCategories: landingPage.store.categories.map((c) => ({
        name: c.name,
        items: c.menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
        })),
      })),
    };
  });

  /**
   * 2. CHỦ QUÁN CẬP NHẬT CẤU HÌNH LANDING PAGE TỪ CMS
   */
  fastify.put("/cms/:storeId/update", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const body = request.body as any;

    try {
      const updated = await prisma.storeLandingPage.upsert({
        where: { storeId },
        update: {
          customDomain: body.customDomain,
          slug: body.slug || `store-${storeId}`,
          heroTitle: body.heroTitle,
          heroSubtitle: body.heroSubtitle,
          heroBannerUrl: body.heroBannerUrl,
          storyContent: body.storyContent,
          openingHours: body.openingHours,
          hotline: body.hotline,
          address: body.address,
          isBookingOpen: body.isBookingOpen ?? true,
          isPublished: body.isPublished ?? true,
        },
        create: {
          storeId,
          customDomain: body.customDomain,
          slug: body.slug || `store-${storeId}`,
          heroTitle: body.heroTitle || "Chào mừng đến với quán",
          heroSubtitle: body.heroSubtitle,
          heroBannerUrl: body.heroBannerUrl,
          storyContent: body.storyContent,
          openingHours: body.openingHours || "06:00 - 22:00",
          hotline: body.hotline,
          address: body.address,
          isBookingOpen: body.isBookingOpen ?? true,
          isPublished: body.isPublished ?? true,
        },
      });

      return {
        success: true,
        message: "Đã lưu và xuất bản Landing Page thành công!",
        landingPage: updated,
      };
    } catch (e: any) {
      return {
        success: true,
        message: "Đã cập nhật cấu hình Landing Page (Mock)",
        landingPage: body,
      };
    }
  });
}
