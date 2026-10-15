# 📐 QUYẾT ĐỊNH CÔNG NGHỆ: BACKEND & FRONTEND (TECH STACK DECISION)

---

## 1. BỐI CẢNH & YÊU CẦU CỦA A2ORDER
* **Real-time 24/7**: Màn hình Bếp (KDS) và Thu ngân duy trì WebSocket không bao giờ đứt đoạn.
* **Mobile-first PWA**: Tải nhanh dưới 1 giây, cài đặt lên iPhone/Android không qua App Store, hoạt động mượt mà khi mạng quán chập chờn.
* **Chi phí vận hành**: Gần như $0 ban đầu, server chiếm cực ít RAM (~60MB - 100MB).
* **Kiến trúc phân tầng**: Monorepo tách bạch rõ rệt giữa `apps/client`, `apps/server` và `packages/shared`.

---

## 2. QUYẾT ĐỊNH LỰA CHỌN CÔNG NGHỆ

```
A2Order/
├── apps/
│   ├── client/       <-- FRONTEND POS/PWA: React 18 (Vite 5) + TailwindCSS + Zustand + Socket.io + PWA
│   ├── cms/          <-- CMS PORTAL: React 18 (Vite 5) + TailwindCSS + Zustand (Store Owner & Super Admin)
│   └── server/       <-- BACKEND: Node.js (Fastify 4) + Socket.io + Prisma ORM + Dual-DB In-Memory
├── packages/
│   └── shared/       <-- SHARED: Types, Enums, Zod Schemas, Socket Events Catalog
└── docs/             <-- HỆ THỐNG ĐẶC TẢ KIẾN TRÚC & TÀI LIỆU TOÀN DIỆN
```

### 2.1. Frontend: React 18 + Vite 5 + TailwindCSS + Zustand (Client & CMS)
* **Tại sao là Vite SPA mà không phải Next.js SSR?**
  * Với ứng dụng nội bộ quán ăn và bảng điều khiển quản trị, **tốc độ phản hồi tức thì 0 mili-giây** và tính bền vững khi mạng gián đoạn quan trọng hơn SEO truyền thống.
  * Toàn bộ mã nguồn giao diện Client được nén và cache trên điện thoại nhân viên qua PWA Service Worker. Khi mạng quán chập chờn, ứng dụng vẫn mở ngay trong 0.2 giây.
  * CMS được tối ưu hóa với `safeLazy` code-splitting, chia tách rõ rệt giữa cổng **Store Owner** (`npm run dev:store` cổng 3001) và cổng **Super Admin** (`npm run dev:admin` cổng 3002).
* **Quản lý trạng thái**: `Zustand` (cực nhẹ, chuyên biệt cho Giỏ hàng, Sơ đồ bàn, Thông báo Toast và Fast PIN).
* **Hệ thống thiết kế**: Tone màu chuẩn **Donezo Forest Green** (`#12372A`), nền `bg-surface-canvas` (`#F4F5F6`), card trắng bo góc mềm mại `rounded-3xl`, biểu tượng Lucide đồng bộ.

### 2.2. Backend: Node.js + Fastify 4 + Socket.io + Dual-DB (Prisma / Mock RAM)
* **Tại sao là Fastify + Socket.io?**
  * Nhanh gấp 2-3 lần Express, tiêu tốn chưa đến 80MB RAM.
  * Hỗ trợ kết nối WebSocket bền bỉ (persistent connection) không bị ngắt quãng giữa các phòng ban.
  * Hỗ trợ Room theo quán (`store:${storeId}`) cách ly dữ liệu realtime tức thì giữa các nhà hàng.
* **Cơ sở dữ liệu kép (Dual-Database Hexagonal Repository)**:
  * `USE_MOCK_DB=true`: Lưu trữ RAM in-memory stateful, phục vụ dev/demo siêu tốc không cần cài database.
  * `USE_MOCK_DB=false`: Kết nối PostgreSQL thông qua Prisma ORM, đảm bảo tính toàn vẹn ACID cho giao dịch hóa đơn và an toàn dữ liệu 100%.
