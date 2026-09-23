# TOEIC Practice

Triển khai SRS v3.3 theo từng phần nhỏ, mỗi phần có commit và build verification riêng; test đang để ở backlog theo yêu cầu hiện tại.

## Phạm vi đang xây

Nền tảng R0A: Content Factory Part 5/Part 7, automated quality gates, Beta form/telemetry contracts và PostgreSQL foundation. Chưa phải bản pilot; chưa có kho đề đã kiểm định, giao diện học viên hoặc kết nối AI/provider thật.

Kiến trúc: ASP.NET Core modular monolith, domain độc lập transport/storage, PostgreSQL qua Npgsql; React ở mốc sau.

## Chạy local

Cần .NET 10 SDK. Máy hiện tại có SDK riêng tại `.tools/dotnet/dotnet.exe`; có thể thay `dotnet` trong các lệnh bằng đường dẫn này.

```powershell
dotnet build Toeic.slnx
dotnet run --project src/Toeic.Api --urls http://localhost:5080
```

Các route công khai hiện có: `/health`, `/health/live`, `/health/ready` và `/api/v1/status`. Chưa mở API authoring, learner hoặc publish khi authentication/repository chưa đầy đủ.

Test mới đang được hoãn theo yêu cầu; build vẫn là kiểm tra bắt buộc cho mỗi mốc.

Xem `docs/IMPLEMENTATION.md` để theo dõi tiến độ, `docs/CONFIGURATION.md` cho cấu hình runtime và `docs/NOTES.md` cho các điểm cần làm rõ.
