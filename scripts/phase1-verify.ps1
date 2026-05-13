param(
  [string]$Root = ".",
  [switch]$SkipBundle,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path $Root).Path
Push-Location $rootPath
try {
  if (-not $SkipBundle) {
    Write-Host "Regenerating Android offline bundle..." -ForegroundColor Cyan
    Remove-Item ".\android\app\src\main\assets\index.android.bundle" -Force -ErrorAction SilentlyContinue
    npx react-native bundle `
      --platform android `
      --dev false `
      --entry-file index.js `
      --bundle-output android/app/src/main/assets/index.android.bundle `
      --assets-dest android/app/src/main/res
  }

  $bundlePath = ".\android\app\src\main\assets\index.android.bundle"
  $hasAplus = Select-String -Path $bundlePath -Pattern "Aplus Lock" -SimpleMatch -Quiet
  $hasBilliards = Select-String -Path $bundlePath -Pattern "Billiards" -SimpleMatch -Quiet

  Write-Host "HAS_APLUS_LOCK =" $hasAplus
  Write-Host "HAS_BILLIARDS =" $hasBilliards

  if (-not $hasAplus) { throw "Bundle check failed: Aplus Lock marker not found." }
  if ($hasBilliards) { throw "Bundle check failed: old Billiards marker is still present." }

  if (-not $SkipBuild) {
    Write-Host "Building Android debug APK..." -ForegroundColor Cyan
    Push-Location ".\android"
    try {
      .\gradlew clean
      .\gradlew assembleDebug
    } finally {
      Pop-Location
    }

    $apk = ".\android\app\build\outputs\apk\debug\app-debug.apk"
    if (-not (Test-Path $apk)) { throw "APK not found: $apk" }
    Write-Host "APK OK:" $apk -ForegroundColor Green
  }

  Write-Host "Phase 1 verify passed." -ForegroundColor Green
} finally {
  Pop-Location
}
