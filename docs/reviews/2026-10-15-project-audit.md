# Đánh giá kỹ thuật A2Order

Ngày: 15/10/2026 · Commit đánh giá: `ad16d85` · Nhánh: `main`.

## Kết luận

Dự án đã có khung monorepo, giao diện theo vai trò, API quản trị và schema nghiệp vụ tương đối rộng. Tuy nhiên, luồng vận hành chưa có một nguồn dữ liệu thống nhất: có dữ liệu trong PostgreSQL, có đơn trong RAM server, có nghiệp vụ chỉ nằm trong React state hoặc localStorage. Một số giao diện thông báo đã thực hiện hành động dù chưa có tích hợp tương ứng.

Chưa nên dùng phiên bản này để vận hành quán với dữ liệu và tiền thật. Ưu tiên hoàn thiện bảo mật và một luồng Bàn → Gọi món → Bếp → Thanh toán → Báo cáo xuyên suốt trước khi mở rộng các phân hệ phụ.

Đây là 31 **nhóm phát hiện**, gồm 4 nhóm P0, 21 nhóm P1 và 6 nhóm P2. Một nhóm có thể chứa nhiều biểu hiện cùng nguyên nhân.

- **P0:** Cần xử lý trước khi mở truy cập hệ thống có dữ liệu thật.
- **P1:** Sai chức năng cốt lõi, sai tiền, mất dữ liệu hoặc thiếu cơ chế bảo vệ quan trọng.
- **P2:** Khả năng phát triển, triển khai, vận hành và trải nghiệm cần cải thiện.

## Phạm vi và độ chắc chắn

- Kiểm kê 370 file được Git theo dõi; quét 299 file mã nguồn trong các thư mục `src`, khoảng 55.980 dòng.
- Đọc sâu server bootstrap, toàn bộ route backend, repository, schema, auth, socket, API client và các luồng POS, QR, KDS, menu, báo cáo, cài đặt, SaaS; khảo sát các phân hệ còn lại và tài liệu kiến trúc.
- Chạy build, lint, file test hiện có; thực hiện kiểm chứng Fastify injection, socket localhost và mock repository trong tiến trình kiểm tra riêng.
- Không gọi API ghi vào database thật; không chạy seed/migration; không xác minh credential còn hiệu lực hay quyền truy cập thật trên Supabase.
- Chưa kiểm thử giao diện trực quan trên thiết bị thật, máy in, ngân hàng hoặc nhà cung cấp hóa đơn. Các nhận xét UI dưới đây dựa trên mã nguồn.
- Báo cáo không khẳng định đã đọc từng dòng của mọi file, hoặc đã tìm hết mọi lỗi.

Ký hiệu bằng chứng:

- **Tái hiện:** Đã quan sát bằng kiểm chứng cục bộ. Các repository liên quan DB được thay bằng mock; không phải kiểm thử tích hợp với DB thật.
- **Mã nguồn:** Có đường đi rõ ràng trong source, chưa chạy toàn bộ tình huống thực tế.
- **Đề xuất:** Khoảng trống hoặc cải tiến cần thiết, không mặc định là lỗi đã xảy ra.

## P0 — Bảo mật cần xử lý trước

### 01. Credential database được commit; JWT có secret dự phòng cố định

**Bằng chứng: mã nguồn và kiểm tra metadata cấu hình.** `apps/server/.env` được Git theo dõi; cả `DATABASE_URL` và `DIRECT_URL` chứa thông tin xác thực trong URL. Không đưa giá trị bí mật vào báo cáo. Server còn dùng secret JWT cố định nếu thiếu `JWT_SECRET`; file `.env` hiện tại không khai báo biến này, dù môi trường bên ngoài vẫn có thể ghi đè.

Hậu quả: người có bản sao repository hoặc lịch sử Git có thể nắm thông tin kết nối; cấu hình thiếu secret riêng có thể dẫn tới giả mạo token khi triển khai guard.

Sửa: thay credential đã đưa vào Git nếu còn sử dụng; đưa secret ra biến môi trường triển khai; chỉ commit `.env.example`; server dừng khởi động khi thiếu secret bắt buộc. Xóa file khỏi phiên bản mới không làm credential biến mất khỏi lịch sử.

Nguồn: [.gitignore](E:/A2Order/.gitignore:13), [server bootstrap](E:/A2Order/apps/server/src/index.ts:28).

### 02. API quản trị chưa yêu cầu xác thực và kiểm tra vai trò

**Bằng chứng: tái hiện.** Request không có token đọc danh sách nhân viên được HTTP 200, có PIN; request đặt lại mật khẩu đi đến repository và được HTTP 200 trong môi trường mock. Các route tạo nhân viên nhận `role` từ body. Bootstrap chỉ đăng ký JWT, không gắn guard chung; `/auth/me` tự verify token nhưng việc này không bảo vệ các route khác.

Hậu quả: nếu API này được mở trực tiếp, người ngoài có thể tiếp cận chức năng quản trị, đổi thông tin bảo mật hoặc thao tác dữ liệu. Ẩn menu ở frontend không bảo vệ API.

Sửa: phân loại route public và protected; bắt buộc verify JWT, kiểm tra trạng thái tài khoản và ma trận quyền ở backend; chặn cấp role vượt quyền. API client ở cả hai app phải đính kèm token trước khi bật guard. PIN nên được hash, không trả lại trong danh sách thông thường.

Nguồn: [staff listing](E:/A2Order/apps/server/src/modules/staff/staff.routes.ts:26), [reset credentials](E:/A2Order/apps/server/src/modules/staff/staff.routes.ts:263), [API client](E:/A2Order/apps/cms/src/services/api/apiClient.ts:10).

### 03. Nhiều thao tác bỏ qua `storeId`, cho phép tác động sai tenant

