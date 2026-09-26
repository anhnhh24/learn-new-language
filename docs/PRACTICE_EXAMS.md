# Luyện đề: API và giao diện

## Phạm vi đã triển khai

- Danh sách đề từ PostgreSQL, phân trang và lịch sử từng người học.
- Bắt đầu, tiếp tục lượt làm, phòng làm bài toàn màn hình, chọn/bỏ đáp án, đánh dấu xem lại trong phiên.
- Snapshot câu hỏi, đáp án và giải thích tại thời điểm bắt đầu. Client không nhận đáp án đúng hoặc giải thích trước khi chấm.
- Lease thiết bị 60 giây, heartbeat 20 giây, cho phép người học chủ động chuyển quyền làm bài.
- Lưu đáp án theo revision, receipt bền vững chống ghi/nộp trùng. Retry giữ operation ID và payload; payload khác trả conflict.
- Đồng hồ theo thời gian server; hết giờ chấm đáp án đã được server xác nhận. Worker xử lý lượt hết giờ ngay cả khi người học rời trang.
- Điểm thô, thống kê theo Part, giải thích và trích dẫn bằng chứng; câu trả lời sai đi vào sổ lỗi sai; báo lỗi câu hỏi qua API hiện có.

## Điều kiện triển khai

Áp dụng các migration theo thứ tự đến `db/021_practice_attempts.sql`. Đợt này chỉ bổ sung migration, chưa áp dụng vào DB đang chạy.

Bật `Features:LearnerApiEnabled`, `Features:BetaServingEnabled`, cấu hình PostgreSQL và `Analytics:PseudonymKeyBase64` theo cấu hình hiện có. `Workers:QuizExpiryEnabled` điều khiển cả worker quiz và luyện đề. Worker quét mỗi 30 giây, tối đa 50 lượt; lỗi riêng từng lượt được lùi 15 phút để thử lại.

Form phải Active, tier BetaPractice/DataValidatedPractice, có nội dung Part5/Part7DirectEvidence đã qua quality pipeline. Form đã gắn bài học không xuất hiện trong danh sách luyện đề độc lập. Start vẫn kiểm tra đầy đủ bằng BetaServingService; không bỏ qua quality gate. Tài khoản phải Active và xác minh email; tối đa 10 lượt bắt đầu mỗi giờ. Lượt đang Active của cùng đề cần được mở lại từ lịch sử.

Migration không seed hoặc tự xuất bản ngân hàng câu hỏi. Danh sách có thể rỗng nếu chưa có form hợp lệ. Không đổi form Draft thành Active chỉ để lấp giao diện.

## API

Prefix `/api/v1/me/practice`, bearer session người học, response `Cache-Control: no-store`.

| Method | Path | Nội dung |
| --- | --- | --- |
| GET | `/forms?page=1&pageSize=20` | Đề có thể mở; pageSize tối đa 50 |
| GET | `/attempts?page=1&pageSize=20` | Lịch sử của chủ tài khoản |
| POST | `/attempts` | formId, clientOperationId |
| GET | `/attempts/{id}` | Câu hỏi, đáp án đã lưu, revision, giờ server; chấm nếu hết giờ |
| PUT | `/attempts/{id}/lease` | token (64 ký tự hex), allowTakeover |
| PUT | `/attempts/{id}/answer` | clientOperationId, expectedRevision, questionId, optionId (null để bỏ chọn), leaseToken |
| POST | `/attempts/{id}/submit` | clientOperationId, expectedRevision, leaseToken |
| POST | `/reports` | attemptId, itemRevisionId, category, comment |

Category: WRONG_KEY, AMBIGUOUS, EXPLANATION, TYPO, TECHNICAL; comment tối đa 2.000 ký tự. Báo lỗi được kiểm tra theo câu hỏi thực sự đã phục vụ cho người học.

Start-operation dùng chung không gian với quiz bài học; hai module không được nhận nhầm lượt của nhau. Lease token không nằm trong hash của receipt: người học có thể lấy lại lease rồi retry thao tác cũ. Ownership vẫn được kiểm tra trước khi trả receipt.

## Giao diện và khôi phục

Các route `/learn/practice`, `/learn/practice/:attemptId`, `/learn/practice/:attemptId/result` dùng API thật. Không dùng điểm hoặc đề giả khi API lỗi.

Đáp án chưa xác nhận được giữ trong sessionStorage của tab cùng operation ID. Giao diện chặn thao tác mới/nộp trong lúc còn bản nháp, cho phép thử lưu lại hoặc bỏ bản nháp và tải dữ liệu server. Sau ACK, tải lại trạng thái server để không hạ revision khi replay receipt cũ. Đáp án chưa đến server trước deadline không được tính điểm.

Lease token chỉ giữ trong bộ nhớ; sau reload có thể phải đợi lease cũ hết hạn hoặc chủ động chuyển quyền sang phiên mới. Dấu xem lại chỉ tồn tại trong phiên giao diện, không đồng bộ sang thiết bị khác.

## Những phần cần làm tiếp

- Đã có quản lý ghép/xuất bản/ngừng phát hành đề từ nguồn đã kiểm định tại `/admin/exams` (xem `ADMIN_EXAMS.md`). Vẫn thiếu ngân hàng đề đầy đủ, CMS nhập/biên tập câu hỏi mới; dữ liệu Listening/audio, Part 6 và các dạng Part 7 ngoài direct evidence.
- Thi thử full TOEIC, chẩn đoán đầu vào và quy đổi điểm 990 chưa được triển khai trong luồng này. Chỉ hiển thị điểm thô; thời gian lượt làm gồm cả thời gian rời trang, không phải thời gian học thực tế.
- Telemetry câu trả lời đánh dấu không đủ điều kiện calibration vì chưa đo thời gian làm từng câu đáng tin cậy.
- Dashboard học tập hiện thống kê quiz bài học riêng; lượt luyện đề xem trong lịch sử luyện đề, chưa cộng vào biểu đồ hoạt động dashboard.
- Chưa chạy kiểm thử chức năng, migration hoặc kiểm tra giao diện trên trình duyệt theo yêu cầu hoãn test. Build không thay thế các kiểm tra này. Frontend hiện có cảnh báo bundle lớn hơn 500 kB.

Thanh toán tiếp tục pending, không được bật bởi thay đổi này.
