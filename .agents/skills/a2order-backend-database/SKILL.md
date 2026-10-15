---
name: a2order-backend-database
description: >-
  Fastify API architecture, dual-database repository pattern (in-memory mock store vs Prisma PostgreSQL), and schema synchronization for A2Order.
  The agent MUST activate and read this skill automatically whenever editing Fastify routes, controllers, Prisma schemas,
  database migrations, seed data, or shared data models in packages/shared.
---

# A2Order Backend & Dual-Database Repository Skill

Kỹ năng này hướng dẫn cách làm việc với backend Fastify, cấu trúc Repository Pattern (Hexagonal), và cơ chế Dual-Database (Mock In-Memory vs Prisma PostgreSQL) trong A2Order.

---

## 1. Cơ Chế Dual-Database (Repository Pattern)

Hệ thống cung cấp 2 chế độ cơ sở dữ liệu qua biến môi trường `USE_MOCK_DB` trong `apps/server/.env`:

1. **`USE_MOCK_DB=true` (Mặc định khi phát triển)**:
   * Dùng `MockDatabaseState` (lưu in-memory trên RAM Server).
   * Khởi động server ngay lập tức mà không cần cài đặt hay chạy dịch vụ PostgreSQL bên ngoài.
   * Dữ liệu mô phỏng đầy đủ nghiệp vụ: thêm, sửa, xóa món, tạo đơn, đổi trạng thái bàn, gia hạn bản quyền.
2. **`USE_MOCK_DB=false` (Production / Staging)**:
   * Dùng `PrismaClient` kết nối tới PostgreSQL thật.
   * Đảm bảo tính toàn vẹn dữ liệu quan hệ, ACID transactions và lưu trữ vĩnh viễn.

---

## 2. Quy Trình Đồng Bộ Khi Thêm / Sửa Trường Dữ Liệu (Field)

Khi nghiệp vụ yêu cầu thêm hoặc sửa một trường dữ liệu (ví dụ: thêm `isChefSpecial: boolean` vào món ăn):

### Bước 1: Khai báo trong Shared Model (`packages/shared`)
Cập nhật interface hoặc DTO trong `packages/shared/src/`:
```ts
export interface FnbDishItem {
  id: string;
  storeId: string;
  name: string;
  price: number;
  isChefSpecial?: boolean; // Trường mới
  // ...
}
```

### Bước 2: Cập nhật Mock Database State (`apps/server`)
Cập nhật trong `apps/server/src/core/database/mock/` để chế độ mock data hoạt động trơn tru:
* Thêm giá trị mặc định cho dữ liệu mock ban đầu.
* Cập nhật các hàm repository tương ứng (ví dụ: `updateMenuItem`, `createMenuItem`).

### Bước 3: Cập nhật Prisma Schema (`apps/server/prisma/schema.prisma`)
Thêm trường vào model tương ứng:
```prisma
model MenuItem {
  id            String   @id @default(uuid())
  storeId       String
  name          String
  price         Float
  isChefSpecial Boolean  @default(false)
  // ...
}
```
Sau đó chạy lệnh sinh client:
```bash
npx prisma generate --schema=apps/server/prisma/schema.prisma
```

---

## 3. Cấu Trúc Tuyến Đường Fastify (Route Module)

Mỗi module nghiệp vụ trong `apps/server/src/modules/` bao gồm:
* `*.routes.ts`: Đăng ký tuyến đường HTTP, kiểm tra JWT, áp dụng tiền tố URL.
* `*.controller.ts`: Tiếp nhận HTTP Request, validate body/params bằng Zod/Shared schema, gọi Repository và trả về JSON chuẩn.
* `*.service.ts` (hoặc repository): Thực hiện nghiệp vụ và truy vấn dữ liệu.

Ví dụ đăng ký route chuẩn:
```ts
export async function menuRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    const { storeId } = request.query as { storeId: string };
    if (!storeId) {
      return reply.status(400).send({ error: "Missing storeId" });
    }
    const items = await menuRepository.getItemsByStore(storeId);
    return { success: true, data: items };
  });
}
```

---

## 4. Các Lệnh Thao Tác Thường Dùng
```bash
# Kiểm tra build toàn bộ workspace server
npm run build --workspace=apps/server

# Chạy seed dữ liệu mẫu vào PostgreSQL
npx prisma db seed --schema=apps/server/prisma/schema.prisma

# Sinh migration mới cho Prisma
npx prisma migrate dev --name init_schema --schema=apps/server/prisma/schema.prisma
```
