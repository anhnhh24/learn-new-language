# Biên tập nguồn Part 7

## Phạm vi

`/admin/part7-drafts` quản lý bản nháp Part7DirectEvidence. Admin chọn blueprint Published, tạo nhóm mới hoặc tạo phiên bản sửa đổi từ source revision cũ. Editor nhập bài đọc và nhóm câu hỏi bằng JSON, xem trước, lưu theo revision, kiểm tra cấu trúc và tạo source bất biến ở trạng thái `StructuralValid`, tier `Draft`.

Áp dụng migration theo thứ tự đến `024_part7_drafts.sql`, bật AdminApiEnabled và dùng AdminSession. Migration chưa được chạy trong đợt code này.

Body gồm `stimulus`, `rightsReference`, và `questions` từ 1–5 phần tử. Mỗi câu có `stableId`, `prompt`, đúng bốn `options`, `proposedKey`, `rationale` và `evidenceQuote`. Số câu cuối cùng phải bằng `groupSize` của blueprint (2–5).

`evidenceQuote` phải được sao chép nguyên văn từ stimulus và xuất hiện đúng một lần. Backend tự tính start/length và sourceHash; client không được tự gửi offset hoặc hash. Trích dẫn không có trong bài hoặc lặp lại khiến vị trí mơ hồ sẽ không qua structural validation.

Khi submit thành công, backend tạo một source revision Part7DirectEvidence và một question node cho mỗi câu theo đúng thứ tự. Family mới do server sinh; bản sửa đổi giữ family và previous_revision_id. Stimulus ID, content hash và provenance được tạo phía server.

Draft dùng UUID do client tạo để retry create an toàn, revision để chống ghi đè và giữ payload khi retry sau lỗi mạng. Draft đã submit bị khóa; cần tạo phiên bản sửa đổi. Mọi create/save/submit đều audit nhưng không ghi toàn bộ nội dung vào safe_diff.

## API

Prefix `/api/v1/admin/part7-drafts`, AdminOnly, no-store.

| Method | Path | Nội dung |
| --- | --- | --- |
| GET | `?page=1` | 20 draft/trang |
| GET | `/blueprints?page=1` | Blueprint Part 7 Published |
| GET | `/{id}` | Nội dung và revision hiện tại |
| POST | `` | id, blueprintId, previousRevisionId tùy chọn |
| PUT | `/{id}` | expectedRevision, title, body |
| POST | `/{id}/validate` | Kiểm tra cấu trúc |
| POST | `/{id}/submit` | Tạo source và question nodes nếu đạt |

## Giới hạn

Nguồn mới chỉ đạt structural validation, chưa đi qua kiểm định ngữ nghĩa, similarity, rights hoặc adversarial checks, nên không xuất hiện trong danh sách ghép đề. Worker kiểm định nguồn do admin nhập vẫn chưa được nối.

Editor ưu tiên JSON để giữ cấu trúc nhóm câu rõ ràng; chưa có kéo chọn trực tiếp đoạn bằng chứng, autosave/offline, lịch sử diff, nhập PDF/Word hoặc nhập hàng loạt. Chỉ hỗ trợ Part7DirectEvidence theo domain hiện có; chưa có Part 6, Listening/audio, full mock hoặc quy đổi điểm 990.

Đã build backend và frontend. Theo yêu cầu hoãn test, chưa chạy test API/DB/concurrency, chưa áp dụng migration và chưa kiểm tra trực quan trên trình duyệt. Frontend tiếp tục có cảnh báo bundle lớn.
