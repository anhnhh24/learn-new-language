# Điểm chưa hợp lý / cần làm rõ

| ID | Tham chiếu | Vấn đề | Hướng xử lý hiện tại |
|---|---|---|---|
| NOTE-01 | 27.3 FR-74, 28.4 | Part 7 ghi R1 ở FR-74 nhưng R0A ở 28.4 và gate pilot. | Theo lát cắt 28.4: Part 7 direct-evidence thuộc R0A; làm sau nền Part 5. |
| NOTE-02 | 28.3, 28.8 | L1Internal chưa có trong bảng tier; ngoại lệ một provider cần PO nhưng chưa có cấu trúc risk approval. | Không triển khai override; thiếu đa dạng provider thì chỉ giữ nội bộ. |
| NOTE-03 | 28.5, 28.14, UC-11 | Form gate cần item L2 nhưng L2 lại đòi form gate; dễ tạo vòng phụ thuộc. | Tách BetaReady của item khỏi BetaActive; form composer cần tạo quyết định và snapshot trong transaction ở mốc sau. |
| NOTE-04 | 28.11 | Chưa định nghĩa N theo population, ability band, xử lý repeated responses, mẫu tối thiểu nhóm năng lực cao. | Chưa tự promote L2D; cần policy và test thống kê riêng. |
| NOTE-05 | 28.7 | Không thể xác minh quyền sử dụng/PII/near-duplicate chỉ bằng kiểm tra trường metadata. | Validator ban đầu chỉ kiểm bất biến cấu trúc; quyền và similarity semantic phải là gate riêng, không đánh đồng với đạt publish. |
| NOTE-06 | 21, D-06 | Chưa có SDK 10 trên PATH, provider, credential, budget và môi trường PostgreSQL. | Dùng SDK 10 riêng trong workspace; chưa gọi model mất phí. Provider và hạ tầng là mốc tiếp theo. |
| NOTE-07 | 28.10 | Any state -> terminal chưa rõ việc phục hồi hoặc sửa item rejected/quarantined. | Không hồi sinh revision cũ; sửa tạo revision mới ở Generated, không kế thừa bằng chứng. |
| NOTE-08 | 28.6, FR-79 | SRS chỉ nêu `budget` nhưng chưa chốt đơn vị, currency, cách chia budget cho batch nhỏ hơn quota hoặc làm tròn. | Domain dùng decimal tối đa 6 chữ số thập phân và phân bổ tỷ lệ theo quota; cần chốt với CostLedger trước triển khai thanh toán thật. |
| NOTE-09 | 28.6 | `allowedVocabulary` bắt buộc nhưng không nói danh sách rỗng có nghĩa là cấm hết hay không giới hạn. | Cho phép danh sách rỗng với nghĩa không có allowlist; `forbiddenTopics` rỗng nghĩa không bổ sung cấm ngoài policy toàn cục. |
| NOTE-10 | FR-24 | Attempt domain hiện có một deadline chung; TOEIC full mock cần deadline riêng Listening/Reading và khóa section. | Dùng cho R0A Reading practice; chưa mở full simulation trước khi bổ sung section clock. |
| NOTE-11 | FR-40–41 | Refund callback có thể đến trước paid callback nhưng chưa có inbox/reconciliation service để giữ event out-of-order. | Commerce giữ PendingIntegration; Infrastructure phải lưu inbox trước khi gọi aggregate. |
| NOTE-12 | FR-01–03 | Domain identity không tự giải quyết rate limit, MFA, password hashing parameters hoặc email anti-enumeration. | Chỉ mở auth API sau khi application/infrastructure và audit được nối đầy đủ. |
| NOTE-13 | 28.7–28.9 | Part 7 validator chỉ chứng minh hash/offset/quote và cấu trúc; không chứng minh passage tự nhiên, distractor hợp lý hoặc câu không cần kiến thức ngoài. | Giữ nội bộ tới khi hai solver, critic, perturbation và similarity runner đều có invocation audit thật. |

## Quyết định kỹ thuật

- .NET 10 LTS cho code mới. Kiểm tra ngày 2026-09-23 tại https://dotnet.microsoft.com/en-us/platform/support/policy (support tới tháng 11/2028).
- SDK tải từ release metadata chính thức và đối chiếu SHA-512; `.tools` không commit.
- Không mở endpoint nhận cờ `gatePassed` từ client. Kết quả solver/gate phải đến từ worker tin cậy và gắn revision/policy trước khi có API publish.

## Giới hạn triển khai đợt đầu

- Schema v1 dùng PascalCase khớp DTO .NET; adapter phải dùng thống nhất. Chưa khóa schema blueprint đầy đủ, chưa có catalog nội dung production.
- Exact family collision không thay thế semantic near-duplicate detection.
- Hash của blind input giúp phát hiện kết quả gắn sai payload; không tự chứng minh provider không thấy key. Cần adapter tách context và lưu invocation thực tế.
- Domain role check chưa phải authentication/RBAC có scope; API nghiệp vụ chưa mở.
- Liveness `/health` chưa phải readiness của DB/provider.
- Từ M03, test mới được hoãn theo yêu cầu người dùng. Build vẫn chạy; các invariant mới chưa được coi là nghiệm thu cho tới khi có test sau.
