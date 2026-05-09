# Chạy Aplus Batch 00 bằng Android Studio, không mở Metro riêng

## Mục tiêu

- Mở project Android trong Android Studio.
- Bấm Run hoặc Build từ Android Studio.
- Debug build vẫn có `index.android.bundle` đóng gói sẵn.
- Không cần mở terminal chạy Metro.

## Cấu hình chính

Trong `android/app/build.gradle`, block `react {}` cần có:

```gradle
react {
    // Cho phép Android Studio build Debug có sẵn JS bundle, không cần mở Metro riêng.
    debuggableVariants = []
    bundleAssetName = "index.android.bundle"
    entryFile = file("../../index.js")
}
```

Theo cơ chế React Native Gradle Plugin, variant nào nằm trong `debuggableVariants` sẽ không ship JS bundle và sẽ cần Metro. Vì vậy Batch 00 để danh sách này rỗng để Debug build cũng đóng gói bundle.

## Script có sẵn

- `npm run android:patch-offline-bundle`: chèn cấu hình vào `android/app/build.gradle`.
- `npm run android:bundle:offline`: sinh bundle thủ công nếu muốn kiểm tra trước.

## Luồng test bằng Android Studio

1. Mở Android Studio.
2. Chọn `Open` và mở thư mục `Aplus/android`.
3. Đợi Gradle Sync hoàn tất.
4. Chọn emulator hoặc điện thoại thật.
5. Chọn variant `debug`.
6. Bấm `Run`.
7. App mở Splash → Login → Home mà không cần mở Metro riêng.
