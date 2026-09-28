# 🏗️ KIẾN TRÚC TỔNG THỂ HỆ THỐNG A2ORDER (SYSTEM ARCHITECTURE)

---

## 1. SƠ ĐỒ KIẾN TRÚC ĐA TẦNG (HIGH-LEVEL ARCHITECTURE)

```
[ THỰC KHÁCH ]      [ PHỤC VỤ ]           [ BẾP / BAR ]         [ THU NGÂN / CHỦ ]
 (Mobile QR)      (iPhone/Android PWA)   (Tablet KDS)          (Laptop/PC/Tablet)
      │                   │                     │                        │
      └───────────────────┴──────────┬──────────┴────────────────────────┘
                                     │ HTTPS / WSS (WebSocket)
                                     ▼
                      ┌─────────────────────────────┐
                      │    CLOUDFLARE WAF & EDGE    │
                      │  • Chống DDoS, Rate-limit   │
                      │  • Caching Static Assets    │
                      └──────────────┬──────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────┐
                      │    NEXT.JS 14 APPLICATION   │
                      │  • App Router (React 18/19) │
                      │  • Server Components (SSR)  │
                      │  • API Routes & Fastify WS  │
                      └──────────────┬──────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐
       │   POSTGRESQL (PRISMA ORM) │   │     VIETQR & WEBHOOK HUB  │
       │   • Multi-Tenant Isolation│   │  • VietQR dynamic payload │
       │   • Orders, Tables, Bills │   │  • Auto-confirm webhook   │
       └───────────────────────────┘   └───────────────────────────┘
```

---

## 2. LỰA CHỌN CÔNG NGHỆ & LÝ DO KỸ THUẬT

| Lớp (Layer) | Công nghệ | Rationale (Lý do cốt lõi) |
| :--- | :--- | :--- |
| **Giao diện (Frontend)** | **Next.js 14 + TailwindCSS + Shadcn/UI** | Tốc độ tải trang tức thì, chuẩn PWA di động, các component UI hiện đại, chuẩn thẩm mỹ cao. |
| **Thời gian thực (Real-time)** | **Socket.io / Server-Sent Events** | Đảm bảo độ trễ truyền tin Bàn $\rightarrow$ Bếp $\rightarrow$ Thu ngân $< 200\text{ms}$. |
| **Tầng dữ liệu (ORM & DB)** | **Prisma ORM + PostgreSQL** | Type-safe 100%, chống SQL Injection, quản lý quan hệ bảng chặt chẽ, dễ dàng mở rộng từ 1 lên 1.000 quán. |
| **Xác thực & Bảo mật** | **JWT HttpOnly Cookies + Fast PIN 4 số** | Phân tầng: Quản lý dùng Email/Mật khẩu an toàn; Nhân viên bàn/bếp chỉ cần bấm mã PIN 4 số để vào việc trong 1 giây. |
| **Thanh toán tự động** | **Dynamic VietQR (Napas247) + PayOS/SePay** | Sinh mã QR động có sẵn số tiền và mã hóa đơn, ngân hàng bắn webhook báo có tiền $\rightarrow$ Hệ thống tự động gạch nợ. |
| **Hạ tầng & Bảo vệ** | **Cloudflare + Docker / Vercel** | Chi phí ban đầu gần như $0, tự động chặn đứng bot spam và các cuộc tấn công phá hoại. |
