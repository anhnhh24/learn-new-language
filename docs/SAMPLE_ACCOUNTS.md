# Danh sách tài khoản mẫu theo từng vai trò (Sample Accounts by Role)

Tài liệu này quy định và hướng dẫn sử dụng các tài khoản mẫu đại diện cho từng vai trò trong hệ thống luyện thi TOEIC Listening & Reading.

Mật khẩu dùng chung cho mọi tài khoản mẫu:
```text
ToeicMaster@2026!
```
*(Thỏa mãn chính sách bảo mật: tối thiểu 12 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt).*

---

## 1. Danh sách chi tiết các tài khoản mẫu

| STT | Vai trò (Role) | Họ và tên hiển thị | Email đăng nhập | Cổng truy cập | Phạm vi & Chức năng chính |
|:---:|---|---|---|---|---|
| **1** | **Learner (Học viên cơ bản)** | Nguyễn Văn Học | `learner@toeic.vn` | [Cổng học viên](/auth/login) → `/learn/today` | Luyện tập lộ trình Level A–B, làm bài kiểm tra quiz, luyện đề thi Part 5/7, ôn bộ thẻ Flashcards 3D và tra cứu Sổ lỗi sai. |
| **2** | **Learner (Mục tiêu 850+)** | Trần Thị Mai | `learner.advanced@toeic.vn` | [Cổng học viên](/auth/login) → `/learn/today` | Học viên chuyên sâu Level D, vượt qua Checkpoint C/D, luyện các dạng bài bẫy, Paraphrasing và đọc kép/ba phức hợp. |
| **3** | **SuperAdmin (Quản trị hệ thống)** | Quản Trị Viên Hệ Thống | `admin@toeic.vn` | [Cổng quản trị](/admin/login) → `/admin/overview` | Toàn quyền kiểm soát hệ thống: Quản lý người dùng, xem nhật ký kiểm toán (Audit Logs), theo dõi tác vụ ngầm (Worker Jobs) và tổng quan vận hành. |
| **4** | **ContentEditor (Biên tập viên / GV)** | Lê Hoàng | `editor@toeic.vn` | [Cổng quản trị](/admin/login) → `/admin/question-drafts` | Soạn thảo câu hỏi Part 5, biên soạn bài đọc hiểu Part 7, quản lý phiên bản ngân hàng đề thi và giáo trình. |
| **5** | **ContentReviewer (Kiểm định viên)** | Phạm Minh Thảo | `reviewer@toeic.vn` | [Cổng quản trị](/admin/login) → `/admin/quarantine` | Thẩm định độ chính xác đáp án, kiểm duyệt vùng cách ly (Quarantine), kiểm tra và nghiệm thu Blueprint đề thi. |
| **6** | **SupportStaff (Hỗ trợ học viên)** | Đỗ Thu Trang | `support@toeic.vn` | [Cổng quản trị](/admin/login) → `/admin/support` | Tiếp nhận và xử lý khiếu nại báo lỗi câu hỏi (FR-17), hỗ trợ tài khoản và giải đáp thắc mắc học viên. |

---

## 2. Tiện ích Đăng nhập nhanh trên Giao diện Web

Trên cả 2 trang đăng nhập:
1. **Trang đăng nhập Học viên (`/auth/login`)**:
   - Tích hợp hộp **"Tài khoản mẫu theo từng vai trò"** với 3 tab: *Tất cả*, *Học viên*, *Quản trị & GV*.
   - Cho phép nhấp **"Điền vào form"** để tự động điền Email và Mật khẩu.
   - Nhấp **"Đăng nhập ngay"** để chuyển thẳng vào bảng điều khiển của vai trò đó.
2. **Trang đăng nhập Quản trị (`/admin/login`)**:
   - Tích hợp sẵn bộ lọc các tài khoản nội bộ (`admin`, `editor`, `reviewer`, `support`).
   - Tự động nhận diện phiên quản trị độc lập (lưu tại `sessionStorage: toeic_admin_access_token`).

---

## 3. Đồng bộ Cơ sở dữ liệu PostgreSQL

Script seed dữ liệu tự động đã được đóng gói tại:
```text
db/025_seed_sample_role_accounts.sql
```

Nội dung script:
- Chèn người dùng vào `identity_data.users` với cờ `Active` và `email_verified_at`.
- Mã băm mật khẩu được tạo bằng chuẩn ASP.NET Core Identity `PasswordHasher<string>` (PBKDF2-HMAC-SHA256).
- Cấp quyền quản trị viên nội bộ vào `identity_data.admin_accounts` cho các tài khoản `admin`, `editor`, `reviewer`, `support`.
- Khởi tạo hồ sơ học tập chi tiết trong `learning.learner_profiles` cho các tài khoản học viên.
- Sử dụng cú pháp `ON CONFLICT (...) DO UPDATE` giúp an toàn khi chạy lại nhiều lần (idempotent).
