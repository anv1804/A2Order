# Chạy và triển khai bản sửa tính toàn vẹn

Cập nhật: 16/10/2026. Xem báo cáo gốc tại `docs/reviews/2026-10-15-project-audit.md` và bảng đối chiếu `REMEDIATION.md`.

## Khởi chạy

Yêu cầu Node.js >=22.13, npm và PostgreSQL. Chạy `npm ci`, sau đó `npm run setup`. Setup tạo các file `.env` cục bộ từ mẫu và sinh JWT secret ngẫu nhiên; không ghi đè cấu hình đã có. Điền kết nối database và thông tin seed quản trị riêng trước khi dùng. `USE_MOCK_DB=true` bị từ chối vì các thao tác có giao dịch không thể dùng an toàn cùng repository RAM cũ.

`npm run dev` build shared rồi chạy server/client/CMS. Các lệnh riêng là `dev:server`, `dev:client`, `dev:cms`, `dev:admin`. Cấu hình `VITE_API_URL`, `VITE_WS_URL`, `ORDER_BASE_URL`, `VITE_CLIENT_URL` và `APP_ORIGINS` theo địa chỉ triển khai; CORS cho phép GET/HEAD/POST/PUT/PATCH/DELETE/OPTIONS với token, idempotency và proof mở bàn. Dùng HTTPS trên môi trường công khai.

## Nâng cấp database hiện hữu

1. Sao lưu và kiểm tra khả năng khôi phục database bằng quy trình vận hành của đơn vị triển khai. Dừng các phiên bản server cũ trong thời gian chuyển đổi.
2. Cấu hình `DIRECT_URL` bằng tài khoản quản trị database. Chạy `npm run db:check`: lệnh này chỉ đọc, báo dữ liệu cần xử lý trước migration và liệt kê các bảng ngoài phạm vi được giữ lại.
3. Chạy `npm run db:deploy` trên môi trường đích đã chọn. Với database cũ, script kiểm tra cấu trúc baseline trước khi đánh dấu baseline và triển khai migration bổ sung. PIN nhân viên cũ được hash và phiên đăng nhập được thu hồi. Không dùng `prisma db push --accept-data-loss`.
4. Chạy `npm run db:runtime` để tạo tài khoản ứng dụng `a2order_v7_runtime` không có SUPERUSER/BYPASSRLS, chỉ có quyền trên các bảng thuộc schema ứng dụng. Script cập nhật `DATABASE_URL` trong file môi trường cục bộ; giữ `DIRECT_URL` cho tác vụ quản trị. Với credential runtime đã có, script không tự đổi mật khẩu ngoài ý muốn.
5. Cấu hình `NODE_ENV=production`, JWT secret riêng và các origin chính xác. Khởi động lại. `/health` kiểm tra process; `/ready` phải HTTP 200 sau khi các cột/bảng bắt buộc tồn tại. Tài khoản DB có SUPERUSER/BYPASSRLS bị chặn khi khởi động production.

Migration có FORCE RLS và thay thế các policy cũ trên 20 bảng thuộc phạm vi ứng dụng. Cần xem lại policy tích hợp tùy chỉnh trước khi triển khai. Các bảng khác không bị xóa. Không có migration nào được tự áp dụng lên schema `public` trong đợt sửa này; preflight schema đó đã qua mà không ghi dữ liệu.

Credential database từng có trong lịch sử Git phải được đổi tại nhà cung cấp. Việc bỏ `.env` khỏi Git và tạo JWT secret riêng không thay thế việc đổi credential đã lộ. Không đưa URL kết nối hoặc mật khẩu vào issue/log/PR.

## Quy tắc vận hành