**Bằng chứng: tái hiện.** Đơn tạo cho `audit-A` được duyệt bằng URL của `audit-B`, HTTP 200. Sửa khu vực chỉ truyền `where: { id: zoneId }` xuống Prisma. `updateDish`/`deleteDish` nhận `storeId` nhưng không dùng nó trong điều kiện ghi. Các thao tác bàn và session cũng có chỗ tìm theo ID đơn thuần.

Hậu quả: ngay cả sau khi thêm đăng nhập, người có quyền ở quán A vẫn có thể tác động đối tượng của quán B nếu biết ID.

Sửa: lấy tenant từ danh tính đã xác thực; đối chiếu tenant của resource và mọi quan hệ liên quan; dùng điều kiện ghi gồm ID và tenant. Kiểm tra cả `zoneId`, `tableId`, session, order và menu item. Các route quản trị toàn hệ thống cần quyền riêng.

Nguồn: [approve order](E:/A2Order/apps/server/src/modules/order/order.routes.ts:125), [update zone](E:/A2Order/apps/server/src/modules/table/table.routes.ts:148), [menu repository](E:/A2Order/apps/server/src/core/database/prisma/prismaRepositories.ts:421).

### 04. Socket cho phép tham gia room tùy ý và giả mạo sự kiện nghiệp vụ

**Bằng chứng: tái hiện bằng hai client socket localhost, không token.** Client tham gia room quán A; client khác gửi `ORDER_APPROVED` với `storeId` A và sự kiện được phát lại. Sau khi client đổi sang room B, nó vẫn nhận được sự kiện gửi vào room A.

Hậu quả: nghe dữ liệu đơn của quán khác, phát sự kiện duyệt/hủy giả và làm giao diện nhân viên thay đổi sai. Khách QR đang dùng cùng room cấp quán với nhân viên nên có thể nhận các payload của bàn khác.

Sửa: xác thực handshake; server quyết định room từ quyền; tách room nhân viên theo quán và khách theo phiên bàn; khi đổi tenant phải rời room cũ. Client gửi lệnh hợp lệ qua API; sự kiện xác nhận chỉ được phát sau khi server lưu trạng thái.

Nguồn: [join room](E:/A2Order/apps/server/src/core/websocket/socketServer.ts:25), [relay approval](E:/A2Order/apps/server/src/core/websocket/socketServer.ts:55).

## P1 — Luồng vận hành và tính đúng dữ liệu

### 05. Server tin giá, số lượng và giảm giá từ client; hủy món không tính lại tiền

**Bằng chứng: tái hiện.** `/orders/submit` chấp nhận bàn không tồn tại, món không có ID hợp lệ, giá `-100`, số lượng `-2`, tổng tiền `1` và giảm giá lớn hơn tổng. Hủy món duy nhất của một đơn 10.000đ vẫn giữ `totalAmount` và `finalAmount` là 10.000đ.

Sửa: dùng schema validation runtime; nhận mã món, số lượng, tùy chọn; tra menu của tenant và tự tính giá/voucher/thuế/phụ thu tại server. Tính lại tổng khi hủy; kiểm tra trạng thái phiên và món còn bán. Tiền lưu theo đơn vị nguyên, chốt quy tắc làm tròn.

Nguồn: [submit order](E:/A2Order/apps/server/src/modules/order/order.routes.ts:47), [finalAmount](E:/A2Order/apps/server/src/modules/order/order.routes.ts:70), [cancel item](E:/A2Order/apps/server/src/modules/order/order.routes.ts:216), [schema chưa được route dùng](E:/A2Order/packages/shared/src/schemas/order.schema.ts:4).

### 06. Đơn QR nằm trong RAM; chưa tạo bản ghi OrderBatch/OrderItem khi duyệt

**Bằng chứng: mã nguồn.** `pendingOrders` là Map; duyệt chỉ đổi Map và phát socket. Không tìm thấy lệnh tạo `OrderBatch`, `OrderItem` hoặc `Bill` trong luồng order/billing hiện tại. Map còn xóa đơn sau TTL 12 giờ, kể cả đơn đã duyệt được giữ trong đó.

Hậu quả: khởi động lại process mất đơn; nhiều instance không thấy cùng dữ liệu; thiết bị bỏ lỡ socket không có nguồn để phục hồi danh sách món đã duyệt.

Sửa: lưu đơn chờ và đơn đã duyệt vào DB; đưa chuyển trạng thái vào transaction; có API lấy snapshot theo phiên. Socket thông báo thay đổi sau commit, không làm nơi giữ dữ liệu duy nhất.

Nguồn: [Map đơn](E:/A2Order/apps/server/src/modules/order/order.routes.ts:32), [approve](E:/A2Order/apps/server/src/modules/order/order.routes.ts:135).

### 07. Gửi bếp và thao tác KDS của nhân viên chủ yếu chỉ đổi state/localStorage

**Bằng chứng: mã nguồn.** POS client tạo ticket trong React state. CMS `handleSendToKitchen` ghi localStorage, không tạo order ở server. CMS KDS đọc localStorage và đổi trạng thái cục bộ, không gọi API cập nhật món.

Hậu quả: màn hình có thể báo đã gửi bếp nhưng máy bếp khác không nhận; tải lại app client mất ticket; bếp hoàn tất chưa làm khách/POS cập nhật theo một trạng thái chung.

Sửa: thống nhất service tạo batch và đổi trạng thái món ở backend cho cả nhân viên và khách; mọi thiết bị đọc cùng snapshot và sự kiện. KDS có thể giữ UI riêng nhưng dùng chung hợp đồng nghiệp vụ.

Nguồn: [client submit](E:/A2Order/apps/client/src/App.tsx:218), [CMS gửi bếp](E:/A2Order/apps/cms/src/features/staff-order/CmsStaffOrderView.tsx:763), [CMS KDS](E:/A2Order/apps/cms/src/features/kds/CmsKdsView.tsx:15).

### 08. Quầy thu ngân lấy món từ map rỗng và QR dùng tài khoản cố định

