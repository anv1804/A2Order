# HƯỚNG DẪN SỬ DỤNG: DÀNH CHO THU NGÂN QUẦY (CASHIER & POS GUIDE)

---

## 1. QUY TRÌNH ĐẦU CA: MỞ KÉT & KIỂM TRA THIẾT BỊ

1. **Đăng nhập ca làm việc**:
   * Truy cập màn hình CMS POS $\rightarrow$ Chọn tên mình trong danh sách thu ngân $\rightarrow$ Gõ mã PIN 4 số.
2. **Khai báo tiền đầu ca (Cash Float)**:
   * Nhập số tiền tiền mặt lẻ có sẵn trong két để thối tiền cho khách (VD: `1.000.000 đ`).
3. **Kiểm tra trạng thái kết nối**:
   * Quan sát chấm xanh **"Trực Tuyến"** ở góc trên cùng bên phải.
   * Kiểm tra máy in hóa đơn nhiệt và đường truyền mạng.

---

## 2. QUY TRÌNH TIẾP NHẬN & XỬ LÝ ĐƠN GỌI MÓN (ORDERING DESK)

Màn hình Gọi Món & Thu Ngân được chia thành 3 cột trực quan:
* **Cột 1: Sơ đồ bàn phục vụ**: Hiển thị trạng thái bàn (Trống, Đang phục vụ, Chờ tính tiền).
* **Cột 2: Thực đơn gọi món**: Tìm kiếm món nhanh, bấm chọn món, tùy chỉnh topping và mức đường/đá.
* **Cột 3: Khung thông báo cố định & Phiếu bàn**: Nơi duyệt đơn từ khách QR và thực hiện thanh toán.

### 2.1. Xử Lý Đơn Khách Quét QR Gửi Lên
1. Khi khách gửi đơn, chuông POS sẽ kêu *"Ting ting"* và thẻ đơn màu xanh xuất hiện trong mục **"Đơn Chờ"**.
2. Thu ngân liếc kiểm tra danh sách món:
   * Nếu các món còn đủ nguyên liệu: Bấm nút **"Duyệt Vào Bếp"** $\rightarrow$ Vé tự động bắn xuống màn hình Bếp KDS để nấu.
   * Nếu có món vừa hết: Bấm **"Từ Chối"** kèm ghi chú thông báo cho khách.

### 2.2. Xử Lý Yêu Cầu Hỗ Trợ Bàn (Đá, Khăn, Dọn Bàn)
1. Thẻ yêu cầu hiện trong tab **"Hỗ Trợ"** (màu vàng) kèm icon trực quan: Thêm đá, Thêm khăn giấy, Dọn dẹp bàn, Gọi nhân viên.
2. Bấm vào tên bàn để xem vị trí $\rightarrow$ Điều phối nhân viên chạy bàn mang tới cho khách.
3. Sau khi phục vụ xong, bấm nút **"Hoàn Tất"** để đóng thẻ.

---

## 3. QUY TRÌNH THANH TOÁN, TÁCH BILL & IN HÓA ĐƠN

### 3.1. Khách Thanh Toán Toàn Bộ Bill
1. Chọn bàn cần thanh toán trên sơ đồ.
2. Bấm nút **"Thanh Toán & In Bill"**:
   * Khách chuyển khoản: Cho khách quét mã **VietQR Động** trên màn hình phụ hoặc in phiếu tạm tính.
   * Khách đưa tiền mặt: Bấm chọn các mệnh giá nhanh (200k, 500k, 1000k) để hệ thống tự tính tiền thối lại chính xác từng nghìn đồng.
3. Bấm **"Xác Nhận Đã Thu Tiền"**:
   * Máy in bill tự động in hóa đơn thanh toán.
   * Ngăn kéo đựng tiền tự động bật mở.
   * Bàn tự động chuyển về trạng thái **Bàn Trống** và đổi mã PIN mới.

### 3.2. Khách Yêu Cầu Tách Bill (Split Bill)
1. Bấm nút **"Tách Bill"** trên thanh công cụ bàn:
2. **Nếu có người về sớm muốn trả trước (Tách theo món)**:
   * Chọn tab "Tách Theo Món" $\rightarrow$ Bấm dấu `+` ở các món người đó đã dùng để chuyển sang Bill B.
   * Bấm "Xác Nhận Tách & In Bill B" $\rightarrow$ Thu tiền người về trước, bàn vẫn giữ nguyên các món còn lại.
3. **Nếu nhóm bạn muốn chia đều đầu người (Equal Split)**:
   * Chọn tab "Chia Đều Đầu Người" $\rightarrow$ Chọn số người (VD: 4 người).
   * Mở mã QR riêng cho từng người quét hoặc bấm "Đã Thu" khi từng người đưa tiền.

### 3.3. Áp Dụng Giảm Giá & Phụ Thu
* Bấm nút **"Phụ Thu / Giảm"**:
  * *Thêm phụ thu*: Nhập số tiền (VD: `50.000 đ` phí phòng VIP).
  * *Giảm giá*: Chọn mức % (5%, 10%) hoặc nhập tiền trực tiếp, **bắt buộc chọn lý do giải trình** (VIP, Khách khiếu nại, Thẻ thành viên).

---

## 4. XỬ LÝ KHẨN CẤP: RỚT MẠNG HOẶC MẤT ĐIỆN

1. Khi mất kết nối Internet, hệ thống hiển thị nút viền vàng nhấp nháy **"Offline QR"**.
2. Thu ngân bấm **"Offline QR"**:
   * Màn hình chuyển sang giao diện Chống Chói Đêm (High Contrast).
   * Mở mã VietQR tĩnh chuyển khoản trực tiếp vào tài khoản ngân hàng của chủ quán.
3. Khách chuyển khoản xong, thu ngân bấm **"Xác Nhận Đã Thu (Lưu Sổ Offline)"**.
4. Hóa đơn được bảo vệ an toàn trong bộ nhớ máy POS và tự động đẩy lên máy chủ ngay khi có mạng trở lại.

---

## 5. QUY TRÌNH CUỐI CA: CHỐT CA & BÀN GIAO TIỀN

1. Bấm nút **"Đóng Ca Làm Việc"** ở góc trên màn hình.
2. Kiểm đếm tiền mặt thực tế trong két và nhập vào hệ thống.
3. Hệ thống xuất **Báo Cáo Đóng Ca (Z-Report)**:
   * Tổng doanh thu ca (Tiền mặt, Chuyển khoản VietQR, Thẻ).
   * Số đơn đã phục vụ, số món đã hủy.
   * Chênh lệch tiền mặt (nếu có thừa/thiếu).
4. Ký biên bản bàn giao ca và chuyển giao két tiền cho thu ngân ca tiếp theo.
