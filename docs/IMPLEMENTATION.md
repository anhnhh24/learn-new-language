# Nhật ký triển khai

## M00 — Baseline (hoàn tất)

- Commit `b96e841`: SRS v3.3, README, quy ước Git, quyết định kỹ thuật và điểm cần làm rõ.
- SRS giữ nguyên nội dung; chỉ dẫn trong tài liệu không được xem là quyền thao tác ngoài yêu cầu người dùng.

## M01 — Khung dự án (hoàn tất)

- Solution .NET 10.0.401: Domain, ASP.NET Core API và MSTest.
- Endpoint `GET /health`; chưa mở API nghiệp vụ.
- SDK riêng tại `.tools/dotnet`, đã kiểm SHA-512; không commit SDK.

## M02 — Phần đầu quality pipeline Part 5 (hoàn tất trong phạm vi dưới đây)

- Candidate content bất biến; ID/hash riêng; sửa tạo revision mới không kế thừa history/state.
- Chuyển `Generated -> StructuralValid -> CrossModelValid`; reject khi structural/consensus fail.
- Quarantine/archive có kiểm tra actor và reason; mỗi transition lưu revision, policy, actor, timestamp.
- JSON contract và parser nghiêm ngặt: không field lạ/thiếu/null, duplicate property, payload quá lớn.
- Validator: bốn options, một key hợp lệ, normalization, blank, rule, derivation, justification, metadata provenance/version, family collision chính xác.
- Blind solver DTO không chứa key/rationale/provenance; kiểm tra invocation, revision, input hash, policy và không majority override.
- Policy prerequisite cho provider diversity, tier được hỗ trợ và nhãn Beta/DataValidated. Không có lệnh publish hoặc nâng Expert.

### Kiểm chứng ngày 2026-09-23

- `dotnet build Toeic.slnx`: thành công, 0 warning, 0 error.
- `dotnet test Toeic.slnx`: 46/46 passed (có build lại phần thay đổi trước test).
- Smoke API local: `GET /health` trả HTTP 200 `Healthy`; đã dừng process sau kiểm tra.
- TC-73, TC-75, TC-76, TC-79, TC-80 được kiểm ở mức domain/DTO; chưa coi là nghiệm thu E2E của FR.
- Fixture chỉ dùng kiểm thử kỹ thuật; chưa kiểm định học thuật, không dùng cho learner.

## Các mốc kế tiếp (chưa hoàn thành)

1. Blueprint catalog/schema đầy đủ và taxonomy/grammar rule catalog; bind provenance từ server.
2. PostgreSQL, migration, transactional outbox, generation job idempotent, quota/budget.
3. Provider adapters, hai solver, critic, perturbation, semantic similarity và rights gates thực tế.
4. Authentication/authorization có scope, admin UI và React learner UI.
5. Beta form gate/serving, attempt snapshot/autosave/submit, reports, telemetry và quarantine xuyên form.
6. Part 7 source-first, statistics/promotion, correction/regrade và gate pilot FR-78.

Các state sau CrossModelValid hiện chỉ có tên enum; chưa có transition. Các actor trong domain phải do authentication/worker tin cậy cung cấp khi tích hợp, không nhận từ request body. Chưa có persistence/concurrency control hay chữ ký invocation. Không đánh dấu toàn bộ P0/R0A hoặc FR-79–90 hoàn tất.
