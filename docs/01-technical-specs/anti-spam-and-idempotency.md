# 🛡️ KIẾN TRÚC CHỐNG SPAM & TÍNH TOÁN SERVER-SIDE (ANTI-SPAM & IDEMPOTENCY)

---

## 1. VẤN ĐỀ THỰC TẾ CẦN GIẢI QUYẾT
1. **Khách/Nhân viên bấm đúp liên tục (Double-tap / Rapid Tapping)**: Khi wifi chập chờn, người dùng bấm nút "Gửi Bếp" 3-4 lần liên tiếp $\rightarrow$ Bếp nhận 3-4 phiếu order giống hệt nhau!
2. **Spam từ bên ngoài**: Kẻ xấu ở ngoài quán dùng tool gửi hàng trăm request vào API đặt món.
3. **Can thiệp sửa giá**: Kẻ gian sửa giá món ăn trên trình duyệt thành 0đ trước khi gửi đi.

---

## 2. NGUYÊN TẮC BẤT BIẾN SERVER-SIDE
* **Server là nơi tính toán duy nhất**: Client chỉ gửi `{ menuItemId, quantity }`. Giá tiền, tiền giảm giá, thuế và tổng tiền bắt buộc **100% được truy vấn từ Database và tính toán tại Server**.
* **Tham số CMS điều chỉnh linh hoạt**: Các ngưỡng Rate-limit được lưu vào cấu hình để Super Admin / Chủ quán có thể điều chỉnh qua CMS trong tương lai.

---

## 3. CƠ CHẾ PHÒNG VỆ 3 LỚP (TRIPLE-LOCK ENGINE)

```
[ CLIENT: NGÓN TAY NGƯỜI DÙNG ]
        │
        ▼ (Lớp 1: Khóa UI & Debounce Cooldown 800ms)
┌───────────────────────────────────────────────────────────┐
│ Hook useAntiSpamAction                                    │
│ • Vừa bấm: Khóa nút, chuyển spinner 'Đang gửi...'         │
│ • Chặn mọi cú click tiếp theo trong 800ms                │
│ • Tự sinh mã duy nhất: x-idempotency-key                   │
└─────────────────────────────┬─────────────────────────────┘
                              ▼ (Gửi kèm Header x-idempotency-key)
┌───────────────────────────────────────────────────────────┐
│ SERVER: LỚP 2 - BỘ ĐỆM IDEMPOTENCY CACHE (60 Giây)        │
│ • Nếu mã idempotency-key đã có trong bộ đệm:             │
│   -> Trả về ngay kết quả cũ (Không tạo đơn trùng trong DB)│
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│ SERVER: LỚP 3 - RATE LIMITER THEO QUÁN & IP               │
│ • Order: Tối đa 20 lượt gửi / phút / thiết bị             │
│ • Billing: Tối đa 10 lượt gọi tính tiền / phút            │
│ • Vượt ngưỡng -> Trả về HTTP 429 Too Many Requests        │
└───────────────────────────────────────────────────────────┘
```

---

## 4. HƯỚNG DẪN SỬ DỤNG CHO LẬP TRÌNH VIÊN

### Tại Client:
```typescript
import { useAntiSpamAction } from "@/hooks/useAntiSpamAction";

const { execute: submitOrder, isSubmitting } = useAntiSpamAction(
  "SUBMIT_ORDER",
  async (items, idempotencyKey) => {
    return await api.post("/api/orders/submit", items, {
      headers: { "x-idempotency-key": idempotencyKey }
    });
  }
);
```

### Tại Server:
```typescript
import { antiSpamMiddleware, cacheIdempotentResponse } from "@/core/middlewares/antiSpamMiddleware";

fastify.post("/submit", { preHandler: (req, rep) => antiSpamMiddleware(req, rep, "order") }, async (req, rep) => {
  // 1. Tính toán giá tiền từ Database
  // 2. Lưu Order vào Database
  // 3. Cache kết quả: cacheIdempotentResponse(req.headers["x-idempotency-key"], result);
  return result;
});
```
