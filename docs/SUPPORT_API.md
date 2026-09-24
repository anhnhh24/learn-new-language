# Ticket hỗ trợ của người học

Migration 013_support_tickets.sql. Yêu cầu Features:LearnerApiEnabled và bearer session hợp lệ.

| Route | Hành vi |
|---|---|
| POST /api/v1/me/tickets | Tạo ticket; clientOperationId UUID bắt buộc |
| GET /api/v1/me/tickets?page=1&pageSize=20 | Danh sách của chính người học, có hasMore |
| GET /api/v1/me/tickets/{id} | Đọc ticket của chính người học; không thuộc sở hữu trả 404 |

Body tạo: clientOperationId, category, title, description, lessonVersionId (tùy chọn).

- category: Content, Technical, Account, Billing; title 3–150 ký tự; description tối đa 2.000 ký tự.
- Cùng learner + operation ID + payload trả ticket đã tạo; đổi payload với ID cũ trả IDEMPOTENCY_CONFLICT (409).
- Giới hạn 5 ticket mới/giờ/tài khoản; replay không tính thêm lượt. Vượt giới hạn trả SUPPORT_RATE_LIMIT (429).
- lessonVersionId phải là bài Published đọc công khai hoặc thuộc phiên bản khóa learner đã enroll. Bài đã thu hồi vẫn được báo lỗi nếu có enrollment.
- Lưu source version chính xác; không nhận learnerId, trạng thái xử lý hoặc role do client tự khai.
- Phân trang mặc định 20, tối đa 50 mục; page 1–1000.
- Nội dung là plain text; UI phải render text, không dùng innerHTML.

## Điểm chưa triển khai

- Staff assignment, trả lời, đổi trạng thái, SLA và audit thao tác staff cần module RBAC/MFA trước khi mở endpoint quản trị.
- Upload ảnh đính kèm chưa mở; cần kiểm MIME/size/malware. Không nhận URL hoặc đường dẫn tệp tùy ý.
- Báo lỗi question/attempt dùng service telemetry riêng; endpoint này chỉ gắn lessonVersionId.
- Chưa nối màn support frontend. Không gửi email tự động khi tạo ticket.
- Migration/API chưa chạy thử: theo yêu cầu người dùng chỉ build bắt lỗi biên dịch, hoãn test và smoke.
