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
│   ├── client/       <-- FRONTEND: React (Vite) + TailwindCSS + Zustand + PWA
│   └── server/       <-- BACKEND: Node.js (Fastify) + TypeScript + Socket.io + Prisma
├── packages/
│   └── shared/       <-- SHARED: Types, Enums, Zod Schemas, Socket Events
└── docs/             <-- HỆ THỐNG TÀI LIỆU TOÀN DIỆN
```

### 2.1. Frontend: React 18/19 (Vite) + TailwindCSS + Shadcn/UI
* **Tại sao là Vite SPA mà không phải Next.js SSR?**
  * Với ứng dụng nội bộ quán ăn, **tốc độ chuyển bàn và gọi món ở 0 mili-giây** quan trọng hơn SEO.
  * Toàn bộ mã nguồn giao diện được cache trên điện thoại nhân viên qua PWA. Khi mạng quán giật lag, app vẫn mở tức thì trong 0.2 giây.
* **Quản lý trạng thái**: `Zustand` (siêu nhẹ cho giỏ hàng và sơ đồ bàn) + `TanStack Query` (caching API).

### 2.2. Backend: Node.js + Fastify + Socket.io + Prisma ORM
* **Tại sao là Fastify + Socket.io?**
  * Nhanh gấp 2-3 lần Express, tiêu tốn chưa đến 80MB RAM.
  * Hỗ trợ kết nối WebSocket bền bỉ (persistent connection) không bị giới hạn thời gian chạy như Serverless.
  * Hỗ trợ Room theo quán (`room:store_${storeId}`) cách ly thông tin tức thì.
* **Cơ sở dữ liệu**: PostgreSQL + Prisma ORM (Đảm bảo an toàn giao dịch hóa đơn, chống SQL Injection 100%).
