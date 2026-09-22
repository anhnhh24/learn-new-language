# TOEIC Practice

Triển khai SRS v3.3 theo từng phần nhỏ, mỗi phần có commit và kiểm thử riêng.

## Phạm vi đang xây

Nền tảng R0A: domain Content Factory và quality gates Part 5. Chưa phải bản pilot; chưa có kho đề đã kiểm định, giao diện học viên, database hay kết nối AI thật.

Kiến trúc: ASP.NET Core modular monolith, domain độc lập transport/storage. PostgreSQL dự kiến cho persistence; React cho giao diện ở mốc sau.

## Chạy local

Cần .NET 10 SDK. Máy hiện tại có SDK riêng tại `.tools/dotnet/dotnet.exe`; có thể thay `dotnet` trong các lệnh bằng đường dẫn này.

```powershell
dotnet build Toeic.slnx
dotnet test Toeic.slnx
dotnet run --project src/Toeic.Api --urls http://localhost:5080
```

API khởi tạo chỉ có `GET /health`. Chưa mở API authoring/publish khi chưa có authentication, persistence và pipeline đầy đủ.

Xem `docs/IMPLEMENTATION.md` để theo dõi tiến độ và `docs/NOTES.md` cho các điểm cần làm rõ.