**Bằng chứng: mã nguồn.** `SAMPLE_BILLS` đang là `{}` nhưng `CashierWorkstation` lấy dòng hóa đơn từ map này để tính tiền. Vì vậy bàn có `totalAmount` vẫn có thể có hóa đơn tổng bằng 0. QR dùng tài khoản ngân hàng viết trực tiếp trong component. Xác nhận thu chỉ đổi state bàn qua callback.

Sửa: tải bill thật từ server theo session; QR lấy thông tin ngân hàng của đúng quán và bill đã chốt; lưu payment trước khi đóng phiên. Không cho xác nhận một bill chưa tải/không hợp lệ.

Nguồn: [bill map](E:/A2Order/apps/client/src/data/mockBills.ts:3), [cashier](E:/A2Order/apps/client/src/features/billing/components/CashierWorkstation.tsx:23), [QR](E:/A2Order/apps/client/src/features/billing/components/CashierWorkstation.tsx:36).

### 09. API thanh toán và KDS trả thành công nhưng chưa thực hiện nghiệp vụ

**Bằng chứng: mã nguồn; endpoint KDS đã kiểm chứng.** Sinh VietQR trả chuỗi rỗng; webhook chỉ trả `success: true`; KDS luôn trả `[]`; PATCH trạng thái món chỉ trả thành công. CMS cashier còn gọi đóng phiên, bỏ qua lỗi và xóa món khỏi UI mà không tạo bill/payment.

Sửa: hoàn thiện hợp đồng bill/payment/KDS; endpoint chưa hỗ trợ phải báo rõ chưa khả dụng. Webhook cần xác minh dữ liệu từ nhà cung cấp, chống xử lý trùng và đối soát tiền/bill; đóng bàn sau khi ghi nhận thanh toán hợp lệ.

Nguồn: [billing routes](E:/A2Order/apps/server/src/modules/billing/billing.routes.ts:3), [KDS routes](E:/A2Order/apps/server/src/modules/order/order.routes.ts:246), [CMS request bill](E:/A2Order/apps/cms/src/features/staff-order/CmsStaffOrderView.tsx:828).

### 10. Hóa đơn điện tử tự sinh mã giả nhưng thông báo đã ký và được cấp mã

**Bằng chứng: mã nguồn.** `generatedCqtCode` được tạo bằng `Math.random`; trạng thái thành `ISSUED_WITH_CODE`; dữ liệu chỉ được lưu cục bộ. Không có request đến dịch vụ phát hành trong handler; link PDF/XML là `#`.

Sửa: ẩn/khóa hành động phát hành trong chế độ vận hành cho đến khi tích hợp thật; nếu dùng demo thì ghi rõ. Chỉ hiển thị trạng thái đã phát hành sau phản hồi xác nhận của nhà cung cấp và lưu mã/tham chiếu thật.

Nguồn: [create e-invoice](E:/A2Order/apps/cms/src/features/e-invoice/CmsEInvoiceManagement.tsx:77).

### 11. PIN bàn và cơ chế QR chưa bảo vệ được quyền gọi món theo phiên

**Bằng chứng: mã nguồn.** API sơ đồ bàn công khai trả PIN. URL QR chỉ chứa quán/mã bàn/ID, không chứa token phiên. Dù đóng bàn đổi `qrSecret`, `/orders/submit` không kiểm tra secret, PIN hay session. Chặn đoán PIN ở trình duyệt bằng sessionStorage không giới hạn request trực tiếp lên API.

Sửa: xác minh PIN ở server, giới hạn thử theo bàn/thiết bị/IP phù hợp; sau mở bàn cấp token khách có scope phiên và thời hạn. Mỗi lệnh tạo/hủy món kiểm tra token, tenant và phiên đang mở. Thu hồi token khi đóng phiên; không gửi PIN cho khách qua API danh sách.

Nguồn: [QR URL](E:/A2Order/apps/server/src/modules/table/table.routes.ts:66), [PIN trong list](E:/A2Order/apps/server/src/modules/table/table.routes.ts:98), [unlock PIN](E:/A2Order/apps/server/src/modules/table/table.routes.ts:590), [submit](E:/A2Order/apps/server/src/modules/order/order.routes.ts:47).

### 12. Idempotency/rate limit có định nghĩa nhưng chưa được gắn vào luồng cần bảo vệ

**Bằng chứng: tái hiện và rà soát tham chiếu.** Gửi hai lần cùng `x-idempotency-key` tạo hai order khác ID. Duyệt cùng order lần hai vẫn thành công và có thể phát lại ticket. Không thấy nơi sử dụng middleware hoặc hook chống spam ngoài file định nghĩa.

Sửa: bắt buộc key ở thao tác ghi quan trọng; lưu theo tenant, người gọi, loại thao tác và hash request; giữ nguyên key cho retry cùng ý định; xử lý đồng thời bằng ràng buộc/transaction. Middleware Map hiện tại cũng chưa giữ chỗ cho request đang xử lý và key không được phân vùng tenant.

Nguồn: [anti-spam middleware](E:/A2Order/apps/server/src/core/middlewares/antiSpamMiddleware.ts:18), [order API client](E:/A2Order/apps/client/src/services/api/orderApi.ts:32), [approve](E:/A2Order/apps/server/src/modules/order/order.routes.ts:125).

### 13. Mở/đóng phiên chưa nguyên tử; có thể tạo nhiều session cho một bàn

**Bằng chứng: mã nguồn, chưa chạy kiểm thử cạnh tranh với DB.** Approve luôn tạo OrderSession mới rồi mới cập nhật Table bằng hai lệnh độc lập. Không kiểm tra phiên đã mở trước đó. Unlock PIN có khoảng thời gian giữa đọc và tạo. Đóng phiên bỏ qua lỗi cập nhật session nhưng vẫn trả bàn trống.

Sửa: transaction cho toàn bộ chuyển trạng thái, bảo đảm chỉ một active session trên một bàn và retry trả lại phiên cũ; xử lý mở/đóng đồng thời bằng khóa hoặc cập nhật có điều kiện. Không nuốt lỗi giữa các bước.

