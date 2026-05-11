# Batch 00-05 review & fixes

## Đã đối chiếu theo kế hoạch PDF

- Batch 00: Base UI/theme/component chung, responsive, keyboard và bottom tab.
- Batch 01: Auth login/register/forgot/OTP/session/trusted device.
- Batch 02: Home Dashboard, filter Nhà/Khách sạn/Văn phòng, truyền đúng `lockId`.
- Batch 03: Lock Detail, quick actions, Remote Unlock, command lifecycle.
- Batch 04: Credential Hub, Credential model chung, permission/capability routing.
- Batch 05: Password manager/add/detail/schedule/revoke/extend/offline sync.

## Vấn đề đã phát hiện

1. Entry `App.tsx` ở root vẫn là template React Native cũ, dễ khiến test/build mở sai app thay vì Aplus UI.
2. TypeScript đang fail ở route params, wait promise, theme font và một số mock adapter/repository.
3. Jest preset cũ không tồn tại trong React Native version hiện tại.
4. ESLint fail do hook dependency và state setter chưa dùng.
5. Batch 00 thiếu tài liệu `UI_COMPONENT_RULES.md`.
6. Batch 04 thiếu option `combination` trong catalog dù Credential type/model đã có.
7. Batch 05 tạo password nhưng không upsert sang Credential model chung nên Credential Hub không thấy password mới.
8. Batch 05 check duplicate chỉ theo code/lock, chưa xét overlap thời hạn như kế hoạch yêu cầu.
9. Batch 05 mock dùng mã chu kỳ chưa kiểm tra ngày/giờ trong `ScheduleRule`.
10. Batch 05 test render chưa đợi async bootstrap/repository nên gây warning/teardown sau test.

## Fix đã làm

- Root `App.tsx` export đúng app tại `src/app/App`.
- Sửa `AppRoute` thành discriminated union để `RootNavigator` type-safe.
- Sửa `AplusTextField` dùng đúng `theme.typography.family`.
- Chuẩn hóa toàn bộ `wait()` thành `Promise<void>`.
- Sửa hook dependency bằng `useCallback` ở `AppStateContext` và `CredentialHubScreen`.
- Cập nhật Jest preset sang `react-native` và test render đợi async effects.
- Thêm `docs/UI_COMPONENT_RULES.md`.
- Thêm credential option `combination`.
- Thêm `upsertPasswordCredential` và `updatePasswordCredentialStatus` trong `MockCredentialRepository`.
- Batch 05 tạo password đồng bộ sang Credential Hub, revoke/pause/resume/extend/update schedule cập nhật credential status.
- Batch 05 duplicate policy kiểm tra overlap thời hạn.
- Batch 05 mock use kiểm tra validFrom/validTo và lịch chu kỳ ngày/giờ.
- UI-26 thêm editor nhanh cho lịch chu kỳ ngay trong màn tạo mật khẩu; UI-46 vẫn dùng để xem/sửa password đã lưu.

## Kết quả kiểm tra

- `npx tsc --noEmit`: pass.
- `npm run lint -- --max-warnings=0`: pass.
- `npm test -- --runInBand`: pass.
