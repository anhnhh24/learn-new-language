# Flashcard cá nhân và lịch ôn

## Phạm vi

Module dùng PostgreSQL, bật cùng `Features:LearnerApiEnabled`, yêu cầu tài khoản Active đã xác minh email và bearer session. Mọi API lấy chủ sở hữu từ session; không nhận learnerId từ client. Cần áp dụng migration `014_private_flashcards.sql` trước khi chạy phiên bản API này. Migration mới chưa được chạy trong đợt code này.

Nội dung thẻ do học viên tự nhập, riêng tư, gồm từ/cụm từ, nghĩa theo ngữ cảnh và ví dụ. Mỗi nghĩa có thể tạo thành một thẻ riêng. Chưa có từ điển biên tập, phát âm/audio, import, bộ thẻ theo khóa học hoặc nối frontend. Không tự sao chép nội dung từ nguồn bên ngoài.

## API

Prefix: `/api/v1/me/flashcards`. Response đặt `Cache-Control: no-store`.

| Method | Path | Body / query | Kết quả |
| --- | --- | --- | --- |
| POST | `/` | clientOperationId, term, meaning, example? | Thẻ mới, revision 0 |
| GET | `/` | page=1, pageSize=20 (tối đa 50), archived=false | items, page, pageSize, hasMore |
| PUT | `/{id}` | expectedRevision, term, meaning, example?, archived | Sửa/lưu trữ/khôi phục thẻ, tăng revision |
| GET | `/queue` | limit=20, từ 1 đến 20 | Mặt trước thẻ và newCardsRemaining |
| POST | `/{id}/reveal` | expectedRevision | revealId, cardId, revision, meaning, example, expiresAt |
| POST | `/{id}/reviews` | clientOperationId, revealId, expectedRevision, rating | Biên nhận lượt ôn và lịch kế tiếp |
| GET | `/settings` | — | newCardsPerDay, revision |
| PUT | `/settings` | expectedRevision, newCardsPerDay (0–30) | Thiết lập mới và revision |

`term` dài 1–200 ký tự, `meaning` 1–2000, `example` tối đa 2000; chuỗi được trim. Frontend phải render dạng text, không chèn HTML từ nội dung thẻ. Tạo tối đa 100 thẻ mỗi giờ mỗi tài khoản, kể cả thẻ đã lưu trữ.

Ví dụ tạo thẻ:

```json
{
  "clientOperationId": "08b43e94-2657-4517-bffa-5e02d9d3edaf",
  "term": "reschedule",
  "meaning": "đổi lịch của một cuộc hẹn hoặc sự kiện",
  "example": "Could we reschedule the meeting for Friday?"
}
```

## Tích hợp màn hình ôn

1. Lấy queue, chỉ hiển thị `term`. Queue ưu tiên thẻ đã học đến hạn theo dueAt, sau đó thẻ mới theo thời điểm tạo; tối đa 20 thẻ mỗi lần lấy.
2. Người học tự nhớ trước, bấm hiện đáp án để gọi reveal. Dùng `revision` trong queue làm expectedRevision. Reveal hợp lệ trong 30 phút; gọi lại cùng phiên bản trả cùng revealId nếu chưa hết hạn.
3. Sau khi hiện đáp án, bật bốn nút `Forgot`, `Hard`, `Remembered`, `Easy`. Gửi revealId và expectedRevision từ kết quả reveal, cùng clientOperationId mới cho mỗi hành động chấm.
4. Khi lỗi mạng, retry nguyên body với cùng clientOperationId. Đổi payload phải tạo operation mới. Server lưu response theo tài khoản và operation trong cùng transaction với lịch ôn.
5. Khi `FLASHCARD_CONFLICT`, tải lại queue/thư viện; khi `REVIEW_REVEAL_REQUIRED`, mở lại đáp án. Không tự tăng revision hay tính dueAt tại frontend.

Thư viện thẻ có nghĩa và ví dụ để quản lý nội dung; yêu cầu reveal là quy tắc của luồng ôn, không phải cơ chế giấu nội dung khỏi chủ thẻ.

## Quy tắc học

