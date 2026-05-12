# Aplus hotfix notes

## Đã sửa

- Đưa icon Android về đúng nền đen/logo đỏ cho legacy icon, round icon, adaptive icon foreground và Play Store icon.
- Đổi adaptive icon background từ trắng sang đen để không còn hiện icon trắng/logo đỏ.
- Giảm giật UI bằng cách:
  - tách trạng thái auth tối thiểu cho RootNavigator để các cập nhật dữ liệu mock không kéo navigator/tab render lại liên tục;
  - memo hoá screen hiện tại trong RootNavigator;
  - trì hoãn các lần preload dữ liệu nặng đến sau interaction;
  - tối ưu callback navigation để tránh reset/render thừa;
  - tắt log debug/video/camera tần suất cao và bỏ console log khỏi production build;
  - bật removeClippedSubviews cho BaseScreen ScrollView.

## Không đổi

- Không đổi business flow, route, mock repository, credential/lock/menu functions.
- App name vẫn là `Aplus`.
