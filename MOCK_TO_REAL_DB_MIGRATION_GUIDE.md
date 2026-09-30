# HƯỚNG DẪN CHUYỂN ĐỔI TỪ MOCK DATABASE SANG DATABASE THẬT (PRISMA POSTGRESQL)
**Dự án**: A2Order POS & Management System  
**Kiến trúc**: Repository Pattern (Hexagonal Architecture)  
**Phiên bản**: v1.0.0

---

## 1. TỔNG QUAN KIẾN TRÚC & NGUYÊN LÝ THIẾT KẾ

Để giải quyết vấn đề mã nguồn bị phình to do nhúng cứng mock data vào component UI, A2Order đã tách biệt toàn bộ mock data ra khỏi frontend và đưa vào **Server Database Repository Layer** (`apps/server/src/core/database/`).

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                        │
│         apps/cms (Admin/Chủ quán)  |  apps/client (POS)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API Calls (/api/...)
┌──────────────────────────────▼──────────────────────────────┐
│                    API CONTROLLERS / ROUTES                 │
│   menu.routes.ts | store.routes.ts | license.routes.ts      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls IRepository Interface
┌──────────────────────────────▼──────────────────────────────┐
│                  REPOSITORY FACTORY LAYER                   │
│   (Tự động điều phối dựa trên USE_MOCK_DB !== "false")      │
├──────────────────────────────┬──────────────────────────────┤
│  USE_MOCK_DB=true (Mặc định) │     USE_MOCK_DB=false        │
│  ▼                           │     ▼                        │
│  MockDatabaseState           │     PrismaClient             │
│  (Stateful In-Memory Store)  │     (PostgreSQL Database)    │
└──────────────────────────────┴──────────────────────────────┘
```

### Điểm ưu việt:
1. **Frontend không đổi 1 dòng code**: Dù chạy mock hay database thật, các URL API, HTTP status, và JSON request/response schema là **giống nhau 100%**.
2. **Stateful Mock Database**: Khi chạy ở chế độ mock, các thao tác Thêm, Sửa, Xóa món, Gia hạn bản quyền, Đổi trạng thái bàn... đều được lưu trữ liên tục trong RAM của Server, mô phỏng như một Database thực thụ.
3. **Chuyển đổi 1-Click**: Chỉ cần thay đổi đúng 1 biến môi trường trong file `.env`.

---

## 2. BẢNG ÁNH XẠ DỮ LIỆU (SCHEMA MAPPING)

Dưới đây là bảng đối chiếu giữa Domain Model chia sẻ (`@a2order/shared`), Mock State và Prisma Schema (`apps/server/prisma/schema.prisma`):

| Khái niệm nghiệp vụ | Shared Domain Model | Prisma Model | Chú thích chuyển đổi |
| :--- | :--- | :--- | :--- |
| **Cửa hàng / Chi nhánh** | `TenantStoreRecord` | `Store` | Lưu thông tin định danh, loại hình kinh doanh (`BusinessType`), license key, phiên bản cấu hình |
| **Gói bản quyền thuê** | `LicenseRecord` | `StoreLicense` | 1-1 với `Store`. Quản lý thời hạn (`endDate`), số bàn tối đa (`maxTables`), số nhân viên |
| **Hóa đơn SaaS** | `SoftwareInvoiceRecord` | `SoftwareInvoice` | Lưu giao dịch thanh toán VietQR giữa chủ quán và A2Order platform |
| **Danh mục món** | `CategoryTemplate` | `Category` | Nhóm món (Cà phê, Trà sữa, Lẩu bò,...) |
| **Món ăn & Đồ uống** | `FnbDishItem` | `MenuItem` | Tên, đơn giá, ảnh Unsplash, tồn kho. `variantsJson` & `customizationsJson` lưu dưới dạng JSON text |
| **Khu vực & Bàn ăn** | `TableTemplate` | `TableZone` & `DiningTable` | Chia theo tầng/khu vực (Tầng 1, Tầng 2, Sân vườn) và trạng thái bàn |

---

## 3. QUY TRÌNH 5 BƯỚC NÂNG CẤP LÊN DATABASE THẬT

Khi dự án bước vào giai đoạn Production hoặc kiểm thử Staging với cơ sở dữ liệu thật, thực hiện chính xác các bước sau:

### Bước 1: Khởi tạo Database PostgreSQL
Chuẩn bị một kết nối PostgreSQL (có thể dùng PostgreSQL cài đặt cục bộ, Docker, hoặc dịch vụ Cloud như Supabase, Neon, AWS RDS, GCP Cloud SQL).
Ví dụ chuỗi kết nối:
```env
postgresql://postgres:password@localhost:5432/a2order_db?schema=public
```

### Bước 2: Cập nhật file cấu hình `apps/server/.env`
Tạo hoặc mở file `apps/server/.env` và thiết lập:
```env
# 1. Cổng máy chủ
PORT=4000

# 2. Chuỗi kết nối Database thật
DATABASE_URL="postgresql://postgres:password@localhost:5432/a2order_db?schema=public"

# 3. TẮT CHẾ ĐỘ MOCK -> BẬT CHẾ ĐỘ PRISMA THẬT
USE_MOCK_DB=false

