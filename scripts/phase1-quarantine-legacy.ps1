param(
  [string]$Root = ".",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path $Root).Path
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$quarantineRoot = Join-Path $rootPath "_legacy_quarantine"
$quarantineDir = Join-Path $quarantineRoot "phase1_$timestamp"
$manifestPath = Join-Path $quarantineDir "manifest.json"

$candidates = @(
  "src\scenes",
  "src\components\Ball",
  "src\components\Button",
  "src\components\CaromBroadcastScoreboard",
  "src\components\Container",
  "src\components\Countdown",
  "src\components\Divider",
  "src\components\ErrorBoundary",
  "src\components\HOC",
  "src\components\Image",
  "src\components\Loading",
  "src\components\PoolBroadcastScoreboard",
  "src\components\Switch",
  "src\components\Text",
  "src\components\TextInput",
  "src\components\UvcCameraView",
  "src\components\Video",
  "src\components\View",
  "src\context",
  "src\data",
  "src\repositories",
  "src\stores",
  "src\services\ffmpeg",
  "src\services\replay",
  "src\services\uvc",
  "src\services\restaurantAdminAuthService.ts",
  "src\services\restaurantAdminStore.ts",
  "src\services\restaurantMenuImage.ts",
  "src\services\restaurantMenuRepository.ts",
  "src\services\restaurantMenuStorage.ts",
  "src\services\restaurantWorkspaceStorage.ts",
  "src\services\livestreamAuth.ts",
  "src\services\liveSession.ts",
  "src\services\youtubeCameraStream.ts",
  "src\services\youtubeLiveFlow.ts",
  "src\services\youtubeNativeLive.ts",
  "src\config\livestreamAuth.ts",
  "src\config\restaurantMenu.ts",
  "src\assets\images\game",
  "src\assets\images\pool8-black",
  "src\assets\images\webcam",
  "ios\billiards_management",
  "ios\billiards_management.xcodeproj",
  "ios\billiards_management.xcworkspace",
  "ios\billiards_managementTests",
  "backend\scoremenu-server",
  "backend\src\billing.js",
  "backend\src\index.js",
  "docs\scoremenu-qr-order-implementation.md"
)

$restaurantDocsPath = Join-Path $rootPath "docs"
if (Test-Path $restaurantDocsPath) {
  $restaurantDocs = Get-ChildItem -Path $restaurantDocsPath -Filter "restaurant-menu-*.md" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $_.FullName.Substring($rootPath.Length + 1)
  }
  $candidates += $restaurantDocs
}

$existing = @()
foreach ($rel in ($candidates | Sort-Object -Unique)) {
  $source = Join-Path $rootPath $rel
  if (Test-Path $source) {
    $existing += [PSCustomObject]@{
      originalRelativePath = $rel
      originalFullPath = $source
      quarantineRelativePath = $rel
    }
  }
}

if (-not $Apply) {
  Write-Host "DRY RUN only. Nothing moved." -ForegroundColor Yellow
  Write-Host "Add -Apply to quarantine these paths:" -ForegroundColor Yellow
  $existing | ForEach-Object { Write-Host "-" $_.originalRelativePath }
  Write-Host ""
  Write-Host "Recommended command:" -ForegroundColor Cyan
  Write-Host "powershell -ExecutionPolicy Bypass -File .\scripts\phase1-quarantine-legacy.ps1 -Apply"
  exit 0
}

New-Item -ItemType Directory -Force -Path $quarantineDir | Out-Null
$moved = @()

foreach ($item in $existing) {
  $target = Join-Path $quarantineDir $item.quarantineRelativePath
  $targetParent = Split-Path $target -Parent
  New-Item -ItemType Directory -Force -Path $targetParent | Out-Null
  Move-Item -Path $item.originalFullPath -Destination $target -Force
  $moved += [PSCustomObject]@{
    originalRelativePath = $item.originalRelativePath
    quarantinedRelativePath = ("_legacy_quarantine\phase1_$timestamp\" + $item.quarantineRelativePath)
  }
  Write-Host "Moved:" $item.originalRelativePath
}

$manifest = [PSCustomObject]@{
  createdAt = (Get-Date).ToString("o")
  root = $rootPath
  quarantineDir = $quarantineDir
  moved = $moved
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host ""
Write-Host "Phase 1 quarantine complete." -ForegroundColor Green
Write-Host "Manifest:" $manifestPath
Write-Host "Moved count:" $moved.Count
Write-Host ""
Write-Host "Next: run .\scripts\phase1-verify.ps1"
