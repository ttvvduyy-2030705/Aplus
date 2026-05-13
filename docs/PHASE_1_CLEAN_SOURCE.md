# Aplus Lock — Phase 1: Clean legacy source safely

Mục tiêu: dọn dấu vết source cũ Billiards / restaurant / livestream mà không đụng chức năng Aplus Lock đang chạy ổn ở Phase 0.

## Cách chạy nhanh

Chạy từ thư mục gốc source:

```powershell
cd C:\project\aplus
powershell -ExecutionPolicy Bypass -File .\scripts\phase1-audit-legacy.ps1
```

Nếu report ổn, chạy dry-run quarantine:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\phase1-quarantine-legacy.ps1
```

Nếu danh sách đúng, chạy thật:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\phase1-quarantine-legacy.ps1 -Apply
```

Sau đó verify:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\phase1-verify.ps1
```

## Nếu cần hoàn tác

Script quarantine sẽ tạo thư mục `_legacy_quarantine\phase1_<timestamp>` và file manifest.
Dùng script restore:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\phase1-restore-quarantine.ps1
```

Script sẽ tự chọn đợt quarantine mới nhất nếu bạn không truyền `-QuarantineDir`.

## Lưu ý

- Phase 1 dùng chiến lược `quarantine`, không xoá vĩnh viễn.
- Không tự sửa logic app khoá.
- Không đụng các thư mục active: `src/features`, `src/navigation`, `src/state`, `src/services/repositories` đang dùng cho mock Aplus Lock.
- Sau khi chạy xong vẫn cần build và test app trên máy thật/emulator.
