# Biên tập nguồn Part 5

## Đã triển khai

`/admin/question-drafts` liệt kê bản nháp và blueprint Part 5 đã xuất bản. Chọn blueprint để tạo câu mới hoặc nhập ID nguồn Part 5 để tạo phiên bản sửa đổi. `/admin/question-drafts/:draftId` có editor câu dẫn, bốn đáp án, giải thích mỗi đáp án, lời giải và nguồn/quyền sử dụng; xem trước bên cạnh, lưu DB, nhập/xuất JSON và hiển thị lỗi cấu trúc theo trường.

Điều kiện: PostgreSQL, AdminApiEnabled, phiên AdminSession và migration theo thứ tự đến `023_question_drafts.sql`. Migration chưa được áp dụng trong đợt code này. Cần có blueprint Part 5 Published; giao diện không tự tạo blueprint hoặc xuất bản nguồn để lấp dữ liệu trống.

## Luồng nội dung

1. Tạo draft với client-generated UUID để retry không tạo trùng. Blueprint cố định trong draft; rule và policy lấy từ blueprint phía server. Family do server sinh cho câu mới, hoặc kế thừa nguồn trước khi sửa đổi.
2. Lưu nháp cho phép nội dung còn thiếu, nhưng giới hạn kích thước: stem 500, option text 120, option justification 2.000, derivation 4.000, rights reference 2.000 ký tự; luôn có bốn options. Mỗi lần lưu tăng revision. Request lặp đúng nội dung ngay sau lần lưu được trả lại bản đã lưu; thay đổi ở phiên khác trả conflict, không ghi đè.
3. Kiểm tra cấu trúc sử dụng Part5Validator hiện có và blueprint đã xuất bản. Bản chưa lưu phải được lưu trước khi kiểm tra. Kiểm tra không gọi AI hoặc chứng nhận độ đúng ngữ nghĩa/quyền sở hữu.
4. Tạo nguồn chỉ được thực hiện nếu kiểm tra cấu trúc đạt. Trong một transaction: tạo question revision `StructuralValid` / tier `Draft`, hash canonical của nội dung, provenance phía server, question node, liên kết draft/source và audit. Không nhận tier, state, rule, family hay provenance do trình duyệt tự khai.
5. Draft đã tạo nguồn bị khóa; sửa tiếp phải tạo draft mới với previous_revision_id. Nguồn cũ, form đã phát hành và snapshot bài làm giữ nguyên. Retry submit trả cùng source ID, không tạo nhiều nguồn.

Nguồn mới **chưa đủ điều kiện xuất bản đề**. Chưa có worker/adapters đưa nguồn do admin nhập qua solver, critic, perturbation, similarity và rights checks rồi cập nhật trạng thái. Đây là nơi lưu nội dung chờ nối bước kiểm định, không phải hàng đợi đã có worker xử lý. Màn hình không thông báo kiểm định tự động đang chạy.

Provenance đánh dấu nguồn biên tập thủ công (`human / editorial / manual / admin-editor-v1`) và tài khoản gửi nguồn. Khi sửa từ nguồn khác, previous_revision_id giữ liên kết nguồn gốc. Thông tin quyền sử dụng do admin khai cần được kiểm định tiếp.

Family mới là UUID riêng; bản sửa kế thừa family. Bước cấu trúc không phát hiện trùng ngữ nghĩa giữa các family; đó là trách nhiệm similarity gate chưa được nối vào luồng nhập.

## API

Prefix `/api/v1/admin/question-drafts`, policy AdminOnly và no-store. Các admin có thể cùng quản lý draft; không có phân quyền tác giả riêng.

| Method | Path | Request / kết quả |
| --- | --- | --- |
| GET | `?page=1` | Danh sách 20 draft/trang |
| GET | `/blueprints?page=1` | Blueprint Published của Part 5, 20/trang |
| GET | `/{id}` | Nội dung, revision, sourceId nếu đã gửi |
| POST | `` | id, blueprintId, previousRevisionId tùy chọn |
| PUT | `/{id}` | expectedRevision, title, body |
| POST | `/{id}/validate` | expectedRevision; trả report gồm passed và findings |
| POST | `/{id}/submit` | expectedRevision; trả sourceId khi thành công, report khi chưa đạt |

Audit ghi create/save/submit cùng admin và liên kết nguồn, không ghi toàn bộ đáp án trong safe_diff. API ghi kiểm tra lại membership admin, khóa user/admin rồi draft trong transaction. UUID tạo draft có advisory lock để hai request trùng ID không tạo hai bản.

## JSON nhập và bảo vệ bản nháp

Chỉ nhập một câu từ JSON tối đa 64 KB. Tệp được parse và đưa vào editor, không tự ghi DB. Các trường ngoài schema bị từ chối; không nhận JSON full question revision hoặc tự nâng trạng thái kiểm định. Định dạng body:

```json
{
  "stem": "",
  "proposedKey": "A",
  "answerDerivation": "",
  "rightsReference": "",
  "options": [
    { "stableId": "A", "text": "", "justification": "" },
    { "stableId": "B", "text": "", "justification": "" },
    { "stableId": "C", "text": "", "justification": "" },
    { "stableId": "D", "text": "", "justification": "" }
  ]
}
```

Mẫu trên chỉ để nhập nội dung, không phải câu hỏi hợp lệ để gửi kiểm định. Nút Xuất JSON giữ nội dung đang sửa để tải về trước khi giải quyết xung đột revision.

Khi lưu chưa được xác nhận, editor giữ nguyên payload và khóa chỉnh sửa để retry an toàn. Có thể tải bản máy chủ sau xác nhận bỏ nội dung cục bộ. Điều hướng trong ứng dụng và đóng/reload trang có nhắc khi còn thay đổi chưa lưu. Nội dung chưa xác nhận chỉ ở bộ nhớ; không có tự động lưu nền/offline, đóng cưỡng bức vẫn có thể mất dữ liệu.

## Còn lại

- Editor Part 7, nhập hàng loạt/PDF/Word, quản lý blueprint qua UI và worker kiểm định nguồn nhập.
- Chưa có workflow nhiều người phê duyệt, xóa/archive draft hoặc lịch sử diff từng lần lưu. Nguồn sau submit bất biến nhưng các phiên bản chỉnh sửa nháp trước đó không được lưu riêng.
- Bộ kiểm tra Part 5 hiện chỉ chấp nhận exam profile `TOEIC-LR-R0A-v1`; blueprint profile khác sẽ nhận finding BLUEPRINT_INVALID.
- Đã build .NET và TypeScript/Vite. Theo yêu cầu hoãn test, chưa chạy kiểm thử API/DB, áp dụng migration hoặc kiểm tra giao diện trên trình duyệt. Frontend có cảnh báo bundle lớn hơn 500 kB.
