# 📚 BẢN ĐỒ TÀI LIỆU HỆ THỐNG A2ORDER (v7.0.0 MONOREPO)

Hệ thống tài liệu A2Order được cấu trúc thành **3 phân vùng chuyên biệt**, phục vụ kép:
1. **Dành cho AI Agent & Lập trình viên**: Nắm rõ kiến trúc, quy chuẩn code, cơ sở dữ liệu, bảo mật, hiệu năng và quy trình bắt buộc khi phát triển tính năng mới.
2. **Dành cho Khách hàng & Chủ quán**: Hướng dẫn vận hành trực quan, dễ hiểu cho từng vai trò (Chủ quán, Thu ngân, Bếp, Phục vụ).

---

## 📂 CẤU TRÚC THƯ MỤC TÀI LIỆU (`/docs`)

```text
docs/
├── README.md                          <-- [Bạn đang ở đây] Bản đồ tra cứu tài liệu
├── .agent-guidelines.md               <-- QUY TẮC BẤT BIẾN cho AI Agent khi lập trình
├── ARCHITECTURE_FLOW.md               <-- Luồng tương tác toàn hệ thống Bàn -> Bếp -> Thu ngân
├── HE_THONG_A2ORDER_VA_BAO_MAT.md    <-- Báo cáo bảo mật 5 tầng & Kiến trúc phòng thủ
├── UI_UX_GUIDELINES.md                <-- Hướng dẫn giao diện Donezo Forest Green & Công thái học
│
├── 00-overview/                       <-- TỔNG QUAN HỆ THỐNG
│   ├── 01-project-vision.md           # Tầm nhìn, định vị sản phẩm & sứ mệnh F&B
│   └── 02-system-architecture.md      # Kiến trúc tổng thể Monorepo: Client PWA, CMS, Fastify Server
│
├── 01-technical-specs/                <-- ĐẶC TẢ KỸ THUẬT NỀN TẢNG (Internal Docs)
│   ├── tech-stack-decision.md         # Quyết định công nghệ: Fastify, React Vite, Zustand, Prisma
│   ├── database-schema.md             # Mô hình dữ liệu Prisma/PostgreSQL, Multi-tenant Isolation
│   ├── security-and-rbac.md           # Hệ thống phòng thủ 5 lớp, Ma trận phân quyền 6 cấp
│   ├── realtime-websocket.md          # Giao thức thời gian thực WebSocket, SocketEvents Catalog
│   ├── performance-and-optimization.md# Chuẩn tối ưu: Code-splitting, Chunks, TTL Cleanup, Zero Leak
│   ├── design-tokens-palette.md       # Bảng màu Donezo Forest Green (#12372A, #F4F5F6, #FFFFFF)
│   ├── design-system-standards.md     # Quy chuẩn component UI, touch targets, badges, modals
│   └── anti-spam-and-idempotency.md   # Cơ chế chống click tặc useAntiSpamAction & x-idempotency-key
│
├── 02-features/                       <-- TÀI LIỆU CHỨC NĂNG (Mỗi tính năng 1 module riêng)
│   ├── TEMPLATE_FEATURE.md            # MẪU CHUẨN BẮT BUỘC khi phát triển tính năng mới
│   └── F01-auth-and-tenancy/          # Quản lý nhà hàng, Đăng nhập Chủ quán & Fast PIN
│
└── 03-user-guides/                    <-- CẨM NANG HƯỚNG DẪN VẬN HÀNH (End-User Manuals)
    ├── store-owner-guide.md           # Cẩm nang Chủ quán (Cài đặt quán, Menu, Doanh thu)
    └── waiter-app-guide.md            # Cẩm nang Phục vụ (Cài app iPhone/Android, gọi món 1 tay)
```

---

## ⚡ QUY TRÌNH PHÁT TRIỂN TÍNH NĂNG MỚI (DÀNH CHO AGENT/DEV)

Trước khi viết bất kỳ dòng code nào cho một chức năng mới:
1. Đọc kỹ file [`.agent-guidelines.md`](file:///home/anv/Documents/A2Order/docs/.agent-guidelines.md) và [`AGENTS.md`](file:///home/anv/Documents/A2Order/AGENTS.md).
2. Kiểm tra tính sẵn có: chức năng này đã có chưa? Có tái sử dụng được gì không? Tuyệt đối không phỏng đoán hay tạo dữ liệu giả.
3. Tạo thư mục chức năng trong `docs/02-features/Fxx-[ten-chuc-nang]/`.
4. Copy mẫu [`TEMPLATE_FEATURE.md`](file:///home/anv/Documents/A2Order/docs/02-features/TEMPLATE_FEATURE.md) và điền đầy đủ:
   * **Tác nhân (Actors)**
   * **Quy trình hoạt động (Workflow & Sequence)**
   * **Phạm vi ảnh hưởng (Impact Analysis)**
   * **Đặc tả Cơ sở dữ liệu & API**
   * **Kịch bản kiểm thử (Verification & Test Cases)**
5. Chạy `npm run build` trên toàn bộ Monorepo để đảm bảo 0 lỗi Type và 0 lỗi cú pháp trước khi hoàn tất.