- Mặc định 5 thẻ mới/ngày. Mốc giới thiệu một thẻ là lần reveal đầu tiên, kể cả sau đó người dùng chưa chấm hoặc đã lưu trữ thẻ. Lấy queue không tiêu hao hạn mức. Khóa hàng tài khoản trong transaction chống hai tab cùng vượt quota.
- Ngày học tính bằng múi giờ hiện tại trong hồ sơ. Thay đổi múi giờ sẽ tính lại ngày của các lần giới thiệu trước đó. Đây là hạn mức hỗ trợ học tập, không phải quota thanh toán/chống gian lận. Nếu cần giới hạn bất biến khi đổi múi giờ, cần chốt chính sách riêng.
- Thẻ đã mở đáp án nhưng chưa chấm vẫn giữ state `New`, song không bị tính là thẻ mới chưa giới thiệu trong queue. Nó tiếp tục được ưu tiên cùng nhóm thẻ đã học để hoàn tất lượt ôn.
- Đặt hạn mức 0 chỉ dừng giới thiệu thẻ mới. Vẫn ôn thẻ đã giới thiệu. Giảm hạn mức không hủy các lần học đã diễn ra.
- `Forgot`: ôn lại sau 10 phút, interval 0, state Relearning.
- `Hard`: max(1, ceil(interval × 1.2)) ngày.
- `Remembered`: 1 ngày ở lần đầu, sau đó ceil(interval × 2).
- `Easy`: 3 ngày ở lần đầu, sau đó ceil(interval × 3).
- Interval tối đa 180 ngày. Các lịch theo ngày đặt vào 08:00 theo múi giờ học viên; dữ liệu lưu UTC. Thuật toán hiện tại là `review-v1`.
- Ôn trước dueAt vẫn lưu sự kiện nhưng giữ nguyên interval, dueAt và state. Lượt chấm vẫn tăng revision, tiêu thụ reveal để tránh ghi lặp từ tab cũ.
- Sửa nội dung/lưu trữ/khôi phục giữ lịch ôn và tăng revision, vô hiệu reveal cũ. Với nghĩa hoàn toàn khác nên tạo thẻ mới để không kế thừa lịch nhớ của nghĩa cũ.
- Dashboard Today chỉ đếm thẻ riêng đã giới thiệu, đến hạn và chưa lưu trữ. Thẻ mới chưa giới thiệu lấy qua queue.

## Lỗi và tính nhất quán

`USER_CARD_NOT_FOUND` (404) cho thẻ không thuộc tài khoản hoặc thẻ lưu trữ đang được yêu cầu ôn. `FLASHCARD_CONFLICT`, `FLASHCARD_SETTINGS_CONFLICT`, `IDEMPOTENCY_CONFLICT` trả 409. `NEW_CARD_DAILY_LIMIT`, `REVIEW_REVEAL_REQUIRED`, dữ liệu không hợp lệ trả 422. Giới hạn tạo thẻ trả 429.

ClientOperationId dùng chung không gian định danh cho thao tác tạo và chấm trong từng tài khoản. Biên nhận retry là kết quả ở thời điểm thao tác gốc, có thể có revision cũ nếu thẻ đã được sửa tiếp. Cần GET lại thư viện/queue để lấy trạng thái hiện tại.

## Ghi chú còn lại

- Chưa chạy test, migration hoặc smoke API theo yêu cầu tập trung code. Build chỉ xác nhận biên dịch; chưa xác minh SQL trên PostgreSQL thực tế.
- Cần kiểm tra tích hợp sau: race hai tab ở thẻ mới cuối ngày, replay sau khi sửa thẻ, quyền sở hữu, archive/restore, DST, hết hạn reveal, giới hạn ngày và đổi múi giờ.
- Queue là một batch tối đa 20 thẻ, chưa có đối tượng phiên ôn cố định hoặc thống kê hoàn thành phiên. Có thể lấy batch kế tiếp sau khi hoàn tất.
- Chưa có lịch sử ôn phân trang, xóa vĩnh viễn, xuất dữ liệu hoặc cơ chế dọn biên nhận; phải bổ sung cùng chính sách lưu trữ/xóa tài khoản. Không tự xóa review_events để giữ lịch sử học.
- Con số 8–12 từ mới trong một số nội dung bài học không đồng nghĩa phải giới thiệu đủ số flashcard trong ngày. Mặc định module vẫn là 5; học viên có thể điều chỉnh 0–30 theo sức học.
