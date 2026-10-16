# 🍽️ A2Order - Hệ thống Quản lý Vận hành & Gọi món Thông minh F&B

> **Phiên bản**: v7.0.0 • **Kiến trúc**: Monorepo (Turborepo-style npm workspaces) • **Phong cách thiết kế**: Donezo Forest Green

A2Order là nền tảng quản trị và vận hành toàn diện dành cho quán ăn, quán cà phê, nhà hàng vừa và nhỏ. Hệ thống tích hợp toàn bộ chuỗi giá trị: Gọi món tại bàn bằng QR/PWA, Màn hình bếp KDS thời gian thực, Thu ngân POS với Dynamic VietQR gạch nợ tự động, và Central SaaS CMS dành cho Chủ quán và Super Admin.

**Bản sửa tính toàn vẹn 16/10/2026:** xem [hướng dẫn chạy và nâng cấp database](docs/02-features/F02-operational-integrity/RUNBOOK.md) và [đối chiếu các phát hiện](docs/02-features/F02-operational-integrity/REMEDIATION.md). Luồng giao dịch hiện yêu cầu PostgreSQL, không dùng `USE_MOCK_DB=true`. Các tích hợp ngoài chưa cấu hình được báo rõ thay vì giả lập thành công. Cần triển khai migration và đổi credential đã từng vào lịch sử Git trước khi vận hành bản này.

---

## 🏗️ Cấu trúc Monorepo

```text
A2Order/
├── apps/
│   ├── client/          # Giao diện POS Thu ngân, Phục vụ (Mobile PWA T9), Khách gọi món QR, Bếp KDS (Port: 3000)
│   ├── cms/             # Central SaaS Engine: Quản lý cửa hàng (Port: 3001) & Super Admin Platform (Port: 3002)
│   └── server/          # Backend Fastify, Socket.io Real-time, Prisma ORM, Dual-DB Repository (Port: 4000)
├── packages/
│   └── shared/          # Typescript DTOs, Enums, Zod Schemas, Domain Models dùng chung
├── docs/                # Hệ thống tài liệu đặc tả kỹ thuật, hướng dẫn vận hành & nghiệp vụ F&B
├── .agents/             # Antigravity Rules & Skills cho AI Agent tự động hỗ trợ phát triển
├── AGENTS.md            # Sổ tay nguyên tắc & giới thiệu hệ thống tối cao cho AI Agent
└── README.md            # Bản đồ tổng quan dự án
```

---

## ⚡ Khởi chạy Nhanh (Quick Start)

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Khởi chạy Môi trường Phát triển (Local Dev)
Khởi chạy đồng thời toàn bộ hệ sinh thái (Server + Client POS + CMS):
```bash
npm run dev
```

Hoặc khởi chạy riêng từng ứng dụng theo nhu cầu:
```bash
# Backend Fastify + Socket.io Server (http://localhost:4000)
npm run dev:server

# Frontend Khách / Thu ngân / Phục vụ / KDS (http://localhost:3000)
npm run dev:client

# CMS Chủ quán (http://localhost:3001)
npm run dev:cms

# CMS Super Admin Nền tảng (http://localhost:3002)
npm run dev:admin
```

### 3. Kiểm tra Build & Typecheck
```bash
npm run build
```

---

## 🗄️ Cơ chế Dual-Database (Repository Pattern)

Hệ thống hỗ trợ 2 chế độ cơ sở dữ liệu linh hoạt thông qua biến môi trường `USE_MOCK_DB` trong `apps/server/.env`:

1. **In-Memory Stateful Store (`USE_MOCK_DB=true`)**: Chế độ mặc định phục vụ phát triển cực nhanh, không cần cài đặt PostgreSQL, dữ liệu lưu trữ trực tiếp trên RAM server và phản hồi tức thì.
2. **PostgreSQL Real Database (`USE_MOCK_DB=false`)**: Chế độ production / staging sử dụng Prisma ORM kết nối tới PostgreSQL database.
   * Tham khảo hướng dẫn chi tiết tại [`MOCK_TO_REAL_DB_MIGRATION_GUIDE.md`](./MOCK_TO_REAL_DB_MIGRATION_GUIDE.md).

---

## 🎨 Quy chuẩn Thiết kế & Bảng màu (Donezo Forest Green)

* **Bảng màu chủ đạo**:
  * Brand Primary: `#12372A` (Donezo Deep Forest Green)
  * Accent / Active: `#2E795E` / `#194B3A`
  * Mint Badge: `#E8F5EE` (Sage Mint)
  * Canvas Nền: `#F4F5F6`
  * Thẻ Card: `#FFFFFF`, bo góc `rounded-3xl`, viền `border-surface-border` (`#E3E5E5`)
* **Công thái học di động**: Chống nháy xanh (`tap-highlight-transparent`), nút bấm tối thiểu 44px - 52px, đệm đáy `pb-28` chống che khuất bởi bottom navigation.
* **Tương tác**: Không dùng `alert()` / `confirm()` mặc định của trình duyệt; bắt buộc dùng `toast.success()`, `toast.error()` và `confirmDialog()`.

---

## 👥 Vai trò & Phân quyền Hệ thống (RBAC)

1. **Super Admin**: Quản trị toàn bộ tenant, bản quyền phần mềm (SaaS Licenses), theo dõi MRR/ARR, tạo mẫu kịch bản menu nhà hàng.
2. **Chủ quán (Store Owner)**: Cài đặt quán, quản lý danh mục & món ăn, sơ đồ bàn ăn, nhân viên & mã PIN, báo cáo doanh thu & hóa đơn.
3. **Thu ngân (Cashier POS)**: Tiếp nhận đơn, mở bàn, tách/gộp hóa đơn, xuất Dynamic VietQR, gạch nợ tự động, in phiếu thanh toán.
4. **Bếp / Pha chế (Kitchen KDS)**: Nhận đơn theo thời gian thực (WebSocket), hiển thị thẻ món, gom mẻ chế biến, đếm giờ cảnh báo trễ SLA.
5. **Nhân viên Phục vụ (Waiter)**: Ứng dụng PWA di động, tìm kiếm món T9 một tay, gửi đơn vào bếp tức thì.
6. **Khách hàng**: Quét QR tại bàn, xem thực đơn số, thêm món, gọi nhân viên, theo dõi trạng thái món.

---

## 📖 Tra cứu Tài liệu Chi tiết

* [Bản đồ tài liệu tổng quan](./docs/README.md)
* [Quy tắc bất biến cho lập trình viên & AI Agent](./docs/.agent-guidelines.md)
* [Kiến trúc hệ thống & Multi-Tenancy](./docs/00-overview/02-system-architecture.md)
* [Bảng màu & Design Tokens](./docs/01-technical-specs/design-tokens-palette.md)
* [Đặc tả Cơ sở dữ liệu](./docs/01-technical-specs/database-schema.md)
* [Bảo mật, Idempotency & Phân quyền](./docs/01-technical-specs/security-and-rbac.md)
* [Giao thức Realtime WebSocket](./docs/01-technical-specs/realtime-websocket.md)
* [Tiêu chuẩn Hiệu năng & Code-Splitting](./docs/01-technical-specs/performance-and-optimization.md)
* [Hướng dẫn chuyển đổi PostgreSQL](./MOCK_TO_REAL_DB_MIGRATION_GUIDE.md)
