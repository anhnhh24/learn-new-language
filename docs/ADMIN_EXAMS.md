# Quản trị đề luyện tập

## Đã triển khai

Các trang `/admin/exams`, `/admin/exams/new`, `/admin/exams/:examId` dùng AdminSession riêng. Có danh sách phân trang/lọc trạng thái, xem trước câu hỏi và lời giải, chọn nguồn theo thứ tự, ghép/xuất bản và ngừng phát hành. Tất cả thao tác ghi kiểm tra lại membership admin trong transaction và ghi audit.

Áp dụng migration theo thứ tự đến `022_admin_exam_publications.sql`, cấu hình PostgreSQL và bật `Features:AdminApiEnabled`. Việc quản trị có thể bật độc lập; để học viên làm đề cần bật LearnerApiEnabled và BetaServingEnabled theo `PRACTICE_EXAMS.md`. Migration chưa được chạy trong đợt code này.

## Quy trình

1. Đưa nguồn câu hỏi qua quality pipeline hiện có. Màn hình chọn nguồn chỉ liệt kê Part5/Part6/Part7DirectEvidence ở BetaReady + AutoValidated hoặc DataValidatedPractice.
2. Xem trước nội dung, chọn nguồn, sắp xếp thứ tự. Nhóm Part 7 không tách lẻ. Nguồn được giữ theo thứ tự chọn giữa các trang; có thể đưa lên/xuống hoặc bỏ khỏi đề.
3. Nhập tên phiên bản duy nhất, policy khớp nguồn, phiên bản cấu hình bài thi, thời lượng 1–240 phút, mức phát hành và ngưỡng tiếp xúc. Tổng số câu 1–200.
4. Nhấn kiểm tra và xuất bản. Backend dùng FormCompositionService: quyền sử dụng, policy, family trùng/khóa được truyền vào composer, số câu theo Part, tier và lượt tiếp xúc đều được kiểm tra. Luồng admin hiện truyền tập family khóa rỗng, chưa có quản lý family cấm toàn hệ thống. Nguồn BetaReady trở thành BetaActive trong cùng transaction.
5. Kiểm tra hash nội dung, snapshot và tập ID câu hỏi trước khi commit. Có cả audit của worker kiểm định tự động và admin yêu cầu xuất bản. Admin không có API đổi trực tiếp tier/state của nguồn để bỏ qua gate.
6. Nếu cần dừng đề, nhập lý do và ngừng phát hành. Lượt mới bị chặn; lượt cũ và kết quả dùng snapshot đã lưu. Không xóa form hay sửa đề đã phát hành. Nội dung mới cần source revision và form version mới.

Nguồn BetaActive không được tái chọn trong composer hiện tại; danh sách chỉ chứa các trạng thái composer đang hỗ trợ. Đổi trạng thái nguồn thủ công để tái sử dụng không nằm trong luồng này.

## API

Prefix `/api/v1/admin`, policy AdminOnly, no-store.

| Method | Path | Nội dung |
| --- | --- | --- |
| GET | `/exams?page=1&state=Active` | 20 đề/trang; state tùy chọn |
| GET | `/exams/sources?page=1&policy=...` | Nguồn đủ trạng thái chọn; policy tùy chọn |
| GET | `/exams/sources/{id}` | Nội dung nguồn, key và lời giải; chỉ admin |
| GET | `/exams/{id}` | Metadata và nguồn theo thứ tự đề |
| POST | `/exams` | operationId, version, policyVersion, examProfileVersion, durationSeconds, tier, sourceIds, part5Count, part7Count, maximumPriorExposure |
| POST | `/exams/{id}/archive` | expectedState, reason (1–1000 ký tự) |

Publish receipt được lưu trong `content.admin_exam_publications`, gắn admin + operationId + hash request. Retry cùng payload trả cùng form ID; payload khác trả conflict. Frontend giữ operation ID trong phiên component để retry sau lỗi mạng, nhưng không lưu cấu hình nháp qua reload. Nếu reload sau kết quả không rõ ràng, kiểm tra danh sách theo tên phiên bản trước khi tạo lại; unique version ngăn tạo hai form cùng tên.

Candidate được khóa theo ID trước khi composer quyết định và thay đổi trạng thái, tránh hai yêu cầu đồng thời cùng xuất bản nguồn BetaReady. Blueprint từ chối Part nằm ngoài requirements, bên cạnh kiểm tra đủ số câu từng Part.

Archive kiểm tra expectedState với trạng thái đã khóa. Nếu đã Archived, trả thành công và không ghi thêm audit. Lý do đầu tiên giữ trong audit safe_diff; bảng audit hiện chỉ hiển thị metadata, chưa có màn hình đọc chi tiết lý do.

## Giới hạn còn lại

- Đã có biên tập Part 5 và Part7DirectEvidence tại `/admin/question-drafts` và `/admin/part7-drafts` (xem `QUESTION_AUTHORING.md`, `PART7_AUTHORING.md`). Chưa có nhập hàng loạt, lưu nháp cấu hình ghép đề trên server, lập lịch phát hành hoặc khôi phục đề Archived.
- Phiên bản cấu hình bài thi là metadata theo hợp đồng composer hiện tại, chưa đối chiếu một danh mục exam profile riêng. Không dùng tên profile để suy ra đây là full TOEIC.
- Chưa mở Listening, Part 6, full mock hoặc quy đổi 990. Chưa có workflow nhiều người duyệt hay MFA/step-up; API sử dụng quyền Admin hiện có.
- Danh sách ứng viên phản ánh trạng thái nguồn, không bảo đảm mọi cách chọn đều qua gate: kết quả cuối cùng do transaction xuất bản quyết định.
- Đã build backend/frontend, chưa test API, concurrency, migration hoặc trình duyệt theo yêu cầu hoãn test. Frontend còn cảnh báo bundle trên 500 kB.
