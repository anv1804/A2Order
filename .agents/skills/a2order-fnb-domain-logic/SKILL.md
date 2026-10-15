---
name: a2order-fnb-domain-logic
description: >-
  Core F&B domain logic, order lifecycle, KDS kitchen flow, table management, and payment processing for A2Order.
  The agent MUST activate and read this skill automatically whenever working on orders, tables, bill splitting,
  VietQR payments, kitchen display system (KDS), waiter T9 ordering, or multi-tenant store isolation.
---

# A2Order F&B Domain Logic & Business Workflows

Kỹ năng này cung cấp các nguyên tắc nghiệp vụ nhà hàng cốt lõi và các quy trình xử lý đơn hàng, bàn ăn, bếp KDS, và thanh toán VietQR trong A2Order.

---

## 1. Nguyên Tắc Cách Ly Đa Thuê (Multi-Tenant Invariant)

Mọi thực thể kinh doanh thuộc một nhà hàng cụ thể bắt buộc phải có thuộc tính `storeId`:
* Bàn ăn (`DiningTable` / `TableTemplate`): `storeId`
* Khu vực (`TableZone`): `storeId`
* Món ăn (`MenuItem` / `FnbDishItem`): `storeId`
* Đơn hàng (`Order` / `OrderItem`): `storeId`
* Nhân viên (`Staff`): `storeId`

> **Lưu ý**: Khi viết API controller hoặc truy vấn database:
> ```ts
> // LUÔN LUÔN kèm storeId
> const tables = await tableRepo.findMany({ storeId, zoneId });
> ```

---

## 2. Vòng Đời Trạng Thái Bàn Ăn (Table Lifecycle)

Trạng thái bàn được biểu diễn qua enum `TableStatus`:

```
               [Mở bàn / Gọi món]
[AVAILABLE] ────────────────────────► [OCCUPIED]
     ▲                                     │
     │                                     │ [Tạm tính / Xuất QR]
     │                                     ▼
     │ [Thanh toán xong]              [BILLING]
     └─────────────────────────────────────┘
```

1. **`AVAILABLE` (Bàn trống)**:
   * Sẵn sàng đón khách mới. Khi khách quét mã QR hoặc nhân viên chọn bàn, hệ thống tạo một `order` mới hoặc gán phiên làm việc.
2. **`OCCUPIED` (Có khách / Đang phục vụ)**:
   * Bàn có ít nhất một đơn hàng đang hoạt động. Màu hiển thị trên POS: Xanh lá đậm.
3. **`BILLING` (Chờ thanh toán)**:
   * Thu ngân đã xuất hóa đơn tạm tính hoặc hiển thị Dynamic VietQR. Màu hiển thị trên POS: Vàng hổ phách.
4. **`RESERVED` (Đã đặt trước)**:
   * Có khách đặt bàn trước kèm thời gian nhận bàn.
5. **`MAINTENANCE` (Khóa / Bảo trì)**:
   * Bàn hỏng, đang dọn dẹp hoặc khóa tạm thời.

---

## 3. Vòng Đời Món Ăn Bếp (Kitchen Display System - KDS)

Mỗi món trong đơn hàng (`OrderItem`) di chuyển qua các bước:

```
[PENDING] ──(Bếp nhận)──► [COOKING] ──(Chế biến xong)──► [READY] ──(Bưng đồ)──► [SERVED]
   │
   └──(Hết nguyên liệu / Báo 86)──► [CANCELLED]
```

* **`PENDING`**: Món vừa được gửi từ khách hoặc phục vụ. Hiển thị trên màn hình KDS với cảnh báo nhấp nháy.
* **`COOKING`**: Bếp bấm "Bắt đầu nấu". Bắt đầu đếm thời gian thực hiện (SLA). Nếu vượt quá SLA quy định (ví dụ 15 phút), thẻ món chuyển sang màu cam/đỏ để cảnh báo ưu tiên.
* **`READY`**: Bếp chế biến xong và bấm "Hoàn tất". Hệ thống phát WebSocket thông báo cho nhân viên phục vụ tại bàn ra nhận đồ.
* **`SERVED`**: Phục vụ đã bưng món đến bàn khách.

---

## 4. Bất Biến Tính Toán Tài Chính (100% Server-Side)

**Quy tắc bất biến**: Không bao giờ tính tổng tiền ở Client rồi gửi lên Server. Client chỉ gửi danh sách món và số lượng; Server tự tính toán:

$$\text{Tạm tính} = \sum (\text{Giá gốc món} + \sum \text{Giá topping}) \times \text{Số lượng}$$

$$\text{Tổng tiền} = \text{Tạm tính} + \text{Phụ phí} + \text{VAT} - \text{Chiết khấu}$$

* Khi thực hiện **Tách Hóa Đơn (Split Bill)**:
  * Tổng tiền các hóa đơn con cộng lại phải đúng bằng tổng tiền hóa đơn gốc.
* Khi thanh toán bằng **Dynamic VietQR**:
  * Chuỗi nội dung chuyển khoản phải tuân theo định dạng: `A2O [Mã_Hóa_Đơn] [Mã_Bàn]` để webhook ngân hàng đối soát tự động gạch nợ.

---

## 5. Chống Spam Thao Tác (Idempotency)

Mọi thao tác thay đổi tiền hoặc đơn hàng phải được bảo vệ bằng Idempotency Key:
```ts
// Phía Client
import { useAntiSpamAction } from "@/hooks/useAntiSpamAction";

const { execute, isSubmitting } = useAntiSpamAction();

const onCheckout = () => {
  execute(async () => {
    const idempotencyKey = crypto.randomUUID();
    await billingApi.checkout({ orderId, idempotencyKey });
  });
};
```
