import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: "./apps/server/.env" });
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 [A2Order DB Sync] Bắt đầu đồng bộ dữ liệu chuẩn lên PostgreSQL...");

  // Xóa key kịch bản mẫu cũ nếu có
  await prisma.systemConfig.deleteMany({
    where: { key: "scenario_templates" },
  });

  // Bảo đảm Store chuẩn A2 Roastery & Kitchen
  console.log("  -> Kiểm tra quán chính thức...");
  await prisma.store.upsert({
    where: { slug: "a2-kitchen" },
    update: {
      name: "A2 Roastery & Kitchen",
      address: "79 Đường Hoa Sứ, Phường 7, Phú Nhuận, TP.HCM",
      phone: "0908889999",
      status: "ACTIVE",
    },
    create: {
      id: "store-a2-kitchen",
      name: "A2 Roastery & Kitchen",
      slug: "a2-kitchen",
      address: "79 Đường Hoa Sứ, Phường 7, Phú Nhuận, TP.HCM",
      phone: "0908889999",
      status: "ACTIVE",
      configVersion: "v1.0.0",
    },
  });

  const totalStores = await prisma.store.count();
  const totalTables = await prisma.table.count();
  const totalDishes = await prisma.menuItem.count();

  console.log("  -> Hoàn tất kiểm đếm cơ sở dữ liệu thật:");
  console.log(`    - Tổng Quán (Stores): ${totalStores}`);
  console.log(`    - Tổng Bàn (Tables): ${totalTables}`);
  console.log(`    - Tổng Món Ăn (Menu Items): ${totalDishes}`);
  console.log("🎉 [A2Order DB Sync] Đồng bộ thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi đồng bộ dữ liệu lên DB:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