Nguồn: [approve session](E:/A2Order/apps/server/src/modules/table/table.routes.ts:452), [close session](E:/A2Order/apps/server/src/modules/table/table.routes.ts:535), [unlock](E:/A2Order/apps/server/src/modules/table/table.routes.ts:590).

### 14. Các màn hình lấy người đăng nhập từ những key khác nhau, dễ dùng sai quán

**Bằng chứng: mã nguồn.** App lưu user ở `a2order_auth_user`, có hỗ trợ sessionStorage khi không chọn nhớ đăng nhập. Staff-order lại đọc `a2order_current_user` hoặc `user`, rồi fallback về `store-a2-kitchen`. Các màn hình khác phần lớn chỉ đọc localStorage nên không nhận user chỉ nằm trong sessionStorage. POS client còn mặc định vào nhân viên đầu tiên và kiểm tra PIN ngay tại client.

Sửa: AuthProvider/store xác thực duy nhất, truyền `currentUser` và `storeId` đã xác minh cho các feature; bỏ fallback tenant trong màn hình đã đăng nhập; staff PIN đi qua API thật. Không dùng localStorage role làm căn cứ cấp quyền.

Nguồn: [auth keys](E:/A2Order/apps/cms/src/data/roleConfig.ts:3), [login/session](E:/A2Order/apps/cms/src/App.tsx:91), [staff-order user](E:/A2Order/apps/cms/src/features/staff-order/CmsStaffOrderView.tsx:121), [client PIN](E:/A2Order/apps/client/src/App.tsx:493).

### 15. Local cache không chia theo tenant/user; đăng xuất không dọn dữ liệu nghiệp vụ

**Bằng chứng: mã nguồn.** `usePersistentState` chỉ tạo key `a2order_${key}`. Menu, khách, hóa đơn, KDS và đơn bàn dùng cùng key giữa các tài khoản. Logout chủ yếu xóa token/user. Hook cũng không đăng ký nhận cập nhật từ tab khác.

Hậu quả: đăng nhập quán B trên cùng thiết bị có thể thấy dữ liệu quán A khi chờ tải hoặc khi API lỗi; các tab giữ bản dữ liệu khác nhau.

Sửa: namespace cache theo tenant và user phù hợp, xóa/hủy query khi đổi phiên; dữ liệu server phải là nguồn chuẩn. Nếu cho phép offline cần cơ chế phiên bản, đồng bộ và quyền truy cập cache riêng.

Nguồn: [persistent state](E:/A2Order/apps/cms/src/hooks/usePersistentState.ts:36), [logout](E:/A2Order/apps/cms/src/App.tsx:206).

### 16. Bộ dọn dữ liệu “mock” có thể xóa dữ liệu thật theo tên món

**Bằng chứng: tái hiện bằng localStorage giả.** Một bản ghi thật giả lập có ID riêng và tên “Bún Chả Hà Nội” làm cả key menu bị xóa. Cleanup tìm chuỗi tên trong JSON; hook persistent cũng làm tương tự. Lần đầu chưa có cờ v7 còn xóa hàng loạt key nghiệp vụ bất kể nội dung.

Sửa: bỏ nhận diện demo bằng tên món/tên người; dùng migration có version, nguồn gốc dữ liệu và ID seed rõ ràng. Chỉ dọn dữ liệu được xác nhận là seed; cần bảo toàn dữ liệu cục bộ đang là nguồn duy nhất trước khi chuyển đổi.

Nguồn: [cleanup](E:/A2Order/apps/cms/src/lib/cleanupStorage.ts:71), [first-run deletion](E:/A2Order/apps/cms/src/lib/cleanupStorage.ts:81), [persistent filtering](E:/A2Order/apps/cms/src/hooks/usePersistentState.ts:32).

### 17. Menu dùng ID tự tạo sau khi lưu, đồng thời nhiều trường không được lưu DB

**Bằng chứng: mã nguồn và kiểm chứng repository mock.** CMS tạo ID `m-...`, gọi create nhưng bỏ response, rồi đưa đối tượng với ID tự tạo vào state. Server tạo UUID riêng, nên sửa/xóa ngay món mới có thể gọi sai ID. Repository không lưu cập nhật category, stockCount, costPrice, description, variants/toppings; costPrice khi đọc được suy ra bằng 40% giá bán. Kiểm chứng update chỉ những trường này không tạo ra field ghi thực tế nào.

Sửa: dùng đối tượng server trả về sau create/update; thống nhất DTO và schema hỗ trợ các trường thật sự có trên UI; không thay dữ liệu giá vốn bằng tỷ lệ giả. Schema thay đổi cần migration và kiểm thử đọc lại sau reload.

Nguồn: [menu create UI](E:/A2Order/apps/cms/src/features/menu/CmsMenuManagement.tsx:164), [menu mapping](E:/A2Order/apps/server/src/core/database/prisma/prismaRepositories.ts:347), [menu update](E:/A2Order/apps/server/src/core/database/prisma/prismaRepositories.ts:421).

### 18. Nhiều thao tác lưu báo thành công dù API/DB lỗi hoặc chỉ lưu trên máy

**Bằng chứng: tái hiện cho landing API; các trường hợp UI theo mã nguồn.** Mock lỗi DB ở landing update vẫn nhận HTTP 200 và `success: true`. CMS sửa/xóa/thêm menu nuốt lỗi rồi cập nhật local và toast thành công; thêm nhân viên có fallback tương tự. Thông tin ngân hàng và “xuất bản landing page” trên UI chỉ lưu localStorage.

Sửa: thành công chỉ sau server xác nhận; giữ bản nháp và hiển thị lỗi/retry khi thất bại. Nếu có hàng đợi offline phải ghi trạng thái “chưa đồng bộ”, có outbox và retry thật; không đổi thành công giả. Nối settings/landing editor vào API tương ứng.

