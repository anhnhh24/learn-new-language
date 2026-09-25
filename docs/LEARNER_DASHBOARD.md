# Thống kê học tập từ PostgreSQL

`GET /api/v1/me/dashboard?days=30&coursePage=1&coursePageSize=10`

Yêu cầu bearer session, tài khoản Active đã xác minh email, PostgreSQL và `Features:LearnerApiEnabled`. Response `Cache-Control: no-store`. Không nhận learnerId từ query. days từ 1–90, coursePage từ 1–10000, coursePageSize từ 1–50; ngoài giới hạn trả DASHBOARD_FILTER_INVALID (422).

## Response

- `generatedAt`: giờ server UTC khi bắt đầu thu thập.
- `timeZone`: múi giờ hiện tại của hồ sơ.
- `overview`: tổng quan toàn bộ tài khoản.
- `courses`: danh sách phân trang thống kê theo enrollment/course version, có hasMore; không phụ thuộc cửa sổ days.
- `days`: đủ số ngày yêu cầu, tăng dần và có ngày hiện tại; ngày không có hoạt động có các số đếm 0.
- `measurementPolicy`: learning-dashboard-v1.

Các phần đọc trong một transaction RepeatableRead, để một quiz vừa nộp không xuất hiện trong tổng quan nhưng lại thiếu trong biểu đồ của cùng response. Endpoint chỉ đọc, không tự chấm bài hết hạn hoặc sửa tiến độ.

## Ý nghĩa chỉ số

PublishedLessons, CompletedLessons, LessonsNeedingReview, LessonsWithQuiz và MeanFirstQuizAccuracy chỉ lấy các lesson Published thuộc enrollment Active/Completed. Khóa đã thu hồi vẫn có thể xuất hiện nếu enrollment còn được giữ để học viên xem lịch sử; không đồng nghĩa có quyền mở bài mới.

MeanFirstQuizAccuracy là trung bình không trọng số của firstQuizAccuracy ở các bài đã nộp quiz trong phạm vi trên; mỗi bài có trọng số bằng nhau, gồm cả checkpoint. Giá trị từ 0–1, làm tròn 4 chữ số; chưa có dữ liệu trả null, không trả 0. Các lần làm lại không ghi đè chỉ số này. Không gọi đây là mức thành thạo hay điểm TOEIC dự đoán.

CompletedLessons yêu cầu tiến độ đánh dấu hoàn thành; khác với đạt ngưỡng checkpoint. PassedCheckpoints ở mỗi khóa đếm **số checkpoint khác nhau đã từng đạt**, không đếm số lượt làm lại đạt. TotalCheckpoints chỉ đếm checkpoint Published trong khóa. Không tự đánh dấu khóa Completed từ các con số này.

GradedQuizAttempts và PassedCheckpointAttempts trong overview đếm **lượt làm** trên toàn bộ lịch sử quiz của tài khoản, kể cả khóa/bài không còn trong danh sách Published. Vì phạm vi khác nhau, không lấy PassedCheckpointAttempts chia cho TotalCheckpoints của khóa.

OpenErrors/ImprovingErrors đếm bản ghi lỗi nguồn, không phải số chủ điểm yếu khác nhau. DueCards chỉ tính thẻ cá nhân đã giới thiệu, chưa lưu trữ và dueAt <= generatedAt. UnintroducedCards là số thẻ chưa giới thiệu, không phải quota thẻ mới còn lại trong ngày; lấy quota ở API flashcard queue.

## Biểu đồ ngày

Days dùng ngày địa phương theo múi giờ hồ sơ hiện tại. Đổi múi giờ sẽ nhóm lại lịch sử; không lưu timezone snapshot cho từng hoạt động.

- LessonsCompleted: số bài có completedAt trong ngày, kể cả bài/khóa đã lưu trữ sau đó.
- QuizzesSubmitted: số quiz đã chấm, nhóm theo submittedAt. Quiz quá hạn được chấm khi mở lại có submittedAt bằng deadline, nên số liệu ngày cũ có thể được bổ sung sau.
- CardReviews: số review event không phải ôn sớm; mỗi lượt quên và ôn lại hợp lệ có thể được đếm riêng, không phải số thẻ duy nhất.
- EarlyCardReviews: số lượt ôn trước dueAt, tách khỏi CardReviews.

Biểu đồ chưa có hoạt động chỉ đọc trang hoặc thời lượng học vì hiện chưa có event/timer tin cậy. Ngày toàn số 0 có nghĩa không có các sự kiện được đo ở trên, không chứng minh học viên không học. Không suy luận streak, giờ học hoặc trình độ từ biểu đồ này.

## Triển khai và phần còn lại

Cần schema tới migration 016; migration 017 bổ sung index cho review event và completion theo tài khoản/thời gian. Các migration mới chưa được chạy trong lượt code này.

Chưa nối frontend dashboard, chưa có thống kê tag/mastery, biểu đồ theo Part, kế hoạch học cá nhân hoặc quy trình correction/regrade làm mất hiệu lực kết quả cũ. Đây là thống kê mô tả dữ liệu đã ghi nhận, không phải đánh giá năng lực.

Build backend để kiểm tra biên dịch. Không chạy test, migration hoặc smoke API theo yêu cầu. Cần kiểm chứng SQL trên PostgreSQL, biên ngày/múi giờ, tài khoản trống, phân trang, quyền sở hữu và số đếm sau retry khi đến đợt test.
