Aplus Batch 03 - Lock Detail + Quick Actions + Remote Unlock + Command Lifecycle

Cach gan de:
1. Giai nen zip.
2. Copy toan bo noi dung trong thu muc Aplus_Batch03_LockDetail_Overlay.
3. Dan de vao C:\project\Aplus.
4. Android Studio: File > Sync Project with Gradle Files > Build > Clean Project > Build > Rebuild Project > Run.
5. Khong chay Metro rieng.

PIN test remote unlock: 2580
Tai khoan test: admin@aplus.vn / 123456

Batch 03 scope:
- Lock Detail dung lockId that, hien thi room/home/pin/signal/gateway/firmware/capability.
- Quick action routing sang CredentialHub/AddPassword/Fingerprint/Face/Card/Remote/PhoneAuth/Settings/More.
- Remote Unlock preflight: permission + capability + setting remoteUnlockEnabled + online/gateway.
- Xac thuc lai bang PIN mock hoac biometric adapter.
- Command lifecycle: pending > sent > ack > success/timeout/failed.
- Chi khi success moi doi trang thai khoa.
- Timeout/failed tao AccessRecord nhung khong doi trang thai khoa.
- Activity tab hien AccessRecord mock tu command.
