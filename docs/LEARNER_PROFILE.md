# Hồ sơ và onboarding

Migration: 012_learner_profiles.sql. API yêu cầu Features:LearnerApiEnabled và bearer session hợp lệ.

- GET /api/v1/me/profile trả tên, timezone, goal, selfLevel, minutesPerDay, studyDays, interests, trạng thái onboarding/skip placement và reminders.
- PUT cùng route nhận expectedRevision và toàn bộ dữ liệu cấu hình. Không nhận userId; server lấy từ session.
- Revision khởi đầu 0. Mỗi lần lưu tăng 1; revision cũ trả PROFILE_CONFLICT (409). Lưu từng bước onboarding bằng completeOnboarding=false; đánh dấu hoàn tất bằng true.
- completeOnboarding/skipPlacement chỉ ghi thời điểm đầu tiên, không xóa lại timestamp đã ghi.
- goal: general, reading, vocabulary, grammar. selfLevel: unknown, beginner, intermediate, advanced. Đây là tự đánh giá, không phải điểm/assessment đã đo.
- minutesPerDay: 5–180; studyDays: 0 (Chủ nhật) đến 6 (Thứ bảy), ít nhất một ngày. interests tối đa 10 mục, mỗi mục 80 ký tự.
- timezone dùng IANA hoặc UTC. Tên hiển thị 2–100 ký tự.
- reminders gồm email, inApp, minuteOfDay, quietStartMinute, quietEndMinute. Các phút tính từ 00:00 địa phương (0–1439).
- Mặc định không opt-in; giờ nhắc 08:00, quiet hours 21:00–08:00. Thay đổi consent từng kênh được ghi event trong cùng transaction.

## Phạm vi và ghi chú

- Đây là persistence/API cho preferences; chưa có scheduler gửi nhắc học. Consent nhắc học không phải consent marketing.
- Skip placement không ghi Measured, không gán band hoặc tự mở level.
- UI onboarding hiện có các mục tiêu tổng điểm; cần mapping rõ khi nối API. Backend này chưa mở mục tiêu thi theo profile chưa được phát hành.
- Chưa nối frontend onboarding/account trong mốc này; giữ nguyên những thay đổi giao diện đang làm riêng.
- Theo yêu cầu mới của người dùng: chỉ build để bắt lỗi compile; chưa chạy migration, test tự động hay smoke API.
