# Biên tập nguồn Part 6

`/admin/part6-drafts` quản lý đoạn văn Part 6. Admin chọn blueprint Part6 Published, tạo nguồn mới hoặc phiên bản sửa đổi, nhập JSON, xem trước, lưu theo revision, kiểm tra cấu trúc và tạo source bất biến ở trạng thái `StructuralValid`, tier `Draft`.

Áp dụng migration theo thứ tự đến `027_part6_drafts.sql`. Migration tạo bảng draft, mở profile luyện tùy chỉnh cho Part 6 và thêm profile `TOEIC-R-STRUCTURE-100-v1`: Part 5 có 30 câu, Part 6 có 16 câu, Part 7 có 54 câu trong 75 phút. Migration chưa được chạy trong đợt code này.

Mỗi source Part 6 chứa một stimulus và đúng bốn câu theo blueprint. Mỗi câu có stableId, prompt, bốn options, proposedKey và rationale. Option hỗ trợ từ/cụm từ hoặc cả câu để biểu diễn dạng chèn câu. Khi submit, backend tạo bốn question node theo thứ tự; phòng thi dùng chung stimulus và chấm từng node độc lập.

Family, stimulus ID, hash, provenance, state và tier được tạo phía server. Bản sửa đổi giữ family/previous_revision_id; nguồn cũ và snapshot bài làm không bị thay đổi. Create retry dùng UUID, save dùng revision, draft đã submit bị khóa và các thao tác ghi đều có audit.

API dùng prefix `/api/v1/admin/part6-drafts`, AdminOnly, no-store; có các route danh sách, blueprints, get/create/save/validate/submit giống editor Part 7.

Nguồn `StructuralValid` chưa được chọn vào đề cho đến khi qua quality pipeline. Hiện chưa có solver/critic/similarity/rights worker cho nguồn Part 6 do admin nhập.

Profile Reading 100 chỉ đảm bảo tổng số Part 5/6/7 và thời lượng. Part 7 hiện là `Part7DirectEvidence`, chưa ép đúng 29 câu single passage và 25 câu multiple passage, nên UI ghi “chưa kiểm cơ cấu passage” và không gọi đây là mô phỏng chính thức hoàn chỉnh.

Chưa hỗ trợ nhập PDF/Word, autosave/offline, chọn vị trí blank trực quan, lịch sử diff hoặc workflow nhiều người duyệt. Đã build backend/frontend; chưa chạy test, migration hoặc kiểm tra trình duyệt theo yêu cầu hoãn test.
