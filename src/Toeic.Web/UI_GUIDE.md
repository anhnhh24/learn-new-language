# Hướng dẫn giao diện và phong cách code

## 1. Cảm giác sản phẩm

Giao diện cần hiện đại, sáng sủa và thân thiện nhưng vẫn giống một sản phẩm học tập được thiết kế có chủ đích. Người dùng phải biết mình đang ở đâu, cần làm gì tiếp theo và tiến độ hiện tại ra sao mà không phải đoán.

Ba đặc tính chính:

1. **Bình tĩnh:** khoảng trắng vừa đủ, ít hiệu ứng, không tạo áp lực khi người học làm sai.
2. **Rõ ràng:** một hành động chính trên mỗi khu vực; nội dung và trạng thái quan trọng có thứ bậc dễ nhìn.
3. **Có cá tính:** dùng typography, minh họa và microcopy nhất quán thay vì ghép các mẫu dashboard phổ biến.

## 2. Tránh cảm giác giao diện do AI tạo

Không dùng các dấu hiệu sau làm phong cách mặc định:

- Gradient tím-xanh phủ toàn màn hình, nền glow lớn hoặc nhiều khối kính mờ.
- Mọi nội dung đều nằm trong card bo tròn giống nhau.
- Quá nhiều badge, icon trang trí, emoji hoặc số liệu không giúp người học ra quyết định.
- Tiêu đề marketing chung chung như “Unlock your potential” hoặc lời khen không dựa trên hành động thật.
- Animation xuất hiện ở mọi thành phần, skeleton kéo dài hoặc hiệu ứng confetti cho thao tác nhỏ.
- Nội dung căn giữa toàn bộ; dashboard có hàng loạt card đối xứng nhưng thiếu điểm nhấn.
- Dùng ảnh stock về học tập, robot hoặc não phát sáng nếu ảnh không truyền tải thông tin.

Ưu tiên bố cục editorial: tiêu đề rõ, đoạn mô tả ngắn, danh sách và bảng có nhịp điệu, đường phân cách nhẹ. Card chỉ dùng khi một nhóm nội dung thực sự có ranh giới và hành động riêng.

## 3. Hệ thống thị giác

### Màu sắc

- Nền chính dùng trắng ngà hoặc xám rất nhạt; không dùng trắng tinh cho mọi bề mặt.
- Màu thương hiệu nên là xanh lam hơi trầm hoặc xanh teal, đủ tương phản với chữ trắng.
- Màu thành công, cảnh báo và lỗi chỉ biểu thị trạng thái; luôn đi kèm icon hoặc chữ.
- Tier `BetaPractice` và `DataValidatedPractice` phải có nhãn bằng chữ, không phân biệt chỉ bằng màu.
- Không dùng màu TOEIC hoặc logo của tổ chức khác theo cách làm người dùng hiểu đây là sản phẩm chính thức.

Tất cả màu phải đi qua semantic tokens, ví dụ:

```css
:root {
  --color-bg: #f7f7f4;
  --color-surface: #ffffff;
  --color-text: #202522;
  --color-text-muted: #66706a;
  --color-border: #dfe4df;
  --color-primary: #176b63;
  --color-primary-hover: #125850;
  --color-danger: #b42318;
  --color-warning: #9a6700;
  --color-success: #287a4b;
}
```

Các giá trị trên là baseline kỹ thuật, cần kiểm tra tương phản trước khi khóa brand palette.

### Typography

- Chọn một sans-serif dễ đọc, hỗ trợ đầy đủ tiếng Việt; ưu tiên system font ở bản đầu.
- Body tối thiểu 16px, line-height khoảng 1.5–1.65.
- Chỉ dùng 3–4 mức heading thực sự cần thiết.
- Độ rộng đoạn văn khoảng 60–75 ký tự; phần giải thích đáp án không kéo dài hết màn hình desktop.
- Dùng tabular numbers cho timer, raw score và số câu.

### Hình khối và khoảng cách

- Radius mặc định 8–12px; tránh bo tròn dạng viên thuốc cho mọi button/card.
- Dùng thang spacing 4, 8, 12, 16, 24, 32, 48 và 64px.
- Shadow rất nhẹ, chỉ dùng để thể hiện lớp nổi như menu hoặc dialog.
- Border và thay đổi màu nền nên thay shadow trong phần lớn layout.

## 4. Luồng học viên

### Dashboard

- Đặt hành động “Tiếp tục học” hoặc “Luyện tập tiếp” ở vị trí đầu tiên.
- Hiển thị tiến độ có ngữ cảnh: bài nào, đã làm bao nhiêu, bước tiếp theo là gì.
- Không dùng streak để gây áp lực; nếu hiển thị, dùng như thông tin hỗ trợ.
- Không hiển thị điểm TOEIC ước lượng khi chưa có policy và tier phù hợp.

### Màn hình làm bài

- Câu hỏi là trọng tâm; navigation và timer không tranh sự chú ý.
- Option có vùng bấm tối thiểu 44×44px, hỗ trợ keyboard và trạng thái focus rõ.
- Autosave phải thể hiện ba trạng thái: đang lưu, đã lưu và lỗi cần thử lại.
- Không để màu đúng/sai hoặc đáp án xuất hiện trước submit.
- Khi mất kết nối, giữ câu trả lời cục bộ có giới hạn và thông báo cụ thể; không hứa đã lưu khi server chưa xác nhận.
- Mobile dùng thanh hành động cố định vừa phải, không che option cuối.

