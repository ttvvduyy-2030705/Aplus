# Patch ngôn ngữ toàn app - Batch 22 follow-up

## Mục tiêu

- Trong tab **Tôi** → **Ngôn ngữ & Branding**, bấm **English** sẽ đổi toàn bộ UI app sang tiếng Anh ngay.
- Bấm **Tiếng Việt** sẽ đổi toàn bộ UI app về tiếng Việt ngay.
- Không chỉ lưu setting nữa: tabbar, header, button, label, placeholder và status chip dùng chung đều đọc cùng một language state.

## File chính đã thêm/sửa

- `src/i18n/LanguageContext.tsx`
- `src/i18n/dictionary.ts`
- `src/components/base/AplusText.tsx`
- `src/components/base/AplusTextField.tsx`
- `src/state/AppStateContext.tsx`
- `src/services/repositories/MockAccountRepository.ts`
- `src/features/account/screens/BrandingSettingsScreen.tsx`

## Cách apply

Giải nén patch, copy thư mục `Aplus-main` đè vào project hiện tại, chọn Replace/Overwrite.

## Cách test thủ công

1. Login bằng `admin@aplus.vn / 123456`.
2. Kiểm tra tabbar đang có: **Nhà / Chìa khoá / Lịch sử / Thêm / Tôi**.
3. Vào tab **Tôi**.
4. Mở **Ngôn ngữ & Branding**.
5. Bấm **English**.
6. Kiểm tra các màn sau đổi sang tiếng Anh:
   - tabbar: **Home / Keys / Records / More / Me**
   - tab Tôi: account/security labels đổi sang English
   - More Hub: group title/action/subtitle đổi sang English
   - Home/Keys/Records: header, button, status chip, placeholder thông dụng đổi sang English
7. Quay lại **Language & Branding**, bấm **Vietnamese**.
8. Kiểm tra toàn app trở lại tiếng Việt.

## Lưu ý

- Các tên dữ liệu seed như tên khóa/phòng cụ thể có thể giữ nguyên nếu đó là dữ liệu dự án, ví dụ `Aplus Lock`, `Căn hộ 520`, `Phòng 701`.
- UI text dùng component chung `AplusText`, `AplusButton`, `AplusHeader`, `AplusTextField`, `StatusChip` sẽ đổi theo ngôn ngữ.

## Test kỹ thuật

```bash
npm install
npx tsc --noEmit
npm run lint -- --max-warnings=0
npm test -- --runInBand

cd android
gradlew clean
gradlew :app:assembleDebug
```
