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

## M03 — Blueprint và generation job domain (hoàn tất phần domain)

- `ContentBlueprintVersion` chứa profile, Part, taxonomy/constraint, quota, budget, route và policy version.
- Blueprint chỉ dùng để sinh câu sau khi Admin publish; archive chặn job mới, phiên bản cũ vẫn giữ để audit.
- Quota Part 5 bị giới hạn tối đa 10 candidate/job; budget reserve tính theo quota yêu cầu trước khi provider chạy.
- `GenerationJob` giữ input hash, idempotency scope/key, route, reservation, checkpoint tăng đơn điệu, transition và domain event.
- Kill switch chặn `Start`; timeout chưa rõ chi phí chuyển sang `AwaitingCostReconciliation`.
- Mới có repository/budget interface. Transactional outbox, unique constraint và tranh chấp budget đồng thời cần làm ở Infrastructure.

Theo yêu cầu ngày 2026-09-23, phần test mới được hoãn. M03 chỉ chạy build để bắt lỗi biên dịch; test chi tiết và integration test sẽ bổ sung sau.

## M04 — Attempt lifecycle (hoàn tất phần domain)

- Immutable question snapshot; lease thiết bị; autosave theo revision/operation ID; deadline server.
- Submit receipt idempotent và chấm objective raw score, không nhận score từ client.

## M05 — Learning loop (hoàn tất phần domain)

- Enrollment, page progress, completion tách NeedsReview, error notebook và flashcard schedule v1.
- Review event dedupe; early review không farm lịch; error evidence cũ bị chặn.

## M06 — Billing chuẩn bị trước (domain hoàn tất, tích hợp pending)

- Product/order/payment/refund/entitlement/quota ledger và adapter contract.
- Commerce mặc định `PendingIntegration`; chưa có checkout/webhook route hoặc provider credential.

## M07 — Persistence baseline và status (hoàn tất baseline)

- PostgreSQL DDL cho identity, content factory, attempts, learning, billing, idempotency, outbox và audit.
- `/api/v1/status` công khai trạng thái trung thực; commerce pending, chưa có official score/expert tier.

## M08 — Identity/scope (hoàn tất phần domain)

- Account, one-time token, session revoke, onboarding profile và permission mặc định deny.
- Password hashing, email provider, rate limit, MFA và auth API còn ở application/infrastructure.

## M09 — Application orchestration (hoàn tất contracts/coordinator)

- Atomic get-or-add generation job trước budget reservation; replay khác input bị conflict.
- Transaction boundary và outbox writer bắt buộc; dispatcher có exponential backoff/dead-letter.

## M10 — API pipeline (hoàn tất baseline)

- Correlation ID được lọc, security headers và error JSON an toàn, không trả stack/vendor error.
- Chưa mở endpoint dữ liệu khi authentication/persistence chưa hoàn chỉnh.

## M11 — Part 7 source-first (hoàn tất validator cấu trúc)

- Stimulus version bất biến, source hash, evidence offset/quote và key/options theo group 2–5 câu.
- Chưa có generator/solver/critic semantic thật nên chưa câu nào được lên Beta.

## M12 — Automated quality gates (hoàn tất contracts/orchestration)

- Hai solver nhận blind input và chạy độc lập; consensus kiểm invocation, hash, policy và route.
- Critic, perturbation, similarity và rights gate chạy song song sau consensus; finding Blocking làm reject.
- Feature flag tắt giữ candidate ở AutoValidated nội bộ, không tự đẩy ra Beta.

## M13 — Telemetry và statistical promotion (hoàn tất domain policy)

- Exposure, response, valid flag, form context và learner report dùng pseudonym thay định danh trực tiếp.
- Policy version hóa: point-biserial âm sau N >= 100 hoặc report threshold làm quarantine; N >= 300, discrimination đạt và không còn report mới xét DataValidatedPractice.
- Threshold là cấu hình sản phẩm khởi điểm, chưa phải psychometric validation hoặc chuẩn ETS.

## M14 — Beta form composition (hoàn tất domain/application contracts)

- Form gate kiểm tier, policy, rights reference, coverage, exposure, family collision/family lock và quota.
- Group Part 7 được giữ nguyên khối nhưng snapshot vẫn ánh xạ từng question revision cho telemetry.
- Form snapshot bất biến; item quarantine chuyển form Active sang Degraded trong cùng transaction contract.

## M15 — Beta serving và learner report (hoàn tất application contracts)

- Start attempt chỉ dùng form Active, kiểm Beta kill switch trong transaction và có receipt idempotency.
- Attempt giữ snapshot/key nội bộ; response start chỉ trả tier, nhãn learner, form và deadline.
- Ghi exposure theo từng question; report chỉ nhận category allowlist và item thực sự thuộc attempt của learner.
- Chưa mở route công khai cho tới khi auth, repository, locking và pseudonymizer HMAC được nối thật.

## Các mốc kế tiếp (chưa hoàn thành)

1. Repository mapping, migration runner, password/email/MFA và auth endpoints.
2. Generation Worker và provider adapters thật; persistence cho invocation, quality run và cost.
3. Repository/locking cho form, attempt, telemetry, quarantine; Operations quality dashboard.
4. Course/lesson CMS, import DOCX/PDF text và learner APIs cho Learning/Assessment.
5. React learner/admin UI, notification, data export/delete, observability và backup/restore.
6. Test backlog đã hoãn: domain, integration concurrency, contract, E2E và release gates.

Các actor trong domain phải do authentication/worker tin cậy cung cấp khi tích hợp, không nhận từ request body. Chưa có persistence/concurrency control, provider invocation thật hoặc chữ ký invocation. Không đánh dấu toàn bộ P0/R0A hoặc FR-79–90 hoàn tất.
