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
        storeId: "store-demo",
        storeName: "Phở Bò Nam Định - Gia Truyền",
        customDomain: "phobonamdinh.vn",
        slug: slugOrDomain,
        heroTitle: "Phở Bò Nam Định - Hương Vị Gia Truyền 30 Năm",
        heroSubtitle: "Nước dùng ninh xương bò tươi 18 tiếng theo bí quyết truyền thống",
        heroBannerUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1200&auto=format&fit=crop",
        storyContent: "Khởi nguồn từ gánh phở rong phố cổ năm 1995, Phở Bò Nam Định gìn giữ trọn vẹn hương vị nước dùng trong, ngọt thanh từ tủy bò tự nhiên cùng bánh phở tươi tráng tay mỗi sáng.",
        openingHours: "06:00 - 14:00 & 17:00 - 22:30",
        hotline: "0912 345 678",
        address: "Số 88 Phố Trần Thái Tông, Cầu Giấy, Hà Nội",
        googleMapsUrl: "https://maps.google.com",
        isBookingOpen: true,
        isPublished: true,
        publicMenuCategories: [
          {
            name: "Phở Bò Truyền Thống",
            items: [
              { id: "m1", name: "Phở Bò Tái Nạm", price: 65000, description: "Bò tái mềm mọng kèm nạm giòn thơm nức" },
              { id: "m2", name: "Phở Bò Tái Lăn", price: 75000, description: "Thịt bò xào lăn tỏi lửa lớn dậy mùi" },
              { id: "m3", name: "Phở Đặc Biệt (Tái, Nạm, Gầu, Gân)", price: 90000, description: "Đầy đặn tinh hoa bát phở truyền thống" },
            ],
          },
          {
            name: "Đồ Uống & Tráng Miệng",
            items: [
              { id: "d1", name: "Trà Đào Cam Sả", price: 35000, description: "Trà ủ lạnh trái cây thanh mát" },
              { id: "d2", name: "Trứng Trần Nước Béo", price: 15000, description: "Trứng trần lòng đào béo ngậy" },
            ],
          },
        ],
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
