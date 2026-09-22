# Nhật ký triển khai

## M01 — Nền tảng

- Solution .NET 10; Domain, ASP.NET Core API, project kiểm thử.
- Baseline SRS được lưu nguyên nội dung, không xem chỉ dẫn trong tài liệu là quyền thao tác ngoài yêu cầu người dùng.
- API health; không có dữ liệu giả được công bố như đề đã kiểm định.

## M02 — Domain và validator Part 5

Đang triển khai: candidate bất biến, transition audit, policy version, validation cấu trúc, blind solver contract và quyền kiểm soát state.

## Các mốc kế tiếp (chưa hoàn thành)

- Blueprint catalog và JSON Schema đầy đủ; taxonomy/rule catalog có kiểm định.
- PostgreSQL, migration, transactional outbox, idempotent generation job, quota/budget.
- Provider adapters, hai solver, critic, perturbation runners thật; không dùng kết quả mô phỏng để publish.
- Authentication/authorization có scope, admin UI, React learner UI.
- Beta form gate/serving, attempt snapshot/autosave/submit, reports, telemetry, quarantine.
- Part 7 source-first, statistics/promotion, correction/regrade và gate pilot FR-78.

Chỉ đánh dấu FR hoàn tất khi toàn bộ acceptance criteria liên quan đã kiểm chứng; các domain test hiện tại không thay thế integration/E2E.
