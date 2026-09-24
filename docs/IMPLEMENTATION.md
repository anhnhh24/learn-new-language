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

## M16 — Database migration foundation (hoàn tất runner)

- Infrastructure project có PostgreSQL migration runner đọc file theo thứ tự, kiểm tên và SHA-256.
- Advisory lock chặn nhiều instance migrate đồng thời; DDL và migration journal commit cùng transaction.
- File migration không tự mở/commit transaction để tránh khoảng trống giữa DDL và journal.
- Chưa chọn/cài PostgreSQL driver và chưa chạy vào database thật; repository mapping vẫn là việc tiếp theo.

## M17 — PostgreSQL runtime và privacy adapter (hoàn tất foundation)

- Npgsql 10.0.3 dùng một thread-safe data source/pool; connection string chỉ đến từ runtime configuration.
- Startup migration là opt-in, fail fast khi bật mà thiếu connection string; SQL được copy cùng API artifact.
- Scoped application transaction được dùng chung bởi repository; telemetry exposure/response/report đã có PostgreSQL adapter idempotent.
- Learner analytics dùng HMAC-SHA256 key tối thiểu 256 bit; key không nằm trong source/appsettings.
- Health live tách khỏi health ready; readiness kiểm PostgreSQL thật khi đã cấu hình.
- Attempt/form repositories, secret manager và key rotation vẫn chưa hoàn thành nên learner route tiếp tục đóng.

## M18 — Core PostgreSQL Repositories (hoàn tất)

- Triển khai `PostgresContentBlueprintRepository` đọc cấu hình `content.blueprint_versions`.
- Triển khai `PostgresGenerationJobStore` hỗ trợ atomic get-or-add bằng `insert ... on conflict`, xử lý lưu trạng thái job và ghi outbox message trong cùng transaction.
- Triển khai `PostgresIdempotencyStore` lưu và check key bằng `operations.idempotency_records`.
- Triển khai `PostgresFormStores` (`IFormVersionStore`, `IFormCandidateStore`) hỗ trợ lấy dữ liệu item kết hợp exposure count từ telemetry.
- Bổ sung pattern "trusted reconstitution" trong Domain để khôi phục AggregateRoot từ CSDL (như `GenerationJob.Reconstitute` và dùng internal constructor access).

## M19 — Guarded Part 5 Beta materialization (hoàn tất backend reader)

- Form lưu exam profile và attempt duration trong immutable snapshot hash, không lấy hằng số ẩn từ Infrastructure.
- Reader khóa form bằng PostgreSQL shared row lock trong transaction tạo attempt.
- Trước khi materialize, reader kiểm form Active, item tier/state, family và content hash; learner snapshot loại justification/provenance.
- Question order là duy nhất toàn form, không reset theo item.
- Beta serving mặc định tắt; startup fail fast nếu bật mà thiếu PostgreSQL hoặc HMAC key.
- Part 7 serving tiếp tục đóng cho tới khi chốt mapping group revision sang từng question revision.


## M20 — Durable outbox lease (hoàn tất persistence/dispatcher contract)

- Claim dùng một câu lệnh CTE update với `FOR UPDATE SKIP LOCKED`, gắn lease ID và expiry trước khi commit.
- Handler chạy ngoài database transaction; mark/retry/dead-letter chạy trong transaction ngắn và chỉ lease owner được cập nhật.
- Lease hết hạn cho phép worker khác thu hồi event; stale worker không thể ghi đè kết quả mới.
- Payload hash được kiểm trước handler; payload sai bị dead-letter với safe error code.
- Retry lưu attempts, next retry và last error code; lỗi thiếu handler hoặc quá số lần retry được dead-letter.

## M21 — Toeic.Web React + TypeScript Frontend (hoàn tất bộ giao diện theo UI_GUIDE và SRS v3.3)

