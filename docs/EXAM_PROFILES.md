# Cấu trúc đề có phiên bản

Migration `026_exam_profiles.sql` tạo danh mục cấu trúc đề phía server. Admin phải chọn profile có thật khi xuất bản; không còn được nhập chuỗi exam profile tùy ý. Migration 026 và phần mở rộng profile trong migration 027 chưa được áp dụng trong đợt code này.

## Profile được seed

| Version | Cấu trúc | Thời lượng | Phát hành |
| --- | --- | ---: | --- |
| `TOEIC-R-CUSTOM-PRACTICE-v1` | Part 5/Part 6/Part 7 tùy chỉnh, tổng 1–200 câu | Admin chọn 1–240 phút | Có |
| `TOEIC-R-P5P7-84-v1` | Part 5: 30; Part 7: 54 | 75 phút | Có |
| `TOEIC-R-STRUCTURE-100-v1` | Part 5: 30; Part 6: 16; Part 7: 54 (chưa kiểm mix passage) | 75 phút | Có |
| `TOEIC-LR-FULL-200-v1` | P1: 6, P2: 25, P3: 39, P4: 30, P5: 30, P6: 16, P7 single: 29, P7 multiple: 25 | 120 phút | Khóa |

Profile full mô tả cấu trúc 200 câu để làm chuẩn kiến trúc và hiển thị rõ phần còn thiếu. Backend luôn từ chối khi cố phát hành profile này. Việc có một record profile không có nghĩa hệ thống đã có nội dung hoặc phòng thi full TOEIC.

Profile Reading 84 câu là bài luyện Part 5 + Part 7, bỏ Part 6 nên không được gọi là Reading section TOEIC đầy đủ. Backend bắt buộc đúng 30/54 câu và 75 phút. Profile tùy chỉnh dành cho bài luyện ngắn, nhận Part5/Part6/Part7DirectEvidence đã qua quality gate.

`GET /api/v1/admin/exams/profiles` trả danh mục và structure. Trang tạo đề dùng select; profile chưa hỗ trợ được hiển thị nhưng không thể chọn để phát hành. Với profile exact, thời lượng bị khóa và nút xuất bản chỉ mở khi số câu từng Part khớp.

## Kiểm tra phía server

- Profile không tồn tại hoặc chưa hỗ trợ bị từ chối.
- Profile exact phải khớp thời lượng, tổng câu và số câu từng Part.
- Composer tiếp tục kiểm policy, tier, family, exposure và coverage.
- Materializer kiểm snapshot trước khi transaction commit.

Các form cũ vẫn giữ nguyên exam_profile_version. Danh mục mới áp dụng cho yêu cầu xuất bản qua admin API; migration không tự gán nhãn lại form cũ.

## Còn thiếu để mở full TOEIC

- Content schema cho Part 1–4, Part 6 và phân loại Part 7 single/double/triple.
- Media/audio versioning, transcript, speaker/accent metadata, preload và quyền sử dụng audio.
- Section clock 45 phút Listening + 75 phút Reading, khóa chuyển section và quy tắc phát audio.
- Composer/materializer cho đủ bảy Part và đúng thứ tự 200 câu.
- Calibration và bảng quy đổi Listening/Reading 5–495; tổng 10–990.
- Ngân hàng nội dung đã kiểm định và kiểm thử phòng thi.

Đã build backend/frontend. Theo yêu cầu hoãn test, chưa chạy test, migration hoặc kiểm tra trình duyệt. Frontend còn cảnh báo bundle lớn hơn 500 kB.
