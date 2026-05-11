# Batch 22 - Tài khoản, ngôn ngữ, App PIN, trusted devices, branding

Patch này chỉ chứa các file sửa/thêm cho Batch 22. Không gửi lại toàn bộ source.

## UI / Route đã thêm

- `Profile` / tab **Tôi**: tổng quan tài khoản, ngôn ngữ, App PIN, trusted devices, branding.
- `AppPinSecurity`: UI-61 Bảo mật App PIN.
- `TrustedDevices`: UI-62 Thiết bị tin cậy.
- `BrandingSettings`: UI-18 Tài khoản & ngôn ngữ + branding dự án.

## Cách apply patch

Giải nén file patch, copy thư mục `Aplus-main` đè vào project hiện tại, chọn Replace/Overwrite.

```bash
npm install
npx tsc --noEmit
npm run lint -- --max-warnings=0
npm test -- --runInBand

cd android
gradlew clean
gradlew :app:assembleDebug
```

## Test nhanh

1. Đăng nhập bằng `admin@aplus.vn / 123456`.
2. Mở tab **Tôi**.
3. Kiểm tra profile card hiển thị:
   - tên user
   - role Owner
   - ngôn ngữ hiện tại
   - App PIN
   - số thiết bị tin cậy
4. Vào **Bảo mật App PIN**:
   - bật/tắt App PIN
   - bật/tắt yêu cầu PIN cho thao tác nhạy cảm
   - bật/tắt biometric fallback
   - đổi PIN từ `2580` sang PIN mới 4-6 số
   - chọn auto-lock 1/5/15/30 phút
5. Sau khi đổi PIN, vào Lock Detail -> Remote Unlock:
   - nhập PIN cũ phải fail
   - nhập PIN mới phải tạo command
6. Vào **Thiết bị tin cậy**:
   - xem danh sách Android/iOS/Web
   - đổi tên thiết bị
   - revoke thiết bị phụ
   - revoke thiết bị hiện tại sẽ xoá trusted device và quay về Login
7. Vào **Ngôn ngữ & Branding**:
   - đổi Việt/Anh
   - sửa tên dự án, tên hệ thống, hotline, terms/privacy
   - lưu branding và quay lại tab Tôi xem tên hệ thống cập nhật

## Ghi chú

- Logo app nền đen không bị đổi trong batch này.
- More Hub vẫn giữ vai trò hub vận hành; phần tài khoản nằm riêng ở tab **Tôi**.
- `remoteUnlockPin` trong AppState giờ đọc từ `AppPinSettings.pinHash`, không còn chỉ cứng `2580`.
