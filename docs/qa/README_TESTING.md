# README_TESTING - Aplus Lock QA handoff

## Smoke test bắt buộc

1. Login/logout/session: `admin@aplus.vn / 123456`, logout không back về Home.
2. Home: filter Tất cả/Nhà/Khách sạn/Văn phòng, bấm từng lock vào đúng detail.
3. Lock Detail: lockId/name/room/battery/online/offline hiển thị đúng state.
4. Credential Hub: capability guard cho password, fingerprint, face, card, remote, phone, NFC, combination.
5. Password: tạo mã, mã tạm, mã một lần, mã chu kỳ; revoke/gia hạn/pending sync.
6. Fingerprint/Face/Card/Remote/NFC: không lưu dữ liệu sinh trắc thô, chỉ lưu template/ref/mock id.
7. Staff/Tenant: role matrix, invite QR/link, revoke user thu hồi credential liên quan.
8. Room/PMS: tạo phòng, gán khóa, check-in tạo quyền, check-out thu hồi quyền.
9. Records/Reports/Alerts: action quan trọng phải có record/audit; report không dùng số hardcode.
10. Device/OTA/Diagnostic: settings theo lock, OTA fail giữ version cũ, diagnostic không lộ secret.
11. Realtime: backend off không crash, reconnect/backoff, event lock/battery/tamper/gateway offline cập nhật đúng.
12. Offline: cache xem được, remote unlock offline bị chặn, sync queue retry/cancel/conflict rõ.
13. Release guard: không còn localhost/API key lộ/test account production/hardcode số liệu release.

## Test thiết bị/layout

- 360x640
- 390x844
- tablet nhỏ
- bật/tắt bàn phím trên form dài
- bottom tab không nằm trong scroll
- iOS/Android nếu có build tương ứng

## Test ngôn ngữ/font

- Tiếng Việt: màn chính không lẫn English trừ thuật ngữ kỹ thuật như API, MQTT, NFC, OTA.
- English: màn chính không lẫn tiếng Việt trừ tên dữ liệu seed như Căn hộ 520 nếu là dữ liệu dự án.
- Không có ô vuông/mất dấu tiếng Việt.
