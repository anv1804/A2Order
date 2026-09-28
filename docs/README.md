# 📚 BẢN ĐỒ TÀI LIỆU HỆ THỐNG A2ORDER

Hệ thống tài liệu A2Order được cấu trúc thành **3 phân vùng chuyên biệt**, phục vụ kép:
1. **Dành cho AI Agent & Lập trình viên**: Nắm rõ kiến trúc, quy chuẩn code, cơ sở dữ liệu, bảo mật, và quy trình bắt buộc khi phát triển tính năng mới.
2. **Dành cho Khách hàng & Chủ quán**: Hướng dẫn vận hành trực quan, dễ hiểu cho từng vai trò (Chủ quán, Thu ngân, Bếp, Phục vụ).

---

## 📂 CẤU TRÚC THƯ MỤC TÀI LIỆU (`/docs`)

```text
docs/
├── README.md                          <-- [Bạn đang ở đây] Bản đồ tra cứu tài liệu
├── .agent-guidelines.md               <-- QUY TẮC BẤT BIẾN cho AI Agent khi lập trình
│
├── 00-overview/                       <-- TỔNG QUAN HỆ THỐNG
│   ├── 01-project-vision.md           # Tầm nhìn, định vị sản phẩm & sứ mệnh F&B
│   └── 02-system-architecture.md      # Kiến trúc tổng thể Multi-tenant, PWA, WebSocket
│
├── 01-technical-specs/                <-- ĐẶC TẢ KỸ THUẬT NỀN TẢNG (Internal Docs)
│   ├── database-schema.md             # Mô hình dữ liệu Prisma/PostgreSQL, Multi-tenant Isolation
│   ├── security-and-rbac.md           # Hệ thống phòng thủ 5 lớp, Ma trận phân quyền 6 cấp
│   ├── realtime-websocket.md          # Giao thức thời gian thực Bàn -> Bếp -> Thu ngân
│   └── pwa-offline-strategy.md        # Hướng dẫn cài đặt PWA (iOS/Android) & Cache Service Worker
│
├── 02-features/                       <-- TÀI LIỆU CHỨC NĂNG (Mỗi tính năng 1 module riêng)
│   ├── TEMPLATE_FEATURE.md            # MẪU CHUẨN BẮT BUỘC khi phát triển tính năng mới
│   ├── F01-auth-and-tenancy/          # Quản lý nhà hàng, Đăng nhập Chủ quán & Fast PIN
│   ├── F02-table-management/          # Sơ đồ bàn, Trạng thái 5 màu, Chuyển/Ghép bàn
│   ├── F03-menu-catalog/              # Danh mục, Món ăn, Topping, Báo hết món 86
│   ├── F04-ordering-waiter-qr/        # Gọi món Phục vụ T9, Khách quét QR, Giỏ hàng chung
│   ├── F05-kds-kitchen/               # Màn hình Bếp KDS, Đếm giờ SLA, Gom mẻ nấu
│   └── F06-billing-vietqr/            # Thu ngân, Dynamic VietQR + Webhook gạch nợ tự động
│
└── 03-user-guides/                    <-- CẨM NANG HƯỚNG DẪN DÀNH CHO KHÁCH HÀNG (End-User Manuals)
    ├── super-admin-guide.md           # Cẩm nang dành cho Bạn (Quản trị toàn bộ các nhà hàng)
    ├── store-owner-guide.md           # Cẩm nang Chủ quán (Cài đặt quán, Menu, Doanh thu)
    ├── cashier-guide.md               # Cẩm nang Thu ngân (Thanh toán, In bill, Đối soát tiền)
    ├── kitchen-kds-guide.md           # Cẩm nang Bếp / Pha chế (Thao tác màn hình KDS)
    └── waiter-app-guide.md            # Cẩm nang Phục vụ (Cài app iPhone/Android, gọi món 1 tay)
```

---

## ⚡ QUY TRÌNH PHÁT TRIỂN TÍNH NĂNG MỚI (DÀNH CHO AGENT/DEV)
Trước khi viết bất kỳ dòng code nào cho một chức năng mới:
1. Đọc kỹ file [`.agent-guidelines.md`](./.agent-guidelines.md).
2. Tạo thư mục chức năng trong `docs/02-features/Fxx-[ten-chuc-nang]/`.
3. Copy mẫu [`TEMPLATE_FEATURE.md`](./02-features/TEMPLATE_FEATURE.md) và điền đầy đủ:
   * **Tác nhân (Actors)**
   * **Quy trình hoạt động (Workflow & Sequence)**
   * **Phạm vi ảnh hưởng (Impact Analysis)**
   * **Đặc tả Cơ sở dữ liệu & API**
   * **Kịch bản kiểm thử (Verification & Test Cases)**
