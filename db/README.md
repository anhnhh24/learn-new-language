# Database baseline

`001_initial.sql` là DDL PostgreSQL chuẩn bị cho R0A và các bảng thương mại R1. Script chưa được chạy tự động.

Commerce được seed ở `PendingIntegration`. Chỉ migration/vận hành có kiểm soát mới đổi sang `Enabled` sau khi có provider, merchant, webhook secret, chính sách giá/refund và quy trình đối soát.

Các ràng buộc cạnh tranh quan trọng nằm ở database: email duy nhất, generation idempotency, active attempt, response operation, grade version, provider event/transaction, entitlement source và quota terminal event. Transaction ứng dụng vẫn phải ghi aggregate cùng outbox trong một commit.

Trước khi dùng production cần bổ sung migration runner, role PostgreSQL tối thiểu quyền, backup/restore và integration test concurrency. Không dùng `EnsureCreated` ở production.
