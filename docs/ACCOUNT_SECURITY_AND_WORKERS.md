# Quản lý phiên và tự chấm quiz hết hạn

## Tài khoản

Các endpoint dưới `/api/v1/me/security` yêu cầu bearer session và không cache:

- GET `/sessions`: các phiên chưa thu hồi, còn hạn; id, createdAt, expiresAt, current. Không trả token/hash.
- DELETE `/sessions/{id}`: thu hồi phiên thuộc tài khoản, gồm cả phiên hiện tại. Gọi lại id đã thu hồi vẫn thành công; id tài khoản khác trả 404.
- POST `/sessions/revoke-others`: thu hồi các phiên khác phiên đang gọi.
- POST `/password`: `{currentPassword,newPassword}`. Mật khẩu mới dài 12–128 ký tự, không chỉ khoảng trắng; kiểm mật khẩu hiện tại và session trong transaction khóa user. Endpoint áp dụng rate limit login hiện có.

Đổi mật khẩu thành công trả 204 và thu hồi toàn bộ learner/legacy sessions, vô hiệu token ResetPassword; frontend phải xóa bearer token và chuyển về đăng nhập. Không tự gửi mật khẩu hoặc token trong response/log. Không có migration mới cho API security.

Đây chưa bao gồm MFA, nâng quyền quản trị hoặc cảnh báo email khi đổi mật khẩu. Session hiện không lưu tên thiết bị/IP; không suy diễn các dữ liệu đó trên UI.

## Worker hết giờ

Migration 018 bổ sung finalization_retry_at và index deadline. Worker chạy khi LearnerApiEnabled và BetaServingEnabled đều bật. `Workers__QuizExpiryEnabled=false` tắt worker; mặc định true trong điều kiện trên.

Mỗi 30 giây lấy tối đa 50 quiz Active quá hạn thuộc tài khoản Active đã xác minh email. Dùng ILessonQuizzes.GetAsync để chấm từ đáp án đã lưu, ghi grade/progress/error notebook/telemetry cùng transaction. API và nhiều worker có thể chọn cùng lượt, nhưng khóa user/attempt và trạng thái Graded ngăn ghi hai grade.

Lượt lỗi được lùi retry 15 phút để không chặn các lượt phía sau. Log chỉ ghi mã lỗi chung, không nội dung câu hỏi/đáp án/tài khoản. Tài khoản Suspended/DeletionPending không được tự chấm cho tới khi chính sách xử lý được bổ sung hoặc được kích hoạt lại. Không tự xóa dữ liệu khi lỗi.

Worker thay thế hạn chế “chỉ finalize khi mở lại” của tài liệu LESSON_QUIZZES.md; GET/submit vẫn giữ chức năng finalize dự phòng. Worker không thực hiện thanh toán hay tự nâng publication tier.

Chưa chạy migration, test hoặc smoke API. Build chỉ xác nhận biên dịch. Cần kiểm chứng chạy nhiều worker, cancellation, lỗi dữ liệu và đổi mật khẩu đồng thời với đăng nhập trong đợt test sau.
