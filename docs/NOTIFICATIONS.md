# Thông báo trong ứng dụng

Migration 019 tạo hộp thông báo riêng cho học viên. API bearer session:

- GET `/api/v1/me/notifications?page=1&pageSize=20&unreadOnly=false`: danh sách mới nhất trước, tối đa 50/trang, có hasMore.
- GET `/api/v1/me/notifications/unread-count`: `{count}`.
- PUT `/api/v1/me/notifications/{id}/read`: 204, đánh dấu đã đọc idempotent; không sở hữu trả 404.

Response no-store. Không nhận learnerId từ client. TargetPath do server đặt cố định `/learn/today`, không nhận URL chuyển hướng tùy ý.

## Nhắc học

Khi LearnerApiEnabled bật, StudyReminderWorker mặc định hoạt động. Có thể tắt bằng `Workers__StudyRemindersEnabled=false`. Migration 019 cần được áp dụng trước khi chạy phiên bản này.

Worker mỗi phút chọn tối đa 500 tài khoản Active, xác minh email và `in_app_reminders=true`. Chỉ nhắc vào study_days (0=Chủ nhật), sau reminder_minute theo timezone hồ sơ và ngoài quiet hours. Hỗ trợ quiet hours qua nửa đêm. Không gửi bù những ngày cũ khi worker dừng; trong cùng ngày có thể nhắc muộn hơn giờ đặt sau khi worker khởi động lại hoặc qua giờ yên tĩnh.

Unique learner/kind/ngày địa phương chống tạo trùng khi nhiều instance, restart hoặc DST lặp giờ. Đổi múi giờ có thể tạo nhắc cho một ngày địa phương khác; không phải giới hạn 24 giờ trượt. Opt-out ngăn thông báo mới, không xóa thông báo đã tạo.

Không ghi khẳng định “bạn chưa học hôm nay” vì hệ thống chưa đo đầy đủ hoạt động đọc. Đây là lịch nhắc do người học chọn, không phải cảnh báo hoặc streak phạt.

Email reminder, push/browser notification và UI hộp thông báo chưa được nối; email_reminders trong hồ sơ vẫn là preference, chưa gửi email nhắc học. Không dùng account verification outbox để gửi nội dung nhắc học.

Chưa chạy test/migration/smoke API. Build chỉ kiểm tra biên dịch; cần xác minh PostgreSQL, timezone, quiet hours, opt-out race và nhiều worker ở đợt test sau.
