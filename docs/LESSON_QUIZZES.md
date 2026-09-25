# Backend quiz bài học và checkpoint

## Phạm vi đã code

Lượt làm gắn với **lesson version trong khóa học đã đăng ký**. Backend tạo snapshot từ form đã qua cơ chế Beta serving hiện có; không lấy câu hoặc đáp án do client gửi làm chuẩn chấm. Hỗ trợ bắt đầu, mở lại, lưu từng đáp án, nộp/chấm, lịch sử và cập nhật tiến độ bài học trong transaction.

Đây chưa phải toàn bộ module luyện thi, chẩn đoán đầu vào hoặc CMS ngân hàng câu hỏi. Chưa nối frontend. Không tạo câu hỏi mẫu để giả lập ngân hàng thật.

## Điều kiện sử dụng

- Áp dụng migration `015_lesson_quizzes.sql` sau các migration trước đó.
- Bật `Features:LearnerApiEnabled` và `Features:BetaServingEnabled`; cấu hình PostgreSQL và `Analytics:PseudonymKeyBase64`. Nếu Beta serving tắt, các route quiz không được map.
- Có form Active hợp lệ từ quality pipeline, tier BetaPractice/DataValidatedPractice, snapshot đúng số câu của bài và mỗi câu một đáp án, một điểm.
- Gắn form vào `learning.lesson_quiz_forms`. Mỗi lesson version có một form hiện hành, mỗi form gắn tối đa một lesson. Việc gắn phải do luồng quản trị đáng tin cậy thực hiện; chưa có API CMS cho bước này.
- Người học có tài khoản Active đã xác minh email, enrollment Active/Completed; khóa và bài đang Published. Với khóa trả phí, kiểm tra entitlement lúc bắt đầu. Thanh toán vẫn pending.
- Khi chưa có mapping, start trả `QUIZ_NOT_READY`. Không được gán form Draft, fixture hoặc bỏ qua quality gate để làm endpoint chạy được.

Mapping cần được người biên tập xác nhận phù hợp chủ điểm; số câu đúng chưa đủ chứng minh phủ kiến thức. Migration này không seed mapping hay công bố câu hỏi mới.

## API

Prefix `/api/v1/me`, bearer session, `Cache-Control: no-store`.

| Method | Path | Request |
| --- | --- | --- |
| POST | `/lessons/{lessonId}/quiz-attempts` | `{ "clientOperationId": "uuid" }` |
| GET | `/lessons/{lessonId}/quiz-attempts?page=1&pageSize=20` | Lịch sử; pageSize tối đa 50 |
| GET | `/quiz-attempts/{attemptId}` | Snapshot an toàn, đáp án đã lưu, revision và kết quả nếu đã chấm |
| PUT | `/quiz-attempts/{attemptId}/answer` | clientOperationId, expectedRevision, questionId, optionId |
| POST | `/quiz-attempts/{attemptId}/submit` | clientOperationId, expectedRevision |

`optionId: null` bỏ chọn đáp án. Chỉ chấp nhận ID câu và option thuộc snapshot; mỗi lần lưu tăng revision một lần. Client phải chờ ACK rồi dùng revision mới cho thao tác tiếp theo. Không gửi correctness, điểm hoặc thời gian do client tính để chấm.

Khi start thành công, lưu attemptId để tiếp tục sau reload. Retry start cùng operation và lesson trả **cùng attempt, trạng thái hiện tại**. Operation đã dùng cho lesson khác trả 409. Không mở lượt mới khi lượt cũ còn Active; tra history và GET lượt đang mở trước. Tối đa 30 lượt mới mỗi giờ mỗi tài khoản.

Lưu đáp án và nộp bài có biên nhận bền vững. Retry nguyên request với cùng operation trả kết quả cũ kể cả sau khi đã chấm. Đổi payload với operation cũ trả `IDEMPOTENCY_CONFLICT`. Hai tab cùng revision chỉ một thao tác ghi thành công; tab còn lại tải lại dữ liệu sau 409.

## Chấm và hạn giờ

