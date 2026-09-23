# TOEIC Reading curriculum 2026.09-v1

## Phạm vi

Khóa seed từ lộ trình người dùng cung cấp, sau đó được biên tập lại cho đúng SRS và tải học. Khóa tập trung ngữ pháp, từ vựng kinh doanh và kỹ năng tích hợp Part 5/6. Các nhãn A–D là giai đoạn nội bộ, không phải CEFR, band được chứng nhận hoặc cam kết tổng điểm TOEIC. Listening và Part 7 cần lộ trình bổ sung riêng trước khi đưa ra mục tiêu điểm tổng.

## Điều chỉnh so với bản nguồn

- Quiz cuối bài không khóa bài tiếp theo. Dưới 80% vẫn hoàn tất lesson nhưng gắn NeedsReview và đề xuất guided practice.
- Chỉ checkpoint cuối mức tạo đề xuất chuyển mức/remediation. Chưa đạt không khóa các hoạt động học khác.
- Placement 24 câu cần trả lời tối thiểu 18 câu và chỉ gợi ý A/B/C; bài ngắn không đủ bằng chứng để tự đưa người học vào D.
- Khi thời gian tới ngày thi không đủ, planner không ghép hai khái niệm mới vào một session. Hệ thống hiển thị thiếu bao nhiêu phút và cho chọn tăng thời gian, giảm phạm vi hoặc đổi ngày.
- Từ vựng mới dùng 8–12 mục/session kèm spaced review thay vì mặc định 20 từ mỗi ngày cho mọi trình độ.
- Bài 50–60 phút có hai trang và được phép dừng ở ranh giới trang; không cắt giữa một page hoặc checkpoint.
- Checkpoint D có 46 câu, tương ứng Part 5 (30) + Part 6 (16), và chỉ trả độ chính xác/tag yếu.

## Dữ liệu đã seed

| Thành phần | Số lượng | Nội dung |
|---|---:|---|
| Course version | 1 | Snapshot 2026.09-v1, Published |
| Level | 4 | A: 6 tuần; B: 7; C: 8; D: 10 |
| Knowledge topic | 40 | A1–A9, B1–B10, C1–C10, D1–D11 |
| Learning guide | 40 | Công thức/pattern, cách áp dụng, mở rộng, self-check |
| Lesson version | 44 | 40 concept lesson + 4 checkpoint |
| Lesson page | 84 | 2 trang/concept + 1 trang/checkpoint |
| Lesson block | 288 | Text, Rule, Example, Contrast, Tip, MiniCheck |
| Roadmap week | 31 | Mục tiêu, theme, threshold và remediation rule |
| Roadmap activity | 122 | Lesson, quiz, flashcard, review, checkpoint, remediation |

## Cấu trúc một concept lesson

Trang 1 — Hiểu khái niệm và công thức:

1. Tóm tắt và mục tiêu có thể quan sát.
2. Công thức/mẫu cấu trúc và quy tắc cốt lõi.
3. Ví dụ tiếng Anh có chỉ rõ điểm cần nhìn.

Trang 2 — Áp dụng và mở rộng:

1. Quy trình giải theo bước, ưu tiên cấu trúc trước và nghĩa sau.
2. Bẫy thường gặp và cách loại.
3. Phần mở rộng để đọc hiểu sâu hơn, không bắt buộc thuộc ở lượt đầu.
4. Câu hỏi tự kiểm tra trước quiz.

Content block là JSON có cấu trúc; không lưu HTML/script. Quiz question/answer key vẫn phải đi qua question bank và publication gate, không nằm trong block trả cho learner.

## Cá nhân hóa

- Kế hoạch mặc định giữ tỷ lệ SRS: 25% review, 55% lesson/drill, 20% buffer.
- Unknown placement hiện lựa chọn điểm bắt đầu, không tự gán A.
- Remediation dùng tối đa hai primary tag yếu có đủ dữ liệu.
- Nếu chưa đủ bằng chứng mastery, dùng mixed review chung và hiển thị “chưa đủ dữ liệu”.
- Flashcard ưu tiên thẻ đến hạn; mục mới 8–12/session và có thể bỏ qua.
- Checkpoint có thể được xếp vào một buổi dài do người học xác nhận.

## Migration

- 005_learning_curriculum.sql: schema version hóa course, level, topic, lesson/page/block, prerequisite, roadmap và placement rule.
- 006_seed_toeic_reading_curriculum.sql: nội dung và roadmap Published.
- enrollments.course_version_id và lesson_progress.lesson_version_id dùng FK NOT VALID để không phá dữ liệu legacy; row mới vẫn được kiểm FK. Cần audit dữ liệu cũ rồi VALIDATE CONSTRAINT trước production.

## Giới hạn còn lại

- Ví dụ/công thức đã được biên tập kỹ thuật nhưng chưa qua giáo viên TOEIC pilot; threshold cần hiệu chỉnh bằng dữ liệu thật.
- Seed có theme từ vựng và quy tắc flashcard; catalog card/word-sense chi tiết sẽ là migration riêng.
- Chưa có repository/API đọc curriculum, plan materializer hoặc CMS write path.
- Chưa có question bank cho 8–10 câu quiz mỗi lesson và checkpoint; lesson content không được dùng như answer key.
