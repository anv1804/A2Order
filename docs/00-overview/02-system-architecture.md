# 🏗️ KIẾN TRÚC TỔNG THỂ HỆ THỐNG A2ORDER (SYSTEM ARCHITECTURE v7.0.0)

---

## 1. SƠ ĐỒ KIẾN TRÚC ĐA TẦNG (HIGH-LEVEL ARCHITECTURE)

```
[ THỰC KHÁCH QR ]      [ PHỤC VỤ (WAITER) ]      [ BẾP / PHA CHẾ (KDS) ]      [ THU NGÂN / CHỦ QUÁN ]
 (Mobile QR Browser)   (PWA T9 1-Handed Mobile)       (Tablet KDS)             (Laptop/PC/POS Terminal)
         │                         │                        │                             │
         └─────────────────────────┴───────────┬────────────┴─────────────────────────────┘
                                               │
                                               │ HTTPS / WSS (WebSocket)
                                               ▼
                                ┌─────────────────────────────┐
                                │    CLOUDFLARE WAF & EDGE    │
                                │  • Chống DDoS, Rate-limit   │
                                │  • Caching PWA Static Asset │
                                └──────────────┬──────────────┘
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         ▼                                           ▼
          ┌─────────────────────────────┐             ┌─────────────────────────────┐
          │   APPS/CLIENT (PORT 3000)   │             │    APPS/CMS (PORT 3001/3002)│
          │  • React 18 + Vite 5 + PWA  │             │  • React 18 + Vite 5        │
          │  • Code-Splitting (Chunks)  │             │  • Central SaaS Management  │
          │  • Donezo Forest Green UI   │             │  • Store Owner + SuperAdmin │
          └──────────────┬──────────────┘             └──────────────┬──────────────┘
                         │                                           │
                         └─────────────────────┬─────────────────────┘
                                               │ REST API & WebSocket (JSON-RPC)
                                               ▼
                                ┌─────────────────────────────┐
                                │   APPS/SERVER (PORT 4000)   │
                                │  • Fastify 4 High-Perf Node │
                                │  • Socket.io Room Isolation │
                                │  • Dual-DB Repository Layer │
                                │  • Multi-Tenant RBAC Guard  │
                                └──────────────┬──────────────┘
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         ▼                                           ▼
          ┌─────────────────────────────┐             ┌─────────────────────────────┐
          │ DUAL-DATABASE REPOSITORY    │             │   VIETQR & WEBHOOK ENGINE   │
          │ • In-Memory (USE_MOCK_DB)   │             │ • Napas 247 Dynamic VietQR  │
          │ • PostgreSQL (Prisma ORM)   │             │ • Webhook gạch nợ tự động   │
          └─────────────────────────────┘             └─────────────────────────────┘
```

---

## 2. LỰA CHỌN CÔNG NGHỆ & LÝ DO KỸ THUẬT (TECH STACK RATIONALE)

| Phân hệ (Subsystem) | Công nghệ chính | Rationale (Lý do cốt lõi) |
| :--- | :--- | :--- |
| **POS & Client App (`apps/client`)** | **React 18 + Vite 5 + TailwindCSS + Zustand + PWA** | Tốc độ tải trang tức thì, chuyển bàn 0 mili-giây, giao diện Donezo Forest Green dịu mắt, hỗ trợ cài đặt PWA di động offline. |
| **Quản trị SaaS (`apps/cms`)** | **React 18 + Vite 5 + TailwindCSS + SafeLazy Code-splitting** | Quản trị cửa hàng và Super Admin SaaS mượt mà, phân chia hơn 20 modules lazy-loaded có retry fallback tự phục hồi. |
| **API & Realtime (`apps/server`)** | **Fastify 4 + Socket.io + TypeScript** | Tốc độ xử lý I/O nhanh gấp 2-3 lần Express, tiêu tốn < 80MB RAM; duy trì kết nối WebSocket thời gian thực Bàn $\rightarrow$ Bếp $\rightarrow$ Thu ngân $< 100\text{ms}$. |
| **Hợp đồng dữ liệu (`packages/shared`)** | **TypeScript Shared Library** | Đồng bộ 100% Type-safe giữa Server, Client và CMS: DTOs, Enums, Zod Schemas, Socket Events. |
| **Tầng dữ liệu (Dual-DB)** | **Prisma ORM (PostgreSQL) + RAM Repository** | Hỗ trợ 2 chế độ (`USE_MOCK_DB=true` cho local test và `false` cho Production Staging kết nối PostgreSQL) qua chuẩn Hexagonal Repository. |
| **Bảo mật & Đa thuê** | **Tenant-Level Isolation + JWT + Fast PIN** | Bắt buộc `storeId` trên 100% queries, mutation, socket room; mã hóa mật khẩu, Fast PIN 4 số tiện lợi cho nhân viên. |
| **Thanh toán tự động** | **Dynamic VietQR (Napas247) + PayOS/SePay** | Sinh mã QR động đính kèm số tiền và mã hóa đơn, ngân hàng bắn webhook báo có tiền $\rightarrow$ Hệ thống tự động gạch nợ. |

---

## 3. CƠ CHẾ CÁCH LY ĐA THUÊ THỜI GIAN THỰC (MULTI-TENANT REALTIME ISOLATION)

1. **Phân vùng Socket Room**:
   * Khi client (POS, KDS, Khách hàng) kết nối tới server, client gửi sự kiện `JOIN_STORE` kèm `storeId`.
   * Server đưa kết nối vào Socket Room riêng biệt: `store:${storeId}`.
   * Mọi sự kiện phát tán (`ORDER_SUBMITTED`, `ORDER_APPROVED`, `KDS_STATUS_CHANGED`, `BILL_PAID`) chỉ được gửi vào room của chính nhà hàng đó (`io.to('store:' + storeId).emit(...)`). Tuyệt đối không để lộ dữ liệu chéo giữa các cửa hàng.

2. **Cách ly Dữ liệu (Database Isolation)**:
   * Tất cả bảng dữ liệu (Bàn, Món, Hóa đơn, Nhân viên, Nguyên liệu) đều chứa khóa ngoại `storeId`.
   * Mọi truy vấn database qua Prisma hay Repository bắt buộc gắn điều kiện `where: { storeId }`.
