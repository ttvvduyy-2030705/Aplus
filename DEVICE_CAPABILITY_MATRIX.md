# DEVICE_CAPABILITY_MATRIX - Aplus Lock

Capability phải được kiểm tra trước mọi flow phần cứng.

| Capability | Flow bị ảnh hưởng | UI chính | Guard |
|---|---|---|---|
| supportsFingerprint | Fingerprint enrollment | UI-27 | Chặn nếu false |
| supportsFace | Face unlock | UI-23 | Chặn nếu false hoặc cameraUnavailable |
| supportsCard | Card basic/Card issuer | UI-09/UI-25/UI-63 | Chặn scan/issue nếu false |
| supportsNfc | NFC/mobile card | UI-15 | Chặn đăng ký NFC nếu phone hoặc lock unsupported |
| supportsRemoteControl | Remote physical | UI-24 | Chặn pair remote nếu false |
| supportsGateway | Gateway/MQTT/realtime | UI-12/UI-35/UI-65 | Hiển thị warning/reconnect nếu false/offline |
| supportsOta | Firmware OTA | UI-43 | Chặn OTA nếu false |

## Test mẫu

- Chọn một khóa không hỗ trợ face, mở **Credential Hub → Face**, kỳ vọng bị khóa/giải thích rõ.
- Chọn một khóa không hỗ trợ NFC, mở **NFC & thẻ điện thoại**, kỳ vọng không tạo credential rủi ro.
- Tắt remoteUnlock trong **Device Settings**, mở **Remote Unlock**, kỳ vọng bị chặn.
- Chọn khóa offline/gateway offline, gửi remote command, kỳ vọng không unlock và có record fail/blocked.
