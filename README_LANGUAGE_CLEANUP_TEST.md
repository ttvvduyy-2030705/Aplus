# Patch i18n cleanup toàn app

Patch này xử lý tiếp vấn đề còn lẫn tiếng Việt/tiếng Anh sau patch Batch 22.

## Đã sửa

- `translateString()` không còn chỉ dịch một chiều Việt → Anh.
- Thêm dictionary chiều Anh → Việt để khi app đang ở Tiếng Việt, các label tiếng Anh như `Reports`, `Records`, `Resolve`, `Ignore`, `Staff`, `Room Management`, `Trusted devices`, `Language & Branding`... được đưa về tiếng Việt.
- Bổ sung nhiều exact key cho các màn Batch 10/11/13/14/15/16/17/22.
- Bổ sung phrase fallback hai chiều để các câu ghép như `UI-17 · Reports từ Records/Alerts/Battery` hoặc `UI-58 · Records/Alerts/Battery liên quan` không còn bị trộn ngôn ngữ quá nhiều.
- Giữ skip rule cho mã kỹ thuật/serial/email/URL như `APL-HOTEL-0701`, `admin@aplus.vn`, `https://...`, `UI-17` để tránh dịch nhầm ID.

## Cách apply

Copy thư mục `Aplus-main` trong patch đè vào project hiện tại.

## Test nhanh

```bash
npm install
npx tsc --noEmit
npm run lint -- --max-warnings=0
npm test -- --runInBand

cd android
gradlew clean
gradlew :app:assembleDebug
```

## Test thủ công trong app

1. Đăng nhập `admin@aplus.vn / 123456`.
2. Vào tab **Tôi** → **Ngôn ngữ & Branding**.
3. Chọn **English**.
4. Đi qua các tab/màn sau và kiểm tra phần UI text chính hiển thị tiếng Anh:
   - Home
   - Keys / Credential Hub
   - Records
   - Reports
   - More Hub
   - Alarm Center
   - Room Management
   - Staff/Tenant
   - Device Settings / OTA / Diagnostic
   - App PIN / Trusted devices / Branding
5. Quay lại **Me → Language & Branding**, chọn **Tiếng Việt**.
6. Đi lại các màn trên và kiểm tra UI text chính hiển thị tiếng Việt.

## Lưu ý

Một số dữ liệu mock dạng tên riêng/model/serial vẫn giữ nguyên để không dịch sai dữ liệu thật, ví dụ `Aplus L5 Pro`, `Gateway S1-05`, `APL-HOTEL-0701`, email, URL. Đây là dữ liệu, không phải label UI.
