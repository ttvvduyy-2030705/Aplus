Aplus bundle fix

Copy toàn bộ thư mục trong zip này đè vào thư mục gốc source Aplus của bạn, ví dụ:
C:\project\aplus\

File chính đã sửa:
android/app/src/main/assets/index.android.bundle

Bundle này đã được generate lại từ entry-file index.js của app Aplus Lock.
Kiểm tra:
- Có chuỗi: Aplus Lock
- Không còn marker app cũ: billiards_management / Aplus Billiards

Sau khi copy đè, chạy từ thư mục gốc project:

powershell -ExecutionPolicy Bypass -File .\check-aplus-bundle.ps1
cd android
.\gradlew clean
.\gradlew assembleDebug

Nếu cài trên máy/emulator vẫn thấy app cũ, uninstall app cũ rồi cài lại APK mới.

Đã sửa kèm script bundle:
scripts/bundle-android-offline.js

Lần sau nếu cần tự generate lại bundle, chạy từ thư mục gốc project:

npm install
npm run android:bundle:offline
powershell -ExecutionPolicy Bypass -File .\check-aplus-bundle.ps1