Nguồn: [landing fallback](E:/A2Order/apps/server/src/modules/landing/landing.routes.ts:131), [menu fallback](E:/A2Order/apps/cms/src/features/menu/CmsMenuManagement.tsx:70), [settings save](E:/A2Order/apps/cms/src/features/settings/CmsStoreSettings.tsx:40), [landing save](E:/A2Order/apps/cms/src/features/settings/CmsLandingPageEditor.tsx:102).

### 19. Publish báo version mới nhưng repository không lưu `configVer`

**Bằng chứng: tái hiện bằng repository mock.** Gọi update chỉ với `configVer: v1.0.1` không phát sinh ghi Store; dữ liệu trả về vẫn `v1.0.0`. Route publish vẫn phát sự kiện version mới. Published-config dùng ETag theo version và cache công khai 24 giờ.

Hậu quả: thiết bị nhận thông báo mới nhưng ETag/version DB cũ; phản hồi 304 hoặc cache khiến cấu hình/menu không cập nhật đúng. Endpoint còn trả raw table objects có `qrSecret`, cần DTO công khai riêng.

Sửa: persist version một cách nguyên tử cùng cấu hình được xuất bản; dùng snapshot/version nhất quán, chỉ trả dữ liệu công khai; kiểm tra chuỗi publish → fetch → conditional fetch.

Nguồn: [publish](E:/A2Order/apps/server/src/modules/store/store.routes.ts:176), [store update](E:/A2Order/apps/server/src/core/database/prisma/prismaRepositories.ts:282), [published cache](E:/A2Order/apps/server/src/modules/store/store.routes.ts:166).

### 20. Thu hồi/hết hạn license và giới hạn module chưa được cưỡng chế ở backend

**Bằng chứng: rà soát mã nguồn.** `verifyStoreLicense` không được route nào gọi. Giới hạn số bàn/nhân viên không được kiểm tra khi tạo. UI cho cập nhật `enabledModules` cục bộ, nên paywall/menu không phản ánh quyền được cấp từ server.

Sửa: guard backend cho entitlement và hạn mức; lấy quyền module từ license đã xác minh; phân biệt mở phiên/đơn mới với xử lý bàn đang phục vụ khi hết hạn. Khóa quán, thu hồi license và vô hiệu hóa tài khoản cần có hành vi nhất quán trên API lẫn socket.

Nguồn: [license guard](E:/A2Order/apps/server/src/core/middlewares/licenseMiddleware.ts:10), [local module apply](E:/A2Order/apps/cms/src/features/settings/CmsStoreSettings.tsx:66).

### 21. Tạo license dự phòng chưa gán quán mâu thuẫn với Prisma schema

**Bằng chứng: mã nguồn, chưa gọi DB thật.** Route/UI cho tạo key không có `storeId`; repository bỏ field này và ép `any`. Schema lại yêu cầu `StoreLicense.storeId String @unique` cùng quan hệ Store bắt buộc. Luồng này không thể lưu hợp lệ theo schema hiện tại.

Sửa: chọn mô hình rõ ràng: key phát hành tách khỏi license đã gán, hoặc cho phép gán tùy chọn với ràng buộc phù hợp. Bỏ ép `any` che lỗi schema; thêm kiểm thử vòng đời phát hành → gán → thu hồi.

Nguồn: [create license](E:/A2Order/apps/server/src/core/database/prisma/prismaRepositories.ts:501), [schema](E:/A2Order/apps/server/prisma/schema.prisma:177).

### 22. Giá thuê bao và ghi nhận thanh toán SaaS không có một nguồn quy tắc chung

**Bằng chứng: tái hiện so sánh API/shared; các phần khác theo source.** Cùng module, kỳ 3 tháng API giảm 0% trong khi shared giảm 5%; kỳ 24 tháng API giảm 20%, shared giảm 30%. API calculate dùng catalog hằng thay vì cấu hình DB. Invoice create tin `body.amount`; tạo quán tự tạo invoice `PAID` dù chưa có bước xác minh thanh toán. Renew dùng hạn cũ cộng ngày nên license hết hạn lâu có thể vẫn hết hạn sau khi “gia hạn”.

Sửa: một service báo giá server dùng cấu hình có version; invoice lưu snapshot báo giá và bắt đầu PENDING; ghi nhận tiền qua luồng được cấp quyền/đối soát. Quy tắc ngày bắt đầu gia hạn và làm tròn tháng phải thống nhất. Validate kỳ hạn dương, module hợp lệ và voucher còn hiệu lực/hạn sử dụng.

Nguồn: [calculate pricing](E:/A2Order/apps/server/src/modules/license/license.routes.ts:141), [invoice amount](E:/A2Order/apps/server/src/modules/license/license.routes.ts:221), [onboard PAID](E:/A2Order/apps/server/src/core/database/prisma/prismaRepositories.ts:230), [renew](E:/A2Order/apps/server/src/core/database/prisma/prismaRepositories.ts:535), [shared pricing](E:/A2Order/packages/shared/src/pricing-rules.ts:95).

### 23. Báo cáo không lọc đúng kỳ; export CSV xuất dữ liệu viết sẵn

**Bằng chứng: mã nguồn.** Tổng doanh thu cộng toàn bộ bill trong localStorage bất kể today/yesterday/week/month. Lọc bill không có điều kiện ngày. CSV luôn chứa ba dòng mẫu. Backend deep-reports luôn trả số 0 và mảng rỗng. Như vậy màn hình và file tải về không có cùng nguồn dữ liệu.

Sửa: báo cáo từ bill/payment đã lưu server; lọc theo thời gian, múi giờ quán, trạng thái và ca; export cùng tập dữ liệu/bộ lọc. Đối chiếu tổng doanh thu với tổng thanh toán và các khoản hủy/hoàn.

Nguồn: [CSV](E:/A2Order/apps/cms/src/features/analytics/CmsDeepAnalyticsView.tsx:23), [totals](E:/A2Order/apps/cms/src/features/analytics/CmsDeepAnalyticsView.tsx:57), [bill filter](E:/A2Order/apps/cms/src/features/analytics/CmsDeepAnalyticsView.tsx:96), [analytics API](E:/A2Order/apps/server/src/modules/analytics/analytics.routes.ts:13).

