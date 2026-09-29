import { PrismaClient } from "@prisma/client";
import { ALL_SCENARIOS } from "../src/mockData/businessScenariosData.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [A2Order Prisma Seed] Bắt đầu gieo mầm dữ liệu mẫu F&B chuẩn...");

  for (const scenario of ALL_SCENARIOS) {
    const storeSlug = scenario.businessType.toLowerCase().replace(/_/g, "-");
    const storeId = `store-${storeSlug}`;

    console.log(`  -> Tạo cửa hàng mẫu [${scenario.name}] (${scenario.businessType})...`);

    // 1. Tạo Store
    const store = await prisma.store.upsert({
      where: { id: storeId },
      update: {
        name: scenario.name,
        businessType: scenario.businessType,
        address: "79 Đường Hoa Sứ, Phường 7, Phú Nhuận, TP.HCM",
        phone: "0908889999",
      },
      create: {
        id: storeId,
        name: scenario.name,
        slug: storeSlug,
        businessType: scenario.businessType,
        address: "79 Đường Hoa Sứ, Phường 7, Phú Nhuận, TP.HCM",
        phone: "0908889999",
        configVersion: "v1.0.0",
      },
    });

    // 2. Tạo License
    const licenseKey = `A2-PRO-${scenario.businessType}-2026`;
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

    // 3. Tạo Khu vực & Bàn (TableZone & DiningTable)
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

    for (let i = 0; i < scenario.tables.length; i++) {
      const tableData = scenario.tables[i];
      const tableId = `tbl-${storeSlug}-${i + 1}`;
      await prisma.diningTable.upsert({
        where: { id: tableId },
        update: {
          name: tableData.name,
          capacity: tableData.capacity,
          currentStatus: tableData.status,
        },
        create: {
          id: tableId,
          storeId: store.id,
          zoneId: zone.id,
          name: tableData.name,
          capacity: tableData.capacity,
          currentStatus: tableData.status,
          sortOrder: i + 1,
        },
      });
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
      const catId = categoryMap.get(dish.category) || undefined;
      await prisma.menuItem.upsert({
        where: { id: dish.id },
        update: {
          name: dish.name,
          price: dish.price,
          unit: dish.unit,
          imageUrl: dish.image,
          isAvailable: dish.isAvailable,
          currentStock: dish.stockQuantity,
          preparationTimeMinutes: dish.prepTimeMinutes,
          variantsJson: dish.variants ? JSON.stringify(dish.variants) : null,
          customizationsJson: dish.customizationGroups ? JSON.stringify(dish.customizationGroups) : null,
        },
        create: {
          id: dish.id,
          storeId: store.id,
          categoryId: catId,
          name: dish.name,
          price: dish.price,
          unit: dish.unit,
          imageUrl: dish.image,
          isAvailable: dish.isAvailable,
          currentStock: dish.stockQuantity,
          preparationTimeMinutes: dish.prepTimeMinutes,
          variantsJson: dish.variants ? JSON.stringify(dish.variants) : null,
          customizationsJson: dish.customizationGroups ? JSON.stringify(dish.customizationGroups) : null,
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
