import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_BUSINESS_SCENARIOS } from "../src/mockData/businessScenariosData.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [A2Order Prisma Seed] Bắt đầu gieo mầm dữ liệu...");

  const adminEmail = process.env.SUPER_ADMIN_SEED_EMAIL?.trim();
  const adminPassword = process.env.SUPER_ADMIN_SEED_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("Cần cấu hình SUPER_ADMIN_SEED_EMAIL và SUPER_ADMIN_SEED_PASSWORD trước khi chạy seed.");
  }

  // 0. Tạo Trụ sở & Tài khoản Super Admin chính thức
  console.log("  -> Tạo tài khoản Super Admin...");
  const systemStore = await prisma.store.upsert({
    where: { slug: "a2order-platform" },
    update: {},
    create: {
      id: "store-a2platform-system",
      name: "A2Order Platform HQ",
      slug: "a2order-platform",
      status: "ACTIVE",
      phone: "0908889999",
      address: "Trụ sở Quản trị A2Order SaaS",
    },
  });

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.staff.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      name: "Quản trị viên",
      isActive: true,
      storeId: systemStore.id,
    },
    create: {
      storeId: systemStore.id,
      name: "Quản trị viên",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const scenarios = Object.values(DEFAULT_BUSINESS_SCENARIOS);

  for (const scenario of scenarios) {
    const storeSlug = scenario.type.toLowerCase().replace(/_/g, "-");
    const storeId = `store-${storeSlug}`;

    console.log(`  -> Tạo cửa hàng mẫu [${scenario.businessName}] (${scenario.type})...`);

    // 1. Tạo Store
    const store = await prisma.store.upsert({
      where: { id: storeId },
      update: {
        name: scenario.businessName,
        slug: storeSlug,
        address: "79 Đường Hoa Sứ, Phường 7, Phú Nhuận, TP.HCM",
        phone: "0908889999",
      },
      create: {
        id: storeId,
        name: scenario.businessName,
        slug: storeSlug,
        address: "79 Đường Hoa Sứ, Phường 7, Phú Nhuận, TP.HCM",
        phone: "0908889999",
        configVersion: "v1.0.0",
      },
    });

    // 2. Tạo License
    const licenseKey = `A2-PRO-${scenario.type}-2026`;
    await prisma.storeLicense.upsert({
      where: { storeId: store.id },
      update: {
        licenseKey,
        planType: "PRO",
        status: "ACTIVE",
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      create: {
        storeId: store.id,
        licenseKey,
        planType: "PRO",
        enabledModules: "CORE_POS,MODULE_KDS,MODULE_ACCOUNTING,MODULE_QR_ORDER,MODULE_ADVANCED_ANALYTICS",
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxTables: 30,
        maxStaff: 20,
      },
    });

    // 3. Tạo Khu vực & Bàn (TableZone & Table)
    const zone = await prisma.tableZone.upsert({
      where: { id: `zone-${storeSlug}-main` },
      update: { name: "Khu vực chính" },
      create: {
        id: `zone-${storeSlug}-main`,
        storeId: store.id,
        name: "Khu vực chính",
        sortOrder: 1,
      },
    });

    if (scenario.defaultTables && scenario.defaultTables.length > 0) {
      for (let i = 0; i < scenario.defaultTables.length; i++) {
        const tableData = scenario.defaultTables[i];
        const tableId = `tbl-${storeSlug}-${tableData.id}`;
        await prisma.table.upsert({
          where: { id: tableId },
          update: {
            name: tableData.name,
            status: "EMPTY",
          },
          create: {
            id: tableId,
            storeId: store.id,
            zoneId: zone.id,
            name: tableData.name,
            status: "EMPTY",
          },
        });
      }
    }

    // 4. Tạo Danh mục (Category)
    const categoryMap = new Map<string, string>();
    for (let cIdx = 0; cIdx < scenario.categories.length; cIdx++) {
      const cat = scenario.categories[cIdx];
      const catId = `cat-${storeSlug}-${cIdx + 1}`;
      const savedCat = await prisma.category.upsert({
        where: { id: catId },
        update: { name: cat.name },
        create: {
          id: catId,
          storeId: store.id,
          name: cat.name,
          sortOrder: cIdx + 1,
        },
      });
      categoryMap.set(cat.name, savedCat.id);
    }

    // 5. Tạo Món ăn (MenuItem)
    for (const dish of scenario.dishes) {
      const catId = categoryMap.get(dish.category) || Array.from(categoryMap.values())[0];
      if (!catId) continue;

      const dishId = `dish-${storeSlug}-${dish.id}`;
      await prisma.menuItem.upsert({
        where: { id: dishId },
        update: {
          name: dish.name,
          price: dish.price,
          image: dish.image || null,
          isAvailable: dish.isAvailable ?? true,
          station: dish.station || "KITCHEN",
        },
        create: {
          id: dishId,
          storeId: store.id,
          categoryId: catId,
          name: dish.name,
          price: dish.price,
          image: dish.image || null,
          isAvailable: dish.isAvailable ?? true,
          station: dish.station || "KITCHEN",
        },
      });
    }
  }

  console.log("✅ [A2Order Prisma Seed] Hoàn tất gieo mầm dữ liệu thành công!");
}

main()
  .catch((e) => {
    console.error("❌ [A2Order Prisma Seed] Lỗi gieo mầm dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