### 24. Khách có nhiều đợt gọi món sẽ bị cập nhật đồng loạt sai trạng thái

**Bằng chứng: mã nguồn.** Khi nhận ORDER_APPROVED/ORDER_REJECTED, trang khách đổi tất cả item PENDING_APPROVAL của bàn, không lọc `orderId`. Hai đợt đang chờ: duyệt một đợt có thể làm đợt còn lại hiển thị đang nấu. CMS còn tạo lại ID item khi nhận ORDER_SUBMITTED, gây khó đối chiếu hủy món theo ID gốc và phát lại sự kiện có thể cộng trùng món.

Sửa: giữ ID ổn định từ server; cập nhật đúng order/batch/item và version sự kiện; loại sự kiện trùng. Trạng thái từng món phải được lấy từ server khi reconnect/reload.

Nguồn: [customer approved/rejected](E:/A2Order/apps/client/src/features/ordering/CustomerTableOrderPage.tsx:230), [CMS submitted mapping](E:/A2Order/apps/cms/src/features/staff-order/CmsStaffOrderView.tsx:355).

### 25. Socket reconnect chưa tự vào lại room và chưa phục hồi snapshot

**Bằng chứng: mã nguồn; việc giữ room cũ khi đổi store đã tái hiện ở mục 04.** `joinStoreRoom` emit khi component effect chạy, còn handler `connect` chỉ log. Khi server hoặc đường truyền kết nối lại, các room của kết nối cũ không được đăng ký lại từ hook này. Không có cơ chế đồng bộ bù đơn đã duyệt/KDS bị bỏ lỡ.

Sửa: quản lý subscription tập trung theo danh tính/tenant/session; join lại sau mỗi connect; rời room khi logout/đổi quán; lấy snapshot và đối chiếu version sau reconnect. UI hiển thị tình trạng kết nối và đơn chưa được server xác nhận.

Nguồn: [socket client](E:/A2Order/apps/client/src/lib/socket.ts:6), [join](E:/A2Order/apps/client/src/lib/socket.ts:25), [CMS socket client](E:/A2Order/apps/cms/src/lib/socket.ts:6).

## P2 — Nền tảng phát triển và vận hành

### 26. Build chưa ổn định từ trạng thái mới; dev/lint/test chưa thành quy trình dùng được

**Bằng chứng: đã chạy.** Build đầu báo thiếu bốn formatter export tại client và CMS. Workspace shared được build sau các app; sau khi shared đã build, lần hai cả bốn workspace thành công. `npm run lint` thất bại vì các workspace không có script lint. Test pricing dùng `require` trong package ESM nên dừng ngay. `npm run dev --workspaces` chạy lần lượt các lệnh dài hạn, không phải khởi chạy đồng thời như README mô tả. Không có thư mục `.github` trong snapshot được kiểm tra.

Sửa: build shared trước các phụ thuộc; xác minh từ clean checkout trong CI; khai báo runtime/package manager; chạy dev qua tiến trình song song có quản lý shutdown; sửa runner test và script lint. Ưu tiên regression test bảo mật, tenant, tiền và cạnh tranh thay vì chỉ kiểm tra build.

Nguồn: [root scripts](E:/A2Order/package.json:11), [shared exports/build](E:/A2Order/packages/shared/package.json:6), [pricing test](E:/A2Order/packages/shared/test/pricing.test.js:1).

### 27. URL localhost viết cứng làm luồng điện thoại/triển khai dễ hỏng

**Bằng chứng: mã nguồn.** CMS `/order` chuyển đến `http://localhost:3000`; POS gọi login và mở CMS ở localhost; xem landing mở API JSON tại localhost:4000. QR mặc định trỏ cổng CMS 3001. Trên điện thoại, localhost là chính điện thoại, không phải máy đang chạy server.

Sửa: cấu hình URL public cho client/CMS/API/socket, validate khi build/khởi động; ưu tiên route qua cùng domain khi phù hợp. QR phải dùng URL public HTTPS của app gọi món. Preview landing cần trang render thật. Kiểm thử quét QR từ thiết bị khác mạng/dev host.

Nguồn: [CMS redirect](E:/A2Order/apps/cms/src/App.tsx:253), [POS login](E:/A2Order/apps/client/src/App.tsx:511), [QR builder](E:/A2Order/apps/server/src/modules/table/table.routes.ts:66), [landing preview](E:/A2Order/apps/cms/src/features/settings/CmsLandingPageEditor.tsx:131).

### 28. Nhiều module phụ mới có UI cục bộ; tài liệu mô tả vượt quá khả năng hiện có

**Bằng chứng: khảo sát source/schema.** Kho, CRM, khuyến mãi, đặt bàn, delivery, máy in và chấm công có phần quản lý state/localStorage; nhiều nút chỉ toast. Bộ đàm tạo bản ghi “voice” nhưng không thu/phát âm thanh giữa thiết bị. Các model/route tương ứng chưa có đầy đủ trong backend. README vẫn nói Dual-DB theo `USE_MOCK_DB`, nhưng repositoryFactory luôn khởi tạo Prisma; seed hiện chỉ tạo HQ/admin, không tạo 8 mô hình như hướng dẫn migration mô tả.

Sửa: lập ma trận `UI / API / DB / realtime / external integration / test` cho từng feature, công bố rõ demo/beta/ready. Chưa có tích hợp thì không thông báo đã gửi đến bên ngoài. Cập nhật tài liệu theo implementation và thu hẹp menu ra mắt.

Nguồn: [repository factory](E:/A2Order/apps/server/src/core/database/repositoryFactory.ts:1), [migration guide](E:/A2Order/MOCK_TO_REAL_DB_MIGRATION_GUIDE.md:1), [delivery handlers](E:/A2Order/apps/cms/src/features/delivery/CmsDeliveryIntegrations.tsx:89), [intercom](E:/A2Order/apps/client/src/components/shared/StaffIntercomWidget.tsx:49), [seed](E:/A2Order/apps/server/prisma/seed.ts:6).

