# Cấu hình runtime

Không commit credential hoặc HMAC key. ASP.NET Core đọc các giá trị sau từ biến môi trường hoặc secret provider:

| Biến | Bắt buộc | Ý nghĩa |
|---|---:|---|
| `ConnectionStrings__Postgres` | Khi bật persistence | PostgreSQL connection string; cần Host, Database và Username. |
| `Database__RunMigrationsOnStartup` | Không | Mặc định `false`; khi `true`, API chạy migration có checksum trước khi nhận request. |
| `Analytics__PseudonymKeyBase64` | Trước khi mở Beta serving | Key HMAC SHA-256 dạng Base64, tối thiểu 32 byte. |

| `Features__BetaServingEnabled` | Không | Mặc định `false`; yêu cầu cả PostgreSQL và HMAC key khi bật. |
Tạo key phát triển bằng PowerShell và lưu vào user secret hoặc biến môi trường cục bộ:

```powershell
$bytes = [byte[]]::new(32)
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Các endpoint vận hành hiện có:

- `/health/live`: chỉ xác nhận process đang chạy.
- `/health/ready`: kiểm PostgreSQL bằng `select 1` khi persistence đã cấu hình.
- `/health`: endpoint tương thích hiện tại, chạy toàn bộ health check đã đăng ký.
- `/api/v1/status`: cho biết persistence, analytics pseudonym và Beta serving đang được cấu hình/bật hay chưa; không kiểm chứng credential.

Thanh toán vẫn ở `PendingIntegration`; chưa có biến provider, checkout hay webhook để cấu hình.
