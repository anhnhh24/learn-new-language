# Cổng quản trị riêng

## Đường dẫn

- `/admin/login`: trang đăng nhập riêng, không nằm trong layout quản trị hoặc layout đăng nhập học viên.
- `/admin/overview`: tổng quan dữ liệu thật.
- `/admin/curriculum`, `/admin/items`, `/admin/blueprints`, `/admin/jobs`, `/admin/quarantine`: danh sách nội dung từ PostgreSQL.
- `/admin/users`, `/admin/support`, `/admin/audit`: danh sách người dùng, yêu cầu hỗ trợ và nhật ký.
- `/admin/quality`: chuyển về overview để giữ tương thích liên kết cũ.

Các route admin phải xác minh phiên bằng backend trước khi render nội dung. Nếu không có phiên, chuyển về admin/login; đăng nhập thành công quay lại đường dẫn admin đã yêu cầu. Lỗi mạng cho phép thử lại, không giả định đã đăng nhập. Link từ giao diện học viên dẫn đến admin/login, không dùng token học viên để mở console.

## Cấu hình

1. Áp dụng toàn bộ migration theo thứ tự, gồm `020_admin_sessions.sql`.
2. Cấu hình `ConnectionStrings__Postgres`.
3. Đặt `Features__AdminApiEnabled=true`. Cờ này mặc định false; có thể bật độc lập với LearnerApiEnabled.
4. Frontend dùng `VITE_API_BASE_URL` như các API hiện có. Backend chỉ cho các origin dev đã cấu hình; cấu hình origin triển khai trước khi dùng domain khác.

Migration 020 cũng là yêu cầu cho bản API tài khoản mới vì đổi/reset mật khẩu sẽ thu hồi admin sessions. Không triển khai API mới trước migration.

## Cấp quyền admin đầu tiên

Không có mật khẩu mặc định, email hardcode hoặc API đăng ký admin công khai. Sử dụng một tài khoản đã đăng ký, xác minh email và có status Active. Người vận hành DB đáng tin cậy cấp membership cho **đúng user ID đã xác nhận**:

```sql
-- Thay UUID bên dưới bằng ID tài khoản được tổ chức phê duyệt.
insert into identity_data.admin_accounts(user_id)
select id from identity_data.users
where id = '00000000-0000-0000-0000-000000000000'::uuid
  and status = 'Active' and email_verified_at is not null
on conflict(user_id) do nothing;
```

UUID zero chỉ là placeholder; câu lệnh không tự tạo user hoặc nâng quyền cho mọi tài khoản. Việc cấp quyền này chưa được chạy. Nếu membership đã bị tắt, INSERT không tự bật lại. Cần quyết định vận hành riêng để kích hoạt lại.

Để ngừng quyền, đặt enabled=false trong admin_accounts. Backend kiểm membership ở mỗi request nên phiên đang mở không tiếp tục dùng API được. Việc thay đổi trực tiếp membership phải được ghi nhận trong quy trình vận hành; chưa có UI cấp quyền hoặc audit tự động cho thao tác SQL thủ công.

## Tách xác thực

- POST `/api/v1/admin/auth/login` nhận email/password, dùng tài khoản chung nhưng chỉ chấp nhận membership admin đang enabled, user Active và đã xác minh email.
- GET `/api/v1/admin/auth/me` trả userId/displayName/role từ phiên đã kiểm phía server.
- POST `/api/v1/admin/auth/logout` thu hồi đúng admin session.
- Admin token có prefix riêng, random 256 bit, DB chỉ lưu SHA-256; thời hạn cố định 2 giờ. Scheme AdminSession và policy AdminOnly tách khỏi LearnerSession. Mọi endpoint `/api/v1/admin` trừ login bắt buộc policy này.
- Frontend chỉ lưu admin bearer trong sessionStorage với key riêng. Logout admin không xóa phiên học viên. Đổi/reset mật khẩu thu hồi cả admin và learner sessions.
- Không cấp quyền dựa vào role/user/token tự khai trong localStorage hoặc request body. Tài khoản học viên thông thường và bearer học viên bị từ chối ở admin API.
- Login giới hạn 5 lần/phút theo IP; tài khoản admin sai 5 lần bị khóa riêng 15 phút trong DB. Thông báo sai tài khoản/quyền/mật khẩu dùng cùng một nội dung. Login thành công ghi sự kiện audit không chứa password/token.

## Phạm vi dữ liệu hiện tại

Overview đếm tài khoản Active (bao gồm tài khoản có membership quản trị), khóa/bài Published, ticket Open/InProgress, form Active và source revision Quarantined. Không tự suy diễn hệ thống đang hoạt động tốt từ các số đếm này.

Danh sách phân trang mặc định 20, tối đa 50; user list không trả email, password hash hoặc token; audit list chỉ trả metadata sự kiện, không raw payload/safe_diff. Nội dung câu/key/provenance đầy đủ không được trả trong bảng ngân hàng câu hỏi. Các nguồn Part 7 được đếm theo source revision, không phải số câu con.

## Phần chưa hoàn tất

- Console có quản lý đề luyện tập tại `/admin/exams`: xem nội dung, ghép/xuất bản từ nguồn đã kiểm định và ngừng phát hành có audit (xem `ADMIN_EXAMS.md`, migration 022). Đã có biên tập/nhập JSON bản nháp Part 5 tại `/admin/question-drafts` (xem `QUESTION_AUTHORING.md`). Chưa có MFA, cấp/đổi role qua UI, editor Part 7, xử lý ticket, import tài liệu hàng loạt hoặc điều khiển generation worker/provider. Các trang cũ chứa thao tác/mock data không còn nằm trong route console mới.
- Trang import dẫn tới editor Part 5; chưa hỗ trợ PDF/Word hoặc nhập đề hàng loạt. Nguồn mới chỉ đạt cấu trúc, chưa tự động được xuất bản.
- Chưa có audit cho mọi lần đọc dữ liệu hoặc cho mọi thay đổi membership trực tiếp DB; không coi audit list là nhật ký đầy đủ mọi hành động.
- Trước khi mở rộng các thao tác đặc quyền cần bổ sung MFA/step-up và kiểm tra permission tương ứng. Phiên dùng bearer phía trình duyệt nên vẫn cần bảo vệ XSS, HTTPS và cấu hình triển khai phù hợp.
- Build .NET và TypeScript/Vite đã chạy. Không chạy test, migration hoặc smoke login theo yêu cầu hoãn test. Chưa xác minh trực quan trên trình duyệt. Frontend còn cảnh báo bundle lớn hơn 500 kB.