### 29. Schema và quy trình migration cần củng cố tính toàn vẹn

**Bằng chứng: mã nguồn; chưa kiểm tra constraints/RLS trên DB đang chạy.** Không có migration được Git theo dõi trong snapshot. Nhiều status/role là String; quy ước `CLOSED` ở route khác `COMPLETED` ở shared; Table.currentSessionId không là FK. Quan hệ `zoneId`/`tableId` và `storeId` là các FK độc lập nên chưa buộc quan hệ cùng tenant. Nhiều quan hệ cascade có thể xóa lịch sử khi xóa cấu hình như khu vực/bàn. Bill chưa có mô hình thanh toán nhiều lần/hoàn tiền hoặc phân bổ dòng khi tách bill.

Sửa: migration có version; định nghĩa trạng thái chung và chuyển trạng thái hợp lệ; ràng buộc duy nhất/FK cùng tenant phù hợp; tránh xóa cứng dữ liệu có lịch sử giao dịch. Thiết kế payment và bill allocation khi bắt đầu làm trả nhiều phương thức/tách bill. Kiểm tra RLS, grants và role kết nối thực tế ở vòng audit DB riêng.

Nguồn: [schema](E:/A2Order/apps/server/prisma/schema.prisma:1), [shared status](E:/A2Order/packages/shared/src/order-status.ts:6), [close session](E:/A2Order/apps/server/src/modules/table/table.routes.ts:535).

### 30. File nghiệp vụ lớn, code trùng và thiếu một số tiêu chí UI cơ bản

**Bằng chứng: thống kê/source.** Staff-order khoảng 2.446 dòng; nhiều feature 1.000+ dòng. Có 12 nhóm file giống hệt giữa client và CMS, gồm socket, API client, nhiều API service và notification store. Trạng thái KDS tồn tại nhiều mô hình khác nhau. Modal chung chưa có focus trap/khôi phục focus, chưa gắn tiêu đề qua aria-labelledby; nút đóng 32px, nút KDS 36px thấp hơn quy chuẩn 44px của dự án. Màu/token chưa thống nhất giữa các màn hình.

Sửa: tách domain service/hook và view nhỏ theo trách nhiệm; chia sẻ API/contracts/UI dùng chung có chọn lọc; chốt một state machine. Chuẩn hóa modal, bàn phím, focus, nhãn và touch target. Đánh giá trực quan trên điện thoại/tablet sau khi luồng dữ liệu chạy đúng.

Nguồn: [staff-order](E:/A2Order/apps/cms/src/features/staff-order/CmsStaffOrderView.tsx:1), [modal](E:/A2Order/apps/cms/src/components/ui/Modal.tsx:77), [KDS action](E:/A2Order/apps/cms/src/features/kds/CmsKdsView.tsx:174).

### 31. Logging/audit/readiness chưa đủ cho điều tra sai lệch vận hành

**Bằng chứng: mã nguồn.** Fastify tắt logger; `/health` trả OK mà không kiểm tra phụ thuộc. AuditLog có schema nhưng chưa thấy tạo audit backend trong các luồng ghi đang xét; phần admin tự thêm log vào state. Có catch rỗng hoặc trả `err.message` thô về client. Dòng “Connected to Supabase” được in khi khởi tạo repository, chưa phải kết quả kiểm tra kết nối thành công.

Sửa: log cấu trúc có request ID, tenant, người thực hiện và thời gian; loại secret/PII khỏi log. Audit quan trọng được server ghi trong transaction; tách liveness/readiness; theo dõi độ trễ đơn/KDS, lỗi thanh toán, số retry và backlog offline. Bổ sung backup và thực hành restore có kiểm chứng.

Nguồn: [server logger/health](E:/A2Order/apps/server/src/index.ts:18), [repository message](E:/A2Order/apps/server/src/core/database/repositoryFactory.ts:21), [admin audit state](E:/A2Order/apps/cms/src/features/super-admin/CmsSuperAdminView.tsx:121).

## Kết quả kiểm chứng

| Kiểm tra | Quan sát |
| --- | --- |
| `npm run build`, lần đầu | Client/CMS lỗi TS2305: bốn formatter chưa có trong shared build cũ; server/shared vẫn được biên dịch |
| `npm run build`, sau khi shared đã build | Thành công cả client, CMS, server, shared |
| `npm run lint` | Thất bại: thiếu script lint ở các workspace |
| `node --test packages/shared/test/pricing.test.js` | Thất bại ngay: `require is not defined in ES module scope` |
| GET staff không token, mock repository | 200; response chứa PIN |
| Reset credential không token, mock repository | 200; gọi đến repository update |
| Submit giá/số lượng âm và bàn giả | 200; dữ liệu không bị từ chối |
| Submit hai lần cùng idempotency key | Hai order ID khác nhau |
| Duyệt order bằng store khác | 200; trả order của store gốc |
| Duyệt lại order đã duyệt | 200, không chặn |
| Update zone dưới store khác, mock Prisma | `where` chỉ có ID, không có tenant |
| Landing update khi mock DB lỗi | 200 và `success: true` |
| KDS tickets | 200 với mảng rỗng cố định |
| Hai socket localhost không token | Kết nối được; phát giả approval được; chuyển store vẫn ở room cũ |
| Store update chỉ đổi configVer, mock Prisma | Không ghi Store; version trả về vẫn cũ |
| Menu update category/stock/cost/description/variant, mock Prisma | Không có field có giá trị nào được gửi để lưu |
| Cleanup với menu tên thật trùng pattern | Xóa cả key menu |
| Báo giá 3/24 tháng API so với shared | 0%/20% so với 5%/30% |
| Hủy món duy nhất của đơn 10.000đ | Item CANCELLED nhưng tổng vẫn 10.000đ |

