Aplus Lock - Batch 05 Password Overlay

Gán đè toàn bộ nội dung thư mục này vào C:\project\Aplus.

Batch 05 hoàn thiện:
- UI-03 Quản lý mật khẩu
- UI-26 Thêm mật khẩu
- UI-45 Chi tiết/thu hồi mật khẩu
- UI-46 Lập lịch mã chu kỳ
- PasswordCredential model
- ScheduleRule
- SyncState/PendingSync/PendingRevoke
- Policy 6-10 số và check trùng mã trong cùng khóa
- Mã thường, mã tạm, mã một lần, mã chu kỳ, mã nhân viên, mã khách
- Mock dùng mã tạo AccessRecord method PIN

Chạy test bằng Android Studio:
File -> Sync Project with Gradle Files
Build -> Clean Project
Build -> Rebuild Project
Run

Không chạy Metro riêng.
