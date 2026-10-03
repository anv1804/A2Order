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
                      │    FASTIFY API & WEBSOCKET  │
                      │  • Fastify REST Server (4000)│
                      │  • Socket.io Realtime Engine │
                      │  • Prisma Multi-Tenant ORM  │
                      └──────────────┬──────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐
       │   POSTGRESQL (SUPABASE)   │   │     VIETQR & WEBHOOK HUB  │
       │   • Multi-Tenant Isolation│   │  • VietQR dynamic payload │
       │   • Orders, Tables, Bills │   │  • Auto-confirm webhook   │
       └───────────────────────────┘   └───────────────────────────┘
```

---

## 2. LỰA CHỌN CÔNG NGHỆ & LÝ DO KỸ THUẬT

| Lớp (Layer) | Công nghệ | Rationale (Lý do cốt lõi) |
| :--- | :--- | :--- |
| **Giao diện (Frontend)** | **Vite + React 18 + TypeScript + TailwindCSS** | Tốc độ tải trang 0 mili-giây, không bị giật lag SSR, chuẩn PWA di động, responsive toàn diện (Mobile Khách/Phục vụ, Tablet KDS, Desktop POS/Admin). |
| **Thời gian thực (Real-time)** | **Socket.io persistent gateway** | Đảm bảo độ trễ truyền tin Bàn $\rightarrow$ Bếp $\rightarrow$ Thu ngân $< 100\text{ms}$. |
| **Tầng dữ liệu (ORM & DB)** | **Prisma ORM + PostgreSQL (Supabase)** | Type-safe 100%, chống SQL Injection, quản lý quan hệ bảng chặt chẽ, dễ dàng mở rộng từ 1 lên 1.000 quán. |
| **Xác thực & Bảo mật** | **JWT Token + Fast PIN 4 số** | Phân tầng: Quản lý dùng Email/Mật khẩu an toàn; Nhân viên bàn/bếp chỉ cần bấm mã PIN 4 số để vào việc trong 1 giây. |
| **Thanh toán tự động** | **Dynamic VietQR (Napas247) + Webhook Hub** | Sinh mã QR động có sẵn số tiền và mã hóa đơn, ngân hàng báo có tiền $\rightarrow$ Hệ thống tự động gạch nợ. |
| **Hạ tầng & Bảo vệ** | **Cloudflare + Docker / Node.js** | Chi phí ban đầu gần như $0, tự động chặn đứng bot spam và các cuộc tấn công phá hoại. |
