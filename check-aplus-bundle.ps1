$bundle = "android\app\src\main\assets\index.android.bundle"
if (!(Test-Path $bundle)) {
  Write-Host "MISSING: $bundle" -ForegroundColor Red
  exit 1
}
Write-Host "Checking $bundle ..."
$aplus = Select-String -Path $bundle -Pattern "Aplus Lock" -SimpleMatch -Quiet
$old1 = Select-String -Path $bundle -Pattern "billiards_management" -SimpleMatch -Quiet
$old2 = Select-String -Path $bundle -Pattern "Aplus Billiards" -SimpleMatch -Quiet
if ($aplus) { Write-Host "OK: found Aplus Lock" -ForegroundColor Green } else { Write-Host "BAD: Aplus Lock not found" -ForegroundColor Red }
if ($old1 -or $old2) { Write-Host "BAD: old Billiards bundle still present" -ForegroundColor Red } else { Write-Host "OK: no old Billiards marker" -ForegroundColor Green }
if (!$aplus -or $old1 -or $old2) { exit 1 }
