# UI_COMPONENT_RULES.md

Quy tắc dùng chung cho Batch 00-05 của Aplus Lock.

## Theme và layout

- Dùng `BaseScreen` cho mọi màn chính để giữ nền graphite/black, red glow, status bar và keyboard handling đồng nhất.
- Không dùng ảnh nền full-screen làm UI thật. Logo/icon chỉ là asset trang trí; input, button, card, tab, list và dialog phải là component native.
- Mọi màn phải dùng token trong `src/theme`: `colors`, `spacing`, `radius`, `typography`, `shadows`.
- Không hardcode màu ngoài theme, trừ trường hợp highlight cục bộ đã được kiểm soát trong component base.
- Bottom tab không đặt trong `ScrollView`. Tab là sibling của screen trong `RootNavigator` để không bị cuộn theo nội dung.

## Component base

- Text: dùng `AplusText`; không tạo style text riêng trùng lặp nếu token đã có.
- Input: dùng `AplusTextField`; luôn truyền `error` khi validate fail để lỗi nằm ngay dưới trường.
- Button: dùng `AplusButton`; action nhạy cảm dùng `variant="danger"` hoặc dialog xác nhận.
- Card/list: dùng `AplusCard`; không tự dựng shadow/border cho từng screen nếu không cần.
- Status: dùng `StatusChip` cho online/offline, pending/revoked, capability/permission.
- Dialog xác nhận: dùng `ConfirmDialog` cho revoke/logout/flow nhạy cảm.

## Navigation và dữ liệu

- Mọi màn chi tiết khóa, credential, password phải nhận `lockId`/`passwordId` qua route params; không hardcode Căn hộ 520.
- Home filter chỉ đổi dữ liệu, không đổi layout card.
- Remote unlock phải qua preflight permission + capability + setting + online/gateway trước khi tạo command.
- Password tạo mới phải kiểm tra policy 6-10 số, duplicate trong cùng khóa và thời hạn hiệu lực bị overlap.
- Offline không crash: tạo password chuyển `PendingSync`; revoke chuyển `PendingRevoke`; remote unlock offline bị chặn.

## Audit và sync

- Command success/timeout/failed đều tạo `AccessRecord` phù hợp. Chỉ success mới đổi trạng thái khóa.
- Password tạo mới phải đồng bộ sang Credential model chung để UI-16 nhìn thấy.
- Revoke không xoá cứng credential/password; trạng thái chuyển revoked/pendingRevoke để giữ audit.
