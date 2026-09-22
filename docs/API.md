# API hiện tại

- `GET /health`: HTTP 200 `Healthy` khi host chạy. Đây là liveness, chưa chứng minh database/provider sẵn sàng.
- Chưa mở authoring, learner, publish hoặc operations endpoints. Không nhận quyền/actor hoặc quality evidence do client tự khai.

# Contract nội bộ

`CandidateJson.Parse` nhận JSON PascalCase theo `schemas/part5-candidate.v1.schema.json`, tối đa 32.000 ký tự, reject field lạ/thiếu, sai kiểu, null và depth quá lớn. Sau bước parse chạy `Part5Validator`; key phải thuộc đúng một option, stable IDs/text không trùng và rule/version phải khớp blueprint.

Schema là contract cấu trúc v1; code bổ sung kiểm tra chéo và normalization. Chưa có grammar rule catalog chuyên môn hoặc blueprint catalog production. Provenance do provider gửi không được dùng như bằng chứng quyền sử dụng; adapter tương lai phải gắn dữ liệu invocation của server.

`CandidateRevision` chỉ hỗ trợ `Generated -> StructuralValid -> CrossModelValid`, reject, quarantine, archive và tạo revision mới. Các enum trạng thái tương lai có sẵn để thống nhất ngôn ngữ domain, chưa có lệnh chuyển sang Beta/Expert.

`ValidateConsensus` kiểm tra hai invocation khác nhau, revision, input hash, policy, key và ambiguity. Đây là kiểm tra kết quả được worker cung cấp; chưa có runner chứng minh hai context/provider thật độc lập. `PublicationPolicy` kiểm tra một số prerequisite, không phải lệnh publish.

Các fixture trong test là dữ liệu kỹ thuật tổng hợp, không phải câu hỏi đã được kiểm định học thuật và không seed cho learner.
