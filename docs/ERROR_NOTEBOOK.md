# Sổ lỗi sai — backend

## Đã triển khai

Migration `016_error_notebook.sql` bổ sung revision, lý do bỏ qua, snapshot và thời điểm cập nhật. API yêu cầu `Features:LearnerApiEnabled`, PostgreSQL và bearer session của học viên đã xác minh email. Đọc sổ lỗi không cần bật Beta serving; tạo lượt quiz vẫn theo điều kiện riêng của module quiz.

Khi quiz được chấm, mỗi câu **đã chọn nhưng sai** tạo một error entry trong cùng transaction với điểm và tiến độ. Câu bỏ trống không tự được coi là bằng chứng thiếu kiến thức. Unique key gồm learner, attempt và question chống ghi trùng; làm sai cùng câu ở một lượt khác tạo bản ghi nguồn khác. Dashboard Today hiện có tự đếm các entry Open/Improving.

Snapshot chỉ chứa câu hỏi, passage, option, đáp án đã chọn và key từ bài làm đã chấm; không chứa provenance hay toàn bộ content JSON nội bộ. Câu hỏi giữ đúng bản ở thời điểm làm bài. PrimaryTag lấy ruleId của nguồn Part 5 khi có; nếu chưa có tag chi tiết thì dùng Section như Part7. Tag cấp Part không đủ để suy luận điểm yếu chủ điểm cụ thể.

## API

Prefix `/api/v1/me/errors`; tất cả response đặt `Cache-Control: no-store`.

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `?state=Open&tag=...&page=1&pageSize=20` | Lọc chính xác theo state/tag; bỏ state để xem tất cả; pageSize tối đa 50 |
| GET | `/summary` | Số entry Open, Improving, Resolved, Ignored của tài khoản |
| GET | `/{id}` | Chi tiết và snapshot nguồn |
| PUT | `/{id}` | `{expectedRevision, action: "Ignore" hoặc "Reopen", reason?}` |
| POST | `/from-quiz` | `{attemptId}` để ghi lỗi của quiz cũ đã chấm; trả `{added}` |

POST from-quiz chỉ đọc quiz đã chấm của chính tài khoản, tự lấy câu sai từ DB. Không nhận key, điểm hay correctness từ client. Gọi lại an toàn: bản ghi đã tồn tại không bị nhân đôi, ghi đè hoặc mở lại; added lần sau bằng 0 nếu không có bản ghi mới. Không tự backfill toàn bộ lịch sử trong migration.

Ignore áp dụng cho Open/Improving/Ignored, lý do tùy chọn tối đa 500 ký tự. Reopen chỉ áp dụng cho Ignored và chuyển về Open, xóa lý do và bằng chứng cải thiện cũ. Reopen không được gửi reason. Hai tab ghi cùng revision sẽ có một thao tác nhận `ERROR_ENTRY_CONFLICT` (409); tải lại trước khi thao tác tiếp. Không dùng endpoint này để tự gán Improving/Resolved.

Entry không thuộc tài khoản trả `ERROR_ENTRY_NOT_FOUND` (404). from-quiz không tìm thấy quiz đã chấm thuộc tài khoản trả `ATTEMPT_NOT_FOUND`. Filter/action/reason không hợp lệ trả 422. Dữ liệu legacy chưa có snapshot trả snapshot=null; giao diện cần hiển thị thiếu chi tiết thay vì tự dựng câu hỏi.

## Phần còn lại

- Chưa nối frontend và chưa có bài luyện câu tương đương được kiểm định. Vì vậy chưa tự chuyển Improving/Resolved; cần tối thiểu bằng chứng đúng từ các family/ngày khác nhau theo domain, không chỉ làm lại câu đã biết đáp án.
- Chưa tự gom nhiều entry cùng chủ điểm thành một lỗi chung, chưa tạo kế hoạch remediation cho checkpoint hoặc tự xóa NeedsReview trong tiến độ bài học.
- Chưa chụp lời giải chi tiết; snapshot hiện có key và đáp án đã chọn. Việc hiển thị lại nội dung bị quarantine/correction cần bổ sung cùng quy trình regrade của quiz.
- Trạng thái thao tác chưa có audit history riêng; revision, state và updatedAt lưu trạng thái hiện tại. Nội dung câu hỏi lấy từ nguồn server, frontend vẫn phải render text an toàn.
- Không chạy test, migration hoặc smoke API trong lượt này theo yêu cầu. Build chỉ xác nhận biên dịch; SQL, transaction rollback, phân quyền và concurrency cần kiểm chứng sau.
