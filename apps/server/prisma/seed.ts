import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } } });

async function main() {
  console.log("🌱 [A2Order Prisma Seed] Bắt đầu gieo mầm dữ liệu...");

  const adminEmail = process.env.SUPER_ADMIN_SEED_EMAIL?.trim();
  const adminPassword = process.env.SUPER_ADMIN_SEED_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 10) {
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
