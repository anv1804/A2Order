# ⚡ GIAO THỨC WEBSOCKET THỜI GIAN THỰC (REALTIME WEBSOCKET SPECIFICATION)

> **Mục tiêu**: Đảm bảo độ trễ truyền tin giữa **Bàn ăn (Khách/Phục vụ) $\rightarrow$ Màn hình bếp KDS $\rightarrow$ Quầy Thu ngân POS** luôn dưới $100\text{ms}$, hỗ trợ cách ly đa thuê tuyệt đối theo từng nhà hàng.

---

## 1. NGUYÊN TẮC PHÂN VÙNG ĐA THUÊ (MULTI-TENANT ROOM ISOLATION)

1. **Khởi tạo kết nối**:
   * Khi bất kỳ client nào (POS Thu ngân, Waiter PWA, Bếp KDS, Khách quét QR) mở kết nối tới Server, việc đầu tiên bắt buộc phải gửi sự kiện `join_store`:
   ```typescript
   socket.emit(SocketEvents.JOIN_STORE, storeId);
   ```
2. **Cơ chế Phân lập Room**:
   * Server Fastify Socket.io tiếp nhận và đưa socket vào Room định danh:
   ```typescript
   socket.join(`store:${storeId}`);
   ```
3. **Phát tán tin nhắn an toàn (Tenant-Safe Broadcast)**:
   * Tất cả sự kiện phát tán **BẮT BUỘC** gọi qua hàm trợ năng `emitToStore`:
   ```typescript
   export function emitToStore(storeId: string, event: string, payload: unknown) {
     if (io) {
       io.to(`store:${storeId}`).emit(event, payload);
     }
   }
   ```
   * **Tuyệt đối cấm** `io.emit(...)` toàn cục làm rò rỉ dữ liệu giữa các nhà hàng khác nhau.

---

## 2. DANH MỤC SỰ KIỆN CHUẨN HÓA (SOCKET EVENTS CATALOG)

Tất cả sự kiện được định nghĩa tập trung trong `@a2order/shared` (`SocketEvents`):

### 2.1. Quản lý Kết nối & Telemetry
| Sự kiện | Payload | Hướng truyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `join_store` | `storeId: string` | Client $\rightarrow$ Server | Đăng ký vào phòng của quán |
| `leave_store` | `storeId: string` | Client $\rightarrow$ Server | Rời phòng quán |
| `telemetry:ping`| `timestamp: number` | Client $\rightarrow$ Server | Gửi timestamp đo độ trễ |
| `telemetry:pong`| `{ clientSentAt, serverTime, latencyMs }` | Server $\rightarrow$ Client | Trả kết quả đo ping cho CMS |

### 2.2. Luồng Gọi Món & Duyệt Đơn (Order Flow)
```
[ Khách QR / Phục vụ ]                                          [ Thu Ngân / Phục vụ ]                                  [ Bếp KDS ]
         │                                                                 │                                                 │
         │─── order:approval_requested ───────────────────────────────────►│                                                 │
         │    (Khách gửi đơn chờ duyệt)                                    │                                                 │
         │                                                                 │─── order:approved ─────────────────────────────►│
         │◄── order:approved ──────────────────────────────────────────────┤    (Quán duyệt ➔ Bếp nhận món)                  │
         │    (Báo khách đơn đã duyệt)                                     │                                                 │
         │                                                                 │                                                 │
         │                                                                 │◄── order:item_status_changed ───────────────────┤
         │◄── order:item_status_changed ───────────────────────────────────┴────(Bếp nấu xong ➔ Chờ phục vụ ra món)────────┤
```

| Sự kiện | Payload chính | Ý nghĩa |
| :--- | :--- | :--- |
| `order:approval_requested` | `{ orderId, storeId, tableId, tableName, items, totalAmount }` | Khách gửi đơn gọi món chờ quán duyệt |
| `order:approved` | `{ orderId, storeId, tableId, tableName, items }` | Quán duyệt đơn, chuyển vào bếp |
| `order:rejected` | `{ orderId, storeId, tableId, reason }` | Quán từ chối đơn hàng |
| `order:item_status_changed` | `{ orderId, itemId, status, storeId }` | Bếp chuyển trạng thái: `QUEUED` $\rightarrow$ `COOKING` $\rightarrow$ `DONE` |
| `order:item_cancelled` | `{ orderId, itemId, tableId, storeId }` | Khách/Nhân viên hủy món khi chưa làm |

### 2.3. Hỗ trợ Nhanh tại Bàn (Quick Table Services)
| Sự kiện | Payload chính | Ý nghĩa |
| :--- | :--- | :--- |
| `service:requested` | `{ serviceId, serviceLabel, tableId, tableName, storeId }` | Khách yêu cầu: Thêm đá, Khăn giấy, Dọn bàn, Gọi nhân viên |
| `billing:requested` | `{ tableId, tableName, storeId }` | Khách gửi yêu cầu tính tiền tại bàn |
| `billing:payment_confirmed`| `{ billId, tableId, amount, paymentMethod, storeId }` | Đã thanh toán (VietQR gạch nợ tự động hoặc Tiền mặt) |

### 2.4. Báo Hết Món & Chuông Báo Bếp (Kitchen SLA)
| Sự kiện | Payload chính | Ý nghĩa |
| :--- | :--- | :--- |
| `kitchen:alert` | `{ type: "CHIME" \| "URGENT", storeId, tableId, message }` | Kích hoạt chuông âm thanh tại quầy bếp |
| `menu:item_86_toggled` | `{ itemId: string, isAvailable: boolean, storeId }` | Bếp bật/tắt hết món (Báo hết 86) |

---

## 3. CƠ CHẾ RECONNECT & BUFFERING

1. **Auto Reconnection**:
   * Socket.io client được cấu hình tự động reconnect với Exponential Backoff (1s, 2s, 4s, tối đa 10s).
   * Khi reconnect thành công, client tự động phát lại sự kiện `join_store` với `storeId` hiện hành.
2. **Âm thanh cảnh báo**:
   * Mọi sự kiện đơn mới hoặc hoàn tất món đều kích hoạt âm thanh Web Audio API chuyên dụng (`sound.playOrderReceived()`, `sound.playKitchenChime()`), không dùng file audio ngoài gây lag mạng.
