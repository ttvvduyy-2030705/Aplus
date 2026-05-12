# QA_CHECKLIST - Aplus Lock

## Route/UI coverage

- [ ] UI-00 Login
- [ ] UI-01 Register
- [ ] UI-02 Forgot password
- [ ] UI-03 Password manager
- [ ] UI-04 Phone authorization
- [ ] UI-05 Home Dashboard
- [ ] UI-06 More Hub
- [ ] UI-07 Lock Detail
- [ ] UI-08 Staff/Tenant
- [ ] UI-09 Card management
- [ ] UI-10 Records
- [ ] UI-11 Room management
- [ ] UI-12 Gateway connection
- [ ] UI-13 Sub admin
- [ ] UI-14 PMS
- [ ] UI-15 NFC/mobile card
- [ ] UI-16 Credential Hub
- [ ] UI-17 Reports
- [ ] UI-18 Profile/account/language
- [ ] UI-19 Alarm Center
- [ ] UI-20 Normally Open
- [ ] UI-21 Battery
- [ ] UI-22 Lock transfer
- [ ] UI-23 Face enrollment
- [ ] UI-24 Remote control
- [ ] UI-25 Add card
- [ ] UI-26 Add password
- [ ] UI-27 Fingerprint enrollment
- [ ] UI-28 Combination unlock
- [ ] UI-29 Device settings
- [ ] UI-30 Remote unlock
- [ ] UI-31 to UI-36 Pairing wizard
- [ ] UI-37 to UI-38 Remote command lifecycle
- [ ] UI-39 Record detail
- [ ] UI-40 to UI-41 Incident/ticket
- [ ] UI-42 to UI-44 Hardware/OTA/Diagnostic
- [ ] UI-45 to UI-46 Password detail/schedule
- [ ] UI-47 to UI-50 Recipient/role/member/invite
- [ ] UI-51 to UI-52 Room detail/edit
- [ ] UI-53 to UI-57 PMS calendar/check-in/out/import/self check-in
- [ ] UI-58 to UI-59 Reports drilldown/filter
- [ ] UI-60 Notification policy
- [ ] UI-61 to UI-62 App PIN/trusted devices
- [ ] UI-63 Card issuer
- [ ] UI-64 to UI-65 Backend/realtime monitor
- [ ] UI-66 Offline sync queue
- [ ] UI-67 Batch issue
- [ ] UI-68 Class/shift schedule
- [ ] UI-69 Capability matrix
- [ ] UI-70 Support/warranty/maintenance

## Permission/capability

- [ ] Guest không vào flow nhạy cảm.
- [ ] SubAdmin không cấp quyền cao hơn chính mình.
- [ ] Khóa không support face/fingerprint/NFC/card/remote thì flow bị khóa rõ lý do.
- [ ] Revoke chuyển trạng thái Revoked/PendingRevoke, không xóa cứng.

## Offline/realtime/backend

- [ ] Backend off không crash.
- [ ] Event realtime cập nhật Home/Detail/Records/Alerts.
- [ ] Command timeout tạo failed record và không đổi trạng thái khóa.
- [ ] Offline xem cache được.
- [ ] Remote unlock offline bị chặn.
- [ ] Sync queue retry/cancel/conflict rõ ràng.
