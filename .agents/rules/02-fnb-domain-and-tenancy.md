# BẤT BIẾN NGHIỆP VỤ F&B VÀ CƠ CHẾ ĐA THUÊ (MULTI-TENANCY)

Tài liệu này là quy tắc bất biến về mặt dữ liệu và luồng nghiệp vụ nhà hàng.

## 1. Nguyên Tắc Cách Ly Đa Thuê (Multi-Tenant Isolation)
* **Bắt buộc có `storeId`**: Mọi bảng dữ liệu liên quan đến nghiệp vụ nhà hàng (Bàn, Món ăn, Đơn hàng, Hóa đơn, Nhân viên, Doanh thu) đều thuộc về một `storeId`.
* **Kiểm tra tầng Server**: Mọi truy vấn Prisma hoặc Mock Database State bắt buộc phải bao gồm điều kiện `where: { storeId }`.
* **Socket.io Rooms**: Client khi kết nối WebSocket bắt buộc join room theo cấu trúc `store:${storeId}`. Không phát broadcast dữ liệu của quán này sang quán khác.

## 2. Vòng Đời Trạng Thái Bàn Ăn (Table Lifecycle)
1. **`AVAILABLE` (Bàn trống)**: Màu sắc xanh mint nhạt. Khách hoặc nhân viên có thể mở bàn để gọi món.
2. **`OCCUPIED` (Đang phục vụ / Có khách)**: Màu xanh lá đậm Donezo. Bàn đang có đơn hàng mở.
3. **`BILLING` (Chờ thanh toán)**: Màu vàng hổ phách. Thu ngân hoặc phục vụ đã in tạm tính / xuất mã VietQR.
4. **`RESERVED` (Đã đặt trước)**: Bàn có lịch hẹn từ trước.
5. **`MAINTENANCE` (Khóa / Bảo trì)**: Không cho phép nhận khách.

## 3. Vòng Đời Trạng Thái Món Ăn Trong Bếp (KDS SLA)
* Món mới đặt: `PENDING` (Chờ bếp tiếp nhận).
* Bếp bấm nấu: `COOKING` (Bếp đang chế biến, hiển thị đồng hồ đếm ngược SLA).
* Chế biến xong: `READY` (Món đã sẵn sàng tại quầy ra đồ, phát thông báo cho Phục vụ).
* Bưng ra bàn: `SERVED` (Phục vụ đã mang tới bàn cho khách).
* Hủy món: `CANCELLED` (Chỉ cho phép hủy kèm lý do hợp lệ khi bếp chưa nấu).

## 4. Bất Biến Tính Toán Tài Chính (100% Server-Side)
* **Tuyệt đối không tính tiền ở Client**: Client chỉ gửi ID món, số lượng, tùy chọn topping.
* **Server chịu trách nhiệm tính**:
  1. `subtotal` = Tổng (Đơn giá gốc món + Giá topping/biến thể) * Số lượng.
  2. `surcharge` = Phụ phí (nếu có: lễ, ngoài giờ, điều hòa).
  3. `discount` = Chiết khấu voucher / khách hàng thân thiết.
  4. `vat` = Thuế giá trị gia tăng (nếu quán bật cấu hình VAT).
  5. `totalAmount` = `subtotal + surcharge + vat - discount`.
* Khi xuất hóa đơn hoặc Dynamic VietQR, số tiền nạp vào mã QR phải khớp 100% với `totalAmount` tính từ Server.

## 5. Chống Lặp Giao Dịch & Chống Spam (Anti-Spam & Idempotency)
* Mọi hành động nhạy cảm (Tạo đơn hàng, Đổi trạng thái bàn, Xác nhận thanh toán) bắt buộc gắn header `x-idempotency-key` (UUID v4 sinh tại client khi bấm nút).
* Phía Client: Bọc handler bằng hook `useAntiSpamAction` để vô hiệu hóa nút bấm trong quá trình gửi yêu cầu.
