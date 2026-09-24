# Luồng tài khoản học viên

## Đã triển khai

- Đăng ký: tên 2–100 ký tự, email hợp lệ, password 12–128 ký tự, termsAccepted bắt buộc. Lưu phiên bản điều khoản do server cấu hình.
- User mới PendingVerification; không tự gán verified hoặc cấp phiên.
- Xác minh email 24 giờ, reset mật khẩu 30 phút; token ngẫu nhiên 256 bit, hash SHA-256 trong DB, dùng một lần dưới transaction.
- Reset thu hồi learner sessions và legacy sessions; tài khoản suspended/deletion-pending không được kích hoạt lại bằng token.
- Login dùng ASP.NET Core Identity PasswordHasher, chỉ Active + verified, sai 5 lần khóa 15 phút. Phiên bearer 8 giờ, kiểm trạng thái và thu hồi qua DB.
- Register/resend/forgot trả cùng 202 cho địa chỉ tồn tại/không tồn tại đủ điều kiện; không tiết lộ token hoặc trạng thái tài khoản.
- Giới hạn auth 10 request/phút/IP/process; gửi email tối thiểu cách 1 phút, tối đa 3 token/giờ/user/purpose trong DB.
- Email outbox ghi cùng transaction với token; payload chứa token mã hóa bằng Data Protection. Worker claim SKIP LOCKED, lease 2 phút, timeout 25 giây, tối đa 5 lần thử; xóa payload sau gửi/hết hạn/thất bại cuối.
- Retry SMTP có thể gửi trùng liên kết khi đã gửi nhưng chưa ghi ACK vào DB; token vẫn chỉ dùng một lần.
- Frontend nối API thật; bỏ offline fallback tự cấp token và thông báo gửi email mô phỏng.

## HTTP contract

Các route dưới /api/v1/auth, body JSON. Link email dùng fragment URL frontend; frontend xóa fragment rồi gửi token qua POST khi người dùng xác nhận, không consume bằng GET.

| Route | Body | Kết quả |
|---|---|---|
| POST /register | displayName, email, password, termsAccepted | 202 Accepted, không có accessToken |
| POST /resend-verification | email | 202 |
| POST /verify-email | token | 204 |
| POST /forgot-password | email | 202 |
| POST /reset-password | token, password | 204 |
| POST /login | email, password | accessToken, expiresAt, tokenType |
| GET /me | Bearer header | userId, displayName |
| POST /logout | Bearer header | 204 |

Token sai/hết hạn/đã dùng trả ACCOUNT_TOKEN_INVALID (422). Chưa có mail config: ACCOUNT_MAIL_UNAVAILABLE (503) trước khi tạo user. Vượt rate limit: 429.

## Cấu hình

Áp dụng migration theo thứ tự, bao gồm 008 và 011. Không sửa checksum migration đã chạy.

| Biến | Ý nghĩa |
|---|---|
| Features__LearnerApiEnabled | true để bật auth/learner endpoints |
| ConnectionStrings__Postgres | Connection string từ secret store |
| AccountMail__Mode | Disabled (mặc định), Smtp, DevelopmentFile |
| AccountMail__PublicWebUrl | Frontend URL tin cậy; HTTPS ngoài Development |
| AccountMail__TermsVersion | Mặc định pilot-v1 |
| AccountMail__SmtpHost / SmtpPort | SMTP STARTTLS, mặc định cổng 587 |
| AccountMail__From | Địa chỉ gửi được provider xác nhận |
| AccountMail__SmtpUser / SmtpPassword | Credential từ secret store |
| AccountMail__DevelopmentDirectory | Thư mục nhận .eml; chỉ trong ASPNETCORE_ENVIRONMENT=Development |
| AccountMail__DataProtectionKeyDirectory | Key ring bền vững, chia sẻ giữa instances |

Key ring phải giữ qua restart/deploy, hạn chế quyền filesystem và bảo vệ tại rest theo hosting. Mất key khiến email đang chờ không giải mã được; cần yêu cầu link mới. Không commit key, file .eml hoặc credential.

SMTP thật chưa cấu hình/xác minh trong phiên này. Kiểm chứng dùng DevelopmentFile và PostgreSQL tạm, không gửi email thật.

## Kiểm chứng và việc còn lại

- Backend Release build sạch; frontend build thành công (còn cảnh báo bundle lớn).
- API local: register 202; login trước verify 401; verify thành công; replay 422; login thành công; reset thành công; phiên/mật khẩu cũ 401; mật khẩu mới thành công; replay reset 422.
- Test tự động vẫn hoãn theo yêu cầu; smoke không thay thế nghiệm thu production.
- Trước triển khai thật: SMTP, TLS/reverse proxy tin cậy, key ring bền vững, giám sát mail outbox failed và limiter phân tán khi scale.
- Chưa có MFA/staff roles, đăng nhập xã hội, đổi email, refresh token. Đây là luồng learner, không cấp quyền admin.
- User do phiên bản register cũ tự gán Active/verified cần audit nguồn xác minh trước pilot; không tự sửa/xóa tài khoản hiện có.
- Client ngoài web phải chuyển từ contract register 201 + session sang 202 + pending verification.
- Thanh toán vẫn pending; không coi mốc này là hoàn thành quiz bank, CMS/import hoặc worker tạo đề.