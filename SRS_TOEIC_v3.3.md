---
title: "Đặc tả yêu cầu website luyện thi TOEIC và IELTS Reading"
version: "3.3"
status: "Đã chốt"
last_updated: "2026-09-22"
document_type: "Software Requirements Specification"
primary_scope: "TOEIC Listening and Reading"
language: "vi"
---

# Đặc tả yêu cầu website luyện thi TOEIC và IELTS Reading

> Bản Markdown phục vụ triển khai, chuyển đổi từ `SRS_TOEIC_v3.3.docx`. Nội dung nghiệp vụ, mã yêu cầu và tiêu chí kiểm thử được giữ nguyên.

**Phiên bản 3.3 • Ngày 22 tháng 09 năm 2026**

**Mục đích:** Làm baseline sản phẩm, thiết kế, lập trình và kiểm thử cho website luyện thi TOEIC Listening & Reading trước, mở rộng IELTS Academic Reading sau. Phiên bản 3.3 chốt Controlled AI Item Factory để tạo nội dung gốc khi chưa có kho đề và chưa có reviewer chuyên môn thường trực.

**Kết luận sản phẩm:** TOEIC là sản phẩm đầu tiên. R0A ưu tiên Part 5 và Part 7 có thể kiểm chứng; các Part còn lại mở theo cổng chất lượng. AI chỉ tạo candidate trong blueprint, qua validator, hai solver độc lập, adversarial critic, perturbation và form gate. Khi chưa có chuyên gia, hệ thống chỉ phát hành BetaPractice hoặc DataValidatedPractice, không tuyên bố đề chuẩn hóa hay điểm tương đương TOEIC chính thức.

**Đối tượng đọc:** Product Owner, Business Analyst, UX/UI, lập trình viên, QA, giáo viên, biên tập viên và vận hành.

**Tình trạng quyết định:** Đã chốt TOEIC-first, IELTS chỉ Reading ở giai đoạn kế tiếp, không crawl làm nguồn nội dung, và dùng Controlled AI Item Factory làm đường sản xuất chính. Manual review vẫn được giữ cho tương lai và cho nội dung import/licensed; nó không còn là điều kiện để mở BetaPractice của nội dung gốc đã đạt toàn bộ automated gates. Mục 28 là đặc tả ràng buộc cho việc code.

## Mục lục

