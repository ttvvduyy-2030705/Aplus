# Phase 1 legacy audit report — Aplus-main (3)

## Kết luận

Source hiện tại chạy được Aplus Lock nhưng vẫn còn nhiều mảng legacy từ app cũ:

- `src/scenes/*`: màn/game/livestream/restaurant cũ, không nằm trong `src/app/App.tsx` hoặc `src/navigation/RootNavigator.tsx` hiện tại.
- `src/components/*` dạng cũ: Ball, scoreboard, UVC camera, Video, Button/Text/View cũ.
- `src/repositories/*`, `src/stores/*`, `src/context/*`, `src/data/*`: lớp dữ liệu cũ của restaurant/game.
- `docs/restaurant-*`, `docs/scoremenu-*`, `backend/scoremenu-server`, `backend/src/billing.js`: tài liệu/backend cũ cho ScoreMenu/restaurant.
- `ios/billiards_management*`: iOS project cũ.
- `src/services/restaurant*`, `src/services/youtube*`, `src/services/livestream*`, `src/services/ffmpeg`, `src/services/replay`, `src/services/uvc`: service cũ liên quan menu/livestream/webcam.

## Cách dọn an toàn

Không xoá vĩnh viễn ngay. Chạy script quarantine để chuyển các phần cũ vào:

```txt
_legacy_quarantine/phase1_<timestamp>/
```

Sau đó regenerate bundle, build app, test smoke test. Nếu ổn sau vài vòng thì mới cân nhắc xoá hẳn thư mục quarantine.

## Những phần không động vào trong Phase 1

- `src/features/*` của Aplus Lock.
- `src/services/repositories/Mock*Repository.ts` đang cấp dữ liệu mock cho app khoá.
- `src/services/adapters/*` đang dùng cho mock BLE/QR/WiFi/realtime.
- `src/components/base`, `src/components/feedback`, `src/components/navigation`.
- `src/assets/icons` vì đang được `AplusIcon` require trực tiếp.
- `src/assets/images/aplus_logo_square.png`, `src/assets/images/aplus_logo.png`.
- `docs/backend/*`, `docs/qa/*`, vì còn hữu ích cho roadmap backend/QA.