### Kết quả và chữa lỗi

- Dẫn bằng raw score và số câu đã trả lời; mô tả rõ đây là luyện tập Beta nếu áp dụng.
- Giải thích theo thứ tự: lựa chọn của người học, đáp án, lý do, bằng chứng và nội dung cần ôn.
- Giọng văn trung tính: “Câu này cần xem lại” thay cho “Bạn đã thất bại”.
- Nút báo lỗi câu hỏi luôn truy cập được bằng bàn phím và screen reader.

### Admin và quality dashboard

- Ưu tiên bảng, filter và detail panel thay cho lưới card dày đặc.
- Finding Blocking phải dễ nhận biết và không có nút bypass.
- Quarantine, archive và publish phải hiển thị đối tượng, revision, lý do và hậu quả trước khi gửi lệnh.
- Không hiển thị raw provider payload hoặc secret trong UI/log client.

## 5. Responsive và accessibility

- Thiết kế từ nội dung, kiểm tra ở 360px, 768px, 1024px và 1440px.
- Learner flow phải dùng tốt trên mobile; authoring phức tạp có thể yêu cầu desktop theo SRS.
- Đạt WCAG 2.2 AA cho contrast, focus, keyboard, label và reduced motion.
- Không khóa zoom, không thay outline bằng hiệu ứng khó thấy.
- Dialog phải trap focus, đóng bằng Escape và trả focus về trigger.
- Error summary liên kết tới field lỗi; không chỉ đặt dòng chữ đỏ cạnh input.
- Tôn trọng `prefers-reduced-motion` và tránh animation dài hơn 200ms cho thao tác thường.

## 6. Quy ước React và TypeScript

### Tổ chức theo feature

Mỗi nghiệp vụ đặt trong một feature độc lập:

```text
features/practice/
├── api/
├── components/
├── hooks/
├── pages/
├── schemas/
└── types.ts
```

Component dùng chung chỉ chuyển vào `components/` khi đã có ít nhất hai feature sử dụng và API của component ổn định.

### Component

- Dùng function component và named export.
- Một component giải quyết một trách nhiệm giao diện rõ ràng.
- Tránh component nhận quá nhiều boolean như `compact`, `rounded`, `special`, `modern`; dùng variant có nghĩa nghiệp vụ hoặc composition.
- Không gọi API trực tiếp trong component trình bày.
- Không lưu server state trùng trong nhiều local state.
- Không dùng index làm React key cho question, option hoặc record có stable ID.

Ví dụ:

```tsx
type AttemptStatusProps = {
  state: "saving" | "saved" | "failed";
  savedAt?: string;
};

export function AttemptStatus({ state, savedAt }: AttemptStatusProps) {
  // Render text and accessible live-region from an explicit state machine.
}
```

### Kiểu dữ liệu và API

- Bật TypeScript strict mode.
- Dữ liệu từ API luôn là `unknown` trước khi được schema runtime kiểm tra.
- Transport DTO không dùng trực tiếp làm view model nếu UI cần trạng thái dẫn xuất.
- Không nhận role, permission, quality gate hoặc score từ query string/local storage như nguồn tin cậy.
- Không đưa answer key vào DTO trước submit; frontend không “ẩn bằng CSS”.
- API error hiển thị message an toàn theo `code` và giữ `traceId` để hỗ trợ.

### State

- Server state do query layer quản lý; form state để gần form.
- Attempt state cần reducer/state machine vì có lease, autosave, conflict, deadline và submit.
- Mọi optimistic update phải có rollback hoặc reconciliation rõ ràng.
- Timer hiển thị dựa trên server deadline; không tự cộng dồn interval làm nguồn thời gian chính.

### CSS

- Dùng CSS Modules hoặc một phương án scoped CSS thống nhất.
- Token toàn cục đặt trong `styles/tokens.css`; component không tự tạo màu gần giống token có sẵn.
- Class name mô tả vai trò như `questionPrompt`, `saveStatus`; tránh tên theo vị trí như `leftBox`.
- Không dùng inline style cho layout thông thường.

## 7. Nội dung và microcopy

- Viết tiếng Việt tự nhiên, ngắn và cụ thể.
- Button dùng động từ: “Bắt đầu luyện”, “Lưu và tiếp tục”, “Nộp bài”.
- Error nói điều gì xảy ra và người dùng có thể làm gì tiếp theo.
- Không tự nhận nội dung là “chính thức”, “chuẩn hóa” hoặc dự đoán điểm TOEIC.
- Nhãn Beta luôn hiện ở màn bắt đầu, attempt và kết quả khi form thuộc tier Beta.
- Không dùng giọng trẻ con, tâng bốc hoặc đổ lỗi cho người học.

## 8. Definition of Done cho một màn hình

Một màn hình chỉ được coi là hoàn chỉnh khi:

- Có loading, empty, error, offline/retry và permission states phù hợp.
- Dùng được hoàn toàn bằng keyboard và có focus order hợp lý.
- Kiểm tra mobile và desktop, nội dung tiếng Việt dài và zoom 200%.
- Không lộ key, internal finding, provider payload, PII hoặc quyền do client tự khai.
- Event analytics không chứa nội dung câu trả lời tự do hoặc dữ liệu nhạy cảm.
- Nhãn tier và giới hạn sản phẩm hiển thị đúng với API.
- Không thêm animation, card hoặc icon nếu chúng không cải thiện khả năng hiểu hoặc thao tác.