- [1 Phạm vi và thuật ngữ](#1-phạm-vi-và-thuật-ngữ)
- [2 Đánh giá tài liệu ban đầu](#2-đánh-giá-tài-liệu-ban-đầu)
- [3 Nghiên cứu và định hướng người dùng](#3-nghiên-cứu-và-định-hướng-người-dùng)
- [4 Phạm vi các bản phát hành](#4-phạm-vi-các-bản-phát-hành)
- [5 Vai trò và phân quyền](#5-vai-trò-và-phân-quyền)
- [6 Hành trình và cấu trúc màn hình](#6-hành-trình-và-cấu-trúc-màn-hình)
- [7 Yêu cầu chức năng bản nền tảng](#7-yêu-cầu-chức-năng-bản-nền-tảng)
- [8 Lộ trình và thuật toán học tập](#8-lộ-trình-và-thuật-toán-học-tập)
- [9 Luyện thi và vòng đời bài làm](#9-luyện-thi-và-vòng-đời-bài-làm)
- [10 Chấm bài Viết và Nói ngoài phạm vi hiện tại](#10-chấm-bài-viết-và-nói-ngoài-phạm-vi-hiện-tại)
- [11 Nội dung và quản trị](#11-nội-dung-và-quản-trị)
- [12 Thanh toán và quyền truy cập](#12-thanh-toán-và-quyền-truy-cập)
- [13 Cộng đồng và lớp học mở rộng](#13-cộng-đồng-và-lớp-học-mở-rộng)
- [14 Quy tắc nghiệp vụ xuyên suốt](#14-quy-tắc-nghiệp-vụ-xuyên-suốt)
- [15 Dữ liệu nghiệp vụ và tính toàn vẹn](#15-dữ-liệu-nghiệp-vụ-và-tính-toàn-vẹn)
- [16 Hợp đồng API và tích hợp](#16-hợp-đồng-api-và-tích-hợp)
- [17 Yêu cầu phi chức năng](#17-yêu-cầu-phi-chức-năng)
- [18 Đo lường sản phẩm](#18-đo-lường-sản-phẩm)
- [19 Use case trọng yếu](#19-use-case-trọng-yếu)
- [20 Kịch bản kiểm thử và truy vết](#20-kịch-bản-kiểm-thử-và-truy-vết)
- [21 Kiến trúc triển khai tham khảo](#21-kiến-trúc-triển-khai-tham-khảo)
- [22 Backlog và điều kiện phát hành](#22-backlog-và-điều-kiện-phát-hành)
- [23 Quyết định còn mở và quản lý thay đổi](#23-quyết-định-còn-mở-và-quản-lý-thay-đổi)
- [24 Tài liệu tham khảo](#24-tài-liệu-tham-khảo)
- [25 Cổng tạo đề và trích xuất bằng AI](#25-cổng-tạo-đề-và-trích-xuất-bằng-ai)
- [26 Thu nhận, chuẩn hóa và nạp đề đa nguồn](#26-thu-nhận-chuẩn-hóa-và-nạp-đề-đa-nguồn)
- [27 Nhà máy nội dung TOEIC từ số 0](#27-nhà-máy-nội-dung-toeic-từ-số-0)
- [28 Phương án kiểm định đề AI khi chưa có người duyệt](#28-phương-án-kiểm-định-đề-ai-khi-chưa-có-người-duyệt)

## 1 Phạm vi và thuật ngữ

### 1.1 Phạm vi sản phẩm

Website giao diện tiếng Việt dành cho người tự luyện TOEIC Listening & Reading. Phạm vi sản phẩm bao phủ Part 1-7 và full simulation, nhưng phát hành theo cổng chất lượng: R0A ưu tiên Part 5 và Part 7 trực tiếp; R0B mở rộng Reading; R1 mới mở Listening và full simulation Beta. Không ép đủ Part bằng cách clone hoặc nới gate.

Cổng nội dung cho Admin và các vai trò được cấp permission: nhập tay, nhập DOCX theo mẫu, trích PDF có text, gắn audio/hình và AI hỗ trợ tạo câu hỏi. R1 hoàn thiện scan/OCR, đối chiếu audio, AI tạo cụm Part 6–7 và thương mại. R2 thêm IELTS Academic Reading, không IELTS overall, Listening, Writing hoặc Speaking. FR-28–32 được giữ ở mục 10 để tham khảo R3, không thuộc backlog R0–R2.

Tiếng Nhật/JLPT, thi vào 10, lớp học mở và giám hộ là R3 chưa cam kết. Pilot đề xuất người trưởng thành luyện TOEIC; không mặc định website phục vụ mọi độ tuổi hoặc mọi chứng chỉ. Mọi mode tạo đề sử dụng QuestionGroup/Stimulus dùng chung; không coi một trang PDF là một câu hỏi.

### 1.2 Ngoài phạm vi baseline

Ứng dụng native; livestream; marketplace giáo viên; lịch đặt lớp 1-1; thi cấp chứng chỉ; giám sát thi bằng camera; phát hiện gian lận tuyệt đối; mạng xã hội mở; chatbot tư vấn tự do không giới hạn; xuất bản thẳng nội dung AI vào đề chấm điểm mà không qua quality gates/pilot; cam kết đạt band; tự động quy đổi CEFR, IELTS, TOEIC, JLPT thành một thang chung.

### 1.3 Quy ước yêu cầu

FR là yêu cầu chức năng; BR là quy tắc nghiệp vụ; NFR là yêu cầu phi chức năng; AC là tiêu chí nghiệm thu; TC là kiểm thử; D là quyết định. Mỗi FR có giai đoạn, hành vi và AC có thể quan sát. MUST nghĩa là bắt buộc trong giai đoạn được gán. Hạng mục R2 không là điều kiện nghiệm thu R0.

| **Thuật ngữ**     | **Định nghĩa trong hệ thống**                                                          |
|-------------------|----------------------------------------------------------------------------------------|
| Course / khóa     | Tập hợp module và bài học có phiên bản và mục tiêu                                     |
| Lesson / bài học  | Chuỗi trang và hoạt động thực hành có mục tiêu cụ thể                                  |
| Knowledge tag     | Điểm kiến thức cụ thể, ví dụ present simple hoặc inference                             |
| Attempt           | Một lần làm quiz, chẩn đoán hoặc đề; có dữ liệu độc lập                                |
| Completion        | Đã hoàn tất các hoạt động bắt buộc; không đồng nghĩa thành thạo                        |
| Mastery indicator | Chỉ báo thực hành nội bộ theo kiến thức, không là chứng chỉ                            |
| Exam profile      | Cấu hình kỳ thi, biến thể, thời gian, phần thi, rubric và chính sách chấm có phiên bản |
| Entitlement       | Quyền truy cập tài nguyên, thời hạn và nguồn cấp quyền                                 |
| Placement         | Chẩn đoán đầu vào để gợi ý nội dung; không xác nhận band chính thức                    |
| SRS ôn tập        | Spaced repetition scheduling, khác với SRS tài liệu yêu cầu này                        |
| Snapshot          | Bản bất biến của nội dung/cấu hình được dùng cho một lần học hoặc thi                  |

## 2 Đánh giá tài liệu ban đầu

### 2.1 Những điểm nên giữ

Kho nội dung dùng chung; hai nhánh học nền tảng và luyện thi; bài giảng dạng trang; metadata kiến thức; phản hồi từ bài thi về kế hoạch học; flashcard; giáo viên tham gia chấm; responsive. Các điểm này tạo được hệ thống có vòng học rõ ràng, phù hợp phát triển từng phần.

### 2.2 Những thiếu sót và hướng sửa

| **Vấn đề trong bản 1.0**                               | **Hệ quả với người dùng hoặc code**                    | **Thay đổi ở bản 2.0**                              |
|--------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------|
| Anh, Nhật, nhiều kỳ thi và mọi cấp độ cùng một phạm vi | Nội dung và logic điểm bị trộn; MVP quá lớn            | Chia R0–R3 và version exam profile                  |
| Placement 15–20 câu kết luận N4 hoặc IELTS 5.0         | Tạo độ chính xác giả, có thể bỏ sót Nói/Viết           | Trả hồ sơ kỹ năng đã đo và mức gợi ý nội bộ         |
| Bỏ placement thì mặc định thấp nhất                    | Người đã biết bị buộc học lại                          | Trạng thái Unknown; cho tự chọn điểm bắt đầu        |
| Mini-check phải đúng mới sang trang                    | Học sinh mắc kẹt hoặc đoán đáp án                      | Giải thích sau lần thử; tiếp tục với cờ cần ôn      |
| Đọc hết trang được coi như nắm bài                     | Dashboard gây hiểu nhầm                                | Completion và mastery tách biệt                     |
| Không cho thoát phòng thi                              | Trình duyệt không bảo đảm điều này; mất bài khi reload | Timer server, autosave, resume, cảnh báo rời trang  |
| Chấm điểm chung cho mọi kỳ thi                         | Quy đổi thiếu căn cứ                                   | Profile điểm riêng, ghi rõ ước lượng hoặc raw score |
| Tự chèn bài và khóa đề tiếp theo                       | Kế hoạch quá tải, giảm quyền chủ động                  | Đề xuất có lý do, xem trước, chấp nhận/hoãn         |
| Chỉ có flashcard, thiếu chữa lỗi theo ngữ cảnh         | Người học nhớ đáp án nhưng không sửa kiến thức         | Error notebook và câu tương đương                   |
| AI chấm nhanh nhưng thiếu kiểm định                    | Phản hồi không ổn định và khó khiếu nại                | Rubric version, fallback, audit, human review       |
| CMS chỉ là CRUD                                        | Sửa đáp án làm đổi lịch sử; đề lỗi ra production       | Draft, review, publish, archive, snapshot, regrade  |
| Thanh toán không có lifecycle                          | Thu tiền trùng, cấp quyền sai                          | Webhook xác minh, idempotency, reconciliation       |
| Phân quyền chỉ theo vai trò                            | Giáo viên có thể xem bài ngoài phạm vi                 | Role + ownership + assignment + entitlement         |
| Hiệu năng dưới 2 giây không nêu điều kiện              | Không thể nghiệm thu nhất quán                         | Ngưỡng p95, mạng, tải và kịch bản xác định          |
| Log mọi hành vi không giới hạn                         | Tích lũy dữ liệu nhạy cảm không cần thiết              | Danh mục event, tối thiểu hóa, retention            |
| Phasing đẩy ôn tập quá muộn                            | MVP chỉ đọc bài và làm quiz rời rạc                    | Ôn tập và sổ lỗi sai thuộc R0                       |

### 2.3 Thứ tự ưu tiên cải tiến

Ưu tiên cao nhất: nội dung có chất lượng, lưu tiến độ tin cậy, giải thích đáp án, sổ lỗi sai, lịch ôn, màn hình “Hôm nay”, kiểm soát xuất bản. Tiếp theo: luyện thi, kế hoạch theo lịch rảnh, báo cáo theo kiến thức. Sau cùng: chấm AI, cộng đồng mở rộng và ngôn ngữ thứ hai. Chưa cần bảng xếp hạng công khai hoặc tích điểm phức tạp để xác thực giá trị cốt lõi.

## 3 Nghiên cứu và định hướng người dùng

### 3.1 Bằng chứng và giới hạn diễn giải

Nghiên cứu bàn sử dụng các nguồn sơ cấp hoặc trang chính thức ở mục 24, truy cập ngày 22/09/2026. Chưa có phỏng vấn, thử nghiệm usability hay số liệu người dùng riêng của website. Persona và KPI dưới đây là giả thuyết sản phẩm cần kiểm chứng.

| **Bằng chứng tham khảo**                                                                                           | **Hàm ý cho sản phẩm**                                 | **Giới hạn**                                                 |
|--------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------------|
| Tổng quan Dunlosky và cộng sự đánh giá practice testing và distributed practice có ích trong nhiều bối cảnh \[S1\] | Đưa tự trả lời và ôn cách quãng vào vòng học           | Không chứng minh lịch 1–3–7 ngày là tối ưu cho mọi người     |
| British Council mô tả level test trực tuyến là chỉ dấu gần đúng \[S2\]                                             | Placement chỉ dùng gợi ý học; hiển thị phần chưa đo    | Không suy ra band IELTS từ vài câu trắc nghiệm               |
| Duolingo công bố nghiên cứu người dùng về nhu cầu xem lại lỗi và luyện điểm yếu \[S3\]                             | Thiết kế sổ lỗi sai, liên kết bài chữa lỗi             | Bằng chứng từ sản phẩm khác; phải kiểm tra lại tại Việt Nam  |
| PREP mô tả study plan và luyện tập có hỗ trợ AI \[S4\]                                                             | Người học cần kế hoạch dễ hành động và phản hồi cụ thể | Mô tả của nhà cung cấp, không là bằng chứng hiệu quả so sánh |
| IELTS có nhiều kỹ năng và quy tắc chấm riêng \[S5, S6\]                                                            | Không dùng một tỷ lệ đúng cho toàn bộ IELTS            | Bảng raw-to-band có biến thiên theo đề                       |
| TOEIC L&R đánh giá Nghe và Đọc \[S7\]; JLPT có scaled scores và ngưỡng phần \[S8\]                                 | Mỗi exam profile cần logic riêng                       | Không tự chế bảng điểm rồi gọi là điểm chính thức            |
| WCAG 2.2 và OWASP cung cấp yêu cầu tiếp cận và rủi ro API \[S9, S10\]                                              | Có kiểm thử bàn phím và quyền truy cập đối tượng       | Áp dụng checklist không tự chứng minh đạt mọi chuẩn          |

### 3.2 Persona và nhu cầu

| **Persona giả thuyết** | **Hoàn cảnh và trở ngại**               | **Nhu cầu ưu tiên**                           | **Thiết kế đáp ứng**                            |
|------------------------|-----------------------------------------|-----------------------------------------------|-------------------------------------------------|
| Người học lại nền tảng | Chưa biết bắt đầu đâu, ngại bài dài     | Bài ngắn, giải thích tiếng Việt, ít áp lực    | Chọn điểm bắt đầu, bài 5–15 phút, gợi ý sau sai |
| Sinh viên luyện TOEIC  | Có hạn thi, lịch học thay đổi           | Luyện dạng đề, biết phần yếu, điều chỉnh lịch | Lịch rảnh, drill theo part, lịch thi và review  |
| Người đi làm           | Học ngắt quãng trên điện thoại          | Tiếp tục nhanh, không mất dữ liệu             | Resume, ôn 5 phút, nhắc học có kiểm soát        |
| Người luyện IELTS      | Kỹ năng lệch, cần phản hồi bài sản xuất | Rubric rõ, biết sửa ở đâu, giáo viên hỗ trợ   | Bài Viết/Nói, phản hồi dẫn chứng, bản sửa lại   |
| Giáo viên / biên tập   | Thời gian soạn và chữa bài hạn chế      | Tái sử dụng, kiểm duyệt, phân công            | CMS có version, ngân hàng câu, hàng đợi         |
| Vận hành / hỗ trợ      | Lỗi nội dung, truy cập hoặc giao dịch   | Điều tra có dấu vết và phạm vi quyền          | Ticket, audit, đối soát, cấp quyền có lý do     |

Pilot mặc định đề xuất người dùng từ 18 tuổi, giao diện tiếng Việt, có điện thoại hoặc laptop và có thể học 15–30 phút mỗi ngày. Đây là giới hạn thử nghiệm sản phẩm, không phải kết luận pháp lý về độ tuổi. Học sinh nhỏ tuổi là phân khúc mở rộng cần thiết kế nội dung, quyền riêng tư và cơ chế người giám hộ phù hợp trước khi mở đăng ký.

### 3.3 Jobs to be done

Khi mở website trong thời gian rảnh, tôi muốn biết việc học nhỏ nhất nên làm tiếp để bắt đầu ngay. Khi trả lời sai, tôi muốn hiểu vì sao và thử câu khác để tránh lặp lỗi. Khi nghỉ vài ngày, tôi muốn quay lại với kế hoạch vừa sức. Khi luyện đề, tôi muốn bài làm được giữ và biết phần nào cần cải thiện. Khi mua khóa, tôi muốn hiểu chính xác mua được gì và còn quyền truy cập bao lâu.

### 3.4 Kế hoạch xác thực với người dùng

Trước khi mở rộng thương mại, phỏng vấn 8-12 người thuộc ba nhóm đầu. Khi có thể tiếp cận giáo viên TOEIC, bổ sung 2-3 buổi audit theo batch; việc chưa có giáo viên không chặn BetaPractice nhưng chặn ExpertReviewed/CalibratedMock. Hỏi về lần học gần nhất, thời điểm bỏ cuộc, cách ghi nhớ lỗi, thiết bị, khả năng chi trả và thời gian thực tế; tránh hỏi dẫn dắt “bạn có thích AI không”.

Pilot 4 tuần với nhóm tuyển có đồng ý tham gia. Dùng bài trước/sau cùng blueprint nhưng câu khác, phân biệt người bỏ dở; không diễn giải tăng điểm làm lại cùng đề là tăng năng lực. Kết quả pilot giúp điều chỉnh độ khó, nội dung và trải nghiệm TOEIC; TOEIC là ưu tiên đã được người dùng chọn, không dùng cỡ mẫu nhỏ để tuyên bố hiệu quả đại diện toàn thị trường.

## 4 Phạm vi các bản phát hành

| **Release**                           | **Phạm vi bắt buộc**                                                                                                                                                    | **Điều kiện nghiệm thu**                                                                                                                |
|---------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| R0A TOEIC Beta an toàn                | Part 5 theo grammar blueprint và Part 7 câu hỏi thông tin trực tiếp; tài khoản, luyện tập, chữa lỗi, báo lỗi câu hỏi; Controlled AI Item Factory bật bằng feature flag. | Chỉ phát hành Auto-validated Beta; 100% blocking gate đạt; không hiển thị điểm TOEIC ước lượng; telemetry và auto quarantine hoạt động. |
| R0B TOEIC Reading mở rộng             | Part 6 và Part 7 đa dạng hơn; form assembler Reading; Data-validated Practice dựa trên pilot.                                                                           | Câu chỉ được nâng tier khi đạt ngưỡng dữ liệu có version; câu bất thường tự cách ly; chưa gọi là đề chuẩn hóa.                          |
| R1 TOEIC Listening và full simulation | Part 1-4, TTS/audio manifest, full TOEIC simulation và composer đủ 200 câu.                                                                                             | Audio qua ASR round-trip, signal QA và kiểm định chéo; toàn bộ đề gắn Beta nếu chưa có expert audit; chỉ raw score.                     |
| R2 IELTS Reading                      | IELTS Academic Reading, full Reading và practice passage; profile, question type và policy riêng.                                                                       | 3 passages, 40 câu/60 phút theo profile \[S6\]; không tính IELTS overall; dùng pipeline riêng, không tái dùng rule TOEIC mù quáng.      |
| R3 chưa cam kết                       | Expert review, calibrated mock, IELTS Listening/Writing/Speaking, lớp học, giám hộ, Nhật/JLPT.                                                                          | SRS bổ sung và quyết định đầu tư riêng; ExpertReviewed và CalibratedMock không được bật khi chưa có chuyên gia.                         |

R0 hiển thị TOEIC, phần bổ trợ và cổng nội dung theo quyền. R0A chỉ mở Part đã đạt gate của mục 28; không hiển thị menu hoặc full mock chưa đủ bank. AI tạo nội dung thuộc R0/R1, khác với AI chấm Viết/Nói thuộc R3. Feature flag được kiểm tra tại API và worker, không chỉ ẩn menu. Các endpoint quota học viên không dùng chung sổ ngân sách AI của nhân sự.

## 5 Vai trò và phân quyền

Một tài khoản có thể có nhiều vai trò; phân quyền áp dụng theo từng hành động và tài nguyên. Mặc định deny. Quyền xem danh sách không tự bao gồm quyền xem bản ghi âm hoặc bài viết riêng tư.

| **Hành động**               | **Khách** | **Học viên** | **Biên tập**                              | **Duyệt nội dung**                | **Giáo viên**                 | **Hỗ trợ**       | **Quản trị**                                  |
|-----------------------------|-----------|--------------|-------------------------------------------|-----------------------------------|-------------------------------|------------------|-----------------------------------------------|
| Xem catalog và bài mẫu      | Có        | Có           | Có                                        | Có                                | Có                            | Có               | Có                                            |
| Học và xem lịch sử          | Mẫu       | Của mình     | Theo quyền học                            | Theo quyền học                    | Theo quyền học                | Không            | Không mặc định                                |
| Tạo và sửa nội dung         | Không     | Không        | Phạm vi được giao                         | Phạm vi được giao                 | Nếu có quyền biên tập         | Không            | Theo permission                               |
| Xuất bản                    | Không     | Không        | Beta nếu có quyền và mọi gate tự động đạt | Level 3 trở lên khi có chuyên gia | Không                         | Không            | Beta có kiểm soát; không bypass blocking gate |
| Chấm bài                    | Không     | Không        | Không                                     | Không                             | Bài được giao                 | Không            | Chỉ nếu có quyền chấm                         |
| Xem tình trạng tài khoản    | Không     | Của mình     | Không                                     | Không                             | Học viên được giao, tối thiểu | Tối thiểu        | Có theo nghiệp vụ                             |
| Xử lý quyền học / giao dịch | Không     | Xem của mình | Không                                     | Không                             | Không                         | Theo permission  | Có                                            |
| Phân quyền nhân sự          | Không     | Không        | Không                                     | Không                             | Không                         | Không            | Có và MFA                                     |
| Xem audit                   | Không     | Không        | Không                                     | Nội dung liên quan                | Bài liên quan                 | Ticket liên quan | Quyền audit riêng                             |

BR-AUTH-01: Kiểm tra đồng thời danh tính, permission, ownership/assignment, trạng thái và entitlement tại backend. Giáo viên không dùng ID đoán được để đọc bài của lớp khác. Hỗ trợ không được xem mật khẩu, token, đáp án đề chưa phát hành hoặc audio học viên nếu không có nghiệp vụ và quyền cụ thể.

BR-AUTH-02: Admin không có đường tắt sửa điểm trực tiếp. Sửa điểm đi qua regrade/review, lưu điểm cũ, người sửa, lý do và thông báo. Truy cập hỗ trợ đặc biệt cần ticket và audit; không dùng impersonation trong R0.

## 6 Hành trình và cấu trúc màn hình

### 6.1 Hành trình chính

Khách xem bài mẫu → đăng ký → chọn mục tiêu và quỹ thời gian → làm hoặc bỏ qua placement → xem kế hoạch → học bài đầu → làm quiz → đọc giải thích → lưu lỗi/từ → ôn đến hạn → xem tiến bộ và tiếp tục. Kết quả quiz thấp dẫn tới gợi ý chữa lỗi, không dẫn tới trang mua gói bắt buộc.

### 6.2 Danh sách màn hình

| **ID** | **Màn hình**                   | **Nội dung và trạng thái cần thiết**                                                               |
|--------|--------------------------------|----------------------------------------------------------------------------------------------------|
| UI-01  | Catalog và chi tiết khóa       | Mục tiêu, trình độ, thời lượng ước tính, nội dung mẫu, điều kiện truy cập, trạng thái chưa có khóa |
| UI-02  | Đăng ký / đăng nhập            | Validation, xác minh email, quên mật khẩu, hết hạn, giới hạn thử                                   |
| UI-03  | Onboarding / placement         | Lưu từng bước, bỏ qua, kỹ năng chưa đo, kết quả định hướng                                         |
| UI-04  | Hôm nay                        | Tiếp tục bài, ôn đến hạn, việc tiếp theo, thời gian ước tính, kế hoạch trống                       |
| UI-05  | Lộ trình                       | Tuần/ngày, lý do đề xuất, lịch rảnh, quá tải, chấp nhận thay đổi                                   |
| UI-06  | Bài học                        | Mục lục trang, bookmark, mini-check, audio, báo lỗi, trạng thái lưu                                |
| UI-07  | Quiz / kết quả                 | Đáp án người học, đúng/sai, giải thích, tag, thêm ôn tập                                           |
| UI-08  | Sổ lỗi sai                     | Lọc kiến thức, lỗi mở/đã cải thiện, luyện câu tương đương                                          |
| UI-09  | Flashcard                      | Hàng đợi đến hạn, hiện đáp án, đánh giá nhớ, kết thúc phiên                                        |
| UI-10  | Phòng thi TOEIC R0             | Preflight, timer, điều hướng, cờ câu hỏi, autosave, mất mạng, hết giờ                              |
| UI-11  | Kết quả TOEIC R0 và Reading R2 | Điểm thô, điểm ước lượng nếu có, độ đầy đủ, phần yếu và bài học liên quan                          |
| UI-12  | Bài Viết/Nói R3 dự trữ         | Rubric, recorder, upload, quota, hàng đợi, phản hồi, gửi sửa lại                                   |
| UI-13  | Dashboard                      | Completion, chỉ báo kiến thức, lịch sử, dữ liệu chưa đủ, bộ lọc thời gian                          |
| UI-14  | Tài khoản                      | Quyền riêng tư, múi giờ, lịch nhắc, thiết bị, export/delete                                        |
| UI-15  | CMS và review                  | Draft, diff, preview mobile, kiểm tra thiếu nội dung, duyệt, từ chối                               |
| UI-16  | Giáo viên R3 dự trữ            | Queue, deadline, rubric, nhận/trả bài, conflict phân công                                          |
| UI-17  | Thanh toán R1                  | Giá và quyền học, pending/success/failure/refund, lịch sử                                          |
| UI-18  | Hỗ trợ / audit                 | Ticket, báo lỗi, đối soát, log hành động, dữ liệu đã che                                           |

Mọi màn hình có loading, empty, error, retry và success khi phù hợp. Không dùng màu là dấu hiệu duy nhất cho đúng/sai. Mobile 360px không cuộn ngang toàn trang; bảng dài có vùng cuộn riêng. Luồng học hỗ trợ bàn phím; audio chỉ phát khi người dùng thao tác.

## 7 Yêu cầu chức năng bản nền tảng

### 7.1 Tài khoản và thiết lập

**FR-01 — Đăng ký và xác minh email \[R0\].** Khách nhập email, mật khẩu, tên hiển thị và xác nhận điều khoản/nhóm tuổi pilot. Email duy nhất không phân biệt hoa thường. Mật khẩu 12–128 ký tự, cho paste và password manager; không ghi vào log. Tài khoản chưa xác minh được xem nội dung công khai nhưng không tạo lịch sử học lâu dài. Token xác minh dùng một lần, hết hạn 24 giờ; gửi lại tối đa 3 lần/giờ/tài khoản, có rate limit IP.

AC-01: Email hợp lệ tạo PendingVerification; dùng token đúng chuyển Active một lần; token cũ/hết hạn không kích hoạt; request đăng ký lặp không tạo tài khoản mới và không tiết lộ email đã tồn tại bằng thông báo khác biệt.

**FR-02 — Đăng nhập và phiên \[R0\].** Học viên đăng nhập, đăng xuất, xem và thu hồi phiên. Giáo viên/nhân sự bắt buộc MFA trước thao tác riêng. Hết phiên khi đang học phải cho xác thực lại và tiếp tục nội dung đã được server lưu. 5 lần sai trong 15 phút kích hoạt trì hoãn/rate limit; không khóa vĩnh viễn để tránh lạm dụng.

AC-02: Phiên thu hồi không dùng được ở request kế tiếp; không đọc dữ liệu người khác dù thay ID; 401 không xóa dữ liệu bài đã lưu. Phiên nhân sự thiếu MFA không gọi được API đặc quyền.

**FR-03 — Khôi phục và quản lý hồ sơ \[R0\].** Reset password bằng email, token một lần hết hạn 30 phút; reset thành công thu hồi các phiên. Người dùng đổi tên, múi giờ IANA, lịch học, mục tiêu, email có xác minh lại; đổi email/mật khẩu yêu cầu xác thực lại. Không cho tự đổi role hay điểm đánh giá.

AC-03: Reset request luôn trả thông báo chung; token dùng lần hai thất bại; đổi múi giờ chỉ ảnh hưởng lịch tương lai, không sửa timestamp lịch sử.

**FR-04 — Onboarding linh hoạt \[R0\].** Thu mục tiêu học, mức tự đánh giá hoặc “chưa biết”, số phút/ngày (5–180), ngày học trong tuần, sở thích chủ đề tùy chọn. Không bắt buộc số điện thoại hoặc ngày sinh chính xác trong pilot. Lưu từng bước, cho quay lại. Mục tiêu luyện thi chỉ xuất hiện khi release/profile đã bật.

AC-04: Reload tiếp tục bước đã lưu; bỏ placement tạo assessmentStatus=Unknown, không tự gán A1; lịch học rỗng hiện yêu cầu chọn ít nhất một ngày hoặc học tự do.

**FR-05 — Chẩn đoán nền tảng tùy chọn \[R0\].** Bài định hướng nền tảng cố định 24 câu, không chặn truy cập đề TOEIC: 8 từ vựng, 8 ngữ pháp, 8 đọc; tối đa 25 phút, được bỏ qua trước khi bắt đầu. Kết quả trả số đúng từng nhóm, phần chưa đo và khóa khởi đầu đề xuất. Audio chẩn đoán mở rộng là bộ riêng, không tự coi người không làm Nghe là yếu Nghe. Không chấm Nói/Viết qua trắc nghiệm.

AC-05: Kết quả ghi “định hướng học tập”; không hiển thị band hoặc CEFR xác nhận. Khi bỏ dở/hết giờ, hiện tỷ lệ đã trả lời; dưới 18/24 câu trả lời thì không đưa nhóm tổng kết. Từ 18 câu, dùng quy tắc mục 8.1; câu bỏ trống tính 0 và hiện rõ. Retest tạo attempt mới, giữ lịch sử.

### 7.2 Khóa và bài học

**FR-06 — Tìm và tham gia khóa \[R0\].** Lọc Published theo trình độ gắn nhãn, chủ đề, kỹ năng; tìm không phân biệt hoa/thường và dấu trong tiêu đề tiếng Việt. Chi tiết hiển thị mục tiêu, prerequisite khuyến nghị, số bài, thời lượng ước tính, giáo viên/đơn vị biên soạn, bài mẫu và phạm vi quyền học. Enroll khóa miễn phí idempotent.

AC-06: Draft không xuất hiện; enroll hai lần có một enrollment; khóa đã archive không cho enroll mới nhưng chính sách học tiếp phải được áp dụng như mục 11.

**FR-07 — Đọc bài dạng trang \[R0\].** Trang có text, ảnh, bảng, ví dụ, mini-check và audio nếu bài cần nghe. Cho trước/sau, mục lục, bookmark, font 100–200%, ghi chú riêng. Tiến độ trang lưu server khi chuyển trang; hoạt động học không được suy từ thời gian mở tab đơn thuần. Một trang đọc xong khi học viên chọn “Đã đọc”; tự đánh dấu không dùng làm bằng chứng thành thạo.

AC-07: Đổi thiết bị đến trang bookmark gần nhất; ghi chú riêng không xuất hiện trong lớp/CMS; lỗi lưu có nhãn “Chưa đồng bộ” và retry; không hiển thị “Đã lưu” khi chưa ACK.

**FR-08 — Mini-check và hoàn tất bài \[R0\].** Người học thử câu ngắn, nhận giải thích sau lần trả lời đầu hoặc chọn xem giải thích. Sai không khóa trang; gắn tag cần ôn. Lesson Completed khi mọi trang bắt buộc được xác nhận đã đọc và quiz cuối bài được nộp hợp lệ, không yêu cầu quiz đạt. Quiz dưới 80% thêm NeedsReview như một cờ độc lập. Không dùng một enum làm mất trạng thái Completed khi cần ôn.

AC-08: Sai ba lần vẫn học tiếp được; xem lời giải trước khi trả lời đánh dấu Assisted; Completed không làm mastery tự thành 100%; nộp quiz lại không nhân đôi số bài hoàn tất.

**FR-09 — Audio phục vụ học \[R0\].** Hỗ trợ play/pause, tốc độ 0.75/1/1.25/1.5, tua và nghe đoạn trong chế độ học; transcript có nút mở, hiển thị nguồn/giọng khi có. Bài Nghe bắt buộc có audio kiểm tra hoạt động trước publish. Không dùng transcript để chấm phát âm.

AC-09: Mobile không autoplay; audio lỗi có retry và báo lỗi; luyện nghe có bật transcript được ghi Assisted và không so ngang với bài thi điều kiện chuẩn.

**FR-10 — Quiz và giải thích \[R0\].** Câu single choice, multi-select all-or-nothing, điền từ có acceptedAnswers, ghép cặp và sắp xếp. Mỗi câu hiển thị điểm và hướng dẫn trước làm. Quiz cuối bài 5–10 câu; blueprint xác định số lượng, điểm và tag. Phản hồi từng câu cho practice; quiz kiểm tra cuối chương chỉ lộ lời giải sau nộp.

AC-10: API attempt không có answer key; server tự chấm; multi-select chọn thừa không nhận điểm; cùng đáp án và version luôn cùng kết quả; lỗi thiếu câu theo blueprint không tạo đề thiếu mà trả ContentUnavailable.

**FR-11 — Lưu câu và từ \[R0\].** Học viên bookmark câu hỏi và thêm từ từ bài học vào bộ riêng. Thẻ gồm từ/cụm từ, nghĩa trong ngữ cảnh, ví dụ và audio nếu có; định nghĩa do biên tập, không tự lấy toàn bộ từ điển có bản quyền. Một từ nhiều nghĩa có thể là thẻ khác nếu sense/context khác.

AC-11: Thêm cùng sourceCardVersion hai lần chỉ tạo một UserCard; xóa bộ cá nhân không xóa từ nguồn hoặc dữ liệu người khác; giới hạn 100 bộ và 5.000 thẻ cá nhân/người với thông báo rõ.

### 7.3 Ôn tập và báo cáo

**FR-12 — Sổ lỗi sai \[R0\].** Tự lưu câu sai theo attempt, tag, đáp án đã chọn, giải thích và nguồn. Gộp giao diện theo kiến thức nhưng giữ các lần sai. Có trạng thái Open, Improving, Resolved, Ignored; người dùng được đánh dấu bỏ qua với lý do tùy chọn. Đề xuất câu mới cùng tag trước khi lặp câu cũ.

AC-12: Làm đúng lại ngay sau xem lời giải không tự Resolved; hai lần đúng câu không Assisted ở hai ngày khác nhau, trong đó có ít nhất một câu khác nguồn lỗi, cho Resolved. Nếu thiếu câu thay thế chỉ ghi “đã luyện lại”, không khẳng định khắc phục. Sai mới mở lại.

**FR-13 — Ôn flashcard \[R0\].** Hàng đợi ưu tiên dueAt tăng dần, sau đó thẻ mới theo createdAt. Trước hiện đáp án phải có thời gian người học tự nhớ; không bắt buộc nhập chữ. Sau reveal chọn Quên, Khó, Nhớ, Dễ. Giới hạn phiên mặc định 20 thẻ, mới tối đa 5/ngày; người học chỉnh 0–30 thẻ mới/ngày. Thuật toán ở mục 8.3.

AC-13: Review event trùng ID không cập nhật lịch lần hai; thẻ chưa reveal không được gửi rating hợp lệ; quá hạn không tạo hàng nghìn thẻ trong một phiên; pause giữa phiên không mất các rating đã lưu.

**FR-14 — Hôm nay và kế hoạch tuần \[R0\].** Màn hình đưa một việc chính: tiếp tục bài đang dở hoặc hoạt động tiếp theo; kèm ôn đến hạn và sổ lỗi sai. Kế hoạch theo quỹ thời gian, cho đổi ngày và bỏ qua hoạt động đề xuất. Học tự do không bắt buộc deadline.

AC-14: Người mới không có điểm vẫn thấy hành động cụ thể; không có nội dung phù hợp phải nêu thiếu nội dung, không tạo task trỏ tài nguyên không tồn tại; nhiệm vụ hoàn tất không xuất hiện lại do refresh.

**FR-15 — Dashboard \[R0\].** Tách số bài Completed/required, quiz accuracy lần đầu, hoạt động ôn, chỉ báo theo tag và thời gian hoạt động. Filter 7/30/90 ngày. Giải thích mẫu số và dữ liệu chưa đủ; không vẽ tăng điểm giả khi không có test mới.

AC-15: 4 bài hoàn tất trên snapshot 10 bài hiển thị 40%; khóa bản mới có 12 bài không tự làm enrollment cũ thành 33%; thi lại cùng đề đánh dấu Repeat. Chưa đo kỹ năng ghi “Chưa có dữ liệu”, không là 0.

**FR-16 — Nhắc học \[R0\].** In-app và email opt-in; không gửi marketing cùng consent nhắc học. Chọn giờ địa phương, ngày, bật/tắt từng loại. Quiet hours mặc định 21:00–08:00; không gửi reminder trong khoảng này, dời đến 08:00 nếu còn có ích. Tối đa một reminder học/ngày, gộp ôn và bài học; thông báo giao dịch/bảo mật tách riêng.

AC-16: Unsubscribe dừng reminder tiếp theo; đổi timezone không tạo hai reminder cùng localDate; worker retry không gửi trùng theo user/type/localDate; đã hoàn thành mục tiêu ngày thì không gửi nhắc quá hạn.

**FR-17 — Báo lỗi và hỗ trợ \[R0\].** Tại trang/câu/audio gửi loại lỗi, mô tả tối đa 2.000 ký tự và source version; ảnh minh họa tùy chọn đã kiểm tra tệp. Ticket có Open, InProgress, Resolved, Rejected và lý do. Học viên xem ticket của mình.

AC-17: Nội dung sửa sau đó vẫn truy được version bị báo; một lỗi được xác nhận tạo liên kết tới bản sửa; báo cáo không tự đổi đáp án của attempt.

**FR-18 — Quyền dữ liệu cá nhân \[R0\].** Cài đặt giải thích dữ liệu thu, yêu cầu export và xóa tài khoản, thu hồi consent tùy chọn. Export yêu cầu xác thực lại, bao gồm hồ sơ, tiến độ, câu trả lời và ghi chú của mình, không kèm answer key chưa được phép công bố. URL export có hạn 24 giờ; file tự xóa sau 7 ngày. Delete có cửa sổ hủy 7 ngày, khóa tạo dữ liệu mới trong thời gian chờ.

AC-18: Người khác không tải được file dù biết exportId; hủy trước xử lý khôi phục trạng thái; sau xử lý xóa/mã hóa không thể liên kết các dữ liệu học trong phạm vi chính sách, giữ audit tối thiểu theo mục 17. Không gọi soft delete là hoàn tất xóa dữ liệu.

## 8 Lộ trình và thuật toán học tập

### 8.1 Quy tắc chẩn đoán và tín hiệu kiến thức

BR-LEARN-01: Với FR-05, 0–11/24 đúng gợi ý khóa “Củng cố căn bản”, 12–18 gợi ý “Căn bản mở rộng”, 19–24 gợi ý “Tiền trung cấp”. Tên nhóm là nội bộ; ngưỡng phải version và giáo viên duyệt trước pilot. Trình độ CEFR của khóa là metadata nội dung, không chứng nhận năng lực học viên. Kỹ năng chưa đo giữ Unknown. Người học có thể chọn khóa khác và hệ thống lưu lựa chọn riêng với assessment.

BR-LEARN-02: Chỉ báo mastery lấy tối đa 20 đáp án gần nhất trong 30 ngày cho từng tag, chỉ câu có một primaryTag được tính; secondaryTags dùng tìm kiếm. Loại Assisted và chỉ lấy lần tiếp xúc độc lập đầu tiên của mỗi questionFamily trong một cửa sổ 7 ngày. Cần ít nhất 5 family thuộc ít nhất 2 ngày để phân loại. Dưới ngưỡng mẫu: InsufficientEvidence. Tỷ lệ điểm đạt ≥80% là PracticedWell, 50–\<80% Developing, \<50% NeedsPractice. Quá 30 ngày không có bằng chứng hợp lệ chuyển NeedsRefresh, không tự gán yếu.

BR-LEARN-03: Tỷ lệ này là chỉ báo thực hành, không là mô hình tâm trắc đã kiểm định. Không cộng vào chứng chỉ hoặc band. Xem hint/transcript/đáp án trước khi chốt câu trả lời hoặc sửa sau phản hồi làm response Assisted; xem lời giải sau nộp không đổi nhãn của đáp án gốc. Phân loại không đổi lịch sử điểm quiz; chỉ điều khiển gợi ý.

### 8.2 Lập và điều chỉnh kế hoạch

**FR-19 — Kế hoạch theo mục tiêu \[R1\].** Đầu vào: examProfile, mục tiêu tự đặt, ngày thi tùy chọn, lịch rảnh, snapshot nội dung và tín hiệu hiện có. Một kế hoạch Active/ngôn ngữ; đổi mục tiêu archive phiên bản cũ. R0 dùng cùng mô hình nhưng không cần examProfile hoặc deadline.

Thuật toán v1 theo luật: lấy lesson còn thiếu theo prerequisite không có chu trình; ưu tiên tag NeedsPractice có đủ dữ liệu, sau đó nội dung khóa theo thứ tự. Với mỗi ngày có B phút, dành 25% cho ôn, 55% cho bài/drill và 20% dự phòng. Hoạt động không vừa slot chuyển ngày kế tiếp; không cắt một đề full vào slot 20 phút. Tỷ lệ là mặc định cấu hình, không tuyên bố tối ưu học thuật. Người học có thể dành một buổi dài cho thi thử.

Nếu tổng estimatedMinutes vượt sức chứa đến ngày thi, hiện số phút thiếu và ba lựa chọn: tăng quỹ thời gian, giảm phạm vi hoặc đổi ngày; không cam kết đạt điểm. Nếu người dùng giữ lịch, đánh dấu AtRisk và vẫn cho dùng. Thời lượng bài mặc định do biên tập đặt; điều chỉnh theo dữ liệu thực chỉ khi có chính sách version riêng.

AC-19: Cùng input/snapshot/algorithmVersion cho cùng plan; kế hoạch không vượt budget ngày trừ hoạt động dài người dùng đã xác nhận; task không trùng nguồn trong cùng tuần; đổi deadline không reset completion.

**FR-20 — Đề xuất điều chỉnh \[R1\].** Sau một bài thi hợp lệ hoặc tổng kết tuần, tạo proposal gồm phần thay đổi, lý do, thời lượng tăng/giảm. Chỉ thay task tương lai chưa bắt đầu. Người dùng Accept, Dismiss hoặc Later. Không khóa đề tiếp theo vì chưa làm bài bù. Đề xuất chỉ dùng nội dung Published có entitlement hoặc gắn nhãn lựa chọn mua riêng, không lén chèn bài trả phí bắt buộc.

AC-20: Đề xuất đến khi plan đã đổi trả Conflict và sinh lại; accept một lần tạo planVersion mới; dismiss không sửa plan; quá 7 ngày không dùng proposal cũ mà tính lại. Không sinh proposal nếu dữ liệu kỹ năng chưa đủ.

### 8.3 Lịch ôn flashcard v1

Lịch đề xuất có thể code và kiểm thử: thẻ mới intervalDays=0, dueAt=now. Quên đặt bước Relearning, dueAt=now+10 phút và intervalDays=0. Khó đặt interval mới max(1, ceil(interval cũ ×1.2)). Nhớ đặt 1 ngày nếu interval=0, ngược lại ceil(interval×2). Dễ đặt 3 ngày nếu interval=0, ngược lại ceil(interval×3). Interval tối đa 180 ngày. Rating thành công tính dueAt theo số ngày lịch tại timezone người học, giờ mặc định 08:00; nếu đã qua giờ thì lấy ngày đích theo công thức, không đẩy thêm ngày ngoài interval.

Ví dụ: thẻ mới Nhớ ngày 22/09 → đến hạn 23/09 lúc 08:00; tiếp tục Nhớ 23/09 → 25/09; Quên → 10 phút sau. Review xong một card không xuất lại cùng phiên, trừ Quên đến hạn lại và người dùng còn thời gian. Review tự nguyện sớm có thể xem thẻ nhưng không thay dueAt để tránh farm lịch. Dùng server time; interval và algorithmVersion lưu cùng event. Không gọi thuật toán này là SM-2 hoặc FSRS.

## 9 Luyện thi và vòng đời bài làm

### 9.1 Các chế độ

**FR-21 — Drill, practice và mock \[R0\].** Drill tập trung một tag/part, có hint và phản hồi; Practice làm phần có thể pause và phát lại; Mock tuân theo profile thời gian, thứ tự, audio và điều hướng. Màn hình preflight nêu rõ mode, số câu, thời lượng, phần được nghỉ, thiết bị và chính sách mất mạng. Chỉ Mock hợp lệ dùng so sánh mức sẵn sàng; practice có nhãn Assisted khi dùng hỗ trợ.

AC-21: Mode cố định sau Start; server chặn hint/reveal trong Mock; bài practice không xuất hiện như mock trên biểu đồ. Web chỉ cảnh báo rời tab; chuyển tab không tự kết luận gian lận hoặc tự trừ điểm.

**FR-22 — Exam profile có phiên bản \[R0/R2\].** TOEIC L&R baseline gồm Listening 100 câu/45 phút và Reading 100 câu/75 phút \[S7\]. Thời gian hướng dẫn ngoài timer chính. Nội dung, part, rule điều hướng và audio sequence phải được giáo viên duyệt cho một profile cụ thể. R2 chỉ IELTS Academic Reading 40 câu/60 phút \[S6\]; không có overall hoặc section Nghe/Viết/Nói. General Training là profile tương lai riêng, không dùng lại key hoặc score mapping Academic.

AC-22: Profile thiếu section/rubric/scorePolicy không publish; attempt giữ profileVersion; chỉnh profile chỉ áp dụng attempt mới. Trước mỗi release nội dung, đối chiếu hướng dẫn chính thức của đúng biến thể; không hardcode thời gian toàn hệ thống.

**FR-23 — Khởi tạo và lưu bài \[R0\].** Start kiểm tra entitlement, profile Published, đủ tài nguyên, chưa có attempt Active cùng đề. Server sinh snapshot questionVersion, thứ tự câu và option, điểm tối đa, policy, startedAt và deadline. Preflight audio tải sẵn phần cần thiết trước Start. Mỗi response lưu questionId, answer payload, revision, clientOperationId. Không nhận clientScore.

AC-23: Start retry cùng idempotency key trả cùng attempt; UUID option không đổi khi random; autosave ACK trả revision và savedAt; request cũ không ghi đè bản mới; user khác không xem hoặc ghi vào attempt.

**FR-24 — Timer, mất mạng và nhiều thiết bị \[R0\].** Timer căn server deadline của section đang hoạt động, hiển thị bằng serverTime offset. Với TOEIC full test, Listening và Reading có deadline riêng theo FR-52; đóng Listening khi chuyển section và không nhận sửa đáp án section đã đóng. Lưu khi thay đáp án sau debounce 1 giây và heartbeat 10 giây; chuyển câu kích hoạt lưu ngay. Offline giữ pending draft trong IndexedDB có hạn, hiển thị số thay đổi chưa đồng bộ; mock timer vẫn chạy. Đồng bộ chỉ nhận trước deadline, không tin client timestamp để nhận câu trả lời muộn. Một device lease 60 giây được renew mỗi heartbeat; takeover chủ động yêu cầu xác thực, thu hồi lease cũ.

AC-24: Chỉnh đồng hồ máy không thêm giờ; reload phục hồi đáp án server; mạng trở lại sau deadline không chèn được draft muộn; tab cũ sau takeover nhận LeaseLost và chỉ đọc. Nếu không hỗ trợ lưu cục bộ, báo trước Start và vẫn lưu online, không hứa phục hồi offline.

**FR-25 — Nộp và chốt bài \[R0\].** Submit hiển thị số câu bỏ trống và xác nhận nếu tự nộp sớm. Server transaction khóa attempt, chốt responses và chuyển Submitted; worker hết giờ cũng gọi cùng nghiệp vụ. Tại deadline của section, answer save của section đó bị từ chối khi receivedAt ≥ deadline; deadline cuối mới chốt toàn bài. Câu server chưa ACK không thuộc kết quả. Độ trễ worker không kéo dài quyền sửa bài.

AC-25: Submit và timeout chạy đồng thời chỉ có một submission; retry trả cùng receipt; câu gửi đúng deadline bị từ chối nhất quán; nộp thành công nhưng response HTTP mất thì GET attempt trả Submitted và cùng receipt.

**FR-26 — Chấm và hiển thị kết quả \[R0\].** Trắc nghiệm chấm từ snapshot bằng worker idempotent. Câu sai/bỏ trống 0, không trừ âm; partial credit chỉ có khi profile công bố trước. Kết quả có raw score, max score, answered count, elapsed time, mode, version và điểm từng phần. Điểm quy đổi chỉ có khi bảng nội bộ đã duyệt với nguồn/phạm vi; ghi “ước lượng luyện tập”. Không đủ dữ liệu thì không tạo số giả.

AC-26: Worker retry không tạo hai grade; Không hiện IELTS overall khi còn phần chưa chấm; TOEIC không dùng tỷ lệ đúng ×990; JLPT không suy scaled score bằng tỷ lệ tuyến tính. Lỗi chấm chuyển GradingFailed với retry vận hành, giữ bài nguyên vẹn.

**FR-27 — Review và làm lại \[R0\].** Sau release kết quả, học viên xem câu trả lời, đáp án, giải thích và học liệu liên quan theo review policy. Làm lại tạo attempt mới, đánh dấu repeat và không ghi đè lần đầu. Question family từng dùng trong học/quiz phải được ghi nhận exposure khi đo mock.

AC-27: Trước khi được review, API không lộ key/explanation; withdrawn question hiển thị thông báo và phiên bản grade nếu regrade; chart lọc first/last/all với nhãn rõ.

### 9.2 Máy trạng thái

Attempt: InProgress → Submitted → Grading → Graded. Timeout tạo Submitted với submissionReason=Deadline; người dùng hủy tạo Abandoned, không có điểm chứng chỉ ước lượng. Grading lỗi chuyển GradingFailed → Grading khi retry. Bài có phần giáo viên chuyển AwaitingReview sau chấm phần khách quan và sang Graded khi đủ phần. Không chuyển ngược Submitted → InProgress. Sự cố hệ thống diện rộng có thể đánh dấu Invalidated với lý do, giữ lịch sử và cấp attempt thay thế; không sửa startedAt âm thầm.

R0 quiz dùng cùng nguyên tắc snapshot và submit idempotent nhưng không có timer nghiêm ngặt: attempt quiz hết hiệu lực sau 7 ngày không hoạt động; cho khởi tạo mới. Lần bỏ dở không tính là sai trong mastery.

### 9.3 Cấu hình câu hỏi và chính sách điểm

R0 mỗi câu single choice/multi-select/điền từ/sắp xếp có maxScore=1; ghép cặp có điểm mỗi cặp bằng 1/số cặp, chỉ khi blueprint công bố partial credit. Multi-select yêu cầu tập option đúng chính xác, không phụ thuộc thứ tự. Sắp xếp so thứ tự itemId với một trong các acceptedSequences; item trùng chữ vẫn có ID riêng. Điền nhiều ô chấm theo từng ô với tổng điểm câu bằng 1; một ô nhận nhiều cách viết chỉ khi có acceptedAnswers đã duyệt. Tỷ lệ quiz = tổng earned / tổng max ×100, hiển thị một chữ số thập phân; so ngưỡng 80% trên giá trị chưa làm tròn.

R0 TOEIC L&R chỉ dùng câu single choice cho các câu trắc nghiệm thuộc profile này, mỗi câu 1 raw point. Blueprint phải kiểm tra đủ 100 câu Listening và 100 câu Reading. Listening chạy audio sequence theo profile và không cho tua/đổi tốc độ trong Mock; Reading có điều hướng giữa câu của section. Không quay lại Listening sau khi sang Reading. Nếu sự cố audio phía hệ thống làm phần thi không sử dụng được, chuyển Invalidated sau xác nhận vận hành và cấp lượt mới; không trừ điểm vì lỗi hạ tầng.

R2 IELTS yêu cầu hỗ trợ thêm matching headings, matching information, True/False/Not Given, Yes/No/Not Given và gap fill có giới hạn số từ. Các loại matching dùng danh sách chọn có thể thao tác bàn phím; không chỉ kéo thả. Question policy phân biệt một lựa chọn được dùng lại hay không; limit số từ/number áp dụng theo hướng dẫn câu, không một regex toàn hệ thống. Trước release cần golden fixtures cho từng loại câu và các trường hợp gạch nối, apostrophe, số và từ viết tắt.

IELTS Reading R2 hỗ trợ single/multiple choice, matching, True/False/Not Given, Yes/No/Not Given, completion, short answer và diagram labels theo profile. Mỗi ô trả lời được đánh số là một scoring item, tổng 40; một group có thể chứa nhiều item. Key lưu acceptedAnswers/optionIds, wordLimit và policy tái sử dụng option. Điểm là raw /40 và Reading band ước lượng khi có mapping đã duyệt; không tự sinh IELTS overall. Hồ sơ Viết/Nói ở mục 10 chỉ dùng khi R3 được phê duyệt.

## 10 Chấm bài Viết và Nói ngoài phạm vi hiện tại

FR-28–32 và AC tương ứng là thiết kế dự trữ. R0–R2 không cung cấp bài Viết/Nói, lượt chấm hoặc AI band cho các kỹ năng này. AI cổng soạn đề được đặc tả riêng ở mục 25.

**FR-28 — Gửi bài Viết \[R3\].** Editor plain/rich text giới hạn định dạng, đếm từ theo policy của task, autosave draft 5 giây và khi blur. Một submission gắn promptVersion và rubricVersion; tối đa 5.000 từ cho bài học, giới hạn riêng theo task nếu cần. Gửi thiếu dung lượng tối thiểu có cảnh báo nhưng vẫn cho nộp khi rubric cho phép. Không tự sửa văn phong trong Mock.

AC-28: Draft và submitted text tách biệt; paste script được sanitize; quota chỉ tiêu thụ khi submission accepted; submit retry không trừ hai lượt. Bài sửa lại tạo version/lượt mới được công bố trước.

**FR-29 — Gửi bài Nói \[R3\].** Preflight microphone và phát lại bản thử; thu âm theo từng task, cho nghe lại trước nộp trong practice. Hỗ trợ MIME được server công bố, chuẩn hóa audio sau upload; giới hạn 50 MB và 15 phút/bản. Upload chia phần có resume, checksum; quá giới hạn phải chặn trước khi trừ lượt. Không có mic cho upload tệp phù hợp; không hỗ trợ cả hai thì hướng dẫn đổi thiết bị.

AC-29: Từ chối mic không mất draft; mất mạng khi upload tiếp tục từ phần đã nhận; file hỏng không vào queue chấm; im lặng/âm lượng thấp được yêu cầu thu lại hoặc chuyển kiểm tra, không tự kết luận năng lực thấp.

**FR-30 — Hàng đợi và giáo viên chấm \[R3\].** Submission Accepted → Queued → Assigned → InReview → Reviewed → Released. Giáo viên chỉ đọc bài được giao; nhận việc bằng atomic claim. Rubric bắt buộc có điểm từng tiêu chí, dẫn chứng và 1–3 hành động cải thiện. SLA đề xuất 48 giờ lịch tính từ acceptedAt; cảnh báo vận hành sau 36 giờ. Nếu không đủ công suất, báo thời gian trước mua hoặc tạm dừng bán lượt chấm.

AC-30: Hai giáo viên claim chỉ một người thành công; thiếu tiêu chí không release; quá SLA vẫn giữ bài và hiện thời gian cập nhật; phân công lại giữ audit và draft cũ riêng, không công bố bản nháp.

**FR-31 — Phúc khảo và học từ phản hồi \[R3\].** Trong 7 ngày sau Released, học viên gửi một yêu cầu review với lý do. Người review khác người chấm đầu khi có đủ nhân sự; thiếu nhân sự phải thông báo cách xử lý trước bán. Điểm mới có lý do và gradeVersion, giữ điểm cũ. Học viên đánh dấu phản hồi đã đọc và gửi bản sửa để so sánh.

AC-31: Review lần hai bị chặn theo policy; sửa điểm cập nhật biểu đồ bằng version mới và nhãn điều chỉnh; không trừ thêm lượt chỉ vì xử lý lỗi chấm đã xác nhận.

**FR-32 — AI phản hồi có kiểm soát \[R3, feature flag\].** AI là lớp hỗ trợ, không thay thế rubric hoặc điểm giáo viên. Chỉ gửi nội dung cần thiết, ẩn PII nhận diện trực tiếp; lưu provider/model/prompt/rubricVersion và thời điểm. Người học có lựa chọn không dùng AI. Output phải có schema, dẫn chứng từ bài và các bước sửa. Không đủ độ tin cậy thì trả phản hồi giới hạn hoặc chuyển người chấm, không bịa điểm.

AC-32: Provider timeout sau giới hạn cấu hình 90 giây/lần gọi; tối đa 2 retry với backoff cho lỗi tạm thời; worker failure không làm mất bài hoặc trừ thêm quota. Prompt injection trong bài được coi là nội dung, không cho gọi tool hoặc thay rubric. Transcript-only không được chấm độ chính xác phát âm; muốn chấm phát âm phải có mô hình audio phù hợp và bộ kiểm định.

Gate bật điểm AI: bộ đánh giá có đồng ý sử dụng tối thiểu 100 bài/task family, phân bố trình độ và thiết bị; hai người chấm độc lập, xử lý bất đồng. Mục tiêu nội bộ đề xuất MAE ≤0,5 band và ≥90% sai lệch ≤1 band so với nhãn đã thống nhất, báo cáo theo nhóm. Không đạt thì chỉ bật gợi ý không điểm. Đây là ngưỡng phát hành đề xuất, không chứng nhận IELTS. Tỷ lệ khiếu nại, lệch điểm và chi phí được theo dõi sau mở; có kill switch.

## 11 Nội dung và quản trị

**FR-33 — Soạn nội dung có cấu trúc \[R0\].** Khóa → module → lesson → page → block. Block gồm text, image, example, audio, mini-check; không cho HTML/script tùy ý. Lesson cần title, objectives, language, levelLabel, skill, primaryTags, estimatedMinutes, prerequisite, author và quyền sử dụng. Mỗi câu cần type, nội dung theo exam profile (prompt có thể nằm trong audio; Part 1–2 không bắt buộc văn bản hiển thị), option stable IDs khi loại câu có options, answer key, giải thích đúng/sai phù hợp loại, primaryTag, difficulty nội bộ, score, source/license, questionFamilyId.

AC-33: Thiếu explanation, answer key hoặc license status hợp lệ không publish câu; audio lesson Nghe thiếu audio không publish; prerequisite có cycle bị từ chối và chỉ ra đường cycle.

**FR-34 — Import và kiểm tra \[R0/R1\].** Hợp nhất các nguồn vào ImportJob ở mục 25: R0 nhập DOCX theo mẫu và PDF có text; CSV/XLSX theo schema là nguồn bổ sung cho câu độc lập; R1 thêm OCR scan/ảnh. Hạn mức mỗi job theo FR-47. Tải tệp → kiểm tra → tách → đối chiếu → commit Draft. Không tự publish. CSV/XLSX tối đa 1.000 câu/job, không chạy macro/formula; CSV export escape ô công thức. Cụm đoạn đọc/audio cần manifest group, không import chỉ một bảng question phẳng.

AC-34: Preview cho số hợp lệ/lỗi và tham chiếu media thiếu; mặc định atomic import, có lỗi không commit; job retry cùng file hash/idempotency key không tạo duplicate. Người dùng có thể sửa file rồi tạo job mới.

FR-35 — Kiểm định và xuất bản \[R0\]. Nội dung có hai track. HumanTrack giữ Draft → InReview → Approved → Published cho nội dung import/licensed và ExpertReviewed. AutomatedBetaTrack dùng Generated → StructuralValid → CrossModelValid → BetaReady → BetaActive → DataValidatedPractice; chỉ áp dụng nội dung gốc theo mục 28. Published/BetaActive bất biến; edit tạo revision mới. Một lỗi Blocking hoặc solver bất đồng làm Reject/Quarantine. Emergency unpublish cần quyền, lý do và audit. Khi chưa có reviewer, hệ thống không được tạo ExpertReviewed hoặc CalibratedMock.

AC-35: Author/Admin không thể bypass blocking gate hoặc tự gán HumanConfirmed; đang có enrollment/attempt không xóa cứng version; concurrent mutation dùng expectedVersion, sai trả Conflict; rollback đổi pointer Published, không viết đè lịch sử. Beta UI/API hiển thị tier và không dùng nhãn official/standardized.

**FR-36 — Ngân hàng đề và chất lượng \[R0\].** Blueprint quy định section, số câu, question type, thời gian, audio group, tag coverage và độ khó nội bộ. Không dùng câu đang luyện làm mock mới nếu muốn đo độc lập; đề có exposure vẫn dùng được nhưng gắn nhãn. Xem tỷ lệ đúng, thời gian và báo lỗi theo câu; mẫu nhỏ dưới 30 responses ghi “chưa đủ dữ liệu”, không tự kết luận chất lượng thấp.

AC-36: Không shuffle câu phụ thuộc thứ tự đoạn/audio; không xáo option có chỉ dẫn “A và B” trừ khi câu được viết lại; ngân hàng thiếu báo thiếu ở từng slot, không nhân đôi câu để đủ đề.

**FR-37 — Sửa lỗi và chấm lại \[R0/R1\].** Khi sai key/explanation: đóng version lỗi cho lượt mới, tạo correction version; giáo viên đề xuất regrade và người có quyền duyệt phạm vi attempt ảnh hưởng. Regrade dùng correction policy ghi rõ, tạo gradeVersion mới; không xóa original snapshot. Với câu hủy, loại cả earned/max của câu; nếu max=0 thì kết quả InsufficientData, không 0% hay 100%.

AC-37: Regrade lặp cùng correctionId chỉ một kết quả; cập nhật mastery, dashboard và thông báo theo event; trường hợp không còn bảng quy đổi phù hợp phải ẩn điểm ước lượng, chỉ hiển thị raw đã sửa.

**FR-38 — Quản trị vận hành \[R0\].** Quản lý người dùng, role/permission, khóa tài khoản có lý do, feature flags, nội dung và ticket. Dashboard vận hành có lỗi autosave, hàng đợi, tệp lỗi, backup, delivery email; ở R0 thêm AI/OCR job và cost; R1 thêm giao dịch; R3 mới có SLA chấm Viết/Nói. Audit gồm actor, action, target, before/after an toàn, reason, timestamp, correlationId.

AC-38: Admin không thể xóa audit qua UI; cấp role cao yêu cầu MFA lại; account suspended không tạo attempt mới, người học thấy kênh hỗ trợ; báo cáo không lộ secret hay nội dung cá nhân ngoài phạm vi.

Xuất PDF bài học thuộc R1 tùy chọn: tạo từ phiên bản Published, chỉ xuất học liệu có quyền tải, không nhúng answer key của đề chưa mở. PDF phản ánh version tại thời điểm tạo; cập nhật nội dung không sửa file đã tải của người dùng. Không coi DRM là bảo vệ tuyệt đối.

## 12 Thanh toán và quyền truy cập

**FR-39 — Catalog sản phẩm và checkout \[R1\].** Giai đoạn đầu chỉ bán một lần: quyền học một khóa 180 ngày từ paidAt, giá nguyên VND, không tự gia hạn. Trang checkout hiển thị sản phẩm, phạm vi, thời hạn, thuế/phí nếu áp dụng, điều kiện hoàn tiền và hỗ trợ. Server tính giá từ productVersion; client không gửi giá có hiệu lực. Đơn PendingPayment hết hạn sau 30 phút nếu provider chưa xác nhận.

AC-39: Giá thay đổi sau tạo order không đổi order snapshot; request giá 1 VND không tạo quyền với giá sai; người đã sở hữu khóa được cảnh báo trùng, R1 không tự gia hạn bằng mua trùng.

**FR-40 — Xác nhận thanh toán \[R1\].** Chỉ webhook/server reconciliation đã xác minh signature, merchant, amount, currency, orderId và providerTransactionId mới chuyển Paid. Redirect thành công từ trình duyệt chỉ là màn hình chờ. Một transaction chỉ gắn một order; xử lý webhook và cấp quyền trong transaction/outbox idempotent.

AC-40: Webhook trùng 10 lần cấp một entitlement; sai amount không cấp quyền; sự kiện đến sau expired được kiểm tra thực thu và đưa Paid hoặc PaymentReview theo đối soát, không bỏ mất tiền đã thu; user thấy PendingVerification nếu provider chưa xác nhận.

**FR-41 — Hoàn tiền và đối soát \[R1\].** MVP thương mại hỗ trợ full refund có phê duyệt, không partial refund/coupon/subscription. Chính sách thử nghiệm đề xuất hoàn trong 7 ngày nếu chưa bắt đầu nội dung trả phí; quyền áp dụng thật phải được hiển thị và duyệt trước checkout. Trường hợp lỗi dịch vụ xử lý ngoại lệ có audit. RefundRequested → RefundPending → Refunded hoặc RefundFailed; chỉ xác nhận provider mới coi hoàn xong.

AC-41: Refunded thu hồi entitlement nguồn order, không xóa tiến độ; RefundFailed giữ trạng thái rõ và có retry đối soát; refund đến trước webhook Paid phải lưu sự kiện, đối soát rồi áp dụng trạng thái cuối, không cấp quyền sai. Tiến trình đối soát ít nhất mỗi 24 giờ.

**FR-42 — Entitlement và quota \[R0/R1/R3\].** Check lúc mở tài nguyên hoặc Start attempt; không dựa riêng role. Quyền hết hạn giữa mock vẫn cho nộp attempt đã bắt đầu tới deadline; không cho mở lần mới. R3 lượt chấm reserve trước gửi, commit lúc Accepted, release nếu reject kỹ thuật trước accepted. Lỗi hệ thống sau accepted retry cùng bài không trừ thêm lượt; nếu không cung cấp được dịch vụ thì hoàn lượt có audit.

AC-42: Hai submit tranh lượt cuối chỉ một reserve thành công; callback lặp không âm quota; đơn hoàn tiền không xóa entitlement miễn phí độc lập của cùng người; tiến độ vẫn đọc được sau khóa hết hạn, nhưng học liệu trả phí theo quyền hiện tại.

## 13 Cộng đồng và lớp học mở rộng

**FR-43 — Hỏi đáp theo bài \[R1\].** Câu hỏi gắn lessonVersion và page anchor tùy chọn; feed hiển thị cuối bài, có thể báo lỗi tại từng trang. Học viên theo dõi câu trả lời, sửa trong 15 phút nếu chưa có reply, đánh dấu hữu ích, báo cáo vi phạm. Rate limit 5 bài/giờ, text tối đa 3.000 ký tự, không có nhắn tin riêng. Moderator ẩn nội dung với lý do, giữ bản audit.

AC-43: Học viên không đọc thảo luận khóa không có quyền; notification không trích nội dung nhạy cảm trong email; bài bị ẩn không còn công khai nhưng tác giả thấy lý do và kênh phản hồi.

**FR-44 — Lớp/nhóm và phụ huynh \[R3, chưa triển khai\].** Cần đặc tả thêm membership, mời/tham gia/rời, teacher assignment, thời hạn bài tập, quyền xem tiến độ và cơ chế giám hộ đã xác minh. Không tự cấp quyền xem dữ liệu học viên cho email tự nhận là phụ huynh. Bảng xếp hạng nếu có phải opt-in, nickname và không lộ dữ liệu nhạy cảm; không thuộc tiêu chí nghiệm thu hiện tại.

**FR-45 — Tiếng Nhật/JLPT \[R3, chưa triển khai\].** Bổ sung kana/kanji/furigana, quy tắc nhập Unicode, cấp N5–N1 và exam profile riêng. JLPT không dùng Viết/Nói làm section thi chỉ vì hệ thống có module này; bài giao tiếp Nhật có thể độc lập. Scaled scores không suy từ phần trăm đúng; cần nguồn kiểm định trước khi hiển thị ước lượng. Chưa có dataset và chương trình nội dung thì không mở menu đăng ký Nhật.

## 14 Quy tắc nghiệp vụ xuyên suốt

| **ID** | **Quy tắc bắt buộc**                                                                                                                             |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| BR-01  | Mọi chấm điểm và entitlement do backend quyết định; không tin score/role/price từ client                                                         |
| BR-02  | Published version và snapshot attempt bất biến; correction tạo version mới                                                                       |
| BR-03  | Idempotency cho Start, Submit, payment, refund, review event và quota                                                                            |
| BR-04  | Completion, điểm lần làm và mastery là ba khái niệm riêng                                                                                        |
| BR-05  | Không có dữ liệu khác với 0 điểm; không đủ kỹ năng không tạo overall                                                                             |
| BR-06  | Deadline và thứ tự nhận response dựa server time; tại deadline không nhận sửa                                                                    |
| BR-07  | Luyện có trợ giúp được đánh dấu; không so ngang mock điều kiện chuẩn                                                                             |
| BR-08  | Mọi điều chỉnh plan có version; không thay hoạt động đã làm hoặc đang làm                                                                        |
| BR-09  | Nội dung trả phí và câu trả lời đúng không rò qua preload/API/CDN công khai                                                                      |
| BR-10  | Nhắc học và cộng đồng có lựa chọn người dùng; không phạt mất chuỗi bằng khóa học                                                                 |
| BR-11  | Không quy đổi chứng chỉ giữa các kỳ thi nếu không có chính sách nguồn và kiểm định                                                               |
| BR-12  | Không xóa cứng dữ liệu nội dung đang được tham chiếu; dữ liệu cá nhân xóa theo lifecycle riêng                                                   |
| BR-13  | Mọi thao tác đặc quyền, sửa điểm, cấp quyền thủ công có lý do và audit                                                                           |
| BR-14  | Một người học có thể có nhiều enrollment, nhưng một active plan/ngôn ngữ                                                                         |
| BR-15  | Câu điền từ chuẩn hóa Unicode NFC, trim và collapse whitespace; case sensitivity, punctuation, spelling variants do question policy quyết định   |
| BR-16  | Không bỏ dấu, số nhiều hoặc tự sửa chính tả toàn cục; acceptedAnswers được duyệt, không fuzzy match bằng AI cho câu khách quan                   |
| BR-17  | Đồng bộ ghi chú dùng revision; conflict trả cả server version và draft để chọn, không âm thầm mất bản                                            |
| BR-18  | Quyền hết hạn không xóa kết quả; đăng xuất xóa draft cá nhân cache trên thiết bị theo best effort                                                |
| BR-19  | AI hoặc validator không được gán HumanConfirmed; chỉ actor con người có permission mới tạo trạng thái này.                                       |
| BR-20  | Khi chưa có reviewer, nội dung AI chỉ được lên AutoValidatedBeta hoặc DataValidatedPractice; không được lên ExpertReviewed hay CalibratedMock.   |
| BR-21  | Một lỗi Blocking, một solver bất đồng hoặc một perturbation làm đổi key đều dẫn tới Reject/Quarantine; không lấy điểm trung bình để bỏ qua.      |
| BR-22  | Thống kê người học giúp phát hiện và hiệu chỉnh câu nhưng không tự chứng minh quyền nội dung, độ tự nhiên hay tính tương đương TOEIC chính thức. |
| BR-23  | Crawl đề công khai không là nguồn R0; nội dung nhập từ bên ngoài không được đi theo automated beta track nếu chưa xác minh quyền và key.         |
| BR-24  | Mọi model, prompt, blueprint, policy và threshold có version; đổi cấu hình không viết lại quyết định lịch sử.                                    |
| BR-25  | Không hiển thị nhãn official, certified, standardized hoặc điểm quy đổi TOEIC nếu chưa có căn cứ và phê duyệt tương ứng.                         |
| BR-26  | Auto quarantine ưu tiên false positive an toàn: tạm ẩn câu nghi vấn và giữ attempt snapshot; không tự đổi key của bài đã nộp.                    |

## 15 Dữ liệu nghiệp vụ và tính toàn vẹn

Đây là mô hình logic phục vụ thiết kế database, không phải DDL cuối cùng. Khóa định danh UUID; timestamp lưu UTC, timezone IANA dùng hiển thị/lập lịch; tiền nguyên đơn vị nhỏ nhất theo currency (VND là đồng). Dùng decimal cho điểm; cấm dùng float cho tiền.

| **Nhóm thực thể**                                 | **Trường nghiệp vụ cốt lõi**                                             | **Ràng buộc**                                          |
|---------------------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------|
| User, Session, Consent                            | emailNormalized, status, displayName, timezone, consentType/version/time | Unique email; token chỉ lưu dạng bảo vệ phù hợp        |
| Role, Permission, UserRole                        | permissionCode, scope, assignedBy                                        | Không mass assignment từ profile update                |
| LearningProfile, Goal                             | language, selfLevel, assessmentStatus, examProfileId, target, examDate   | Không ghi đè assessment khi sửa tự đánh giá            |
| CourseVersion, Module, LessonVersion, Page, Block | language, version, status, objectives, order, metadata, license          | Published immutable; order duy nhất trong parent       |
| KnowledgeTag, Prerequisite                        | code, description, parent, prerequisiteId                                | Không cycle; primaryTag bắt buộc trên câu              |
| Enrollment, LessonProgress                        | courseVersionId, state, completedAt, needsReview, bookmark               | Unique user/courseVersion; không cộng completion trùng |
| QuestionVersion, Option, QuestionFamily           | type, prompt, key, explanation, maxScore, policy, familyId               | Key tách response DTO học viên; option ID ổn định      |
| ExamProfileVersion, Blueprint, TestVersion        | sections, duration, navigation, audio, scorePolicy                       | Published chỉ khi đầy đủ ràng buộc                     |
| Attempt, AttemptItem, Response                    | user, mode, snapshot, deadline, status, lease, revision                  | Unique attempt/question/response hiện hành             |
| GradeVersion, CriterionScore                      | raw, max, estimated, basis, rubric, reason, grader                       | Grade trước không bị overwrite                         |
| PlanVersion, PlanTask, Proposal                   | algorithm, inputVersion, date, budget, source, status                    | Accept có expectedVersion; một active plan/ngôn ngữ    |
| ErrorEntry, Evidence                              | questionVersion, tag, sourceAttempt, assisted, state                     | Evidence có provenance và dedupe key                   |
| Deck, Card, UserCard, ReviewEvent                 | sense/context, dueAt, intervalDays, rating, algorithmVersion             | Unique user/sourceCardVersion; eventId unique          |
| Submission, Assignment, ReviewRequest             | essay/audio ref, rubricVersion, SLA, reviewer, state                     | Một active assignment/bài; một review request/lần trả  |
| ProductVersion, Order, PaymentEvent, Refund       | amount, currency, provider IDs, state, timestamps                        | Unique provider event/transaction; giá snapshot        |
| Entitlement, QuotaLedger                          | resourceScope, startsAt, expiresAt, source, delta/reservation            | Không số dư âm; ledger append-only                     |
| Notification, Delivery                            | type, localDate, channel, consent, dedupeKey                             | Unique delivery key theo phạm vi                       |
| Ticket, Thread, Comment, AuditEvent               | sourceVersion, text, moderation, actor, action, reason                   | Quyền theo nguồn và ownership                          |
| OutboxEvent, Job                                  | eventId, payloadVersion, attempts, nextRetryAt                           | Consumer xử lý idempotent, dead-letter sau ngưỡng      |

Quan hệ: User 1–n Enrollment/Attempt/Plan/Order; CourseVersion 1–n LessonVersion qua cấu trúc module; TestVersion n–n QuestionVersion qua TestItem; Attempt 1–n AttemptItem/Response/GradeVersion; QuestionFamily 1–n QuestionVersion; UserCard 1–n ReviewEvent. Không cascade delete từ Course sang Attempt. File binary ở object storage riêng tư, database lưu key, hash, MIME, size, owner, lifecycle.

Retention mặc định ở mục 17 áp dụng theo nhóm; anonymization cần loại cả free text/định danh gián tiếp khi tổng hợp. Backup restore phải chạy lại deletion ledger để tài khoản đã xóa không xuất hiện trở lại.

## 16 Hợp đồng API và tích hợp

### 16.1 Quy ước chung

Prefix /api/v1. API dùng JSON UTF-8; ID là opaque string; timestamp ISO 8601 UTC; cursor pagination mặc định 20, tối đa 100. Error có code, message tiếng Việt an toàn, fieldErrors tùy chọn và traceId; không trả stack trace. 401 chưa đăng nhập, 403 thiếu quyền hành động, 404 cho tài nguyên không tồn tại/không được phép tiết lộ, 409 conflict, 422 validation, 429 rate limit có Retry-After. Response DTO học viên không chứa key, rubric nội bộ ẩn hoặc dữ liệu người khác.

Idempotency-Key là UUID do client tạo cho một intent, scope theo user+endpoint. Giữ record ít nhất 7 ngày cho learning mutation và theo vòng đời nghiệp vụ đối với tiền/quota. Cùng key khác body hash trả 409; cùng key cùng body trả resource/receipt cũ. Ràng buộc nghiệp vụ vẫn phải unique lâu dài để không phụ thuộc TTL cache.

### 16.2 Danh mục endpoint định hướng

| **Method và endpoint**                                   | **Mục đích và hợp đồng chính**                  | **FR**   |
|----------------------------------------------------------|-------------------------------------------------|----------|
| POST /auth/register, /verify, /login, /reset             | Xác thực; rate limit; không lộ email tồn tại    | 01–03    |
| GET/PATCH /me; DELETE /me/sessions/{id}                  | Hồ sơ whitelist fields; quản lý phiên           | 02–04    |
| POST /me/data-exports; POST /me/deletion                 | Job export/delete có xác thực lại               | 18       |
| GET /courses; POST /enrollments                          | Published catalog; courseVersionId, idempotency | 06       |
| GET /lessons/{id}; PUT /progress/{id}                    | Nội dung theo entitlement; expectedRevision     | 07–09    |
| POST /assessments/{id}/attempts                          | Placement/quiz hoặc test; mode, idempotency     | 05,10,23 |
| PUT /attempts/{id}/responses/{questionId}                | answer, expectedRevision, operationId, lease    | 23–24    |
| POST /attempts/{id}/submit                               | expectedAttemptRevision; idempotency; receipt   | 25       |
| GET /attempts/{id}; GET /attempts/{id}/result            | Resume/status; kết quả theo review policy       | 24,26–27 |
| GET /me/errors; POST /me/error-practices                 | Lỗi của mình và bộ luyện chữa lỗi               | 12       |
| GET /me/reviews/due; POST /me/review-events              | queue; cardId, rating, eventId, sessionId       | 13       |
| GET /me/plan; POST /me/plan-proposals/{id}/accept        | Versioned plan; expectedPlanVersion             | 14,19–20 |
| GET /me/dashboard                                        | Khoảng ngày/timezone; dữ liệu tổng hợp          | 15       |
| POST /tickets; PATCH /me/notification-preferences        | Ticket và consent                               | 16–17    |
| POST /submissions; POST /uploads/{id}/complete           | Text/media accepted; checksum, quota            | 28–29    |
| POST /assignments/{id}/claim; POST /reviews/{id}/release | Atomic assignment; rubric đủ trường             | 30–32    |
| POST /admin/content; POST /admin/content/{id}/publish    | Draft/review/version preconditions              | 33–38    |
| POST /orders; POST /payments/{provider}/webhook          | ProductVersion; callback đã xác minh            | 39–40    |
| POST /orders/{id}/refund-requests                        | Policy, reason, audit và idempotency            | 41       |
| GET /me/entitlements; GET /me/quota                      | Scope và thời hạn/quota chính xác               | 42       |
| POST /lessons/{id}/threads; POST /threads/{id}/replies   | Membership/entitlement và moderation            | 43       |

### 16.3 Ví dụ hợp đồng lưu và nộp

Save response request: attemptId trên path; questionId trên path; body {answer:{optionIds:\["opaque-option-id"\]}, expectedRevision:3, clientOperationId:"uuid", leaseToken:"opaque"}. Success trả {revision:4, savedAt:"2026-09-22T09:00:00Z", serverTime:"2026-09-22T09:00:00Z"}. Stale revision trả ResponseConflict và revision hiện hành; client không tự ghi đè.

Submit success trả {attemptId, status:"Submitted", submissionReceiptId, submittedAt, gradingStatus:"Queued"}. “Đã nộp” chỉ xuất hiện sau receipt hoặc GET xác nhận. Worker result có gradeVersionId. GET polling theo backoff 2/5/10 giây tối đa; không cần WebSocket cho MVP.

### 16.4 Hệ thống ngoài và lỗi

Email provider lỗi: queue retry, UI xác minh hiển thị gửi lại theo quota. Object storage lỗi: upload chưa Accepted thì không tạo submission hợp lệ. Payment timeout: giữ PendingVerification và đối soát, không cho người dùng bấm thanh toán vô hạn. AI lỗi: hàng đợi retry/fallback giáo viên theo gói. Không đưa lỗi raw của vendor vào UI. Chuyển provider phải qua adapter để bảo toàn idempotency và business state.

## 17 Yêu cầu phi chức năng

Các mục tiêu sau là baseline nghiệm thu đề xuất cho R0/R1, phải đo trên staging gần production và báo cáo cấu hình thực tế.

| **ID** | **Yêu cầu và ngưỡng**                                                                                                        | **Cách nghiệm thu**                                                                                                                                    |
|--------|------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-01 | API đọc/lưu đáp án p95 ≤500ms, p99 ≤1,5s; submit ACK p95 ≤1s, không tính chấm async                                          | 100 người dùng đồng thời, trung bình 2 request/giây/người, hỗn hợp 60% đọc/30% save/10% khác trong 30 phút; 10.000 users, 10.000 câu, 100.000 attempts |
| NFR-02 | Trang học LCP ≤2,5s, INP ≤200ms, CLS ≤0,1 tại p75 khi có field data                                                          | Trước launch chạy lab mobile 4GB RAM, 4Mbps, RTT 150ms; ghi rõ lab không thay field percentile                                                         |
| NFR-03 | Uptime mục tiêu ≥99,5%/tháng cho API học; không tuyên bố đã đạt trước đo                                                     | Probe mỗi phút từ ít nhất 2 điểm, tính thời gian không phục vụ chức năng chính; bảo trì được thống kê                                                  |
| NFR-04 | RPO ≤24 giờ, RTO ≤4 giờ; mất response đã ACK trong vận hành bình thường là lỗi nghiêm trọng                                  | Backup ngày, retention 30 ngày, thử restore trước launch và mỗi quý; mô phỏng crash sau commit                                                         |
| NFR-05 | WCAG 2.2 AA làm mục tiêu; không chỉ kiểm tra tự động \[S9\]                                                                  | Keyboard toàn luồng, focus, label, error, tương phản, zoom 200%, screen reader; target nội bộ ưu tiên 44px                                             |
| NFR-06 | Responsive 360–1440px; hỗ trợ hai phiên bản stable gần nhất Chrome/Edge/Firefox/Safari tại release                           | Ma trận thiết bị thực: Android Chrome, iOS Safari, Windows Edge/Chrome; record version ngày test                                                       |
| NFR-07 | TLS, mật khẩu hash có salt bằng thư viện xác thực chuẩn, MFA nhân sự; secret không ở repo/client                             | Review cấu hình và test negative; object-level permission bắt buộc \[S10\]                                                                             |
| NFR-08 | Không lộ answer key trước policy; HTML sanitize; upload validate MIME/size và malware                                        | Test XSS, file giả đuôi, truy cập URL media, IDOR, role tampering, CSRF nếu cookie                                                                     |
| NFR-09 | Submit, payment, quota không xử lý trùng; optimistic concurrency cho chỉnh sửa                                               | Test duplicate/out-of-order/parallel worker, crash giữa DB và gửi event                                                                                |
| NFR-10 | Job grading khách quan p95 ≤10 giây với 50 bài nộp/phút, 200 câu/bài                                                         | Load test queue riêng; lưu metric queue age và failed jobs                                                                                             |
| NFR-11 | Log có traceId, latency, code và event nghiệp vụ; không chứa password, token, full essay/audio                               | Kiểm tra sample log; cảnh báo error rate \>2%/5 phút hoặc save failure \>1%/5 phút                                                                     |
| NFR-12 | UTC persistence, IANA timezone, Unicode đầy đủ; số/ngày hiển thị tiếng Việt                                                  | Test qua nửa đêm, đổi timezone, DST cho tài khoản ngoài VN, NFC text                                                                                   |
| NFR-13 | Feature flag AI có quota ngày/người soạn, ngân sách workspace và tháng toàn hệ thống; AI chấm cho học viên R3 có quota riêng | Hết budget trả thông báo/fallback, không tự gọi thêm provider ngoài consent                                                                            |
| NFR-14 | Export/delete/audit có job theo dõi; dữ liệu thu tối thiểu                                                                   | Test xóa cả DB, object storage, index và cache; áp dụng deletion ledger sau restore                                                                    |

Retention đề xuất: security/audit logs 180 ngày; analytics pseudonymous 90 ngày trước tổng hợp; pending local quiz draft tối đa 7 ngày, xóa sau nộp/logout best effort; audio học viên 90 ngày sau trả bài trừ yêu cầu xóa sớm hoặc retention đã chấp thuận; essay/attempt/progress giữ khi tài khoản active, rà soát inactive sau 24 tháng. Backup hết vòng đời sau 30 ngày. Dữ liệu giao dịch và hồ sơ pháp lý cần retention riêng được xác minh trước mở bán; không tự mặc định các mốc trên thỏa nghĩa vụ pháp luật.

Chính sách dữ liệu học viên nhỏ tuổi, thanh toán, quyền nội dung và nhà cung cấp AI là điều kiện trước launch phân khúc tương ứng. Tài liệu không đưa ra kết luận tuân thủ pháp luật. Các chính sách đó phải được rà soát theo thị trường và thời điểm triển khai.

## 18 Đo lường sản phẩm

Không dùng số phút online làm chỉ số thành công duy nhất. Dữ liệu nên trả lời: người học có bắt đầu được, có hoàn thành vòng chữa lỗi, có quay lại và có tiến bộ trên câu chưa gặp hay không.

| **Metric**             | **Định nghĩa**                                                                                | **Mục tiêu pilot đề xuất**                           |
|------------------------|-----------------------------------------------------------------------------------------------|------------------------------------------------------|
| Activation D1          | Tài khoản đã xác minh hoàn tất 1 bài + nộp quiz trong 24h / tài khoản xác minh mới            | ≥60%                                                 |
| Time to first learning | Median từ hoàn tất đăng ký đến tương tác học đầu; loại thời gian chờ verify riêng             | ≤5 phút sau verify                                   |
| D7 retention           | Người học có hoạt động có ý nghĩa đúng ngày địa phương D7 / cohort activated D0               | ≥25%, báo thêm rolling D7                            |
| Vòng chữa lỗi          | Người có lỗi đã luyện ít nhất 1 bộ chữa lỗi trong 7 ngày / người có lỗi và đủ 7 ngày quan sát | ≥40%                                                 |
| Task usability         | Hoàn thành nhiệm vụ trọng yếu không trợ giúp / tổng lượt thử                                  | ≥80% trước pilot mở rộng                             |
| Learning evidence      | Chênh điểm test tương đương chưa gặp, báo mẫu và attrition                                    | Đo baseline trước, chưa gán cam kết tăng điểm        |
| Lost acknowledged work | Số trường hợp dữ liệu đã ACK bị mất                                                           | 0 trong nghiệm thu                                   |
| Content defect         | Lỗi key/audio được xác nhận trên 1.000 câu trả lời                                            | Theo dõi xu hướng; lỗi key nghiêm trọng chặn publish |

Các target không phải benchmark thị trường. Event đề xuất: onboarding_completed, lesson_started/completed, quiz_submitted, feedback_opened, error_practice_completed, card_reviewed, plan_proposal_accepted, mock_submitted, grading_failed, entitlement_granted. Payload gồm user pseudonymous ID, time, sourceVersion, mode, release; không gửi nguyên bài viết hoặc audio vào analytics. Heartbeat thời gian học chỉ tích lũy khi tab active và có thao tác trong 60 giây gần nhất, vẫn ghi là active time ước lượng.

## 19 Use case trọng yếu

### UC-01 Bắt đầu học khi chưa biết trình độ

Actor: học viên. Tiền điều kiện: tài khoản Active. Trigger: onboarding. Luồng: chọn nền tảng → chọn lịch → chọn “Chưa biết” → bỏ qua placement → xem ba khóa gợi ý và bài mẫu → chọn khóa → enroll → vào bài đầu. Ngoại lệ: không có khóa phù hợp thì hiển thị catalog và “chưa đủ nội dung”, không tạo plan rỗng giả. Hậu điều kiện: assessment Unknown, enrollment và plan riêng; không có band. Truy vết FR-04–07,14; TC-01,02.

### UC-02 Học một bài và chữa lỗi

Actor: học viên. Tiền điều kiện: có quyền học. Luồng: tiếp tục bookmark → đọc trang → sai mini-check → xem giải thích → tiếp tục → nộp quiz → điểm 60% → Completed + NeedsReview → vào sổ lỗi → luyện câu tương đương → lên lịch ôn. Ngoại lệ: save lỗi hiện pending; câu nguồn bị thu hồi vẫn giữ reference và hướng dẫn. Hậu điều kiện: grade snapshot, error entry, progression và event không trùng. Truy vết FR-07–15; TC-03–06.

### UC-03 Thi thử và mất mạng

Actor: học viên. Tiền điều kiện: R0, đủ quyền, profile Published. Luồng: preflight → Start → lưu câu → mất mạng → draft local + timer tiếp tục → mạng lại trước deadline → sync → Submit → receipt → grade. Nếu mạng lại sau deadline, draft chưa ACK không tính; cho xem server-saved và hướng dẫn hỗ trợ nếu lỗi hệ thống. Hậu điều kiện: một submission; không kéo dài giờ hoặc ghi đè đáp án mới. Truy vết FR-21–27; TC-07–12.

### UC-04 Sửa một đáp án sai trong ngân hàng

Actor: biên tập và reviewer. Luồng: nhận ticket → xác nhận lỗi → chặn version cho attempt mới → tạo correction → duyệt → xác định attempts ảnh hưởng → approve regrade → worker chạy → gradeVersion mới → cập nhật dashboard/thông báo. Ngoại lệ: correction chạy lại không double grade; đề đang làm giữ snapshot, regrade sau submit. Hậu điều kiện: cả bản điểm trước và sau còn audit. Truy vết FR-17,35,37; TC-13,14.

### UC-05 Mua khóa và callback trùng

Actor: học viên, provider. Luồng: xem quyền 180 ngày và giá → tạo order → thanh toán → redirect pending → webhook verified → Paid + entitlement → trang cập nhật. Callback trùng trả ACK, không cấp thêm. Sai chữ ký không thay trạng thái. Đã thu tiền nhưng callback chậm thì đối soát. Truy vết FR-39–42; TC-15–18.

### UC-06 Gửi bài và nhận phản hồi

Actor: học viên, giáo viên, AI tùy chọn. Luồng: xem rubric/quota/SLA → soạn hoặc thu → kiểm tra tệp → reserve quota → Accepted → assign → chấm → release → người học đọc và sửa. Ngoại lệ: upload hỏng release reserve; AI fail không mất bài; giáo viên quá SLA báo vận hành; review tạo phiên bản mới. Truy vết FR-28–32,42; TC-19–22.

## 20 Kịch bản kiểm thử và truy vết

Bảng là bộ nghiệm thu tối thiểu cho nghiệp vụ rủi ro, không thay toàn bộ test case chi tiết. QA cần mở rộng mỗi FR/AC thành happy path, validation, quyền, concurrency và failure khi phù hợp. Mỗi TC phải chỉ rõ fixture version và clock giả lập để có thể lặp lại.

| **TC** | **FR liên quan** | **Dữ liệu / thao tác**                                              | **Kết quả bắt buộc**                                        |
|--------|------------------|---------------------------------------------------------------------|-------------------------------------------------------------|
| TC-01  | 01–04            | Verify token đã dùng; tự gửi role=Admin; bỏ placement               | Không tái dùng token/đổi role; Unknown                      |
| TC-02  | 05,14            | 17 câu trả lời; nhóm 18 câu; không có khóa                          | Không kết luận khi \<18; rule đúng ngưỡng; empty state thật |
| TC-03  | 07–08            | Sai mini-check, quiz 60%, đọc đủ                                    | Học tiếp; Completed + NeedsReview; mastery độc lập          |
| TC-04  | 10               | Multi-select thiếu/thừa; Unicode khoảng trắng; accepted variants    | Điểm đúng policy; không fuzzy tự ý                          |
| TC-05  | 12               | Đúng lại ngay; đúng câu khác ngày sau; sai lần mới                  | Chưa resolved ngay; đủ điều kiện resolved; reopen           |
| TC-06  | 13–15            | Review event trùng; thẻ quá hạn; khóa thêm bài                      | Lịch chỉ đổi một lần; limit phiên; mẫu số snapshot          |
| TC-07  | 23               | Start retry cùng key; cùng key khác body                            | Một attempt; body khác 409                                  |
| TC-08  | 24               | Save revision cũ đến sau mới; takeover thiết bị                     | Không overwrite; lease cũ read-only                         |
| TC-09  | 24–25            | Client clock +1h; save trước/đúng/sau deadline                      | Timer không đổi; chỉ trước deadline hợp lệ                  |
| TC-10  | 24–25            | Offline rồi sync sau deadline; worker chậm 2 phút                   | Draft muộn bị từ chối; không tăng thời gian                 |
| TC-11  | 25               | Hai Submit + timeout cùng lúc; response mất                         | Một receipt; GET phục hồi                                   |
| TC-12  | 26–27            | Grader crash/retry; IELTS Reading-only; practice Assisted           | Một grade; không overall; không trộn chart                  |
| TC-13  | 33–35            | Thiếu license/key/audio; reviewer là author                         | Chặn publish, chỉ lỗi cụ thể                                |
| TC-14  | 37               | Regrade 2 lần; hủy mọi câu trong section                            | Một correction grade; InsufficientData                      |
| TC-15  | 39–40            | Client sửa giá; forged redirect; webhook sai signature              | Không cấp quyền                                             |
| TC-16  | 40               | Callback trùng và out-of-order, đúng tiền                           | Một Paid transition và entitlement                          |
| TC-17  | 41               | Refund provider fail rồi thành công; callback refund đến trước paid | Không báo hoàn sớm; đối soát trạng thái đúng                |
| TC-18  | 42               | Hết quyền lúc mock; hai request tranh quota cuối                    | Vẫn nộp được; một reservation                               |
| TC-19  | 28–29            | Mic denied; file fake MIME; upload resume                           | Hướng dẫn fallback; chặn file; không double charge          |
| TC-20  | 30               | Hai giáo viên claim; teacher đọc bài khác                           | Một assignment; truy cập bị từ chối                         |
| TC-21  | 31–32            | AI timeout/schema sai/prompt injection; khiếu nại                   | Fallback an toàn; grade version có audit                    |
| TC-22  | 32               | Chỉ transcript nhưng yêu cầu chấm pronunciation                     | Không tạo pronunciation score                               |
| TC-23  | 16               | Unsubscribe; timezone đổi; retry delivery                           | Không nhắc sau opt-out; không gửi trùng                     |
| TC-24  | 18               | Export user khác; delete và restore backup                          | Bị chặn; deletion ledger áp lại                             |
| TC-25  | 38,43            | XSS ở comment/lesson; IDOR audio; support thiếu permission          | Sanitize/chặn; không lộ nội dung                            |
| TC-26  | NFR-01–04,10     | Load target, crash worker, restore                                  | Đạt ngưỡng và không mất dữ liệu ACK                         |
| TC-27  | NFR-05–06        | Keyboard, screen reader, mobile 360px, zoom                         | Hoàn tất luồng; không mất focus/nút submit                  |
| TC-28  | 19–20            | Budget 15 phút/ngày, đề 120 phút; accept proposal cũ                | Không ép đề vào slot; báo conflict                          |

Traceability theo mục tiêu: bắt đầu đúng mức → FR-04–06,14; học và chữa lỗi → FR-07–13; duy trì và theo dõi → FR-14–20; luyện thi tin cậy → FR-21–27; phản hồi sản xuất → FR-28–32; nội dung tin cậy → FR-33–38; thương mại đúng quyền → FR-39–42; giao tiếp có kiểm soát → FR-43. R3 FR-44–45 cần test specification riêng trước xây.

## 21 Kiến trúc triển khai tham khảo

Phần này là khuyến nghị kỹ thuật, không ràng buộc tên bảng hoặc thư viện. Phù hợp kỹ năng C# và React: modular monolith ASP.NET Core, React, relational database, object storage riêng tư và background worker. Chọn phiên bản runtime còn được hỗ trợ tại thời điểm khởi tạo, xác minh tài liệu vendor trước cài; SRS không khóa vào .NET 8. PostgreSQL hoặc SQL Server đều phù hợp, chọn một cho triển khai đầu.

Module logic: Identity; Content; Learning; Assessment; Review; Planning; Billing; Notifications; Operations. API xử lý transaction ngắn; worker chấm bài, gửi email, AI, import, regrade và đối soát. Database là nguồn chuẩn cho deadline, response và entitlement. Redis có thể dùng cache/rate limit, không là nơi duy nhất chứa bài làm. Dùng transactional outbox để tránh commit bài rồi mất job chấm. Consumer có inbox/deduplication.

Tách Domain/Application/Infrastructure/API và Worker nếu giúp tổ chức code; không bắt buộc microservices. Domain trọng yếu: Attempt aggregate, PublishedContentVersion, PlanVersion, Order/Entitlement và QuotaLedger. Không nhét quy tắc điểm vào React. Unit test rule thuần và state transition; integration test transaction, unique constraint, concurrency; end-to-end các use case ở mục 19.

Thứ tự xây lát cắt: domain tier/blueprint/policy → Part 5 controlled generator → deterministic validators → hai solver và critic → Beta serving/report/quarantine → Part 7 source-first → Reading form assembler → media Part 1-4. HumanTrack cho import/licensed vẫn tồn tại nhưng không chặn AutomatedBetaTrack. Kiến trúc chi tiết ở mục 25.12 và 28.16. Dùng technical fixtures có chủ đích cho test, không gọi fixture là gold học thuật.

## 22 Backlog và điều kiện phát hành

### 22.1 Thứ tự triển khai R0

| **Thứ tự** | **Epic**                         | **Kết quả review được**                                      |
|------------|----------------------------------|--------------------------------------------------------------|
| 1          | Identity, scope và content model | QuestionGroup, Stimulus, version, permission và audit        |
| 2          | Nhập tay và DOCX template        | Import một Part 5 và một cụm Part 7, đối chiếu và duyệt      |
| 3          | PDF có text và đáp án rời        | Tách nhóm, sửa split/merge, map key có provenance            |
| 4          | TOEIC media và full test         | Part 1–4 đúng nội dung hiển thị, audio manifest, đủ 200 câu  |
| 5          | Thi và chữa lỗi                  | Timer/section transition, save/resume, grade, error notebook |
| 6          | AI soạn đề nhỏ                   | Tạo Part 5 và hỗ trợ chuẩn hóa, quota/cost, reviewer gate    |
| 7          | Học bổ trợ và hardening          | Bài chữa lỗi, ôn, dashboard, data rights, benchmark và pilot |

Không đợi có OCR scan hoặc kho đề ngoài mới xây luồng học viên. Lát cắt đầu chạy bằng candidate gốc Part 5/Part 7 từ Controlled AI Item Factory; import/DOCX là track riêng và chưa publish nếu thiếu quyền/key/reviewer. Mọi track dùng chung canonical model, validator và immutable snapshot. Không cam kết số tuần trước khi benchmark cost và rejection rate.

### 22.2 Bộ nội dung pilot TOEIC

R0A cần tối thiểu 150 câu Part 5 BetaReady và 20 group Part 7 direct-evidence BetaReady, không trùng family; có nhãn Beta, report issue, exposure log và auto quarantine. Có thể bổ sung 10-15 bài chữa lỗi và 100 thẻ từ có ngữ cảnh. Bài chẩn đoán 24 câu là tùy chọn và không dự đoán TOEIC.

R0B mở Part 6 và Reading form khi từng item đạt tier. R1 mới hướng tới full TOEIC simulation 200 câu sau khi Part 1-4 qua media gate; khi chưa có expert, full simulation vẫn mang nhãn Beta và raw score. Hai full mock độc lập là target tương lai, không phải điều kiện R0A. R2 cần profile IELTS Academic Reading riêng; không chặn luyện tập chỉ vì chưa có bảng điểm ước lượng.

### 22.3 Definition of Ready và Definition of Done

Ready: FR và release rõ; UI states được xác định; data/permission/policy thống nhất; blueprint hoặc nguồn nội dung tồn tại; AC có fixture. Done: code review; unit/integration phù hợp rủi ro; test AC đạt; error/loading/empty states; object permission; audit/metric; migration và rollback; tài liệu API cập nhật; không có secret; nội dung đạt tier được phép cho release.

Gate R0A: FR của lát cắt đạt; Part 5/Part 7 đủ target L2; không có blocking finding, IDOR, key/transcript leak hoặc API bypass; report, quarantine, backup/restore và end-to-end test đạt. Gate R0B: item statistics và Reading form đạt. Gate R1: media/ASR gate, đủ bank từng Part, quota/cost và full simulation Beta đạt. Gate R2: profile IELTS Reading và score policy riêng; không có IELTS overall.

## 23 Quyết định còn mở và quản lý thay đổi

| **ID** | **Quyết định**                     | **Mặc định để code**                                                                       | **Người chốt và thời điểm**                                    |
|--------|------------------------------------|--------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| D-01   | Sản phẩm đầu tiên                  | TOEIC L&R trước; IELTS chỉ Academic Reading ở R2                                           | Đã chốt theo yêu cầu người dùng                                |
| D-02   | Giữ hay mở Nhật sớm                | Chỉ giữ thiết kế mở rộng, R3                                                               | PO và trưởng nội dung trước đổi phạm vi                        |
| D-03   | Nội dung, license và kiểm định     | Controlled AI Item Factory; tối đa DataValidatedPractice khi chưa có reviewer; không crawl | Đã chốt cho v3.3; expert audit trước khi bật Level 3           |
| D-04   | Ngưỡng placement/mastery           | Quy tắc nội bộ mục 8, có version                                                           | Giáo viên trước pilot; hiệu chỉnh bằng dữ liệu                 |
| D-05   | Giá, refund và retention tài chính | Sandbox; chưa thu tiền R0                                                                  | PO/vận hành/phụ trách pháp lý trước R1                         |
| D-06   | Provider AI/OCR cho tạo đề         | Adapter, budget và benchmark; không chọn model cố định trong SRS                           | Kỹ thuật/PO trước bật cổng AI R0                               |
| D-07   | Mở cho người dưới 18               | Chưa mở pilot nhóm này                                                                     | PO và phụ trách dữ liệu trước mở phân khúc                     |
| D-08   | Bảng quy đổi điểm                  | Raw score và thống kê nội bộ; không estimate TOEIC khi thiếu căn cứ                        | Trưởng học thuật hoặc đối tác kiểm định trước khi bật estimate |
| D-09   | Thi vào 10                         | Hồ sơ riêng, không trộn IELTS/TOEIC                                                        | PO nếu chuyển đối tượng học sinh                               |
| D-10   | Ngân sách hạ tầng và tải thực      | NFR baseline 100 concurrent                                                                | Kỹ thuật trước load test và launch                             |

Một quyết định chưa chốt ở R2 không chặn xây R0. Các yếu tố ảnh hưởng an toàn dữ liệu, tiền và độ đúng của điểm phải chốt trước khi bật chức năng liên quan. Mọi thay đổi FR ghi change request: lý do, người dùng hưởng lợi, FR/data/API/test bị ảnh hưởng, migration, release và người duyệt hoặc policy owner. Lịch sử: 1.0 tài liệu nguồn; 2.0 bổ sung SRS; 3.0 ngày 22/09/2026 đổi sang TOEIC-first, IELTS Reading-only và bổ sung cổng tạo đề; 3.1 bổ sung thu nhận đa nguồn; 3.2 chuyển sang sản xuất nội dung gốc có AI hỗ trợ; 3.3 chốt Controlled AI Item Factory, automated beta tiers, telemetry và auto quarantine khi chưa có reviewer. Mã FR-01-78 giữ để truy vết; FR-79 trở đi là yêu cầu mới.

## 24 Tài liệu tham khảo

Nguồn đầu vào: Pasted markdown(4).md, “Website học & luyện thi Tiếng Anh / Tiếng Nhật”, phiên bản 1.0 ngày 22/09/2026. Các nguồn dưới đây phục vụ kiểm chứng phương pháp và đặc điểm hệ thống thi; những ngưỡng sản phẩm, thuật toán và kế hoạch release là đề xuất của tài liệu này.

\[S1\] Dunlosky và cộng sự, Improving Students’ Learning With Effective Learning Techniques, APS, 2013. Tổng quan practice testing và distributed practice. https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html

\[S2\] British Council LearnEnglish, Take free level test. Giới hạn diễn giải bài kiểm tra định hướng. https://learnenglish.britishcouncil.org/english-levels/online-english-level-test

\[S3\] Duolingo, How Duolingo Works With Learners to Improve The App. Ví dụ nghiên cứu nhu cầu xem lỗi và luyện điểm yếu; không suy rộng thành khảo sát người dùng Việt Nam. https://blog.duolingo.com/how-duolingo-works-with-learners/

\[S4\] PREP Education, trang giới thiệu sản phẩm. Tham khảo study plan và luyện tập có AI; không sử dụng tuyên bố marketing làm bằng chứng hiệu quả. https://prepedu.com/en/

\[S5\] IELTS, IELTS scoring in detail. Quy tắc chấm từng kỹ năng và biến thiên raw-to-band. https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail

\[S6\] IELTS, IELTS Academic test và Reading format. https://ielts.org/take-a-test/test-types/ielts-academic-test ; https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading

\[S7\] ETS, About the TOEIC Listening and Reading Test. Phạm vi Nghe/Đọc và cấu trúc bài. https://www.ets.org/toeic/about/listening-reading.html

\[S8\] JLPT, Scoring Sections, Pass or Fail, Score Report. https://www.jlpt.jp/e/guideline/results.html

\[S9\] W3C, Web Content Accessibility Guidelines 2.2. https://www.w3.org/TR/WCAG22/

\[S10\] OWASP, API Security Top 10 2023. Tham khảo rủi ro quyền đối tượng và chức năng. https://api-security.owasp.org/editions/2023/en/0x11-t10/

\[S11\] IELTS, IELTS Academic Writing test format. https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing

Tất cả nguồn web được tra cứu ngày 22/09/2026. Khi bắt đầu một release luyện thi cần kiểm tra lại nguồn chính thức và lưu ngày đối chiếu vào exam profile. Nghiên cứu bàn không thay cho kiểm định nội dung, khảo sát người dùng hay đánh giá pháp lý khi vận hành thương mại.

## 25 Cổng tạo đề và trích xuất bằng AI

### 25.1 Tham khảo SHub và quyết định sản phẩm

SHub công bố tính năng đề tách câu, chỉnh sửa, lời giải từng câu và đảo câu/đáp án trong lịch sử ứng dụng giáo viên; có ghi nhận tách câu từng phần tiếng Anh \[S12\]. Đây là cơ sở tham khảo trải nghiệm chuyển tài liệu thành câu hỏi chỉnh sửa được. Tài liệu công khai chưa đủ để xác nhận pipeline OCR/LLM nội bộ, độ chính xác, API tích hợp hoặc giá hiện tại của SHub. Thiết kế dưới đây là giải pháp đề xuất cho website này, không mô tả lại kiến trúc SHub và không phụ thuộc API của SHub.

Cổng tạo đề có 4 điểm vào: Nhập tay; Upload đề có sẵn; AI tạo câu mới; Ghép từ ngân hàng. Cả bốn tạo TestDraft/QuestionGroupDraft cùng schema. “Upload đề” phải giữ trung thực nội dung; “AI tạo mới” là biên soạn, có provenance khác. Không trộn đáp án AI suy đoán với đáp án trích từ file.

| **Hướng xử lý**                                | **Ưu điểm**                                        | **Hạn chế**                                                          | **Quyết định**                                            |
|------------------------------------------------|----------------------------------------------------|----------------------------------------------------------------------|-----------------------------------------------------------|
| Chỉ hiển thị PDF và lưới đáp án                | Làm nhanh, giữ bố cục                              | Khó luyện từng câu, tìm kiếm và thống kê; dễ lộ đáp án nằm cuối file | Chỉ là nguồn đối chiếu nội bộ, không là trải nghiệm chính |
| Chỉ parser/regex                               | Dễ lặp lại, chi phí xử lý thấp với mẫu chuẩn       | Dễ sai với nhiều cột, group qua trang, scan                          | Dùng cho DOCX template và PDF rõ cấu trúc                 |
| Gửi cả file cho LLM tạo JSON                   | Nhanh thử nghiệm                                   | Có thể bỏ câu, đổi chữ, gán nhầm passage/key; khó kiểm soát chi phí  | Không dùng làm đường chuẩn duy nhất                       |
| Native extraction + OCR chọn lọc + AI + editor | Giữ nguồn, tận dụng mẫu rõ và có cách sửa phần khó | Cần thiết kế dữ liệu và công cụ review ban đầu                       | Kiến trúc khuyến nghị                                     |

Định nghĩa tối ưu ở đây là tổng thời gian nhập và sửa thấp, đáp án được kiểm chứng và dữ liệu tái sử dụng được với đội .NET nhỏ. Chưa có benchmark file thực tế của dự án để tuyên bố một OCR/model cụ thể tốt nhất.

### 25.2 Mô hình đề TOEIC và đơn vị tách

Profile TOEIC L&R mô phỏng dạng paper-delivered: 200 câu, Listening khoảng 45 phút, Reading 75 phút. Số lượng theo Part được kiểm tra theo bảng dưới và hướng dẫn ETS \[S13\]. Mô hình web là công cụ luyện, không phải kỳ thi do ETS tổ chức.

| **Part**                | **Số câu** | **Đơn vị nội dung phải giữ**                                                 | **Cách hiển thị trong Mock**                      |
|-------------------------|------------|------------------------------------------------------------------------------|---------------------------------------------------|
| 1 Photographs           | 6          | 1 hình + 1 audio chứa 4 phát biểu + 1 câu                                    | Hình và nút A–D; không hiện text 4 phát biểu      |
| 2 Question Response     | 25         | 1 audio chứa câu hỏi/phát biểu và 3 phản hồi                                 | Chọn A–C; không tự tạo D, không hiện transcript   |
| 3 Conversations         | 39         | 13 cụm, mỗi cụm 1 hội thoại và 3 câu; graphic nếu có                         | Câu và lựa chọn in trong đề, audio dùng chung cụm |
| 4 Talks                 | 30         | 10 cụm, mỗi cụm 1 bài nói và 3 câu; graphic nếu có                           | Câu và lựa chọn in trong đề, audio dùng chung cụm |
| 5 Incomplete Sentences  | 30         | 1 câu độc lập, 4 lựa chọn                                                    | Stem và A–D                                       |
| 6 Text Completion       | 16         | 4 cụm, mỗi cụm 1 văn bản và 4 câu/ô trống                                    | Văn bản với blank anchors và câu liên kết         |
| 7 Reading Comprehension | 54         | Cụm một hoặc nhiều văn bản; 29 câu single passages, 25 câu multiple passages | Giữ mọi văn bản, bảng/hình và câu hỏi trong cụm   |

Part 7 full profile được trưởng nội dung duyệt thêm ràng buộc: 10 cụm single passages (2–4 câu/cụm, tổng 29); 5 cụm multiple passages, 5 câu/cụm, baseline 2 cụm đôi và 3 cụm ba. Profile có version để điều chỉnh theo nguồn chính thức được xác minh cho phiên bản thi; không dùng bộ đếm 54 câu làm điều kiện duy nhất.

QuestionGroup là đơn vị tái sử dụng/ghép đề đối với Part 3,4,6,7. Stimulus là passage, image, table hoặc audio mà cả group dùng chung; Part 7 có nhiều Stimulus theo thứ tự. Part 5 có group một câu để thống nhất mô hình. Tách ảnh cắt câu chỉ là SourceRegion, chưa phải nội dung học hoàn chỉnh.

Phân biệt sourceQuestionNumber và displayQuestionNumber: số nguồn có thể bắt đầu lại hoặc ghi 147–150 qua hai trang. Dùng sourceDocumentId + sourceSection + sourceQuestionNumber để map, còn questionId là UUID. Tuyệt đối không dùng số thứ tự làm khóa chính. Full test hiển thị 1–200 theo profile; drill có thể hiện 1–10 nhưng giữ số nguồn khi review nội bộ.

Part 1–2 thiếu text stem/options trong PDF không phải lỗi OCR. Cần audio phù hợp, key đã duyệt và hình ở Part 1. Transcript là dữ liệu hậu kiểm/chữa bài; không bắt buộc phải có để bắt đầu nghe nếu audio/key đã được người duyệt kiểm tra, nhưng cần giải thích tối thiểu. Không dùng AI “điền” nội dung audio còn thiếu rồi coi là đề gốc.

### 25.3 Vai trò và quyền tạo đề

**FR-46 — Phân quyền cổng nội dung \[R0\].** Phân quyền theo permission + scope + ownership/assignment + trạng thái. Scope R0 là toàn kho, thư mục hoặc examProfile được giao; không phải multi-tenant trường học. Học viên không có quyền upload đề vào kho chung. Giáo viên chỉ có quyền authoring khi được cấp riêng; vai trò Teacher không tự có quyền publish.

| **Permission**              | **Uploader**             | **Test Author**                           | **Reviewer**                                  | **Publisher**                                   | **Admin**                                            |
|-----------------------------|--------------------------|-------------------------------------------|-----------------------------------------------|-------------------------------------------------|------------------------------------------------------|
| source.upload, source.read  | Nguồn của mình/được giao | Scope được giao                           | Nguồn gắn bản review                          | Nguồn gắn bản xuất bản                          | Theo quyền nội dung                                  |
| import.run, import.edit     | Không mặc định           | Có trong scope                            | Chỉ đọc và nhận xét                           | Chỉ đọc                                         | Có khi được cấp                                      |
| ai.generate                 | Không                    | Có nếu cấp + còn budget                   | Không mặc định                                | Không mặc định                                  | Có nếu bật và còn budget                             |
| question.edit, test.compose | Không                    | Draft của mình/được giao                  | Đề nghị sửa; không sửa lén                    | Không sửa nội dung đã duyệt                     | Theo scope                                           |
| test.submit_review          | Không                    | Có                                        | Không thay tác giả                            | Không thay tác giả                              | Có khi là author                                     |
| test.review                 | Không                    | Không mặc định                            | Có khi được bố trí; không review bản mình sửa | Không mặc định                                  | Không bắt buộc cho Beta; bắt buộc cho ExpertReviewed |
| test.publish, test.withdraw | Không                    | Beta nếu có permission; không bypass gate | Expert tier khi có nhân sự                    | Beta sau automated gate; expert tier sau review | Beta sau automated gate; emergency withdraw có audit |
| role.assign, budget.manage  | Không                    | Không                                     | Không                                         | Không                                           | Có + MFA + audit                                     |

Khi HumanTrack hoạt động, một người có thể vừa Reviewer vừa Publisher nếu không tham gia biên soạn revision đó; Admin không có nút tự duyệt. Khi AutomatedBetaTrack hoạt động, Quality Gate Engine thay bước approve người nhưng chỉ được gán AutoValidated/Beta. Không user hay worker nào được gán HumanConfirmed nếu không có actor con người đủ permission và review record hợp lệ.

AC-46: Uploader gọi ai.generate nhận 403; Author không đọc importId ngoài scope; Reviewer không nhận bản mình đã sửa; thu hồi quyền khi job đang chạy cho phép worker lưu kết quả kỹ thuật riêng nhưng không cho người cũ đọc/commit; publish luôn kiểm tra quyền hiện tại và approvedRevision.

### 25.4 Đầu vào và tải tài liệu

**FR-47 — Tạo gói nguồn \[R0/R1\].** Một SourcePackage gồm đề chính, file đáp án tùy chọn, file giải thích/transcript tùy chọn, audio và ảnh. Người upload khai báo tên, ngôn ngữ, examProfile, loại full/section/part, nguồn và quyền sử dụng, phạm vi chia sẻ. Có thể upload nhiều file trong một gói nhưng không nhận ZIP ở MVP; hệ thống lưu tên gốc để nhận diện và storage key ngẫu nhiên để truy cập.

| **Đầu vào**           | **R0**                                                                    | **R1 và giới hạn sản phẩm đề xuất**                            |
|-----------------------|---------------------------------------------------------------------------|----------------------------------------------------------------|
| DOCX                  | Parse theo template; file tự do đưa cảnh báo và sửa thủ công              | 20 MB/file; không DOC/DOCM/macros; giới hạn giải nén 100 MB    |
| PDF có text           | Extract layout và text theo trang                                         | 50 MB/file, tối đa 100 trang đề/job                            |
| PDF scan hoặc hỗn hợp | Nhận diện và báo trang cần OCR; chưa có OCR thì yêu cầu bản khác/nhập tay | OCR chọn trang, tối đa 100 trang/job                           |
| PNG/JPEG              | Ảnh media câu hỏi; ảnh nguyên đề chưa tự OCR                              | Tối đa 20 MB/ảnh, 30 megapixel; tối đa 100 ảnh nguồn/job       |
| Audio MP3/WAV/M4A     | Tệp đầy đủ hoặc clip được gắn thủ công                                    | 200 MB/file, 90 phút/file; tổng gói ≤500 MB                    |
| Key CSV/XLSX/DOCX/PDF | Template key hoặc nhận dạng có review                                     | CSV/XLSX ≤5 MB, một sheet dữ liệu chính; không execute formula |

Giới hạn trên là product configuration, không phải giới hạn vendor. Validate cả MIME, chữ ký file, số trang/kích thước giải nén; PDF khóa mật khẩu yêu cầu người có quyền xuất bản không khóa, không tự phá khóa. File đang scan/chưa scan không được preview công khai. URL tải lên do server cấp hạn 15 phút, ràng buộc owner, MIME, size; hoàn tất upload kiểm tra hash và actual size, không tin client metadata. Không hỗ trợ nhập URL web tùy ý ở MVP để giảm SSRF và lỗi nguồn.

AC-47: Người có quyền tạo gói, upload key/audio riêng, xem trạng thái từng file; MIME giả/file vượt giới hạn bị chặn trước parser/provider; cùng hash trong scope hiển thị gợi ý dùng lại, không tiết lộ file trùng thuộc scope khác. Thiếu audio vẫn tạo Draft TOEIC Reading hoặc Listening chưa hoàn chỉnh, không FullReady.

### 25.5 Pipeline trích xuất

**FR-48 — Phân tích cấu trúc nguồn \[R0\].** DOCX đọc paragraph/run/table/image relationship, không chỉ nối InnerText toàn file. Template v1 dùng nhãn PART, GROUP, PASSAGE, QUESTION, OPTION và KEY rõ nghĩa; cho map số nguồn. File tự do nhận diện headings, số câu và option labels bằng parser theo profile. PDF lấy text cùng bounding boxes, phân tích cột/reading order, giữ page index và tọa độ. Nội dung trang tiếp nối cần context trang trước/sau; header/footer được đánh dấu trước khi bỏ khỏi vùng câu hỏi. PdfPig có công cụ layout/reading order \[S14\], Open XML SDK hỗ trợ cấu trúc Word \[S15\]; các thư viện này không tự hiểu TOEIC.

AC-48: Một câu có option sang trang sau vẫn có thể merge; số trang/footer không trở thành câu; DOCX có key dạng chữ đậm/nghiêng chỉ được dùng như tín hiệu nếu template đã quy định, không mặc định mọi chữ đậm là đáp án. Lưu extractionVersion và anchors để đối chiếu.

**FR-49 — OCR chọn lọc \[R1\].** Phân loại từng trang thành native text đủ chất lượng, scan hoặc mixed; native text không bị OCR lại mặc định. Trang scan dùng OCR/layout adapter trả text, polygon và confidence nếu provider có. Không dùng số confidence vendor như xác suất đúng học thuật. Microsoft Document Intelligence là lựa chọn managed để thử nghiệm vì có text/table/layout extraction \[S16\]; chọn provider thực bằng benchmark của dự án.

AC-49: Trang native và scan trong cùng PDF đều được xử lý đúng nhánh; ảnh nghiêng/thấp nét tạo issue gắn vùng; OCR thất bại chỉ retry trang lỗi, không lặp toàn gói; thiếu budget trả PausedBudget và giữ kết quả đã có. Người dùng có thể sửa tay hoặc upload lại trang tốt hơn.

**FR-50 — Dựng cụm câu và bảo toàn nguồn \[R0\].** Output trung gian là CandidateGroup chứa source regions, passages, media references và CandidateQuestions. Parser/AI đề xuất part, group boundary, stem, options, tags; sourceText và normalizedText tách biệt. AI được đề nghị sửa OCR nhưng mọi khác biệt phải có diff. SourceExtraction không được tự thêm câu/đáp án không có trong nguồn; thiếu trường phải null + issue.

AC-50: Nhóm Part 3 có 3 câu và một audioRef; Part 7 đôi có hai passage cùng group; Part 2 nhận 3 options labels dù không có option text trong PDF. Mất một passage/hình tạo blocking issue. Câu có dấu phủ định NOT/EXCEPT hoặc số/ngày khác nguồn phải được reviewer kiểm tra, không tự sửa im lặng.

**FR-51 — Nhập và xác nhận đáp án \[R0\].** Nguồn key có thể từ bảng cuối đề, file riêng, nhập tay hoặc AI gợi ý. Mỗi đáp án có origin=SourceKey/HumanAuthored/AISuggested, sourceAnchor nếu có, confirmedBy và confirmedAt. Ghép theo document+section+source number; không theo vị trí dòng sau sort. Mâu thuẫn giữa key rời và key trong đề phải hiện cả hai, không tự chọn confidence cao hơn.

AC-51: Key 31=A trùng hai section phải yêu cầu chọn section; thiếu key giữ Unconfirmed; AI giải được câu nhưng key vẫn AISuggested đến khi người có quyền kiểm tra. Không publish nếu còn key chưa xác nhận, key ngoài option set hoặc mâu thuẫn chưa giải quyết. Batch confirm được phép sau xem phạm vi rõ và không có issue chặn; audit lưu các itemIds được xác nhận.

**FR-52 — Gắn audio và transcript \[R0/R1\].** R0 hỗ trợ một master audio cho cả Listening hoặc các clip theo group với manifest thứ tự và khoảng nghỉ. Editor gắn file theo source group, chọn startMs/endMs và nghe thử. R1 ASR/alignment chỉ đề xuất transcript và mốc, không suy ra key chính thức. Với full Mock, playback plan phải giữ hướng dẫn, thứ tự và thời gian; luyện Part/nhóm dùng các clip phù hợp.

AC-52: startMs \< endMs ≤ durationMs; clip không trỏ file sai scope; kiểm tra đoạn bị thiếu/cắt mất lời, overlap hoặc vùng không phân loại. Full playback manifest phải phủ toàn timeline đã duyệt, bao gồm pause/directions, và timer Listening bằng manifest duration đã duyệt. Baseline khoảng 45 phút, không cắt audio máy móc ở phút 45; Reading luôn 75 phút từ readingStartedAt. Audio lỗi hoặc transcript lệch tạo issue; transcript không trả trong learner Mock DTO.

Cụ thể timer full TOEIC: listeningDeadline = startedAt + manifestDuration; readingStartedAt = listeningDeadline; readingDeadline = listeningDeadline +75 phút. Server đóng response Listening tại listeningDeadline và chỉ cho sửa Reading trong cửa sổ Reading. Reload sau transition phục hồi section theo server time, không trì hoãn Reading vì client offline. Chỉ lỗi dịch vụ được xác nhận mới có Invalidated/lượt bù; không gia hạn dựa trên thời gian máy học viên.

### 25.6 Editor đối chiếu và quản lý lỗi

**FR-53 — Màn hình đối chiếu nguồn \[R0\].** UI gồm nguồn bên trái (PDF/page preview hoặc DOCX rendition có anchor), form câu/cụm ở giữa và danh sách issue bên phải; có thể ẩn một pane trên màn nhỏ. Click field làm nổi vùng nguồn; click vùng dẫn tới field. Có split/merge, đổi thứ tự, ghép passage, chọn crop ảnh, tách vùng key, sửa part và map số nguồn. Undo/redo trong session, autosave revision và audit server. R0 ưu tiên desktop ≥1280px cho soạn đề, mobile chỉ xem/review cơ bản, không hứa editor kéo vùng đầy đủ.

AC-53: Split/merge giữ source anchors và tạo mapping cũ/mới; thay option order không đổi correctOptionId; key conflict không mất sau refresh; hai người sửa cùng revision nhận 409 và so sánh draft. DOCX không có tọa độ trang gốc thì dùng structural anchor; không bịa bounding box. Rendition PDF tạo để đối chiếu có renditionVersion riêng và có thể khác phân trang Word.

**FR-54 — Validation và commit vào kho nháp \[R0\].** Validator server chạy schema, TOEIC profile, group graph, key, asset và provenance. Severity gồm Blocking, Warning, Info. Không có overall confidence nào tự bỏ qua Blocking. Người biên tập commit các group đã chọn vào kho Draft; commit là transaction trên tập chọn. Câu chưa sửa nằm staging, không xuất hiện trong kho Published. Full test thiếu câu/group được giữ Incomplete, không tự bù bằng AI.

AC-54: Thiếu 1 trong 3 câu Part 3 chặn commit group ở trạng thái ReadyForReview; được lưu IncompleteDraft để sửa. Chọn 5 group hoàn chỉnh trong job 20 group có lỗi thì commit đúng 5 với idempotency, không đánh dấu job đã hoàn tất toàn bộ. CSV atomic import FR-34 áp dụng cho cả tập dòng đã chọn trong preview, không mâu thuẫn staging/partial selection.

| **Kiểm tra**                                     | **Mức**                                      | **Cách giải quyết**                                                     |
|--------------------------------------------------|----------------------------------------------|-------------------------------------------------------------------------|
| Sai số option theo Part, hai key, thiếu key      | Blocking                                     | Sửa và xác nhận key                                                     |
| Part 6 mất blank anchor, Part 7 thiếu passage    | Blocking                                     | Đối chiếu nguồn và ghép đúng                                            |
| Part 1 thiếu hình hoặc Listening thiếu audio     | Blocking với Listening/full                  | Bổ sung media hoặc đổi sang nguồn chưa hoàn chỉnh                       |
| Số câu nguồn thiếu/trùng, chưa rõ group boundary | Blocking cho vùng liên quan                  | Xác nhận thiếu thật hay lỗi extraction                                  |
| Text OCR khả nghi, thay chữ phủ định/số liệu     | Blocking khi ảnh hưởng đáp án                | Không publish tự động; cần nguồn tin cậy hoặc human verify khi có người |
| Difficulty do AI gợi ý, tag chưa hiệu chuẩn      | Warning                                      | Giữ Unknown/Predicted; chỉ nâng nhãn sau dữ liệu pilot                  |
| Near duplicate trong kho                         | Warning, có thể nâng Blocking theo policy đề | Loại tự động khỏi batch hoặc quarantine; không cần cố giữ               |
| File nguồn có answer key/transcript              | Blocking learner exposure                    | Tách asset nội bộ; kiểm tra learner DTO/crop                            |

**FR-55 — Duyệt và xuất bản đề \[R0\].** Author SubmitReview đóng băng reviewRevision và contentHash của toàn bộ group, key, audio manifest, giải thích và policy. Reviewer kiểm tra đầy đủ, approve/reject kèm comment. Publisher chạy validate lần cuối, kiểm tra revision/hash được duyệt và quyền nội dung rồi publish TestVersion bất biến. Edit sau Approved làm approval hết hiệu lực; sửa shared group tạo version mới, không cập nhật âm thầm đề đã Published.

AC-55: Admin soạn đề không tự approve; publisher không publish Draft; approved key bị sửa một ký tự yêu cầu duyệt lại; job hoàn tất không tự publish; retire một asset cho đề mới không làm mất file cần cho attempt cũ trừ thu hồi có lý do và chính sách xử lý.

### 25.7 AI tạo nội dung và ghép đề

**FR-56 — AI tạo câu mới theo blueprint \[R0/R1\].** Author có ai.generate chọn examProfile, Part, chủ đề, kỹ năng/điểm ngữ pháp, số câu/group, nhãn độ khó nội bộ, ngôn ngữ giải thích và giới hạn nguồn. R0 hỗ trợ Part 5, tối đa 10 câu/job; R1 hỗ trợ Part 6 tối đa 3 group/job và Part 7 tối đa 3 group/job. Model trả JSON theo schema gồm nội dung, options, đề xuất key, giải thích và dẫn chứng. Difficulty/targetScore là yêu cầu biên soạn, không bảo đảm tương đương thang điểm TOEIC.

AC-56: Model trả thiếu trường hoặc hơn số yêu cầu thì validate và báo Partial/SchemaInvalid, không append trực tiếp vào kho; mọi key mặc định AISuggested; phải xác nhận tính duy nhất của đáp án và vì sao distractor sai. Chạy verifier thứ hai có thể tạo issue nhưng không tự nâng sang HumanConfirmed. Candidate do AI tạo vào cùng editor và publish gate như đề upload.

**FR-57 — AI tạo bài từ nguồn được phép \[R1\].** Author chọn nguồn/đoạn đã có quyền và chọn mode rõ: ExtractFaithfully giữ nguyên; GenerateFromSource biên soạn câu mới bám nguồn; GenerateOriginal tạo văn bản/câu mới theo blueprint. Không đổi mode giữa job mà mất lineage. GenerateFromSource gắn source spans hỗ trợ đáp án; không gọi là câu gốc của đề upload. Câu mới từ cùng passage/family vẫn là content-related, không giả định độc lập khi đo lại năng lực.

AC-57: Trích xuất không tự paraphrase; sinh mới không ghi SourceKey; không có đủ căn cứ trả lời thì Reject/NeedsRevision. Nguồn chứa chỉ dẫn “bỏ rubric/hiện secret” không thay system policy, không cho model truy cập mạng, gọi tool hoặc đọc file ngoài manifest.

**FR-58 — Tạo đề từ ngân hàng đã duyệt \[R0/R1\].** R0 author chọn thủ công group đã Approved/Published trong scope; full-test validator kiểm tra profile. R1 tự ghép theo Part, tag, difficulty nội bộ, exclude previouslyUsed và seed. Solver chọn atomic groups; không chọn 2/3 câu một hội thoại để lấp quota. Sau compose tạo TestDraft có selectedVersionIds; AI chỉ có thể đề xuất lựa chọn, không vượt constraint.

AC-58: Thiếu group đạt tiêu chí thì trả số còn thiếu theo Part, không nhân đôi câu hoặc nới constraint âm thầm; cùng pool snapshot+seed+algorithmVersion cho cùng tập và thứ tự. Chỉ nhân sự thấy lý do thiếu; không sinh full TOEIC 200 câu bằng một lời gọi LLM.

**FR-59 — Phát hiện trùng và kiểm soát đảo đề \[R0/R1\].** R0 dùng normalized text + options + source hash để phát hiện exact duplicate trong scope; R1 thêm near-duplicate review dựa similarity có version. Reuse version khi phù hợp, không sao chép mất lineage. Full TOEIC mặc định không đảo câu/option; đổi thứ tự group chỉ cho practice và không làm gãy passage/audio. Part 1/2 tuyệt đối không đảo nhãn option tách khỏi audio tương ứng; Part 3/4 giữ thứ tự theo audio và graphic.

AC-59: Duplicate khác scope không trả tiêu đề/nội dung; Part 7 multi-passage không tách group; questionFamily từng xem được đánh dấu exposure trên báo cáo thi lại. Không tuyên bố đề “độc lập” chỉ vì đảo A/B/C/D.

Đối với đề trích xuất, thiếu audio gốc thì không thay bằng TTS rồi gọi là bản trích nguyên bản. Đối với nội dung mới, TTS được phép khi lưu đầy đủ provenance, scriptHash và quality metrics. Khi chưa có reviewer, Listening chỉ được phát hành Beta sau automated media gate; không dùng trong ExpertReviewed/CalibratedMock và không che nhãn synthetic nội bộ.

### 25.8 Job bất đồng bộ và chi phí

**FR-60 — Job có checkpoint và retry \[R0\].** Source upload hoàn tất → Queued → Validating → Extracting → Structuring → NeedsReview → Committed hoặc PartiallyCommitted. Có Failed, Canceled, PausedBudget; retry từ checkpoint theo stage/page/group. AI generate đi cùng lifecycle nhưng thay Extracting bằng Generating. Mỗi output lưu jobId, inputHash, pipelineVersion, stageAttempt và candidate revision. Cancel best effort không hứa vendor hoàn phí đã phát sinh; worker không commit output sau cancel nếu không có yêu cầu resume mới.

AC-60: Worker crash ở trang 21 giữ kết quả 1–20; retry callback không tạo group trùng; cùng idempotency key khác input trả 409; user đóng tab vẫn có job ở dashboard. User sửa group thủ công thì reprocess không overwrite, chỉ tạo đề xuất diff với baseRevision.

**FR-61 — Ngân sách và provenance AI \[R0\].** Budget theo người/nhóm và tháng toàn hệ thống, tách pages OCR, input/output tokens và tiền ước tính theo bảng giá cấu hình. Trước job hiển thị phạm vi, route và estimate; reserve ngân sách atomically. Provider/model/prompt/schema version ghi cùng output; không dùng model name làm bằng chứng độ đúng. Chỉ gửi page/region cần xử lý và nguồn được phép tới vendor được cấu hình; không gửi hồ sơ học viên hoặc file toàn kho.

AC-61: Hai job tranh budget cuối chỉ một reserve; exceeded budget chuyển PausedBudget, không gọi provider khác ngoài cấu hình; timeout trạng thái phí chưa rõ ghi UnknownCost và đối soát trước release reservation toàn phần. Admin thấy usage và có kill switch AI/OCR; native parser/editor vẫn hoạt động khi AI tắt. Retry AI tối đa 2 lần cho lỗi tạm thời, schema retry tối đa 1 lần với errors cụ thể; không retry vô hạn.

Công thức so sánh chi phí nội bộ: chi phí OCR theo trang + LLM theo token + media/compute + chi phí audit theo batch nếu có. Cache theo scope+sourceHash+pageRange+pipelineVersion; không cache kết quả AI dùng chung xuyên scope. Đo cost per BetaReady candidate, rejection reason và quarantine rate; không tối ưu bằng cách nới quality gate. Không đưa giá API cố định vào SRS.

### 25.9 Quyền nguồn và tách dữ liệu nội bộ

**FR-62 — Bảo vệ file và nguồn đáp án \[R0\].** SourceOriginal, answerKey, transcript và explanation nội bộ nằm private storage; learner chỉ nhận published safe assets có scope. Không gửi PDF gốc chứa đáp án cho trình duyệt học viên rồi dùng CSS che trang. Crop từ vùng nguồn phải kiểm tra không chứa key bên lề, hướng dẫn nội bộ hoặc chữ có thể đọc dưới lớp che. Preview worker xử lý file trong môi trường giới hạn CPU/RAM/time, không execute macros, external relationships hoặc URL trong tài liệu \[S17\].

AC-62: Student gọi source URL/ID không truy cập được; download URL hết hạn ≤5 phút và kiểm tra scope trước cấp; upload XML/zip bomb hoặc file có embedded script bị chặn/cách ly; sanitization không xóa âm thầm phần câu mà phải báo khác biệt. Source upload không đồng nghĩa có quyền xuất bản; quyền sử dụng/chia sẻ có người xác nhận trước publish.

Retention nguồn: job failed/canceled chưa có candidate giữ 30 ngày; candidate chưa commit giữ 90 ngày sau hoạt động cuối và nhắc trước xóa. Nguồn đang được version Published tham chiếu giữ trong thời gian cần đối chiếu theo policy đã duyệt; không xóa theo TTL staging. Revocation license chặn phát hành mới, đánh giá ảnh hưởng các đề đang dùng và thông báo; không tự thay nguồn hoặc AI paraphrase để né quyền nội dung.

### 25.10 Mở rộng IELTS Reading

**FR-63 — Profile IELTS Reading riêng \[R2\].** Cổng tạo đề tái sử dụng source/package/job/editor, nhưng thay profile validator và schema scoring item. Một full Reading có 3 passages và 40 scoring items/60 phút; một passage có nhiều question groups, nhiều nhóm có thể dùng chung passage. Không ép mọi group thành 4 lựa chọn. Academic là profile đầu; General Training chưa mở. AI chỉ tạo draft passage/questions và gợi ý key như TOEIC, không chấm tự luận.

AC-63: True/False/Not Given không bị đổi thành Yes/No/Not Given; matching reuse option theo policy; gap fill vượt word limit được chấm đúng quy tắc đã duyệt; full 39 hoặc 41 item không publish. Không xuất band overall từ Reading; blank question và không làm bài phân biệt với parser thiếu nội dung.

### 25.11 Dữ liệu và hợp đồng API bổ sung

| **Entity**                         | **Trường quan trọng**                                                     | **Bất biến**                                                    |
|------------------------------------|---------------------------------------------------------------------------|-----------------------------------------------------------------|
| SourcePackage / SourceAsset        | owner, scope, assetType, hash, MIME, license, scanStatus                  | Nguồn gốc bất biến; mỗi reupload tạo asset mới                  |
| SourceRegion                       | assetId, pageNumber, polygon, rotation, coordinateSpace, structuralAnchor | Polygon chuẩn hóa 0–1 với hệ quy chiếu; một field có nhiều vùng |
| ImportJob / JobStage               | state, pipelineVersion, inputHash, checkpoint, budgetReservation, actor   | Job output và quyền của người khởi tạo độc lập                  |
| CandidateGroup / CandidateQuestion | sourceNumber, part, stimulusRefs, options, draftRevision                  | Sống ở staging; không truy cập qua API learner                  |
| StimulusVersion                    | kind, safeContent, internalTranscriptRef, sourceRegions                   | Text/hình/audio có visibility riêng                             |
| QuestionGroupVersion               | examProfile, part, orderedStimuli, orderedQuestions, family               | Atomic khi compose; version bất biến sau approve                |
| AnswerKeyEvidence                  | questionId, optionId/value, origin, sourceAnchor, confirmedBy             | Key là ID/value, không là chữ A sau shuffle                     |
| ValidationIssue                    | fieldPath, regionIds, severity, ruleVersion, resolution                   | Blocking đóng chỉ khi sửa/xác minh đúng quyền                   |
| MediaManifest                      | audioAssets, start/end, order, pause/directions, verifiedBy               | Full playback đã duyệt khớp timer/profile                       |
| AIJob / UsageLedger                | provider/model, token/pages, costState, prompt/schema, inputHash          | Usage append-only; chi phí không ghi đè tùy ý                   |
| ReviewDecision                     | testDraftId, approvedRevision, contentHash, contributorIds                | Đổi nội dung làm review hết hiệu lực                            |
| TestVersion / TestItem             | profileVersion, groupVersionIds, sequence, scorePolicy                    | Snapshot toàn graph, không chỉ question IDs                     |

DTO ví dụ Part 3: groupId, part=3, sourceNumbers=\[32,33,34\], stimuli=\[audioRef,optionalGraphicRef\], questions=\[q1,q2,q3\]. Mỗi q có stemVisibleInMock, optionIds, sourceRegions, primaryTag; AnswerKeyEvidence lưu riêng. Với Part 2, optionIds A/B/C tồn tại để chọn nhưng option spoken text chỉ lưu internal/review content. Với Part 6, blankAnchorId nối đúng vị trí trong passage, không replace mọi chuỗi “\_\_\_\_” bằng cùng câu.

| **API**                                             | **Input chính**                                          | **Output và quyền**                          |
|-----------------------------------------------------|----------------------------------------------------------|----------------------------------------------|
| POST /authoring/source-packages                     | profileId, mode, scopeId, license declaration            | packageId; source.upload                     |
| POST /authoring/source-packages/{id}/upload-intents | MIME, size, hash, assetType                              | constrained URL; source.upload               |
| POST /authoring/source-assets/{id}/complete         | uploaded size/checksum                                   | Validating; upload ownership                 |
| POST /authoring/import-jobs                         | packageId, pageRanges, extractionMode, expectedQuestions | 202 jobId; import.run + budget               |
| GET /authoring/jobs/{id}                            | jobId                                                    | progressStage, completedUnits, issues; scope |
| POST /authoring/jobs/{id}/cancel hoặc /retry        | expectedRevision, retryStage                             | state; job owner/assigned editor             |
| PATCH /authoring/candidate-groups/{id}              | patch whitelist, expectedRevision                        | revision/diff; import.edit                   |
| POST /authoring/groups/{id}/split hoặc /merge       | source regions, expected revisions                       | replacement draft IDs; import.edit           |
| POST /authoring/key-evidence/{id}/confirm           | chosenValue, evidence, reason                            | confirmed key; question.edit                 |
| POST /authoring/import-jobs/{id}/commit             | selectedGroupIds, expected revisions, key                | Draft IDs; test.compose                      |
| POST /authoring/ai-jobs                             | generationMode, blueprint, sourceRefs, limits            | 202 jobId; ai.generate                       |
| POST /authoring/test-drafts/compose                 | profileVersion, group IDs hoặc constraints+seed          | Draft + validation; test.compose             |
| POST /authoring/test-drafts/{id}/submit-review      | expectedRevision/contentHash                             | InReview; test.submit_review                 |
| POST /authoring/reviews/{id}/decision               | approve/reject, comment, revision                        | Approved/ChangesRequested; test.review       |
| POST /authoring/test-drafts/{id}/publish            | approvedRevision, contentHash                            | immutable testVersionId; test.publish        |

Mọi mutation có Idempotency-Key và version check. Không dùng endpoint /admin/... làm lý do chỉ Admin mới thao tác được; /authoring/... dùng policy permission cụ thể. API không cho client cập nhật confirmedBy, approvedBy, scanStatus hoặc publishStatus trực tiếp. ValidationError có fieldPath, ruleCode, sourceRegionIds và message; không trả secret/provider raw payload. Revoke quyền phải có hiệu lực trước commit/review/publish, kể cả job bắt đầu từ trước.

### 25.12 Giải pháp kỹ thuật khuyến nghị

Giữ ASP.NET Core modular monolith và một worker tiến trình riêng. Modules bổ sung: Authoring, SourceIngestion, Extraction, ContentValidation, AIOrchestration. Không cần tách microservice Python chỉ để gọi LLM. Worker tác vụ nặng độc lập web API để PDF/OCR không làm chậm lưu bài học viên. Metadata, state và jobs ở relational database; binary ở private object storage; outbox bảo đảm job sau commit, consumer idempotent.

Lộ trình native: Open XML SDK cho DOCX; PdfPig cho PDF text/layout; PDF.js ở React để hiển thị trang và overlay vùng \[S14,S15,S18\]. Thư viện parser không thay content validator. R1 dùng OCR adapter managed cho trang scan khó; có thể benchmark OCR tự host nếu lượng tài liệu đủ lớn và có người vận hành. Không chốt vendor chỉ vì tương thích .NET: benchmark phải gồm tiếng Anh, bảng, nhiều cột, hình Part 1 và group qua trang.

Đầu ra mọi extractor về IntermediateDocument gồm pages/blocks/text/tables/images/anchors. Rule parser nhận diện rõ trước; LLM chỉ nhận vùng chưa rõ hoặc group cần chuẩn hóa, trả JSON theo schema. Chunk theo group có ngữ cảnh, không cắt giữa passage; buffer trang lân cận xử lý group qua trang. Kết quả luôn qua rule validator. Không để model tự truy vấn database, publish đề hoặc sửa key đã duyệt.

Xử lý ảnh: giữ asset gốc và tọa độ; không dùng OCR để tái tạo ảnh mô tả tình huống Part 1. Bảng/email/ad Part 7 ưu tiên semantic HTML nếu trích ổn, nhưng luôn giữ ảnh nguồn để reviewer so sánh. Nếu chỉ có crop ảnh, cần alt/transcription phù hợp trước xuất bản vào mode yêu cầu tiếp cận; không khẳng định OCR bảo đảm accessibility.

Tối ưu vận hành: queue native/OCR/LLM tách giới hạn concurrency; mặc định 2 native jobs/worker, 1 OCR và 1 LLM job/nhân sự, cấu hình theo tài nguyên. Native stage timeout 120 giây/file trong giới hạn đã nêu; OCR/LLM tối đa 10 phút/stage trước Failed/UnknownProviderStatus, không hủy kết quả provider đang chạy bằng tạo job mới trùng. Có health metrics queueAge, stageLatency, retryCount, reviewMinutes, correctionRate và costPerAcceptedQuestion.

### 25.13 Kiểm thử và tiêu chí chất lượng

Nghiệm thu extraction pipeline dùng bộ cấu trúc được gán nhãn thủ công cho page/group/key mapping; không dựa demo một file đẹp. Khi chưa có chuyên gia, tập này chỉ chứng minh parser/validator hoạt động, không chứng minh nội dung học thuật đúng. Content generation dùng synthetic technical fixtures, automated gates và Beta telemetry; expert gold set được bổ sung trước Level 3. Không dùng đề không có quyền làm benchmark hoặc đưa vào model.

| **Chỉ số**                          | **Mục tiêu nội bộ đề xuất**                                                           | **Cách tính**                                                                        |
|-------------------------------------|---------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| R0 template boundary/group accuracy | ≥99% trên DOCX đúng template                                                          | Group/câu tách đúng hoàn toàn / gold set tương ứng                                   |
| R0 PDF text accuracy                | ≥97% question detection; ≥95% group mapping                                           | Đo riêng theo loại file/Part; không gộp che lỗi Listening                            |
| R1 scan benchmark                   | ≥95% question detection; ≥90% group mapping trước review                              | Bộ scan đọc được; file mờ phải báo không đủ chất lượng                               |
| Auto-validated candidate            | 100% schema/profile/evidence gate; generator key và hai solver độc lập đồng thuận     | Một bất đồng hoặc blocking issue loại khỏi BetaReady                                 |
| Tỷ lệ sống qua pipeline             | Theo dõi theo Part, blueprint và model; không đặt KPI ép cao                          | accepted candidates / generated candidates; rejection cao có thể là lựa chọn an toàn |
| R0 native latency                   | p95 ≤120 giây cho đề 40 trang/200 câu native trên worker 4 vCPU/8GB, 2 jobs đồng thời | Không tính hàng đợi/upload/human; staging gần production                             |
| AI/OCR latency                      | Báo p50/p95 theo provider; không hứa thời gian cố định trước benchmark                | Tách queue, provider và validation                                                   |

Ngưỡng là tiêu chí phát hành đề xuất, chưa là kết quả đo. “Tách đúng câu” gồm đủ stem và options; “đúng group” gồm đủ passage/audio/graphic references và thứ tự. Học thuật đúng đáp án phải kiểm riêng với trích đúng nội dung. Một file không đạt phải được đưa sang sửa tay/nguồn tốt hơn; không được bỏ qua issue để đạt KPI.

| **TC mới** | **FR** | **Tình huống**                                                      | **Kết quả bắt buộc**                                         |
|------------|--------|---------------------------------------------------------------------|--------------------------------------------------------------|
| TC-29      | 46     | Uploader gọi generate/publish; role bị thu hồi khi job chạy         | 403; giữ output riêng, chặn read/commit trái quyền           |
| TC-30      | 47,62  | MIME giả, DOCX zip bomb, PDF khóa mật khẩu                          | Reject/quarantine; không chạy parser/provider                |
| TC-31      | 48–50  | PDF 2 cột, stem trang 4, options trang 5                            | Đủ một câu với nhiều source regions; không ghép câu cạnh cột |
| TC-32      | 49     | PDF 10 trang, 3 scan; retry OCR một trang                           | Chỉ OCR scan và trang lỗi, không tính phí lặp mọi trang      |
| TC-33      | 50,52  | Part 2 PDF không có text options, audio có 3 lựa chọn               | Nhận đúng cấu trúc A–C, không tạo D/transcript visible       |
| TC-34      | 50,54  | Part 3 thiếu một câu; Part 7 đôi thiếu passage                      | Blocking group, không tự bù nội dung                         |
| TC-35      | 51     | Key rời lệch số, hai key khác nhau                                  | Hiển thị conflict có evidence; không tự chốt                 |
| TC-36      | 51,56  | Không có key; AI đề xuất B                                          | Vẫn Unconfirmed; không publish tới khi human confirm         |
| TC-37      | 52     | Clip cắt giữa câu; audio dài hơn timer cũ; mạng mất lúc đổi section | Issue media; dùng manifest deadline; không cộng giờ client   |
| TC-38      | 53–55  | Hai editor merge cùng group; sửa key sau approve                    | 409; approval invalidated và yêu cầu review lại              |
| TC-39      | 54,60  | Partial commit 5 group, callback trùng, worker crash                | Chỉ 5 group một lần; checkpoint giữ phần còn lại             |
| TC-40      | 56–57  | Model thiếu options, đáp án mơ hồ, prompt injection                 | Validation issue; không tool call hoặc publish               |
| TC-41      | 58–59  | Pool thiếu Part 4; cố chia group để đủ 200                          | Báo thiếu; không nới rule hoặc nhân đôi                      |
| TC-42      | 59     | Đảo labels Part 1/2 không đổi audio                                 | Bị chặn trong Full Mock                                      |
| TC-43      | 60–61  | Timeout provider với phí chưa rõ; reprocess group đã sửa tay        | UnknownCost đối soát; diff chứ không overwrite               |
| TC-44      | 61     | Hai job tranh hạn mức; AI kill switch                               | Một reserve; native/editor tiếp tục hoạt động                |
| TC-45      | 62     | PDF nguồn có key cuối file; transcript hidden bằng CSS              | Learner không nhận file/key/transcript ngay từ API           |
| TC-46      | 55,62  | Admin tự duyệt; changed group ảnh hưởng đề đã published             | Chặn tự duyệt; đề cũ dùng snapshot                           |
| TC-47      | 63     | Reading 39 items, TFNG bị đổi thành YNNG, matching cho phép reuse   | Chặn profile sai; giữ type/policy chính xác                  |

### 25.14 Use case tạo đề thực tế

UC-07 — Import đề TOEIC full: Author chọn Full TOEIC → upload đề PDF/DOCX, key và MP3 → khai báo quyền dùng → preflight hiển thị trang native/scan → chọn extraction → nhận draft Part 1–7 → sửa group/ảnh → map key theo số nguồn → gắn audio hoặc manifest → nghe kiểm tra → xử lý issues → commit TestDraft → gửi reviewer → publisher xuất bản. Thiếu audio không làm mất Reading đã xử lý, nhưng full test chưa publish; không tự chuyển một bộ Reading thành TOEIC full.

UC-08 — AI soạn bài Part 5: Author chọn Present perfect, chủ đề công sở, 10 câu, mức trung bình → xem estimate → tạo job → editor hiển thị câu, key AISuggested và giải thích → author kiểm tra đáp án/distractors → reviewer duyệt → publish bộ drill. Muốn full mock thì compose từ bank đã duyệt, không đổi nhãn 10 câu thành đề thi đầy đủ.

UC-09 — Nhận đề scan khó: Uploader tải ảnh → Author chạy OCR ở R1 → một trang mờ NeedsReview → người biên tập crop lại/đổi ảnh/sửa tay → hệ thống giữ nguồn và diff → kiểm key/group → publish theo gate thường. Nếu không đọc được nguồn, yêu cầu bản rõ hơn; không dựa LLM bịa nội dung để hoàn tất job.

### 25.15 Nguồn nghiên cứu bổ sung

\[S12\] SHub Giáo Viên, thông tin và lịch sử phiên bản do nhà phát triển công bố trên App Store; có chức năng đề tách câu và tách phần tiếng Anh. https://apps.apple.com/vn/app/shub-gi%C3%A1o-vi%C3%AAn/id1610958369 . Trang sản phẩm: https://shub.edu.vn/ . Chưa xác minh được pipeline nội bộ hoặc khả năng OCR/AI hiện hành; không suy đoán từ tên tính năng.

\[S13\] ETS, TOEIC Listening and Reading Test Examinee Handbook, phần About the test và Sample questions. https://www.in.ets.org/content/dam/ets-india/pdfs/toeic/toeic-listening-reading-test-examinee-handbook.pdf

\[S14\] PdfPig, Document Layout Analysis và reading order. https://github.com/UglyToad/PdfPig/wiki/Document-Layout-Analysis ; https://uglytoad.github.io/PdfPig/

\[S15\] Microsoft, Open XML SDK Word processing. https://learn.microsoft.com/en-us/office/open-xml/word/overview

\[S16\] Microsoft, Document Intelligence layout analysis. https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/layout?view=doc-intel-4.0.0

\[S17\] OWASP, File Upload Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

\[S18\] Mozilla, PDF.js Getting Started. https://mozilla.github.io/pdf.js/getting_started/

Nguồn tra cứu ngày 22/09/2026. Bộ đề thực tế chưa được cung cấp để chạy benchmark; các chỉ số chất lượng và cấu hình phần mềm ở mục 25 là yêu cầu/giải pháp đề xuất, không phải kết quả thử nghiệm đã hoàn thành.

## 26 Thu nhận, chuẩn hóa và nạp đề đa nguồn

Mục này mở rộng cổng tạo đề để hệ thống không phụ thuộc PDF/DOCX. Tại baseline 3.2, chủ sản phẩm xác nhận chưa có kho đề cũ; do đó mục này là khả năng tiếp nhận nội dung do admin/đối tác cung cấp về sau, không phải chiến lược tạo nguồn cho R0. Nguồn R0 được sản xuất theo mục 27. Tất cả nguồn đi qua cùng Canonical Assessment Model (CAM), validator TOEIC và cổng duyệt ở mục 25. “Lấy được dữ liệu” không đồng nghĩa “được quyền xuất bản”: quyền sử dụng, bằng chứng nguồn và phạm vi giấy phép là điều kiện riêng. ETS nêu test và tài liệu liên quan có bản quyền, quyền sao chép chỉ được cấp bằng văn bản \[S22\]. Vì vậy hệ thống ưu tiên nội dung tự biên soạn, nội dung được cấp phép và gói do chủ sở hữu cung cấp; không xây crawler để sao chép hàng loạt đề thương mại.

### 26.1 Danh mục nguồn và thứ tự triển khai

| **Kênh thu nhận**                          | **Ví dụ đầu vào**                                   | **Độ giữ cấu trúc**      | **Rủi ro/công sửa**                          | **Release đề xuất**                           |
|--------------------------------------------|-----------------------------------------------------|--------------------------|----------------------------------------------|-----------------------------------------------|
| Form nhập tay/editor                       | Câu, cụm, passage, key, audio do biên tập viên nhập | Cao nhất                 | Chậm; cần autosave và clone group            | R0                                            |
| Template Excel/XLSX                        | Sheet Questions, Groups, Assets, Keys               | Cao nếu đúng mẫu         | Sai ID, kiểu ô, đường dẫn asset              | R0                                            |
| DOCX template/tự do                        | Đề và key do đơn vị biên soạn cung cấp              | Cao/trung bình           | Styles, bảng và ảnh không đồng nhất          | R0/R1                                         |
| PDF native/scan/ảnh                        | Đề giấy được phép dùng                              | Trung bình/thấp          | OCR, cột, group qua trang, thiếu audio       | R0/R1                                         |
| Gói nguồn ZIP có manifest                  | document + key + media + metadata                   | Cao                      | Zip bomb, đường dẫn độc, manifest sai        | R1 sau sandbox; khác ZIP tùy ý bị cấm ở FR-47 |
| QTI/Common Cartridge                       | Export từ LMS/item bank có quyền                    | Cao cho item chuẩn       | Khác phiên bản/profile, extension vendor     | R1                                            |
| Moodle XML/GIFT                            | Export question bank                                | Trung bình/cao           | HTML/media nhúng, category và type riêng     | R1                                            |
| API/connector hệ thống đối tác             | LMS nội bộ, kho nội dung có OAuth/API               | Cao nếu contract ổn định | Token, rate limit, delta sync, thu hồi quyền | R1                                            |
| Google Forms quiz có quyền                 | Form do tổ chức sở hữu và cấp OAuth                 | Trung bình               | Không biểu diễn đủ group/audio TOEIC         | R2 tùy nhu cầu                                |
| HTML/web package được cấp phép             | HTML lưu trữ nội bộ hoặc URL allowlist              | Trung bình               | DOM đổi, nội dung động, điều khoản sử dụng   | R2                                            |
| AI tạo mới hoặc chuyển thể nguồn được phép | Blueprint, corpus nội bộ, passage được phép         | Biến thiên               | Hallucination, trùng lặp, chi phí            | R0 Part 5/R1 Part 6–7                         |
| Đóng góp cộng tác viên                     | Bộ câu hỏi kèm tuyên bố quyền sử dụng               | Biến thiên               | Chất lượng và provenance                     | R1 có review hai lớp                          |

QTI được 1EdTech thiết kế để đóng gói và di chuyển câu hỏi/đề giữa ứng dụng \[S19\]; Common Cartridge đóng gói tài nguyên học tập và có thể mang assessment \[S20\]. Moodle hỗ trợ import/export GIFT và Moodle XML; XML là định dạng riêng của Moodle cho Quiz \[S23,S24\]. Google Forms API có thể đọc/sửa form và quiz khi tài khoản được cấp quyền \[S21\]. Đây là các adapter nhập dữ liệu, không phải cam kết tương thích mọi extension của nhà cung cấp.

**Quyết định ưu tiên sau khi xác nhận chưa có kho cũ:** R0 giữ editor, XLSX template và DOCX template để đội nội dung nhập bản thảo được tạo mới; PDF native chỉ là tiện ích cho tài liệu do tác giả/đối tác có quyền cung cấp. QTI, Moodle, connector, Google Forms, HTML và crawler không nằm trên critical path R0; chỉ làm khi xuất hiện nguồn cụ thể và có business case. Không dành sprint để xây crawler trước khi có nguồn hợp lệ cần lấy.

### 26.2 Canonical Assessment Model và hồ sơ nhập

**FR-64 — Canonical Assessment Model \[R0\].** Mọi adapter phải xuất cùng CAM versioned gồm SourcePackage, Assessment, Section, Stimulus, QuestionGroup, Question, Option, AnswerKeyEvidence, Explanation, Asset, SourceRegion và LicenseRecord. CAM giữ \`sourceValue\` và \`normalizedValue\`, ngôn ngữ, examProfile, part, thứ tự, stable external ID, source anchor, confidence từng field và adapterVersion. Part 3/4/6/7 giữ group nguyên tử; asset không được nhúng base64 vào JSON nghiệp vụ.

AC-64: Cùng một đề nhập bằng XLSX template và DOCX template tạo graph tương đương theo semantic hash; round-trip CAM → export nội bộ → CAM không mất group, option IDs, key, media link hoặc provenance. Trường không ánh xạ được nằm trong extensions kèm namespace, không bị bỏ âm thầm.

**FR-65 — Import profile và mapping có phiên bản \[R0/R1\].** Người tạo chọn hoặc hệ thống gợi ý SourceType và ImportProfile. Profile mô tả cột/sheet, style/marker, numbering, option labels, key layout, timezone, encoding, asset naming, examProfile và chính sách group. Preview tối thiểu 5 group trước khi chạy toàn bộ. Mapping đã xác nhận có version và chỉ tái sử dụng trong scope tổ chức; sửa profile không làm đổi job cũ.

AC-65: XLSX đổi tên cột hoặc QTI có interaction chưa hỗ trợ tạo issue \`MappingRequired/UnsupportedInteraction\`; không suy đoán thành câu single choice. Preview và commit dùng cùng profileVersion/content hash; file đổi sau preview buộc preview lại.

### 26.3 Adapter nhập dữ liệu

**FR-66 — XLSX/CSV template an toàn \[R0\].** Workbook chuẩn gồm \`Manifest\`, \`Groups\`, \`Questions\`, \`Options\`, \`Keys\`, \`Assets\`; mỗi dòng dùng client-generated externalId để tham chiếu. Data validation/dropdown hỗ trợ Part, type, language và answer label. CSV chỉ dành cho một bảng đơn giản; full TOEIC dùng XLSX hoặc package để giữ quan hệ. Công thức không được thực thi; giá trị bắt đầu bằng \`=,+,-,@\` được xử lý như dữ liệu khi export. Asset được tải riêng rồi map bằng assetExternalId/checksum.

AC-66: Dòng option tham chiếu question không tồn tại, key trùng, externalId lặp, hidden sheet chứa dữ liệu ngoài manifest hoặc workbook vượt giới hạn đều báo đúng vị trí; người dùng tải được file lỗi có sheet \`ImportErrors\`. Không commit nửa group.

**FR-67 — QTI/Common Cartridge và Moodle \[R1\].** Adapter QTI hỗ trợ subset công bố rõ: assessment/item, choice interaction một đáp án/nhiều đáp án, ordered response, text entry cơ bản, feedback, manifest và media local. Common Cartridge chỉ lấy QTI/resource được allowlist. Moodle XML hỗ trợ multichoice, true/false, short answer, matching và description khi map được; GIFT dành cho các loại văn bản cơ bản. HTML được sanitize; identifier nguồn giữ riêng. Extension, plugin question type, script, LTI link và remote executable không được chạy.

AC-67: Package khai QTI version lạ hoặc response processing không biểu diễn được bị giữ \`Unsupported\`, không tự chuyển key; path traversal, external entity và file thực thi bị chặn. Báo cáo nêu số item imported/skipped/blocked theo type và lý do. TOEIC validator vẫn chặn item đúng chuẩn QTI nhưng sai Part/group.

**FR-68 — Connector API và đồng bộ có kiểm soát \[R1/R2\].** Connector dùng OAuth/service account theo workspace, permission tối thiểu, secret vault và allowlist host. Người dùng chọn collection/form cụ thể; lần đầu full import, lần sau delta theo cursor/ETag nếu provider hỗ trợ. Mỗi external object map \`(connectorId, externalId, externalVersion)\`; thay đổi nguồn tạo candidate revision, không ghi đè bản đã review/publish. Xóa ở nguồn tạo tombstone đề nghị archive, không xóa câu đang được đề sử dụng.

AC-68: Token hết hạn chuyển \`NeedsReconnect\`; 429 dùng backoff và checkpoint; webhook trùng idempotent; provider trả cùng ID nhưng version mới tạo diff. Thu hồi connector chặn sync mới và xóa token, không xóa audit/provenance cần giữ.

**FR-69 — Web/Google Forms và thu nhận bán cấu trúc \[R2\].** Chỉ đọc tài nguyên mà tài khoản/URL đã được tổ chức cho phép. Google Forms connector đọc quiz items, choices, answer key/feedback nếu API và quyền cung cấp; page break có thể gợi ý section nhưng không tự suy ra Part. HTML importer nhận file HTML/package nội bộ hoặc URL allowlist do Admin cấu hình, lưu snapshot và content hash; không vượt đăng nhập, CAPTCHA, robots/điều khoản hoặc tải vòng link. DOM selector là profile versioned; ảnh/audio remote phải được phép sao chép hoặc giữ link theo license.

AC-69: Form grid/file-upload/date hoặc item không hỗ trợ tạo issue, không bóp thành multiple choice. URL chuyển domain, nội dung sau login hoặc license chưa xác nhận bị chặn. Web source đổi DOM không âm thầm xuất câu rỗng; quality gate so số group/field với preview.

### 26.4 Quyền nội dung, chống trùng và chuẩn hóa

**FR-70 — License gate và sổ nguồn \[R0\].** Mỗi SourcePackage khai owner, acquiredBy, acquiredAt, sourceKind, licenseType, proofAsset, allowedUses, territory, expiresAt, attribution và restriction. Trạng thái \`Unverified\`, \`Verified\`, \`Rejected\`, \`Expired\`. Chỉ \`Verified\` và có \`publish=true\` mới được phát hành; Admin có permission không được tự bỏ qua gate mà không có quyết định/audit. Tài liệu mẫu công khai của tổ chức thi chỉ là nguồn tham khảo khi điều khoản chưa cho phép sao chép lên dịch vụ.

AC-70: License hết hạn chặn publish version mới và cảnh báo nội dung đang dùng; thay proof tạo revision và người duyệt pháp lý/nội dung. Export phải mang attribution/restriction; clone sang workspace khác kiểm tra lại quyền. Source bị Rejected có thể giữ fingerprint để chống nhập lại nhưng nội dung bị cách ly/xóa theo retention.

**FR-71 — Pipeline chuẩn hóa và nạp ngân hàng \[R0/R1\].** Pipeline cố định: Acquire → Quarantine → Identify → Extract → MapToCAM → Normalize → ValidateProfile → ResolveAssets → DetectDuplicate → HumanReview → CommitBank → ComposeTest → Publish. Normalize chỉ thực hiện biến đổi bảo toàn nghĩa: Unicode NFC, newline, khoảng trắng, dấu nháy, label option, số câu và MIME; sửa chính tả/viết lại là editorial change có diff. Mỗi stage ghi inputHash, outputHash, tool/adapterVersion, issues và actor. Commit tạo QuestionGroupVersion bất biến trong staging bank; publisher chọn đưa vào approved bank.

AC-71: Retry từ checkpoint cho cùng input/profile sinh cùng CAM semantic hash; sửa tay được lưu patch riêng và không mất khi reprocess. Exact duplicate không tạo bản mới; near duplicate vào hàng review. Commit 100 group mà 4 group lỗi có thể commit 96 nếu người dùng chọn partial, nhưng bốn group lỗi không được xuất hiện trong test hoặc chỉ số “đã sẵn sàng”.

### 26.5 Thiết kế module cho .NET

Kiến trúc nên dùng ports/adapters trong modular monolith:

| **Module**       | **Trách nhiệm**                                | **Interface định hướng**                     |
|------------------|------------------------------------------------|----------------------------------------------|
| SourceIntake     | upload session, connector, quarantine, license | \`ISourceAdapter\`, \`IConnectorClient\`     |
| Extraction       | DOCX/PDF/OCR/XLSX/QTI/Moodle/HTML              | \`IExtractionAdapter.ExtractAsync()\`        |
| Canonicalization | map về CAM, normalize, semantic hash           | \`ICanonicalMapper\`, \`INormalizationRule\` |
| Validation       | schema + TOEIC/IELTS profile + asset/key       | \`IAssessmentValidator\`                     |
| Review           | issue, patch, diff, approval                   | \`IReviewWorkflow\`                          |
| QuestionBank     | version, dedupe, search, lifecycle             | \`IQuestionBankService\`                     |
| TestComposition  | blueprint, group atomic, exposure              | \`ITestComposer\`                            |

Mỗi adapter trả \`AdapterResult\<CAM\>\` cùng issues; không gọi repository để tự commit. Application service điều phối job và transaction/outbox. File lớn nằm object storage; PostgreSQL lưu metadata, graph, version và JSONB extension có schemaVersion. Worker giới hạn CPU/RAM/thời gian theo adapter. Chưa cần microservice riêng; có thể tách Extraction Worker khi OCR/package tải nặng.

API bổ sung:

| **API**                                          | **Mục đích**                     | **Quyền**                 |
|--------------------------------------------------|----------------------------------|---------------------------|
| GET \`/authoring/import-profiles\`               | Danh sách format/subset/giới hạn | \`source.read\`           |
| POST \`/authoring/import-profiles/{id}/preview\` | Preview + mapping/issues         | \`import.run\`            |
| POST \`/authoring/source-packages/{id}/license\` | Khai báo bằng chứng quyền dùng   | \`source.license.manage\` |
| POST \`/authoring/connectors\`                   | Tạo connector theo workspace     | \`connector.manage\`      |
| POST \`/authoring/connectors/{id}/sync\`         | Full/delta sync có checkpoint    | \`import.run\`            |
| GET \`/authoring/import-jobs/{id}/report\`       | Báo cáo item/group/asset/license | scope owner/reviewer      |
| POST \`/authoring/import-jobs/{id}/commit-bank\` | Commit các group đã chọn         | \`question.edit\`         |

### 26.6 Kiểm thử bổ sung

| **TC** | **FR** | **Tình huống**                                      | **Kết quả bắt buộc**                                         |
|--------|--------|-----------------------------------------------------|--------------------------------------------------------------|
| TC-48  | 64     | Một Part 7 nhập XLSX và DOCX                        | Cùng graph/semantic hash; anchors khác được giữ              |
| TC-49  | 65     | Preview xong thay file hoặc profile                 | Buộc preview lại; không commit mapping cũ                    |
| TC-50  | 66     | Workbook có formula, duplicate ID, key sai          | Không thực thi; báo ô chính xác; không commit group lỗi      |
| TC-51  | 67     | QTI có custom responseProcessing/XXE/path traversal | Unsupported hoặc blocked; không suy key/ghi file ngoài scope |
| TC-52  | 67     | Moodle XML có HTML, media và plugin type            | Sanitize; media nội bộ; plugin type nằm skipped report       |
| TC-53  | 68     | Sync 429, token hết hạn, webhook lặp                | Backoff/checkpoint; reconnect; idempotent                    |
| TC-54  | 68     | Nguồn xóa câu đang nằm trong đề Published           | Tạo tombstone/cảnh báo; snapshot đề không mất                |
| TC-55  | 69     | Google Form có grid và page break                   | Grid issue; page break không tự suy Part                     |
| TC-56  | 69–70  | URL đổi domain hoặc thiếu quyền sao chép            | Chặn import/publish; lưu lý do và audit                      |
| TC-57  | 70     | License hết hạn sau khi đã có câu trong bank        | Chặn publish mới; tìm được tất cả version bị ảnh hưởng       |
| TC-58  | 71     | Reprocess sau 3 patch thủ công                      | Patch còn nguyên hoặc conflict rõ; không mất sửa             |
| TC-59  | 71     | 100 group, 4 lỗi, partial commit                    | Chỉ 96 staging versions; báo 4 group chưa sẵn sàng           |

### 26.7 Nguồn nghiên cứu cho mở rộng đa nguồn

\[S19\] 1EdTech, Question & Test Interoperability (QTI). https://www.1edtech.org/standards/qti

\[S20\] 1EdTech, Common Cartridge. https://www.1edtech.org/standards/cc

\[S21\] Google for Developers, Google Forms API Overview. https://developers.google.com/workspace/forms/api/guides

\[S22\] ETS, Permissions Use Policies. https://www.ets.org/legal/permissions.html

\[S23\] MoodleDocs, Import questions. https://docs.moodle.org/en/Import_questions

\[S24\] MoodleDocs, Moodle XML format and GIFT format. https://docs.moodle.org/en/Moodle_XML_format ; https://docs.moodle.org/en/GIFT_format

Các chuẩn trên xác nhận khả năng trao đổi/import của định dạng. Phạm vi subset, độ chính xác adapter và chi phí review trong SRS là quyết định sản phẩm cần benchmark bằng gói nguồn thực tế trước khi cam kết SLA.

## 27 Nhà máy nội dung TOEIC từ số 0

### 27.1 Quyết định nguồn nội dung

Chủ sản phẩm xác nhận chưa có kho đề cũ. R0 phải tạo nội dung gốc, không lấy việc crawl đề luyện thi đang công khai trên Internet làm nguồn. Tài liệu ETS được dùng để đối chiếu format, hướng dẫn và đặc trưng kỳ thi; không tự sao chép câu hỏi vào sản phẩm. ETS công bố sample và tài liệu chuẩn bị \[S25\], đồng thời yêu cầu xin phép bằng văn bản khi tái sử dụng tài liệu có bản quyền và có chính sách riêng với tài liệu TOEIC \[S22,S26\].

Nguồn đề theo thứ tự khuyến nghị:

| **Mô hình**                      | **Tốc độ**                          | **Chi phí**    | **Quyền sở hữu và chất lượng**                                                             | **Quyết định**                     |
|----------------------------------|-------------------------------------|----------------|--------------------------------------------------------------------------------------------|------------------------------------|
| Controlled AI Item Factory       | Trung bình lúc đầu, cao khi ổn định | Trung bình     | Blueprint + validator + solver độc lập + Beta telemetry; không cần reviewer toàn thời gian | Chọn làm mô hình chính v3.3        |
| AI tạo và AI tự chấm một lần     | Nhanh                               | Thấp           | Lỗi tương quan, judge bias, không có cơ chế từ chối an toàn                                | Không dùng để auto publish         |
| Mua/license kho đề               | Nhanh sau hợp đồng                  | Cao            | Tốt nếu quyền, format, key và chất lượng được cam kết                                      | Phương án bổ sung, không chặn MVP  |
| Thuê chuyên gia audit theo batch | Trung bình                          | Theo batch     | Không cần nhân sự full-time; mở khóa ExpertReviewed                                        | Khuyến nghị khi bắt đầu thương mại |
| Crawl đề Internet                | Nhanh lúc thử                       | Chi phí ẩn cao | Quyền không rõ, trùng, sai key và parser dễ vỡ                                             | Loại khỏi R0/R1                    |

### 27.2 Blueprint trước khi sinh câu

**FR-72 — Blueprint nội dung có phiên bản \[R0\].** Mọi job tạo mới phải tham chiếu ContentBlueprintVersion. Blueprint quy định examProfile, Part, group size, item type, mục tiêu ngữ pháp/từ vựng/kỹ năng đọc-nghe, bối cảnh công việc, độ dài, difficulty nội bộ, distractor policy, forbidden topic, tên hư cấu, evidence requirement, media requirement và quota theo taxonomy. Full test blueprint cố định số lượng Part theo FR-22; practice blueprint có thể nhỏ hơn nhưng không phá group.

AC-72: Không có blueprint Published thì job không chạy; blueprint Part 3 yêu cầu 3 câu/conversation, Part 6 yêu cầu 4 câu/text và Part 7 khai báo single/double/triple. Sửa blueprint tạo version mới, không làm đổi question draft cũ. Hệ thống báo coverage thiếu/thừa trước khi compose đề.

FR-73 — Ma trận phủ nội dung và chống lặp \[R0\]. ContentPlan lập quota theo Part × skill/tag × difficulty × scenario × lexical range. Scenario gồm office, travel, purchasing, schedules, services và bối cảnh giao tiếp công việc phù hợp; taxonomy do policy owner version hóa. Không dùng tên công ty/người thật mặc định. Semantic fingerprint kiểm tra với bank, prompt examples và các batch trước; family variant không xuất hiện cùng form.

AC-73: Job yêu cầu 100 câu không được tạo 100 biến thể cùng một pattern; dashboard thể hiện planned/generated/rejected/BetaReady/BetaActive/DataValidated. Duplicate vượt threshold bị Reject/Quarantine, không chuyển thành review bắt buộc. Cùng seed chỉ phục vụ tái lập kỹ thuật, không dùng nhân bản câu.

### 27.3 Luồng AI tạo Reading

**FR-74 — Sinh draft Reading theo từng đơn vị nhỏ \[R0/R1\].** R0 hỗ trợ Part 5 tối đa 10 câu/job; R1 hỗ trợ Part 6 và 7 tối đa 3 group/job. Model nhận blueprint, schema, danh sách nội dung đã dùng và constraints; trả JSON schema gồm stimulus, questions, options, suggested key, rationale, evidence span và self-check. Không gửi toàn bộ ngân hàng vào prompt; retrieval chỉ lấy taxonomy, style guide và near-duplicate candidates trong scope được phép.

AC-74: Part 5 chỉ có một đáp án tốt nhất và rationale giải thích từng distractor; Part 6 blank anchor tồn tại trong passage; Part 7 mỗi key có evidence span trong stimulus, trừ loại câu hợp lệ yêu cầu suy luận và phải có rationale. Schema sai retry tối đa theo FR-61; sau đó NeedsReview, không chèn chuỗi rỗng.

AI verifier thứ hai chỉ phát hiện vấn đề: nhiều đáp án đúng, evidence không đủ, kiến thức ngoài passage, ngữ pháp không tự nhiên, distractor vô nghĩa, tên/địa chỉ thật hoặc nội dung quá giống nguồn. Verifier không được tự nâng key thành HumanConfirmed.

### 27.4 Luồng sản xuất Listening và hình

**FR-75 — Sản xuất script, hình và audio gốc \[R0/R1\].** Listening được tạo theo ba artifact tách biệt: script versioned → answer/evidence review → media production. Part 1 cần ảnh tự tạo, ảnh stock có license hoặc ảnh do đội nội dung sở hữu; không dùng ảnh tìm kiếm ngẫu nhiên. Part 2 lưu prompt và ba responses nội bộ nhưng learner không thấy text. Part 3 dùng conversation nhiều speaker và 3 câu/group; Part 4 dùng talk và 3 câu/group. Script không nhắc trực tiếp đáp án một cách máy móc trừ khi item chủ ý kiểm tra chi tiết.

Audio có thể do voice actor hoặc TTS provider tạo. Mỗi asset lưu productionType, provider/model/voice/version, accent label nội bộ, speakingRate, generatedAt, scriptHash và license. Audio assembler tạo directions, pause, clip boundaries và manifest; không nối file bằng khoảng lặng tùy ý ngoài profile.

AC-75: TTS đổi model/voice tạo asset version mới; script sửa làm asset cũ Stale. Automated media gate kiểm tra codec, duration, silence/clipping, ASR alignment, speaker consistency và khớp scriptHash. Khi chưa có người nghe chuyên môn, audio chỉ đạt Beta; Part 1 ảnh phải qua image policy và ambiguity critic. Transcript/script không trả qua learner API trong mock.

### 27.5 Kiểm định tự động theo rủi ro và review chuyên môn tương lai

FR-76 — Kiểm định theo tier \[R0\]. Khi chưa có reviewer, draft AI đi qua deterministic validators, hai solver độc lập, adversarial critic, perturbation và form gate; chỉ được gán AutoValidated/Beta/DataValidated. Khi có chuyên gia, ContentReviewer và FullTestReviewer có thể nâng revision lên ExpertReviewed theo separation of duties. Điểm self-evaluation của model không là bằng chứng chất lượng.

AC-76: Mọi key/evidence phải có solver consensus; mọi group boundary và media phải đạt automated gate. AI/System không được tạo HumanConfirmed. Full mock chưa có expert luôn mang nhãn Beta và raw score. Mọi Blocking finding có disposition Reject/Quarantine; không có nút ignore để publish.

**FR-77 — Provenance của nội dung tạo mới \[R0\].** QuestionVersion lưu creationMode Human, AI-assisted hoặc Licensed; contributor IDs; blueprintVersion; promptTemplateVersion; model identifier; source references nếu có; generated output hash; review chain; asset license và similarity report. Prompt/output thô có thể lưu kho riêng theo retention và quyền, nhưng metadata provenance phải đủ audit. Tác giả/cộng tác viên xác nhận quyền chuyển giao hoặc quyền sử dụng theo contract trước khi submit.

AC-77: Không có contributor/provenance hoặc asset license thì chặn publish; đổi model không làm đổi content đã publish. Export nội dung giữ attribution/restriction. Xóa log prompt theo retention không xóa decision/audit tối thiểu.

### 27.6 Khối lượng nội dung ban đầu

FR-78 — Gate nội dung cho pilot \[R0\]. Pilot R0A không yêu cầu hai full mock. Trước pilot phải có tối thiểu 150 Part 5 BetaReady và 20 group Part 7 direct-evidence BetaReady, không trùng family; telemetry, report và auto quarantine hoạt động. Hai full mock độc lập là mục tiêu R1 và chỉ đạt ExpertReviewed/CalibratedMock khi có expert gate tương ứng.

| **Part** | **Pilot hiện tại không reviewer**  | **Mục tiêu full mock tương lai**  | **Đơn vị quản lý**      |
|----------|------------------------------------|-----------------------------------|-------------------------|
| Part 1   | Chưa bật R0A                       | 12 mock + 20 practice             | ảnh + audio + câu       |
| Part 2   | Chưa bật R0A                       | 50 mock + 50 practice             | audio item              |
| Part 3   | Chưa bật R0A                       | 26 group mock + 15 group practice | conversation + 3 câu    |
| Part 4   | Chưa bật R0A                       | 20 group mock + 10 group practice | talk + 3 câu            |
| Part 5   | Tối thiểu 150 BetaReady            | 60 mock + 100 practice            | câu độc lập theo ruleId |
| Part 6   | R0B: tối thiểu 12 group BetaReady  | 8 group mock + 8 group practice   | text + 4 câu            |
| Part 7   | Tối thiểu 20 group direct-evidence | 30 group mock + 15 group practice | passage set + 2-5 câu   |

Các con số practice là mục tiêu pilot đề xuất, không phải cấu trúc ETS. Câu dùng trong hai full mock không được tính đồng thời vào practice tối thiểu nếu learner có thể gặp trước ngày mock. ContentPlan theo dõi exposure và khóa group trước khi compose.

AC-78: R0A không có câu fail schema/profile/evidence/consensus; mọi asset có provenance; chạy thử end-to-end và kill switch/quarantine đạt. Nếu thiếu bank, release gate fail, không crawl, clone hoặc nới rule. Full simulation chưa đủ L2 theo từng Part không được hiển thị.

### 27.7 Lộ trình sản xuất đề

| **Tuần công việc** | **Kết quả bắt buộc**                                                                            |
|--------------------|-------------------------------------------------------------------------------------------------|
| Sprint 1           | Chốt taxonomy, grammar rule catalog, blueprint Part 5/Part 7 và JSON Schema; chưa gọi model.    |
| Sprint 2           | Xây generator adapter, deterministic validator, provenance, budget và job lifecycle.            |
| Sprint 3           | Tích hợp Solver A, Solver B, adversarial critic, option permutation và rejection policy.        |
| Sprint 4           | Mở Part 5 Beta nội bộ; learner label, report issue, exposure log và auto quarantine.            |
| Sprint 5           | Thêm Part 7 source-first direct evidence; evidence offsets và distractor justification.         |
| Sprint 6           | Tính item statistics, promotion DataValidatedPractice và dashboard chất lượng.                  |
| Sprint 7           | Form assembler Reading, family deduplication, snapshot và correction/regrade.                   |
| Sprint 8           | Đánh giá chi phí/defect; quyết định Part 6 rồi Listening; chuẩn bị audit chuyên gia theo batch. |

Lịch này là trình tự phụ thuộc theo sprint, không phải cam kết thời gian cố định. Năng lực đo bằng số candidate đạt BetaReady, cost/candidate, rejection reason và defect/quarantine rate; không đo bằng tổng output AI.

### 27.8 Test case bổ sung

| **TC** | **FR** | **Tình huống**                             | **Kết quả bắt buộc**                                |
|--------|--------|--------------------------------------------|-----------------------------------------------------|
| TC-60  | 72     | Sinh Part 3 bằng blueprint Part 5          | Chặn trước provider hoặc schema mismatch            |
| TC-61  | 73     | 20 câu khác chữ nhưng cùng pattern/ý       | Near-duplicate queue; không auto approve            |
| TC-62  | 74     | Part 7 key không có evidence               | Blocking issue; reject tự động, không vào BetaReady |
| TC-63  | 74     | Part 6 có 4 key nhưng chỉ 3 blank          | Chặn group                                          |
| TC-64  | 75     | Sửa script sau khi TTS đã tạo              | Audio Stale; không compose                          |
| TC-65  | 75     | Part 2 trả transcript/options qua mock API | Chặn contract/security test                         |
| TC-66  | 75     | TTS phát âm sai tên riêng, clip cuối câu   | Media issue; auto quarantine và không compose       |
| TC-67  | 76,81  | Generator hoặc Admin tự gán HumanConfirmed | 403/conflict; automated gate chỉ gán AutoValidated  |
| TC-68  | 77     | Asset AI/stock thiếu license metadata      | Chặn publish                                        |
| TC-69  | 78     | Mock 2 dùng lại family của mock 1          | Form gate fail; không phát hành Beta mock           |
| TC-70  | 78     | Thiếu 5 câu Part 2, composer clone để đủ   | Không clone; báo thiếu chính xác                    |

### 27.9 Nguồn đối chiếu

\[S25\] ETS, TOEIC Test Preparation Materials. https://www.ets.org/toeic/test-takers/prepare.html

\[S26\] ETS, TOEIC Licensing Policy. https://www.ets.org/legal/permissions/licensing.html

Nguồn ETS dùng để xác nhận format/tài liệu chính thức và chính sách quyền. Blueprint, automated gates, tier, quota practice và lịch triển khai là quyết định nội bộ. Phiên bản 3.3 cho phép BetaPractice không có reviewer nhưng vẫn chặn mọi tuyên bố ExpertReviewed/CalibratedMock cho tới khi có actor và quy trình thật.

## 28 Phương án kiểm định đề AI khi chưa có người duyệt

### 28.1 Quyết định kiến trúc

Quyết định chính thức của phiên bản 3.3 là triển khai Controlled AI Item Factory. Hệ thống không cho một model tự tạo và tự xuất bản. Nội dung được sinh trong blueprint hẹp, kiểm tra bằng code, giải độc lập bởi nhiều model, bị phản biện có chủ đích, sau đó chỉ được phát hành ở tier Beta để thu thập dữ liệu. Cơ chế này tối ưu cho bối cảnh chưa có kho đề và chưa có reviewer chuyên môn thường trực.

Ranh giới bắt buộc: khi chưa có chuyên gia, nội dung chỉ có thể đạt DataValidatedPractice. Hệ thống không được gán ExpertReviewed, CalibratedMock, official hoặc certified. Dữ liệu người học giúp tìm câu lỗi và ước lượng độ khó nội bộ, nhưng không thay thế hoàn toàn đánh giá học thuật và không chứng minh điểm tương đương ETS.

Automated beta track chỉ áp dụng cho nội dung gốc được tạo từ blueprint của hệ thống. File import, đề crawl, nội dung của bên thứ ba, key không rõ nguồn hoặc media không xác minh quyền phải đi theo manual/licensed track và bị chặn publish khi chưa có người chịu trách nhiệm.

### 28.2 Tiêu chí lựa chọn phương án

| **Phương án**              | **Độ an toàn**       | **Khả năng mở rộng** | **Chi phí vận hành** | **Kết luận**                                    |
|----------------------------|----------------------|----------------------|----------------------|-------------------------------------------------|
| Một AI tạo và tự chấm      | Thấp                 | Cao                  | Thấp                 | Loại vì lỗi tương quan và không có gate độc lập |
| Nhiều AI bỏ phiếu          | Trung bình           | Cao                  | Trung bình           | Chỉ là một tầng kiểm tra, chưa đủ để publish    |
| Controlled AI Item Factory | Khá cho Beta         | Cao                  | Trung bình           | Chọn: constraint + code + consensus + telemetry |
| Mua kho đề có license      | Cao nếu hợp đồng tốt | Cao                  | Cao                  | Bổ sung sau; không phụ thuộc để khởi động       |
| Crawl đề công khai         | Thấp                 | Thấp lâu dài         | Chi phí làm sạch cao | Không dùng                                      |

Lý do không chọn multi-model voting làm phương án duy nhất: các model có thể học từ nguồn tương tự, lặp cùng lỗi hoặc bị ảnh hưởng bởi cách trình bày. LLM-as-a-Judge có các thiên lệch đã được ghi nhận; vì vậy đồng thuận được xem là điều kiện cần, không phải bằng chứng tuyệt đối \[S28\].

### 28.3 Cấp chất lượng và nhãn hiển thị

| **Tier**                  | **Điều kiện**                                        | **Nhãn cho người học**              | **Được phép dùng**                     |
|---------------------------|------------------------------------------------------|-------------------------------------|----------------------------------------|
| L0 Draft                  | Vừa sinh, chưa kiểm tra                              | Không hiển thị                      | Staging nội bộ                         |
| L1 AutoValidated          | Schema, profile, evidence, solver và critic đều đạt  | Không hiển thị riêng                | Ứng viên Beta                          |
| L2 BetaPractice           | L1 + form gate + quyền nội dung + feature flag       | Luyện tập Beta do AI hỗ trợ         | Bài luyện không cam kết chuẩn hóa      |
| L2D DataValidatedPractice | L2 + đủ mẫu pilot + chỉ số đạt policy                | Luyện tập đã kiểm định bằng dữ liệu | Practice và form nội bộ; raw score     |
| L3 ExpertReviewed         | Chuyên gia xác nhận revision, key, evidence và media | Đề đã được chuyên gia kiểm tra      | Mock có kiểm soát                      |
| L4 CalibratedMock         | L3 + pilot/psychometric + form equating phù hợp      | Đề thi thử đã hiệu chỉnh            | Ước lượng điểm nếu có chính sách riêng |

Trong giai đoạn hiện tại, nút promote lên L3 và L4 luôn disabled ở backend, không chỉ ẩn trên giao diện. Model, worker, Admin hoặc script migration không được tự tạo HumanConfirmed.

### 28.4 Phạm vi nội dung theo giai đoạn

| **Giai đoạn** | **Part** | **Loại được phép**                                       | **Lý do**                                     |
|---------------|----------|----------------------------------------------------------|-----------------------------------------------|
| R0A           | Part 5   | Grammar/vocabulary item có ruleId và answer derivation   | Dễ ràng buộc và kiểm tra nhất                 |
| R0A           | Part 7   | Câu thông tin trực tiếp, một evidence span rõ            | Có thể kiểm chứng trong passage               |
| R0B           | Part 6   | Text completion có blank anchor và rule rõ               | Rủi ro liên kết đoạn cao hơn                  |
| R0B           | Part 7   | Purpose/inference có hai evidence spans trở lên          | Cần critic và dữ liệu pilot mạnh hơn          |
| R1            | Part 2-4 | Script-first, transcript-grounded, TTS/voice versioned   | Cần kiểm tra tự nhiên, speaker và audio       |
| R1 sau cùng   | Part 1   | Ảnh có license hoặc tự tạo, bốn mô tả được kiểm tra chéo | Rủi ro nhiều mô tả cùng đúng và artifact hình |

Full simulation 200 câu chỉ được mở khi từng Part đã có đủ L2/L2D theo blueprint. Khi chưa có L3, sản phẩm phải ghi rõ đây là mô phỏng luyện tập Beta và chỉ hiển thị raw score theo section.

### 28.5 Pipeline xử lý đầu cuối

1.  Content Planner chọn blueprint version, Part, skill, difficulty dự kiến, scenario, quota và ngân sách.

2.  Generator tạo candidate JSON theo schema; không có quyền gọi tool hoặc publish.

3.  Schema Validator kiểm tra kiểu dữ liệu, enum, độ dài, số option, group size và reference integrity.

4.  Profile Validator kiểm tra quy tắc TOEIC nội bộ theo Part và form blueprint.

5.  Evidence Validator xác nhận offset, quote, source hash, answer derivation và distractor justification.

6.  Similarity Validator so candidate với bank, batch hiện tại, prompt examples và question family fingerprints.

7.  Solver A và Solver B giải độc lập, không nhìn key/rationale của Generator và không nhìn kết quả của nhau.

8.  Adversarial Critic cố tìm đáp án thứ hai, lỗi ngữ pháp, kiến thức ngoài passage, cue theo độ dài và distractor vô hiệu.

9.  Perturbation Runner đảo labels, đổi tên hư cấu hoặc chi tiết không liên quan; key semantic phải bất biến.

10. Quality Gate Engine áp policy version. Bất kỳ lỗi Blocking hoặc bất đồng nào đều Reject, không chuyển sang hàng đợi chờ người.

11. Form Validator kiểm tra coverage, family collision, exposure, media, số lượng và quota trước khi tạo BetaPracticeVersion.

12. Telemetry Service theo dõi phản hồi người học; Promotion Service nâng L2D hoặc Quarantine Service tạm ẩn theo policy.

### 28.6 Blueprint và hợp đồng sinh câu

ContentBlueprintVersion là đầu vào bắt buộc, bất biến sau publish và tối thiểu có các trường sau:

| **Nhóm**  | **Trường bắt buộc**                               | **Quy tắc**                               |
|-----------|---------------------------------------------------|-------------------------------------------|
| Định danh | examProfile, part, itemType, blueprintVersion     | Không nhận chuỗi tự do cho profile/Part   |
| Mục tiêu  | skillId, ruleId, lexicalBand, difficultyBand      | difficulty ban đầu là Predicted           |
| Cấu trúc  | groupSize, optionCount, stimulusType, lengthRange | Khớp profile version                      |
| Nội dung  | scenarioId, allowedVocabulary, forbiddenTopics    | Không dùng người/công ty thật mặc định    |
| Đáp án    | answerDerivation, distractorTypes, evidencePolicy | Không chấp nhận key không giải thích được |
| Media     | mediaPolicy, voicePolicy, imagePolicy             | Có license/provenance và version          |
| Vận hành  | maxCandidates, budget, modelRoute, policyVersion  | Reserve budget trước gọi provider         |

Part 5 ưu tiên template có slot được kiểm soát. Hệ thống chọn rule và dạng đáp án trước, sau đó AI viết câu tự nhiên trong constraint. Part 7 dùng source-first: tạo stimulus trước, đóng băng StimulusVersion, trích fact/evidence graph, rồi mới sinh câu hỏi. Không sinh passage và key độc lập trong hai lời gọi không liên kết.

### 28.7 Bộ kiểm tra xác định bằng code

| **Nhóm validator** | **Ví dụ kiểm tra**                                               | **Khi lỗi**            |
|--------------------|------------------------------------------------------------------|------------------------|
| Schema             | JSON hợp lệ, enum, required, max length, stable option IDs       | Reject                 |
| TOEIC profile      | Part, group size, số option, số câu, media requirement           | Reject                 |
| Key                | Một key, key thuộc option, answerDerivation tồn tại              | Reject                 |
| Evidence           | Offset hợp lệ, quote khớp source hash, evidence đủ cho key       | Reject                 |
| Uniqueness         | Option khác nhau sau normalize; không trùng stem/family          | Reject hoặc Quarantine |
| Language hygiene   | Placeholder, ký tự lỗi, PII, URL thật, profanity, prompt leakage | Reject                 |
| Media              | Codec, duration, silence, clipping, scriptHash, ASR alignment    | Reject hoặc Stale      |
| Rights             | creationMode, contributor/system identity, asset license         | Reject                 |
| Form               | coverage, family collision, exposure, đủ quota, timer            | Không compose          |

Validator code chỉ khẳng định các bất biến có thể tính được. Nó không tự kết luận văn phong tự nhiên, độ khó chuẩn hay giá trị đo lường; các nội dung đó được xử lý bằng solver/critic, telemetry và tier label.

### 28.8 Kiểm định chéo nhiều model

| **Tác nhân** | **Đầu vào được thấy**                               | **Đầu ra**                           | **Giới hạn quyền**                |
|--------------|-----------------------------------------------------|--------------------------------------|-----------------------------------|
| Generator    | Blueprint + style guide + allowed examples          | Candidate + proposed key + rationale | Không publish, không HumanConfirm |
| Solver A     | Stem/stimulus/options, không proposed key           | Answer + evidence + reasoning code   | Không sửa candidate               |
| Solver B     | Giống A; ưu tiên model family khác                  | Answer + evidence + ambiguity flag   | Không thấy Solver A               |
| Critic       | Candidate và rubric, key có thể được che ở pass đầu | Findings theo severity               | Chỉ phát hiện, không approve      |
| Gate Engine  | Outputs đã ký hash + policy version                 | Accept/Reject/Quarantine             | Không gọi model để tự nới rule    |

Tối thiểu phải có hai lần giải độc lập. Ít nhất một solver phải khác model family hoặc route với Generator. Nếu chỉ có một provider, hệ thống có thể chạy blinded independent contexts nhưng candidate chỉ được tier L1Internal, không được tự động ra public Beta trừ khi PO chấp nhận policy rủi ro có audit.

```python
beta_ready = (
    schema_ok
    and profile_ok
    and rights_ok
    and generator_key == solver_a_key == solver_b_key
    and evidence_ok
    and similarity_ok
    and critic_blocking_count == 0
    and perturbation_key_stable
    and form_gate_ok
)

if not beta_ready:
    reject_or_quarantine(candidate_id)
```

Không dùng average confidence và không chấp nhận quy tắc 2/3 nếu một solver chọn đáp án khác. Với câu khách quan, bất đồng là tín hiệu câu hoặc pipeline chưa đủ chắc chắn.

### 28.9 Kiểm tra ambiguity và độ bền

- Option permutation: đổi thứ tự A/B/C/D nhưng giữ stableOptionId; key semantic phải giữ nguyên.

- Neutral mutation: đổi tên hư cấu, ngày hoặc địa điểm không liên quan đến kỹ năng được hỏi; key phải không đổi.

- Negative test: Critic phải thử chứng minh ít nhất một distractor cũng hợp lý; nếu thành công thì Reject.

- Evidence ablation: che evidence chính phải làm solver giảm khả năng trả lời; nếu vẫn trả lời chỉ nhờ cue bề mặt thì Flag/Reject.

- Rationale consistency: lý do đúng và lý do sai phải tham chiếu cùng revision của stimulus, không chứa thông tin ngoài source.

- Length/style cue: key không được nổi bật chỉ vì dài hơn, chi tiết hơn hoặc khác cấu trúc rõ rệt so với distractors.

### 28.10 Máy trạng thái nội dung

```text
Generated -> StructuralValid -> CrossModelValid -> AdversarialValid
          -> BetaReady -> BetaActive -> DataValidatedPractice
Any state -> Rejected | Quarantined | Archived
Future only: DataValidatedPractice -> ExpertReviewed -> CalibratedMock
```

Mỗi chuyển trạng thái lưu fromState, toState, reasonCode, policyVersion, candidateRevision, actorType, actorId/jobId và timestamp. Published/BetaActive revision bất biến. Sửa nội dung tạo revision mới và quay lại Generated; không kế thừa solver votes hoặc statistics như bằng chứng cho nội dung đã sửa.

### 28.11 Telemetry và kiểm định bằng dữ liệu

BetaPractice được phân phối có kiểm soát, không dùng để cam kết điểm. Hệ thống ghi exposure, response, correctness, response time, ability band nội bộ, option selected, report category và form context. Không ghi dữ liệu nhạy cảm vào prompt hoặc log analytics.

| **Chỉ số**                           | **Ngưỡng mặc định ban đầu**                             | **Hành động**                          |
|--------------------------------------|---------------------------------------------------------|----------------------------------------|
| Số response hợp lệ                   | N \>= 100 để cảnh báo sơ bộ; N \>= 300 để xét L2D       | Thiếu mẫu giữ Beta                     |
| Point-biserial                       | \< 0 sau N \>= 100                                      | Auto quarantine                        |
| Point-biserial                       | 0 đến \< 0,15 sau N \>= 300                             | Giữ Beta, không promote                |
| Point-biserial                       | \>= 0,15 sau N \>= 300                                  | Một điều kiện để xét L2D               |
| Báo lỗi                              | \>= 3 người khác nhau cùng category và \>= 1% exposures | Auto quarantine                        |
| Key disagreement ở nhóm năng lực cao | Đáp án khác key chiếm ưu thế với N đủ policy            | Auto quarantine và đóng form liên quan |
| Correct rate ngoài difficulty band   | Theo blueprint version                                  | Flag difficulty; không tự đổi key      |
| Distractor gần như không được chọn   | \< 2% sau N \>= 300                                     | Flag distractor yếu; không tự sửa      |

Các ngưỡng trên là cấu hình sản phẩm khởi điểm, không phải chuẩn ETS. ItemStatisticsPolicy phải có version và được hiệu chỉnh sau pilot. Promotion L2D cần đồng thời: không có quarantine signal, không có unresolved report, đạt discrimination policy, difficulty không lệch nghiêm trọng và đủ dữ liệu theo từng population.

### 28.12 Auto quarantine và correction

- Quarantine tạm ngừng cấp câu cho attempt mới nhưng giữ snapshot của attempt đã bắt đầu.

- Nếu form đang phát hành chứa câu bị quarantine, FormVersion chuyển Degraded; composer ngừng tạo attempt mới và chọn bản thay thế đã đạt cùng tier.

- Không tự đổi key. Mọi thay đổi key tạo QuestionRevision và CorrectionCase mới.

- Nếu correction ảnh hưởng điểm đã nộp, worker tạo GradeVersion mới, lưu điểm trước/sau và thông báo theo policy.

- Model regression scan có thể re-solve nội dung cũ nhưng chỉ tạo finding; không sửa Published revision.

- Emergency kill switch có thể dừng toàn bộ AI generation hoặc toàn bộ Beta serving độc lập.

### 28.13 Mô hình dữ liệu bổ sung

| **Entity**                | **Trường chính**                                             | **Bất biến**                              |
|---------------------------|--------------------------------------------------------------|-------------------------------------------|
| ContentBlueprintVersion   | profile, part, constraints, taxonomy, policyVersion          | Published immutable                       |
| GenerationJob             | inputHash, route, budget, state, checkpoint                  | Idempotent theo scope + key               |
| QuestionCandidateRevision | content, key, rationale, sourceHash, familyId                | Mọi edit tạo revision                     |
| ModelInvocation           | role, provider, model, promptVersion, token/cost, outputHash | Không dùng model name làm bằng chứng đúng |
| SolverVote                | candidateRevision, solverRoute, key, evidence, resultHash    | Blind với proposed key                    |
| ValidationRun/Finding     | validatorVersion, code, severity, path, evidence             | Blocking không thể override ở Beta track  |
| PerturbationRun           | mutationType, originalHash, variantHash, semanticKey         | Key phải invariant                        |
| PublicationTierDecision   | tier, policyVersion, gateSummary, decidedBy                  | Không gán HumanConfirmed bởi System       |
| ItemExposure/Response     | learnerHash, form, item, option, time, validFlag             | Dedupe theo attempt item                  |
| ItemStatisticSnapshot     | window, n, pValue, pointBiserial, distractorRates            | Snapshot có population/filter             |
| LearnerIssueReport        | category, itemRevision, comment, reporterHash                | Rate limit và chống spam                  |
| QuarantineDecision        | reason, signals, affectedForms, state                        | Không xóa lịch sử                         |

### 28.14 API và job nền

| **Endpoint hoặc job**                    | **Mục đích**                                             | **Quyền hoặc rule**             |
|------------------------------------------|----------------------------------------------------------|---------------------------------|
| POST /authoring/generation-jobs          | Tạo batch theo blueprintVersion và quota                 | content.generate + budget       |
| GET /authoring/generation-jobs/{id}      | Tiến độ, cost, rejection summary                         | Scope owner/admin               |
| POST /authoring/candidates/{id}/validate | Chạy lại pipeline trên revision mới                      | content.validate                |
| GET /authoring/candidates/{id}/quality   | Findings, solver votes đã che chain-of-thought, evidence | quality.view                    |
| POST /authoring/forms/compose-beta       | Ghép form từ L2/L2D                                      | content.publish_beta; form gate |
| POST /questions/{id}/reports             | Người học báo lỗi theo category                          | Authenticated; rate limit       |
| GET /operations/item-quality             | Dashboard signal và quarantine                           | quality.dashboard               |
| POST /operations/items/{id}/quarantine   | Tạm ẩn khẩn cấp                                          | content.quarantine + reason     |
| ItemStatisticsJob                        | Tính snapshot theo cửa sổ và population                  | Idempotent; policy version      |
| PromotionJob                             | Xét L2 -\> L2D                                           | Không được tạo L3/L4            |
| RegressionAuditJob                       | Re-run validator/solver khi policy đổi                   | Finding only; không mutate      |

### 28.15 Phân quyền khi chưa có reviewer

| **Vai trò**      | **Được phép**                                                | **Không được phép**                                              |
|------------------|--------------------------------------------------------------|------------------------------------------------------------------|
| Owner/Admin      | Quản lý blueprint, policy, budget, feature flag, quarantine  | Bypass blocking gate; gán ExpertReviewed                         |
| Content Operator | Khởi tạo job, xem candidate, sửa draft, yêu cầu validate lại | Sửa Published; ép publish candidate fail                         |
| System Worker    | Generate, validate, solve, compose, thống kê theo policy     | Thay policy; HumanConfirm; gọi tool ngoài allowlist              |
| Learner          | Làm Beta, xem nhãn, báo lỗi                                  | Xem key trước submit; xem nội dung nội bộ                        |
| Future Expert    | Review revision và ký ExpertReviewed                         | Review revision mình trực tiếp soạn/sửa nếu policy tách nhiệm vụ |

### 28.16 Thiết kế module cho ASP.NET Core

| **Module**     | **Trách nhiệm**                                   | **Interface định hướng**                                  |
|----------------|---------------------------------------------------|-----------------------------------------------------------|
| ContentFactory | Blueprint, generation job, candidate revision     | IQuestionGenerator, IBlueprintRepository                  |
| Quality        | Validator, solver, critic, gate policy            | IContentValidator, IIndependentSolver, IQualityGateEngine |
| Assessment     | Question bank, form composer, attempt snapshot    | IFormAssembler, IPublicationPolicy                        |
| Analytics      | Exposure, item statistics, promotion              | IItemStatisticsService, IPromotionPolicy                  |
| Media          | TTS, ASR alignment, signal checks, manifest       | IMediaProducer, IMediaValidator                           |
| Operations     | Quarantine, correction, audit, kill switch        | IQuarantineService, ICorrectionService                    |
| Infrastructure | Provider adapters, outbox, object storage, budget | ILLMProvider, IJobQueue, ICostLedger                      |

Khuyến nghị tiếp tục modular monolith: ASP.NET Core API + Worker + PostgreSQL/SQL Server + object storage. GenerationJob là aggregate điều phối, nhưng mỗi model call và validator run là record riêng để retry/idempotency. Transactional outbox phát event CandidateGenerated, ValidationCompleted, BetaPublished, ItemQuarantined và CorrectionRequired.

### 28.17 Yêu cầu chức năng bổ sung

| **ID** | **Tên**                              | **Yêu cầu**                                                                                 | **Acceptance criteria**                                                |
|--------|--------------------------------------|---------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| FR-79  | Controlled generation                | Mọi candidate AI phải tham chiếu blueprint/policy version và chỉ sinh trong batch giới hạn. | Thiếu blueprint hoặc vượt quota bị chặn trước provider.                |
| FR-80  | Deterministic validation             | Schema, profile, key, evidence, duplicate, rights và form gate chạy bằng code.              | Một Blocking finding làm gate fail và không có API override.           |
| FR-81  | Independent solver consensus         | Hai solver blind giải độc lập; ít nhất một route khác Generator.                            | Bất đồng key/evidence Reject; AI không gán HumanConfirmed.             |
| FR-82  | Adversarial and perturbation testing | Critic tìm đáp án thứ hai; runner đảo option và neutral mutation.                           | Key semantic đổi hoặc critic tìm ambiguity thì Reject.                 |
| FR-83  | Publication tiers                    | Backend thực thi L0-L4 và learner label tương ứng.                                          | Khi reviewer capability tắt, L3/L4 không thể tạo kể cả Admin.          |
| FR-84  | Beta exposure telemetry              | Ghi response/exposure/report theo item revision và form.                                    | Retry/callback không double count; dữ liệu cá nhân được tối thiểu hóa. |
| FR-85  | Auto quarantine                      | Signal theo policy tạm ẩn item/form và phát event.                                          | Attempt đang làm giữ snapshot; attempt mới không nhận item.            |
| FR-86  | Statistical promotion                | Promotion L2D dùng snapshot đủ N và policy có version.                                      | Không đủ mẫu hoặc discrimination thấp thì giữ Beta; không tự nâng L3.  |
| FR-87  | Truthful labeling                    | UI/API phân biệt predicted, Beta, data-validated và expert-reviewed.                        | Không dùng official/standardized/TOEIC estimate khi chưa đủ gate.      |
| FR-88  | Automated media QA                   | Audio lưu scriptHash, voice/model version, ASR alignment, clipping/silence metrics.         | Media fail hoặc script stale không compose.                            |
| FR-89  | Cost and provider resilience         | Budget reservation, provider adapter, timeout/retry và kill switch.                         | Không đổi provider ngoài route policy; không retry vô hạn.             |
| FR-90  | Audit and reproducibility            | Lưu input/output hashes, policy/model/prompt versions và transition history.                | Có thể tái dựng lý do tier mà không cần lưu chain-of-thought.          |

### 28.18 Use case trọng yếu

| **Use case**                   | **Luồng chính**                                                                                                                                                      |
|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| UC-09 Sinh batch Part 5        | Operator chọn blueprint và quota; job sinh candidate; validator, solvers, critic, perturbation chạy; survivors thành BetaReady; phần còn lại Reject với reason code. |
| UC-10 Sinh Part 7 source-first | Generator tạo passage; hệ thống đóng băng stimulus; evidence graph được tạo; câu hỏi chỉ sinh từ graph; solver phải trả cùng evidence span.                          |
| UC-11 Phát hành Beta           | Publisher/Owner yêu cầu compose; form gate chọn chỉ L2/L2D, khóa family/exposure, tạo immutable FormVersion và hiển thị nhãn Beta.                                   |
| UC-12 Tự động quarantine       | Statistics job phát hiện point-biserial âm hoặc report threshold; item tạm ẩn; form liên quan Degraded; alert và audit được tạo.                                     |
| UC-13 Correction sau phát hành | Operator tạo revision; pipeline chạy lại từ đầu; nếu key đổi, tạo CorrectionCase/regrade; không ghi đè lịch sử.                                                      |
| UC-14 Mở khóa expert tier      | Khi có đối tác chuyên môn, Admin bật capability sau migration và policy review; expert ký revision; hệ thống vẫn giữ toàn bộ automated evidence.                     |

### 28.19 Test case bổ sung

| **TC** | **FR** | **Tình huống**                                   | **Kết quả bắt buộc**                                                  |
|--------|--------|--------------------------------------------------|-----------------------------------------------------------------------|
| TC-71  | 79     | Job không có blueprintVersion                    | 400/422; không gọi provider                                           |
| TC-72  | 79,89  | Hai job cùng idempotency key khác input          | 409; không trừ budget lần hai                                         |
| TC-73  | 80     | Part 5 có 5 options hoặc hai key                 | Blocking; Reject                                                      |
| TC-74  | 80     | Evidence offset đúng text nhưng sai sourceHash   | Blocking; Reject                                                      |
| TC-75  | 81     | Generator và Solver A chọn B, Solver B chọn C    | Reject; không majority vote                                           |
| TC-76  | 81     | Hai solver dùng cùng context có lộ proposed key  | Validation run invalid; không tính consensus                          |
| TC-77  | 82     | Đảo A/B/C/D làm solver đổi semantic answer       | Reject                                                                |
| TC-78  | 82     | Critic chứng minh distractor cũng đúng           | Blocking ambiguity; Reject                                            |
| TC-79  | 83,87  | Admin gọi promote L3 khi reviewer capability off | 403/domain error; giữ L2/L2D                                          |
| TC-80  | 83,87  | Learner API trả nhãn official cho L2             | Contract test fail; release blocked                                   |
| TC-81  | 84     | Response callback/retry trùng                    | Một exposure/response hợp lệ                                          |
| TC-82  | 84     | Bot gửi hàng trăm report                         | Rate limit/dedupe; không làm méo threshold                            |
| TC-83  | 85     | Point-biserial âm, N=120                         | Auto quarantine; form Degraded                                        |
| TC-84  | 85     | Item quarantine khi learner đang làm             | Attempt giữ snapshot; attempt mới không nhận                          |
| TC-85  | 86     | N=299 dù chỉ số tốt                              | Không promote L2D                                                     |
| TC-86  | 86     | N=350 nhưng còn unresolved report                | Giữ Beta hoặc Quarantine theo policy                                  |
| TC-87  | 88     | Script sửa sau khi tạo TTS                       | Asset Stale; không compose                                            |
| TC-88  | 88     | ASR lệch từ phủ định hoặc số                     | Media Blocking; Reject                                                |
| TC-89  | 89     | Provider timeout, phí chưa rõ                    | UnknownCost; retry giới hạn; không double reserve                     |
| TC-90  | 89     | Kill switch AI bật giữa job                      | Dừng call mới; checkpoint an toàn                                     |
| TC-91  | 90     | Đổi policy sau khi L2 đã publish                 | Không viết lại lịch sử; tạo regression finding                        |
| TC-92  | 80,90  | Candidate gần trùng item khác khác vài từ        | Family collision; Reject/Quarantine                                   |
| TC-93  | 83     | Form full thiếu Part 4                           | Không nới quota hoặc clone; compose fail                              |
| TC-94  | 85     | Correction đổi key của item đã có attempt        | QuestionRevision + GradeVersion; audit đầy đủ                         |
| TC-95  | 79-90  | Provider/model/prompt bị đổi giữa retry          | Tạo attempt/version mới hoặc resume đúng route; không trộn provenance |

### 28.20 Yêu cầu phi chức năng và an toàn

- Reliability: mọi job có checkpoint, idempotency và outbox; crash không tạo candidate/tier trùng.

- Security: model không có tool access; output bị coi là untrusted input; JSON Schema và allowlist được kiểm tra trước lưu.

- Privacy: không gửi dữ liệu học viên, report tự do hoặc toàn bộ ngân hàng câu hỏi vào provider; dùng pseudonymous aggregates cho analytics.

- Cost: budget reserve theo job và tenant; ghi token, media compute và chi phí ước tính; có daily/monthly cap.

- Observability: metric theo Part, blueprint, provider, rejection code, latency, cost/candidate sống và quarantine rate.

- Reproducibility: lưu hashes và versions; không yêu cầu lưu suy luận nội bộ dài của model.

- Accessibility: nhãn Beta và cảnh báo không chỉ dựa vào màu; learner có cách báo lỗi bằng bàn phím và screen reader.

- Performance: validation/solver chạy async; learner request không chờ generation; serving chỉ đọc immutable published snapshot.

### 28.21 Kế hoạch triển khai ưu tiên

| **Ưu tiên** | **Deliverable**                                        | **Điều kiện hoàn tất**                                         |
|-------------|--------------------------------------------------------|----------------------------------------------------------------|
| P0          | Domain states, tiers, blueprint schema, policy version | Unit test state transition và permission                       |
| P0          | Part 5 controlled generator + static validator         | Gold synthetic fixtures; zero blocking leak                    |
| P0          | Two-solver + critic + rejection                        | Blind input verified; no majority override                     |
| P0          | Beta serving, label, report và kill switch             | API/UX tests; feature flag backend                             |
| P1          | Exposure/statistics/quarantine                         | Idempotent events; thresholds configurable                     |
| P1          | Part 7 source-first direct evidence                    | Evidence hash/offset test; family dedupe                       |
| P1          | Reading form composer                                  | Coverage/exposure/form snapshot tests                          |
| P2          | Part 6 và Listening media pipeline                     | ASR/signal QA; vẫn Beta nếu chưa expert                        |
| P2          | Expert audit workflow                                  | Chỉ xây khi có actor/quy trình thật; mở L3 bằng migration/flag |

### 28.22 Definition of Done và release gate

- Không có unresolved Blocking finding trong candidate hoặc form.

- Generator key, Solver A và Solver B đồng thuận stableOptionId và evidence requirement.

- Critic không tìm được đáp án thứ hai hợp lý; perturbation giữ key semantic.

- Question family, semantic similarity, exposure và license/provenance đều đạt.

- Learner API hiển thị đúng tier; không trả key, rationale nội bộ hoặc transcript bị ẩn trước submit.

- Kill switch, quarantine, correction và rollback được kiểm thử end-to-end.

- Dashboard theo dõi rejection, report, item statistics, cost và provider errors.

- Không có nút hoặc API bypass gate; quyền đặc quyền có MFA/audit theo chính sách hiện có.

- Full simulation chưa có expert phải ghi Beta, chỉ raw score, không quy đổi điểm chính thức.

### 28.23 Rủi ro còn lại và phương án giảm thiểu

| **Rủi ro**                            | **Không thể loại bỏ hoàn toàn vì**              | **Giảm thiểu**                                                       |
|---------------------------------------|-------------------------------------------------|----------------------------------------------------------------------|
| Các model cùng sai                    | Dữ liệu huấn luyện và pattern có thể tương quan | Khác family, blind solving, code gate, telemetry, reject-first       |
| Câu tự nhiên nhưng không giống kỳ thi | Format đúng không đồng nghĩa construct validity | Blueprint chặt, label Beta, expert audit trước L3                    |
| Difficulty dự đoán sai                | Model không có response distribution thật       | Giữ Predicted; promotion bằng pilot data                             |
| Audio phát âm không tự nhiên          | ASR không đo đủ prosody/naturalness             | TTS versioning, signal QA, Listening làm sau, future human audit     |
| Người học gặp câu lỗi                 | Không có human pre-review                       | Phân phối nhỏ, report nhanh, auto quarantine, không dùng high-stakes |
| Chi phí model tăng                    | Nhiều pass kiểm định                            | Cheap static gates trước; batch; cache đúng scope; budget cap        |

### 28.24 Kết luận vận hành

Hệ thống có thể khởi động mà chưa cần reviewer toàn thời gian nếu chấp nhận ba điều kiện: chỉ tạo nội dung trong blueprint hẹp; lỗi hoặc bất đồng bị loại thay vì cố cứu; và sản phẩm công khai đúng tier Beta/DataValidatedPractice. Khi bắt đầu thu phí cho mock test hoặc muốn công bố điểm ước lượng, cần thêm audit chuyên gia theo batch hoặc nguồn nội dung licensed. Đây là cổng bắt buộc để chuyển từ sản phẩm luyện tập có kiểm soát sang sản phẩm đánh giá có tuyên bố chất lượng cao hơn.

### 28.25 Nguồn đối chiếu

\[S27\] NIST. Artificial Intelligence Risk Management Framework Generative Artificial Intelligence Profile, NIST AI 600-1, 2024. https://doi.org/10.6028/NIST.AI.600-1

\[S28\] Zheng, L. et al. Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena, 2023. https://arxiv.org/abs/2306.05685

\[S29\] ETS. Designing the TOEFL Primary Tests, Research Memorandum RM-16-02. https://www.ets.org/Media/Research/pdf/RM-16-02.pdf

\[S30\] ETS. TOEIC Research Program - Score Consistency. https://www.ets.org/toeic/research/score-consistency.html

NIST và nghiên cứu LLM judge được dùng để xác định giới hạn tin cậy và yêu cầu quản trị AI. Tài liệu ETS được dùng để tham khảo nguyên tắc specification, pilot và score consistency; các ngưỡng N, point-biserial, report rate và tier trong mục 28 là policy nội bộ ban đầu, phải được version và hiệu chỉnh bằng dữ liệu của sản phẩm.