- Khởi tạo kiến trúc Vite + React 18 + TypeScript strict mode, Scoped CSS Modules và hệ thống Semantic Design Tokens (tokens.css, reset.css, global.css).
- Tuân thủ nghiêm ngặt định hướng thẩm mỹ "Editorial - Calm - Distinctive": nền sáng ngà (#f7f7f4), màu thương hiệu teal trầm (#176b63), tỷ lệ tương phản cao WCAG 2.2 AA; không dùng gradient tím/xanh phát sáng toàn màn hình hay glassmorphism lạm dụng.
- Hoàn thiện đầy đủ các màn hình được đặc tả trong SRS Mục 6.2 và README:
  - UI-01: Catalog khóa học và Chi tiết khóa học (/learn/courses, /learn/courses/:id).
  - UI-02: Đăng nhập, Đăng ký, Xác minh Email và Quên mật khẩu an toàn (/auth/login, /auth/register, /auth/verify-email, /auth/forgot-password).
  - UI-03: Onboarding khảo sát mục tiêu và Bài chẩn đoán định hướng 24 câu (/auth/onboarding, /auth/placement).
  - UI-04: Màn hình Hôm nay (/learn/today) với thẻ hành động chính tiếp theo, hàng đợi ôn tập đến hạn, không áp lực streak tiêu cực.
  - UI-05: Lộ trình học tập (/learn/roadmap) theo tuần và theo module kiến thức.
  - UI-06: Bài học đa phương tiện (/learn/lesson/:id) hỗ trợ đọc dạng trang, đánh dấu đã đọc, audio có điều khiển tốc độ và transcript (ghi nhận Assisted), interactive mini-check với phản hồi tức thì.
  - UI-07: Chuyên biệt Luyện tập Ngữ pháp & Từ vựng Mini-Drill (/learn/quiz/:quizId) với phản hồi tức thì từng câu, hiển thị giải thích chi tiết, 1-click lưu sổ lỗi sai / tạo thẻ flashcard / báo lỗi câu hỏi, và tổng kết chỉ báo thành thạo theo Primary Tag (BR-LEARN-02).
  - UI-08: Sổ lỗi sai (/learn/errors) lọc theo tag, trạng thái Open/Improving/Resolved/Ignored, luyện câu tương đương.
  - UI-09: Ôn tập Flashcard (/learn/flashcards) theo thuật toán lặp ngắt quãng Spaced Repetition (Quên / Khó / Nhớ / Dễ).
  - UI-10: Phòng thi TOEIC (/learn/practice/:attemptId) tập trung, đồng bộ server deadline countdown, autosave state machine (Debounce + ACK timestamp), lưu draft cục bộ khi mất kết nối mạng, hiển thị bài đọc Part 7 chia đôi màn hình (stimulus + questions) và lưới điều hướng 1-100 câu.
  - UI-11: Kết quả thi TOEIC (/learn/practice/:attemptId/result) với điểm thô (raw score), thời gian làm, phân tích theo Part/Tag, xem lại từng câu kèm bằng chứng trích xuất từ bài đọc và ghi chú tier rõ ràng.
  - UI-13: Thống kê & Dashboard (/learn/dashboard) tỷ lệ hoàn thành, độ chính xác quiz lần đầu, chỉ báo kiến thức có giải thích thiếu dữ liệu.
  - UI-14: Tài khoản & Quyền riêng tư (/learn/account) quản lý giờ yên tĩnh (21:00 - 08:00), yêu cầu xuất dữ liệu (export 24h) và hủy tài khoản (7-day window) theo FR-16/18.
  - UI-15: CMS Chương trình đào tạo (/admin/curriculum) hỗ trợ kiểm soát chu trình tiên quyết (AC-33), Ngân hàng câu hỏi (/admin/items) với chỉ số phân biệt D-score và ngưỡng mẫu (FR-36), Cổng nạp đề đa nguồn (/admin/import) hỗ trợ kiểm tra media đính kèm và atomic commit draft (FR-34), cùng Quality Dashboard & Console quản trị Controlled AI Item Factory (/admin/quality, /admin/jobs, /admin/quarantine, /admin/blueprints).
  - UI-17: Thanh toán & Quản lý Quyền học (/learn/billing/checkout/:courseId, /learn/billing/orders/:orderId, /learn/billing/history) với lựa chọn phương thức thanh toán VietQR / Napas / Thẻ / MoMo, đếm ngược giữ lệnh 30 phút, đối soát ngân hàng tự động, hiển thị thời hạn quyền học 180 ngày và luồng yêu cầu hoàn tiền trong 7 ngày theo chuẩn FR-39/40/41/42.
  - UI-18: Quản trị Vận hành, Quản lý Người dùng & Nhật ký Kiểm toán bất biến (/admin/users, /admin/audit) với xác thực 2 lớp MFA khi cấp role đặc quyền (FR-38), tạm khóa tài khoản có lý do bắt buộc và truy vết trước/sau (before/after state diff).
- Tầng API client (src/lib/api/) hỗ trợ kết nối VITE_API_BASE_URL với fallback mock fixtures chuẩn nghiệp vụ SRS phục vụ kiểm thử giao diện độc lập.

## M22 — Part 7 question-node persistence và beta materialization (hoàn tất backend)

- Migration 003_question_nodes.sql tách source revision của cả passage/group khỏi ID ổn định của từng câu; dữ liệu Part 5 cũ được backfill không đổi ID.
- Form composition lấy đúng số question node theo thứ tự trong group; exposure, response, report, statistics và quarantine đều tham chiếu ID từng câu.
- Reader kiểm source state, family và content hash, rồi ánh xạ stable_id sang đúng câu Part 7; attempt snapshot lưu passage ở Stimulus và không phát rationale/provenance.
- Quarantine một question node khóa source group và chuyển mọi form Active chứa câu đó sang Degraded.
- Writer PostgreSQL từ chối ID trùng, stable ID trùng sau normalize và thứ tự không liên tục; caller phải lưu source revision và nodes trong cùng application transaction.

## M23 — Privileged content audit writer (hoàn tất write path)

- Audit event lưu actor ID/type, action, target, reason, safe diff, correlation ID và timestamp; migration bổ sung actor type cho dữ liệu cũ.
- Generation job mới, form activation và auto-quarantine ghi audit trong cùng PostgreSQL transaction với thay đổi nghiệp vụ.
- Quarantine decision lưu chính xác danh sách form bị ảnh hưởng thay vì giá trị rỗng mặc định; audit dùng cùng snapshot ID làm correlation.
- Safe diff chỉ chứa metadata vận hành đã chọn, không lưu prompt, đáp án, thông tin learner hoặc secret.
- Read API, permission quality.view, retention/purge job và export audit vẫn là phần tiếp theo.

## M24 — Versioned TOEIC Reading curriculum và 31-week roadmap (hoàn tất DB/seed)

- Schema version hóa course, level, knowledge topic, lesson/page/block, prerequisite, placement rule và roadmap activity; enrollment giữ nguyên course snapshot.
- Seed Published gồm 40 chủ điểm A1–D11, 40 learning guide, 44 lesson, 84 trang, 288 block, 31 tuần và 122 hoạt động.
- Mỗi concept lesson có công thức/pattern, core rule, ví dụ phân tích, quy trình áp dụng, bẫy, phần mở rộng và self-check dưới dạng JSON có cấu trúc.
- Quiz dưới 80% gắn NeedsReview nhưng không khóa completion; checkpoint mới sinh remediation tối đa hai tag yếu và lịch retry.
- Khóa được ghi đúng phạm vi Reading/Part 5–6, không cam kết tổng điểm TOEIC; placement chỉ gợi ý điểm bắt đầu và không tự đưa learner vào D.
- Migration 001–006 đã được áp dụng thành công từ database trống trên PostgreSQL 16; count/invariant của curriculum đã được truy vấn sau migrate.

## M25 — Tái cấu trúc Lộ trình thành Hệ thống phân hệ kiến thức (Knowledge Architecture & Mastery Map)

- **Định hướng nghiệp vụ:** Loại bỏ cách trình bày theo lịch 31 tuần cứng nhắc; chuyển đổi hoàn toàn sang mô hình **Hệ thống phân hệ kiến thức chuẩn hóa (Knowledge Architecture)** gồm 4 phân hệ lớn và 40 chuyên đề cốt lõi:
  - **Phần 1: Cấu trúc câu & 4 từ loại cốt lõi** *(Level A — 9 chuyên đề: A1–A9)*: Nhận diện 4 từ loại, cấu trúc câu S–V–O, các thì cơ bản, mạo từ và danh từ đếm được/không đếm được. Kết thúc bằng bài kiểm định **Checkpoint A** (25 câu, ngưỡng chuẩn hóa 70%).
  - **Phần 2: Hệ thống các thì & Mệnh đề liên kết** *(Level B — 10 chuyên đề: B1–B10)*: Thì hoàn thành, thể bị động, câu điều kiện loại 0-1-2, động từ khuyết thiếu, danh động từ, mệnh đề quan hệ và liên từ kết hợp. Kết thúc bằng bài kiểm định **Checkpoint B** (40 câu, ngưỡng chuẩn hóa 70%).
  - **Phần 3: Cấu trúc nâng cao & Điểm ngữ pháp phức** *(Level C — 10 chuyên đề: C1–C10)*: Đảo ngữ trạng từ phủ định, cụm phân từ rút gọn, câu giả định, cấu trúc song song, mệnh đề danh từ và câu chẻ nhấn mạnh. Kết thúc bằng bài kiểm định **Checkpoint C** (40 câu, ngưỡng chuẩn hóa 75%).
  - **Phần 4: Độ chính xác chuyên sâu & Né bẫy Part 5/6** *(Level D — 11 chuyên đề: D1–D11)*: Word form khó, collocation công sở, văn phong thương mại, liên từ chuyển tiếp đoạn Part 6 và chiến lược né bẫy đề thi. Kết thúc bằng bài kiểm định **Checkpoint D Tốt nghiệp** (46 câu, ngưỡng chuẩn hóa 85%).
- **Giao diện & Trải nghiệm người dùng:**
  - Trang `/learn/roadmap` được tái thiết kế thành Bản đồ hệ thống kiến thức (Knowledge Map) phong cách TOTC hiện đại: Hero banner tóm tắt 4 phân hệ/40 chuyên đề/4 Checkpoint, ô tìm kiếm chuyên đề/công thức/từ khóa tức thì, bộ lọc tab theo phân hệ (Phần 1 đến Phần 4) và danh mục (Ngữ pháp, Từ vựng, Chiến thuật).
  - Mỗi thẻ chuyên đề hiển thị mã bài nổi bật (`A1`..`D11`), tiêu đề song ngữ, tóm tắt cốt lõi, hộp trọng tâm ghi nhớ 2 quy tắc vàng, hộp cảnh báo bẫy thi Part 5/6 và 2 nút hành động trực tiếp: "Học lý thuyết" (mở `/learn/lesson/:id`) và "Luyện bài tập" (mở `/learn/quiz/:quizId`).
  - Mỗi phân hệ tích hợp mốc kiểm định chuẩn hóa độc lập (Checkpoint Card) với thông số câu hỏi, thời gian và ngưỡng đạt.
  - Đồng bộ thanh điều hướng `LearnerLayout` (`Hệ thống kiến thức`), nút quay lại trong `LessonPage` và thẻ khóa học trong `TodayPage`.
- **Cơ sở dữ liệu & Persistence:**
  - Bổ sung migration `db/009_update_curriculum_knowledge_system.sql` cập nhật các bảng `learning.course_versions`, `learning.curriculum_levels`, `learning.course_modules` đồng bộ với cấu trúc phân hệ kiến thức mới.
  - Đồng bộ `curriculumData.ts` ở Frontend phản ánh chính xác cấu trúc phân hệ từ Database.

## Các mốc kế tiếp (chưa hoàn thành)
1. Generation Worker và provider adapters thật; persistence cho invocation, quality run và cost.
2. Operations quality dashboard và công cụ kiểm soát quarantine.
3. Password/email/MFA, auth endpoints và secret manager.
4. Curriculum repository/API, plan materializer, question bank quiz; CMS write path và import DOCX/PDF.
5. Notification, data export/delete, observability và backup/restore.
6. Test backlog đã hoãn: domain, integration concurrency, contract, E2E và release gates.

Các actor trong domain phải do authentication/worker tin cậy cung cấp khi tích hợp, không nhận từ request body. Chưa có persistence/concurrency control, provider invocation thật hoặc chữ ký invocation. Không đánh dấu toàn bộ P0/R0A hoặc FR-79–90 hoàn tất.
