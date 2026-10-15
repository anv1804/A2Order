# QUY CHUẨN KIỂM THỬ, XÁC THỰC VÀ BẢO TOÀN HỆ THỐNG

Tài liệu này là quy trình xác thực bắt buộc trước khi bàn giao bất kỳ tác vụ nào cho người dùng.

## 1. Xác Thực Build Toàn Bộ Monorepo
* Sau khi chỉnh sửa code, AI Agent **BẮT BUỘC** chạy lệnh kiểm thử toàn diện:
  ```bash
  npm run build
  ```
* Lệnh trên sẽ compile TypeScript và bundle toàn bộ 4 workspace:
  1. `@a2order/shared`
  2. `@a2order/client`
  3. `@a2order/cms`
  4. `@a2order/server`
* Nếu có bất kỳ lỗi cú pháp, thiếu type, hoặc sai import nào, **phải khắc phục triệt để** trước khi báo cáo hoàn thành.

## 2. Kiểm Thử Đa Vai Trò (Multi-Role Emulation)
Khi cập nhật một luồng tính năng, cần kiểm tra tính nhất quán trên các vai trò:
1. **Khách hàng / Waiter**: Tạo đơn hàng thành công, hiển thị đúng tiền tạm tính, không đúp click.
2. **Bếp (KDS)**: Nhận đơn tức thì qua WebSocket, hiển thị trạng thái chuyển đổi mượt mà.
3. **Thu ngân (POS)**: Bàn chuyển sang màu vàng (Billing), xuất mã Dynamic VietQR chính xác, gạch nợ thành công.
4. **Chủ quán (CMS)**: Doanh thu ghi nhận đúng báo cáo, lịch sử đơn hàng cập nhật.
5. **Super Admin**: Báo cáo tổng thể toàn hệ thống chính xác, không rò rỉ dữ liệu tenant khác.

## 3. Không Để Lại Tệp Tạm (No Clutter In Root)
* Tuyệt đối không tạo các script tạm bợ như `replace_*.py`, `temp_test.js` tại thư mục gốc của repository.
* Nếu cần công cụ thao tác file, dùng trực tiếp các công cụ có sẵn (`replace_file_content`, `multi_replace_file_content`, v.v.).
