# RELEASE_GUARD - Aplus Lock

Không release nếu còn bất kỳ mục Critical/High chưa xử lý.

## Critical

- Không dùng `localhost` hoặc `127.0.0.1` làm baseUrl trong production.
- Không hardcode API key, secret, webhook signing secret trong app.
- Không lưu password/PIN/sinh trắc học thô trong diagnostic package/log.
- Remote unlock, transfer, factory reset, emergency card, API key phải có re-auth và audit.

## High

- Account test `admin@aplus.vn / 123456` chỉ được phép trong demo/internal flavor.
- Backend off/realtime off không được crash.
- Offline không được cho remote unlock.
- Command timeout/fail không tự đổi trạng thái lock sang unlocked.
- Permission/capability guard phải chạy trước khi tạo credential.

## Medium

- Tất cả Reports/KPI phải đọc từ records/alerts/battery/credentials, không hardcode.
- Push policy phải có cooldown/dedupe để tránh spam.
- Import CSV/Excel phải preview lỗi trước khi ghi.
- Export diagnostic phải redaction IP/secret/credential sensitive fields.

## Manual release steps

1. Chạy `npx tsc --noEmit`.
2. Chạy `npm run lint -- --max-warnings=0`.
3. Chạy test unit/e2e hiện có.
4. Chạy `cd android && gradlew clean && gradlew :app:assembleDebug`.
5. Mở app, vào **Thêm → QA & release readiness** và kiểm từng tab.
6. Kiểm file cấu hình build flavor production trước khi bàn giao.
