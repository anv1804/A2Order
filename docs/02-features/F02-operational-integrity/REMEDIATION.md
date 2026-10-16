# Đối chiếu 31 nhóm phát hiện

Cập nhật 16/10/2026, nhánh `codex/fix-audit-findings`. Đây là phạm vi sửa theo các đường đi đã xác minh, không phải cam kết phần mềm không còn lỗi. Quy trình triển khai và giới hạn: [RUNBOOK](RUNBOOK.md).

| Nhóm | Thay đổi |
| --- | --- |
| 01 | Bỏ các `.env` khỏi Git, thêm mẫu; JWT bắt buộc secret riêng. Credential cũ trong lịch sử cần đổi tại nhà cung cấp. |
| 02–03 | Guard chung, reload tài khoản/vai trò, tenant từ danh tính, composite FK và RLS; không trả PIN/password hash. |
| 04 | Socket xác thực, room do server quyết định, từ chối room khác quán; bỏ relay sự kiện nghiệp vụ từ client. |
| 05 | Schema runtime, giá/topping/tồn kho/voucher/thuế tại server; hủy tính lại tiền và quota. |
| 06–09 | Đơn QR/nhân viên, KDS, snapshot, bill và payment lưu PostgreSQL; QR lấy ngân hàng đúng quán, webhook xác minh và chống trùng. |
| 10 | Chặn phát hành/hủy hóa đơn điện tử giả khi chưa có provider. |
| 11–13 | Token khách theo phiên, proof mở bàn, PIN server có giới hạn thử; durable idempotency, khóa và giao dịch, unique phiên active. |
| 14–16 | Auth/cache thống nhất theo tenant và user; bỏ tenant dự phòng và bộ xóa món theo tên. |
| 17–19 | Menu lưu đủ cấu hình và dùng ID server; chỉ báo thành công sau lưu; document CAS; publish lưu version và ETag thực tế. |
| 20–22 | Giới hạn license/quota được kiểm tra ở thao tác nghiệp vụ; license chưa gán quán; invoice SaaS dùng bảng giá chung, không tự đánh dấu PAID; voucher giữ quota nguyên tử. |
| 23 | Báo cáo theo `paidAt`/kỳ Việt Nam, CSV từ dữ liệu lọc, escape công thức; thanh toán hỗn hợp theo ledger payment. |
| 24–25 | Trạng thái món dựa ID batch/item, cập nhật theo phiên; socket tự vào lại room và tải snapshot. |
| 26–27 | Setup/build shared trước consumers; sửa ESM test, lint/typecheck, scripts dev, CI; cấu hình URL theo môi trường và host thiết bị. |
| 28 | Dữ liệu phụ lưu server có tenant/quyền/version; nhập kho/chấm công/chat và đón khách có nghiệp vụ thật. Các tích hợp ngoài chưa có provider được chặn rõ. Tiền cọc là ghi nhận thủ công, không tự chuyển tiền/bảo lưu thành voucher. |
| 29 | Baseline + migration bổ sung, preflight dữ liệu cũ, transaction, CHECK, composite FK, partial unique, FORCE RLS; giữ các bảng ngoài phạm vi. Chưa triển khai lên `public`. |
| 30 | Tách service order/billing/menu/analytics/pricing/security, dùng hook/API chung; bổ sung focus/Tab/Escape cho modal đăng nhập, món và thanh toán. Giữ class/style hiện có. Các màn hình lớn còn có thể tách tiếp khi phát triển chức năng. |
| 31 | Audit lệnh đã commit, lỗi được làm sạch và có request ID, graceful shutdown, health/readiness kiểm tra schema. Chưa tích hợp hệ thống giám sát ngoài. |

## Phát hiện bổ sung từ kiểm thử

- CORS mặc định thiếu PATCH/PUT/DELETE khiến thao tác trình duyệt thất bại dù test injection qua; đã sửa và có preflight regression.
- Đường dẫn tải phòng bàn sai làm danh sách trống; đã sửa các consumer.
- Callback ngân hàng gửi lại khi bill mới thu một phần từng có thể thu tiếp phần còn thiếu; đã sửa nhánh replay chỉ đọc kết quả đã ghi.
- Vé bếp biến mất sau thanh toán trước khi hoàn tất; đã tách truy vấn KDS khỏi trạng thái ACTIVE của session, kiểm tra không ghi đè bàn khách mới.
- Số liệu KDS 8.5 phút viết sẵn được thay bằng audit thời gian thật; chưa có dữ liệu hiển thị dấu gạch.
- Quầy thu ngân tự gửi điều chỉnh mặc định có thể xóa giảm giá/phụ thu đã lưu; chỉ gửi điều chỉnh khi chủ quán chủ động thay đổi và giữ các trường còn lại.
- Có thao tác hủy tạm tính để tiếp tục gọi món; không tự hủy QR khi đóng cửa sổ.
- Tỷ lệ VietQR, tổng kết kỳ, số tiền món hủy và phân bổ ca lấy dữ liệu thực tế; bỏ các con số mẫu, xác nhận khớp két và lệnh in giả. P&L chưa có sổ chi phí hiển thị chưa đủ dữ liệu thay cho lợi nhuận cố định.
- Xác minh phiên đăng nhập không xóa token khi mạng tạm lỗi; phản hồi cũ không ghi đè phiên mới.
- Chỉnh sửa nhân viên lưu số điện thoại/ca làm, bảo vệ chủ quán cuối cùng, kiểm tra quota khi kích hoạt lại. Đổi PIN/mật khẩu/quyền thu hồi ngay cả kết nối socket; cập nhật liên hệ không làm mất phiên. Bỏ mật khẩu reset ngẫu nhiên quá ngắn và PIN mặc định trong onboarding.

## Bằng chứng kiểm tra

Các bài regression dùng PostgreSQL thật trong schema riêng, tài khoản NOBYPASSRLS, gồm policy legacy permissive để kiểm tra migration thay thế policy. Có kiểm tra đồng thời mở bàn/gửi đơn/quota/tồn kho, idempotency khác payload, chia bill bảo toàn từng đồng, webhook retry, RLS, menu, CAS, tồn kho, chấm công, chat, SaaS, public publishing, đặt bàn và socket. Kết quả chạy cuối cùng được ghi trong báo cáo bàn giao.

Kiểm thử trình duyệt dùng tài khoản và quán QA giả trong schema riêng. Không phát hành hóa đơn thuế, gửi tin tới người thật hoặc chuyển tiền thật. Không thực hiện migration ghi lên schema `public`.

Kết quả ngày 16/10/2026: một lượt đầy đủ 26/26 test tích hợp và 4/4 test tính giá đạt; sau bổ sung kiểm tra nhân viên, test thu hồi phiên HTTP/socket riêng đạt 1/1. Tổng cộng 27 tình huống backend và 4 test tính giá. Lint/typecheck và build cả bốn workspace đạt; preflight database chỉ đọc không có vấn đề được phát hiện. Audit production 0; audit toàn bộ còn 5 advisory trong chuỗi build braces với guard giảm thiểu.

Kiểm thử trình duyệt xác nhận mở bàn → gửi món → KDS nấu/xong/đã bưng → thu tiền mặt QA → báo cáo 65.000đ → bàn EMPTY, số dư 0. Đã xem giao diện desktop và viewport 390×844. Kiểm tra AST xác nhận các className hiện có trong những component chỉnh sửa không bị xóa/đổi. Ảnh QA cục bộ: `.runtime/qa-desktop.jpg`, `.runtime/qa-mobile.jpg`.