- PostgreSQL giữ session, batch, món, bill, payment, lệnh chống trùng và audit; socket chỉ thông báo trạng thái đã lưu. Các màn hình tải lại snapshot khi kết nối lại và định kỳ.
- Giá món/topping, tồn kho, voucher, thuế và chia bill được kiểm tra tại server. Mỗi phiên dùng tối đa một voucher đang có hiệu lực; voucher không cộng dồn giảm thủ công. Quota được giữ trong giao dịch và trả lại khi hủy/từ chối làm mất toàn bộ ưu đãi. Điều kiện của voucher được chụp cùng batch.
- Bill tạm tính khóa việc thêm/hủy món. Dùng **Hủy Tạm Tính** khi khách chưa chuyển khoản để tiếp tục gọi món. Không thể hủy bill đã thu tiền hoặc hủy món trong phiên đã thu một phần khi chưa có nghiệp vụ hoàn tiền đối soát. Đóng cửa sổ QR không hủy bill.
- KDS vẫn hiển thị món chưa hoàn tất khi khách đã trả tiền. Hoàn tất vé của phiên cũ không được đổi trạng thái bàn của khách mới.
- Tiền mặt cần xác nhận đã nhận đủ tiền. VietQR chỉ được gạch nợ bằng webhook SePay đã xác minh `PAYMENT_WEBHOOK_SECRET`, tài khoản, BIN ngân hàng, mã bill/phần bill, số tiền và ID giao dịch duy nhất. Thiết lập ngân hàng của từng quán trước khi dùng; chưa kiểm chứng giao dịch ngân hàng thật.
- Doanh thu được ghi nhận khi bill thanh toán đủ, theo `paidAt`, múi giờ Việt Nam. Tiền đã thu từng phần nhưng bill chưa đủ tiền chưa nằm trong báo cáo doanh thu. Hóa đơn hỗn hợp phân bổ theo từng payment thực tế.
- Voucher SaaS giữ lượt khi tạo invoice PENDING. Admin có thể hủy invoice chưa trả tiền qua `POST /api/licenses/invoice/:invoiceId/cancel` để hoàn lượt. Xác nhận thanh toán nhiều lần không gia hạn nhiều lần. Giá cấu hình sửa sau đó không thay đổi invoice đã tạo.
- Dữ liệu phụ được lưu theo tenant và version. Xung đột phải tải lại trước khi lưu. Tiền cọc đặt bàn là xác nhận thủ công của quán, không phải chuyển tiền tự động; chỉ chủ quán/thu ngân được xác nhận. Chức năng bảo lưu cọc thành voucher chưa được hỗ trợ. Đón khách mở phiên chỉ khi bàn trống.

## Tích hợp chưa cấu hình

Hóa đơn điện tử, đồng bộ GrabFood/ShopeeFood, Zalo/ZNS, gửi hỗ trợ trung tâm và lệnh in máy in vật lý chưa có adapter/provider hoạt động. Các hành động đó báo chưa khả dụng, giữ cấu hình nháp hợp lệ và không tự sinh mã thuế, đơn hàng, thông báo gửi thành công hoặc thanh toán giả. Chat nội bộ/chấm công/nhập kho đi qua API thật. Trang quán công khai dùng `/?landing=slug` hoặc `/s/slug`; khách gọi quán để đặt bàn, chưa có form đặt bàn công khai tự xác nhận.

P&L chưa có sổ chi phí/bảng lương thì không hiển thị lợi nhuận giả. Tổng kết kỳ là bản xem số liệu, chưa phải chứng từ kiểm kê hoặc đóng ca đã xác nhận. Điểm thành viên chưa tự cộng/đổi thưởng; số điện thoại khách chỉ gắn vào đơn và lưu trong phiên trình duyệt theo quán/bàn.

## Kiểm tra

`npm run lint`, `npm run test`, `npm run build`, `npm audit --omit=dev`. CI dùng PostgreSQL riêng và không dùng credential triển khai. Test server tạo schema/role ngẫu nhiên có RLS và tự dọn đúng schema đó. Chỉ dùng `TEST_DATABASE_URL` hoặc `DIRECT_URL` của môi trường cho phép tạo schema/role kiểm thử.

Audit dependency dùng cho production hiện không còn advisory. Audit toàn bộ vẫn báo 5 advisory mức high từ chuỗi build Tailwind/braces; postinstall giới hạn độ sâu pattern và tự kiểm chứng đầu vào lồng 10.000 cấp bị chặn. Đây là biện pháp giảm thiểu, không phải tuyên bố advisory đã được nhà cung cấp sửa. Khi cập nhật dependency cần giữ kiểm tra guard; không tự nâng Tailwind major nếu chưa so sánh style.