Các kiểm chứng không được lưu thành test suite trong repository; đây là bằng chứng audit, chưa thay thế regression suite.

## Hướng phát triển đề xuất

### Chọn phạm vi ra mắt

Nên chốt một mô hình quán đầu tiên, chẳng hạn phục vụ tại bàn với quầy thu ngân và một bếp. Hoàn thiện 5 luồng: cấu hình quán/menu → mở phiên → gọi món nhiều đợt → bếp/phục vụ → thu tiền/chốt ca. Chỉ mở rộng CRM/kho/delivery/HĐĐT sau khi luồng này đạt tiêu chí nghiệm thu.

| Phương án | Lợi ích | Đánh đổi |
| --- | --- | --- |
| **Đề xuất: một quán, luồng cốt lõi hoàn chỉnh** | Dễ kiểm chứng tiền và trạng thái; sớm dùng thử trong ca thật | Tạm ẩn nhiều module phụ đã có UI |
| Hoàn thiện đồng thời toàn bộ menu hiện có | Giữ bề rộng sản phẩm | Nhiều hợp đồng dữ liệu/tích hợp cùng lúc; chậm đạt một luồng đáng tin cậy |

### Thứ tự thực hiện

1. **Bảo vệ hệ thống:** xử lý secret; AuthContext chung; bearer token; guard API/socket; tenant scope; PIN/session token; bỏ thông báo thành công giả ở chức năng chưa tích hợp. Nghiệm thu bằng ma trận anonymous/role/tenant.
2. **Chốt dữ liệu và tiền:** service order/session/bill/payment dùng chung, giá server, transaction, idempotency và audit. DB là nguồn dữ liệu chuẩn; giữ ID và snapshot giá từng món.
3. **Đồng bộ vận hành:** KDS/API thật, cập nhật item, reconnect/snapshot; xử lý hai thiết bị và retry. Sửa menu ID/schema, config publishing và settings.
4. **Thu ngân và báo cáo:** thanh toán tiền mặt có lưu vết, QR đúng tài khoản, đối soát chuyển khoản, chốt ca, báo cáo từ ledger. Chỉ xác nhận tự động khi có sự kiện thanh toán đã kiểm chứng.
5. **Chất lượng và triển khai:** build sạch, lint/test/CI, migration, logging/readiness, backup/restore, thử mobile và máy in. Sau đó ưu tiên từng phân hệ mở rộng dựa trên nhu cầu quán thử nghiệm.

### Những tính năng nên ưu tiên cho quán thực tế

- Hiển thị rõ lệnh đang gửi, đã được server nhận hay chưa đồng bộ; có mã đơn/batch để nhân viên đối chiếu.
- Nút gọi thêm món theo đợt, hủy có lý do và quyền quản lý; giữ lịch sử thay đổi giá/phụ thu/giảm giá.
- Bếp có phân trạm KITCHEN/BAR từ menu, hàng chờ, âm báo có chống phát lặp và đánh dấu món chậm theo SLA cấu hình.
- Thu ngân có chốt ca: tiền đầu ca, thu tiền mặt/chuyển khoản, hoàn tiền, chênh lệch bàn giao; có khả năng in lại cùng bill mà không ghi nhận thu lần nữa.
- Offline cần outbox, ID ổn định, retry và xử lý xung đột. Hiện `offline_bills` mới là lưu cục bộ, chưa có luồng đồng bộ lại; chưa nên mô tả đã lưu an toàn lên hệ thống.
- Onboarding theo bước: thông tin quán → ngân hàng → menu → sơ đồ bàn → nhân viên → đơn thử. Cho biết bước nào chưa đủ điều kiện mở bán.

## Bộ tiêu chí nghiệm thu tối thiểu

1. Không token → 401 ở mọi route protected; sai role/tenant → 403 hoặc 404 phù hợp, không đổi DB.
2. Khách chỉ xem và thao tác đúng phiên bàn được cấp; phiên đóng/thu hồi không gửi thêm món được.
3. Giá/thuế/discount client sửa không làm thay đổi số tiền server đã tính; số lượng âm/0/sai kiểu bị từ chối.
4. Hai request cùng ý định, retry và đồng thời chỉ tạo một order/payment; duyệt lại không sinh ticket trùng.
5. Hai nhân viên mở một bàn đồng thời chỉ có một active session; lỗi giữa chừng không để trạng thái nửa vời.
6. Tạo đơn → khởi động lại server → tải lại POS/KDS/khách vẫn khôi phục đúng dữ liệu.
7. Bếp hoàn tất trên máy B, POS trên máy A và khách cập nhật đúng item; reconnect không mất/trùng món.
8. Tách/gộp/chuyển bàn giữ tổng lượng món và tổng tiền; hủy/hoàn có audit và phép tính khớp.
9. Thanh toán lưu bill/payment rồi mới đóng phiên; QR đúng ngân hàng tenant; webhook giả/trùng/sai tiền không gạch nợ sai.
10. Đổi quán trên cùng trình duyệt không thấy dữ liệu quán trước; đăng nhập không chọn nhớ vẫn chọn đúng tenant.
11. Báo cáo kỳ/ca và export cho cùng kết quả với ledger; backup restore được thử thành công.
12. Clean checkout có thể cài, generate client, build, lint và chạy test bằng quy trình được ghi trong README.

## Phần cần xác minh tiếp khi có môi trường staging

RLS/grants và quyền role kết nối trên Supabase; schema DB có khớp Prisma không; tính hiệu lực/phạm vi credential; giới hạn hạ tầng; giao dịch đồng thời với DB thật; webhook sandbox; máy in; trải nghiệm trên điện thoại/tablet; backup/restore. Không suy luận rằng những lớp bảo vệ ngoài repository đã tồn tại chỉ vì tài liệu có mô tả.

Không sửa source ứng dụng, schema, cấu hình hoặc dữ liệu thật trong lượt đánh giá này. Thay đổi được tạo là báo cáo này; build chỉ tạo/cập nhật output nằm ngoài Git.
