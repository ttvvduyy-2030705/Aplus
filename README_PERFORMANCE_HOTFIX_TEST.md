# Performance hotfix test

Patch này xử lý cảm giác app bị đơ/lag sau khi tích nhiều batch.

## File đã sửa

- `src/i18n/dictionary.ts`
  - Cache kết quả dịch theo `language + text`.
  - Pre-sort phrase dictionary một lần thay vì sort lại cho mỗi text render.
  - Cache regex phrase boundary để giảm CPU trên Android/Metro/Hermes.

- `src/i18n/LanguageContext.tsx`
  - Stable `t()` bằng `useCallback`.

- `src/components/base/AplusText.tsx`
  - Memo component.
  - Memo kết quả translate node để tránh dịch lại mỗi render.

- `src/components/base/AplusTextField.tsx`
  - Memo placeholder translation.
  - Memo component.

- `src/components/base/AplusButton.tsx`
  - Debounce tap 450ms để tránh double navigation/action gây cảm giác đơ.
  - Memo component.

- `src/components/base/AplusIcon.tsx`
  - Memo icon để giảm render lại ở list/card/tabbar.

- `src/components/navigation/AplusBottomTab.tsx`
  - Memo tabbar.
  - Bấm tab hiện tại sẽ không reset route nữa.

- `src/navigation/RootNavigator.tsx`
  - Bỏ reset route khi chọn lại chính tab đang mở.

## Cách apply

Copy thư mục `Aplus-main` trong patch đè vào project hiện tại.

## Test build

```bash
npm install
npx tsc --noEmit
npm run lint -- --max-warnings=0
npm test -- --runInBand

cd android
gradlew clean
gradlew :app:assembleDebug
```

## Test cảm giác UI

1. Mở app, vào Home, bấm qua lại 5 tab: Nhà / Chìa khoá / Lịch sử / Thêm / Tôi.
2. Bấm lại tab đang mở nhiều lần, app không nên reset/nhấp nháy.
3. Vào Thêm, cuộn danh sách nhiều module, bấm mở từng module rồi quay lại.
4. Vào Tôi → đổi English/Tiếng Việt, kiểm tra sau khi đổi xong app không giật lâu.
5. Test các nút hành động nhanh như Save/Create/Refresh: bấm liên tục không tạo nhiều navigation/job trùng.

## Lưu ý

Patch này không đổi business logic batch, không đổi logo, không sửa native Android/Kotlin, không đụng dữ liệu seed.
Nếu vẫn thấy lag rõ, bước tiếp theo nên là thay các màn danh sách dài đang dùng `ScrollView + map` sang `FlatList` theo từng màn nặng nhất.