- Snapshot chứa key phía server. API đang làm chỉ trả prompt, stimulus và options, không trả key. Sau chấm trả điểm thô, accuracy, passed, các đáp án đúng/sai và nhãn chất lượng gốc. Không quy đổi sang điểm TOEIC chính thức.
- Thời lượng lấy từ form, deadline và serverTime lấy phía server. Lưu đáp án sau deadline bị từ chối. Submit sau deadline chỉ chấm đáp án đã lưu trước đó, dùng deadline làm submittedAt.
- GET một lượt đã quá hạn sẽ chấm và lưu kết quả trong transaction. Đây là finalize lười khi truy cập; **chưa có background worker** tự chấm những lượt không bao giờ được mở lại.
- Lịch sử là read-only và có thể còn hiển thị Active cho lượt đã qua deadline cho tới khi GET/submit lượt đó.
- Một lần chấm ghi grade version 1, trạng thái Graded, kết quả quiz, tiến độ và telemetry cùng transaction. Bài làm đã mở vẫn có thể hoàn tất và xem lại sau khi quyền học hết hạn hoặc bài bị thu hồi; không tạo lượt mới trong những trường hợp đó.
- Với hai tab nộp bài, lượt nộp thứ hai dùng operation khác nhận `ATTEMPT_ALREADY_SUBMITTED`; gọi GET để lấy kết quả đã lưu.

## Tiến độ và checkpoint

Tiến độ dùng `LessonProgress.SubmitQuiz`: giữ nguyên firstQuizAccuracy, đánh dấu quizSubmitted, tăng revision. Completed chỉ khi đủ các trang bắt buộc và đã nộp quiz; không đồng nghĩa đã đạt checkpoint. NeedsReview dưới 80% hiện là cờ tích lũy từ domain, không tự xóa khi làm lại tốt hơn.

Checkpoint yêu cầu các bài `RequiredForCheckpoint` đã Completed và các checkpoint ở phân hệ trước đã có kết quả Passed. Đây là gate cho **bắt đầu checkpoint**, chưa khóa toàn bộ việc đọc bài ở phân hệ sau.

Ngưỡng pass được chụp từ recommendedAccuracy của lesson khi bắt đầu. So sánh bằng tỷ lệ chưa làm tròn; accuracy hiển thị làm tròn 4 chữ số. Khi checkpoint không đạt, retryAt = submittedAt + retry_after_days từ mapping. Đặt 3 ngày thông thường và 7 ngày cho D theo chính sách curriculum hiện hành. Backend lưu cấu hình theo attempt để sửa mapping không thay đổi bài đang làm.

Chưa tự chuyển Enrollment sang Completed, chưa tạo kế hoạch củng cố theo hai tag yếu, chưa yêu cầu hoàn tất số buổi củng cố trước retry. Các phần này cần đi cùng sổ lỗi sai/knowledge mastery để không suy diễn năng lực từ việc đọc bài hoặc nộp bài.

## Telemetry và giao diện Today

Start tái sử dụng BetaServingService nên lưu exposure bằng learner pseudonym. Submit lưu response các câu đã chọn. Vì chưa có timing từng câu/first-exposure evidence, response được ghi **Valid=false, AbilityBand=Unknown, ResponseTimeMs=0**; không dùng chúng để nâng tier dựa trên thống kê.

Today trả QuizServingDisabled nếu cờ Beta tắt; QuestionBankPending nếu chưa gắn form Active; QuizConfigured nếu đã gắn. QuizConfigured chỉ là gợi ý có cấu hình, start vẫn kiểm quyền, prerequisite, cooldown và quality gate.

## Mã lỗi chính

- 404: LESSON_NOT_FOUND, ATTEMPT_NOT_FOUND.
- 409: ACTIVE_QUIZ_CONFLICT, RESPONSE_CONFLICT, ATTEMPT_REVISION_CONFLICT, IDEMPOTENCY_CONFLICT, ATTEMPT_ALREADY_SUBMITTED.
- 422: QUIZ_NOT_READY, QUIZ_FORM_MISMATCH, CHECKPOINT_PREREQUISITE_REQUIRED, PREVIOUS_CHECKPOINT_REQUIRED, CHECKPOINT_RETRY_NOT_READY, ATTEMPT_DEADLINE_REACHED, ANSWER_OPTION_INVALID.
- 429: QUIZ_RATE_LIMIT.

## Phần còn lại và xác minh

- Ngân hàng câu hỏi đủ phủ 40 chủ điểm và 4 checkpoint; CMS gắn form/version; snapshot lời giải chi tiết. API kết quả hiện trả key/đúng-sai, chưa trả rationale.
- Phân tích tag yếu, remediation, sổ lỗi sai, đánh giá lại nội dung bị quarantine và quy trình regrade/correction chưa triển khai trong module này.
- Đồng bộ UI quiz/checkpoint, tự lưu tuần tự, resume và xử lý conflict.
- Chưa có device lease phía client; quiz dùng revision và khóa DB. Không coi đây là phòng thi Mock hoàn chỉnh.
- Chưa chạy test, migration hoặc smoke API theo yêu cầu. Build chỉ kiểm tra biên dịch. Cần kiểm chứng PostgreSQL, replay, concurrency, deadline, quyền sở hữu, pass threshold và progress transaction ở đợt test sau.
