# HƯỚNG DẪN SỬ DỤNG: DÀNH CHO QUẢN TRỊ VIÊN HỆ THỐNG (SUPER ADMIN GUIDE)

---

## 1. GIỚI THIỆU VAI TRÒ SUPER ADMIN

Tài khoản **Super Admin** là cấp quản trị cao nhất của nền tảng A2Order SaaS, có quyền điều phối toàn bộ các chuỗi nhà hàng, quán ăn tham gia hệ thống:
* Giám sát danh sách mọi nhà hàng (Tenants).
* Khởi tạo quán mới theo các kịch bản kinh doanh mẫu (Scenarios).
* Kích hoạt, gia hạn gói thuê bao hoặc tạm khóa tài khoản nợ cước.
* Quản lý phân bổ tài nguyên và tài khoản chủ sở hữu.

---

## 2. QUẢN LÝ CỬA HÀNG & THUÊ BAO (STORE ONBOARDING & TENANCY)

### 2.1. Khởi Tạo Quán Mới Trong 60 Giây (Fast Store Onboarding)
1. Truy cập menu **"Quản Trị Hệ Thống (Super Admin)"** $\rightarrow$ Bấm nút **"+ Thêm Cửa Hàng Mới"**.
2. Nhập thông tin cơ bản:
   * **Tên Quán**: VD: *Trà Sữa KOI Thé - Chi nhánh Quận 1*.
   * **Mã định danh (Slug/StoreId)**: `koi-the-q1` (duy nhất trong toàn hệ thống).
   * **Số điện thoại & Địa chỉ liên hệ**.
   * **Mô hình kinh doanh**: Trà sữa, Cà phê truyền thống, Lẩu nướng, Nhà hàng Alacarte.
3. Chọn gói cước dịch vụ:
   * `BASIC`: Dưới 15 bàn, 1 quầy thu ngân.
   * `PRO`: Dưới 50 bàn, KDS bếp không giới hạn, hỗ trợ VietQR tự động.
   * `ENTERPRISE`: Đa chi nhánh, xuất hóa đơn điện tử, báo cáo chuyên sâu.
4. Bấm **"Tạo Quán & Khởi Tạo Dữ Liệu Mẫu"** $\rightarrow$ Hệ thống tự động tạo sẵn danh mục, bảng giá và sơ đồ bàn mẫu.

### 2.2. Khóa & Kích Hoạt Cửa Hàng
* Khi quán hết hạn dùng thử hoặc vi phạm chính sách:
  * Chọn quán trong danh sách $\rightarrow$ Chuyển trạng thái sang `SUSPENDED` (Tạm khóa).
  * Toàn bộ nhân viên và khách quét QR của quán đó sẽ bị chặn truy cập và nhận thông báo: *"Dịch vụ tạm ngưng, vui lòng liên hệ ban quản trị"*.
  * Dữ liệu hóa đơn cũ vẫn được bảo lưu an toàn 100%.

---

## 3. KHO KỊCH BẢN KINH DOANH MẪU (SCENARIO TEMPLATE MANAGER)

A2Order tích hợp sẵn các bộ kịch bản mẫu giúp chủ quán không phải mất công nhập từng món từ đầu:
1. **Kịch bản Trà Sữa & Đồ Uống Hiện Đại**: Tích hợp sẵn Topping (Trân châu trắng, phô mai dẻo, pudding), cấu hình mức đường 30-50-70-100%, mức đá.
2. **Kịch bản Quán Cà Phê Truyền Thống & Điểm Tâm**: Cà phê phin, bạc xỉu, bánh mì, hủ tiếu, trà đá miễn phí.
3. **Kịch bản Quán Lẩu Nướng / Buffet**: Đếm suất người lớn/trẻ em, gọi thêm món nướng không giới hạn, vé bia tươi.
4. **Kịch bản Nhà Hàng Hải Sản / Alacarte**: Quản lý giá theo thời giá (kg), phụ thu chế biến, phòng VIP riêng biệt.

Super Admin có thể chỉnh sửa kho mẫu này để nhân bản cho hàng trăm khách hàng tiếp theo chỉ bằng 1 cú click chuột.

---

## 4. GIÁM SÁT AN TOÀN HỆ THỐNG & NHẬT KÝ VẬN HÀNH

* **Dashboard giám sát Realtime**: Theo dõi số lượng kết nối WebSocket đang hoạt động (`Active Sockets`), lượng đơn hàng tạo ra trong ngày trên toàn hệ sinh thái.
* **Audit Trail**: Ghi nhận toàn bộ thao tác nhạy cảm: Ai đổi mật khẩu chủ quán, ai can thiệp vào gói thuê bao, thời gian truy cập của từng IP.