# 4. Tài khoản Super Admin được tạo khi chạy seed
SUPER_ADMIN_SEED_EMAIL="admin@example.com"
SUPER_ADMIN_SEED_PASSWORD="thay-bang-mat-khau-rieng"
```

### Bước 3: Đồng bộ lược đồ bảng vào Database (Prisma Migration)
Mở terminal tại thư mục gốc của dự án hoặc thư mục `apps/server` và chạy:
```bash
# Di chuyển vào thư mục server
cd apps/server

# Sinh mã Prisma Client tương thích
npm run prisma:generate

# Tạo bảng và indexes trong PostgreSQL
npm run prisma:migrate
```

### Bước 4: Gieo mầm dữ liệu chuẩn 8 mô hình F&B (Database Seed)
Hệ thống đã có sẵn script seed chuẩn tự động đưa toàn bộ 8 mô hình kinh doanh F&B (Quán Cà Phê, Trà Sữa, Quán Nhậu, Buffet, Fast Food, Phở & Bún, Nhà Hàng Fine Dining, Tiệm Bánh):
```bash
npm run db:seed
```
*Kết quả terminal:*
```
🌱 [A2Order Prisma Seed] Bắt đầu gieo mầm dữ liệu mẫu F&B chuẩn...
  -> Tạo cửa hàng mẫu [Highlands Coffee Station] (CAFE)...
  -> Tạo cửa hàng mẫu [Gong Cha Tea Bar] (MILK_TEA)...
  -> Tạo cửa hàng mẫu [Bia Hơi Phố Cổ 99] (PUB_BEER)...
  ...
✅ [A2Order Prisma Seed] Hoàn tất gieo mầm dữ liệu thành công!
```

### Bước 5: Khởi động lại Server & Xác minh
Khởi động máy chủ backend:
```bash
npm run dev --workspace=@a2order/server
```
Quan sát dòng log đầu tiên khi Server khởi động:
```
🐘 [A2Order Database] Running in REAL DATABASE mode (Prisma Client Layer)
🚀 [A2Order Server] Running at http://localhost:4000
```
Khi thấy biểu tượng `🐘 [A2Order Database] Running in REAL DATABASE mode`, toàn bộ hệ thống đã hoạt động trên Database PostgreSQL thật!

---

## 4. DANH SÁCH REST API ĐÃ CHUẨN HÓA SẴN SÀNG CHO DATABASE THẬT

Tất cả các endpoint dưới đây đều gọi thông qua `repositoryFactory`:

### Kịch bản kinh doanh F&B (Scenarios):
- `GET /api/scenarios` : Lấy danh sách 8 gói kịch bản mẫu.
- `GET /api/scenarios/:type` : Lấy chi tiết kịch bản (dishes, categories, tables).
- `POST /api/scenarios/:type/apply/:storeId` : Ghi đè hoặc thêm món mẫu vào menu của quán (`{ mode: "REPLACE" | "APPEND" }`).

### Quản lý Thực đơn & Món (Menu & Dishes):
- `GET /api/menu/:storeId` : Lấy toàn bộ thực đơn theo store.
- `GET /api/menu/:storeId/dishes/:dishId` : Lấy chi tiết 1 món kèm biến thể & topping.
- `POST /api/menu/:storeId/dishes` : Thêm món ăn mới.
- `PUT /api/menu/:storeId/dishes/:dishId` : Cập nhật thông tin món, giá bán, biến thể, topping.
- `PATCH /api/menu/:storeId/dishes/:dishId/stock` : Cập nhật nhanh số lượng tồn kho hoặc trạng thái còn/hết hàng.
- `DELETE /api/menu/:storeId/dishes/:dishId` : Xóa món ăn khỏi thực đơn.

### Quản lý Quán & Bản quyền (Stores & Licenses):
- `GET /api/stores` : Danh sách tất cả chi nhánh/quán trên nền tảng.
- `GET /api/stores/:storeId` : Chi tiết quán.
- `POST /api/stores` : Đăng ký quán mới (tự động áp dụng gói kịch bản phù hợp).
- `PUT /api/stores/:storeId` : Sửa thông tin quán.
- `POST /api/stores/:storeId/publish` : Xuất bản cấu hình mới (tăng `configVersion` và phát WebSocket báo cho POS).
- `GET /api/licenses` : Danh sách tất cả bản quyền phần mềm đã cấp.
- `POST /api/licenses` : Cấp mới license.
- `POST /api/licenses/:keyCode/renew` : Gia hạn thời hạn bản quyền.
- `GET /api/licenses/invoices/all` : Danh sách hóa đơn thuê phần mềm.

---

## 5. CÁCH QUAY LẠI CHẾ ĐỘ MOCK KHI CẦN PHÁT TRIỂN TIẾP
Nếu bạn cần phát triển tính năng mới nhanh chóng offline mà không muốn chạy PostgreSQL:
1. Đặt `USE_MOCK_DB=true` trong `apps/server/.env`.
2. Khởi động lại server. Hệ thống tự động chuyển sang `📦 [A2Order Database] Running in MOCK REPOSITORY mode`.
