param(
  [string]$Root = "."
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path $Root).Path
$reportDir = Join-Path $rootPath "docs"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$reportPath = Join-Path $reportDir "phase1-legacy-audit-generated.md"

$excludeDirNames = @(".git", "node_modules", ".gradle", "build", "dist", "Pods", "DerivedData", "_legacy_quarantine")
$keywords = @(
  "Billiards", "billiards",
  "restaurant", "Restaurant",
  "scoremenu", "ScoreMenu",
  "livestream", "LiveStream",
  "webcam", "Webcam",
  "youtube", "YouTube",
  "billing", "Billing"
)

function Test-ExcludedPath([string]$path) {
  foreach ($name in $excludeDirNames) {
    if ($path -match "[\\/]$([regex]::Escape($name))([\\/]|$)") { return $true }
  }
  return $false
}

$bundlePath = Join-Path $rootPath "android\app\src\main\assets\index.android.bundle"
$hasAplus = $false
$hasBilliards = $false
if (Test-Path $bundlePath) {
  $hasAplus = Select-String -Path $bundlePath -Pattern "Aplus Lock" -SimpleMatch -Quiet
  $hasBilliards = Select-String -Path $bundlePath -Pattern "Billiards" -SimpleMatch -Quiet
}

$candidatePaths = @(
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

$restaurantDocsRoot = Join-Path $rootPath "docs"
if (Test-Path $restaurantDocsRoot) {
  $restaurantDocs = Get-ChildItem -Path $restaurantDocsRoot -Filter "restaurant-menu-*.md" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $_.FullName.Substring($rootPath.Length + 1)
  }
  $candidatePaths += $restaurantDocs
}

$existingCandidates = @()
foreach ($rel in ($candidatePaths | Sort-Object -Unique)) {
  $full = Join-Path $rootPath $rel
  if (Test-Path $full) { $existingCandidates += $rel }
}

$allFiles = Get-ChildItem -Path $rootPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object { -not (Test-ExcludedPath $_.FullName) }
$hitRows = @()
foreach ($file in $allFiles) {
  $count = 0
  foreach ($keyword in $keywords) {
    try {
      $matches = Select-String -Path $file.FullName -Pattern $keyword -SimpleMatch -ErrorAction SilentlyContinue
      if ($matches) { $count += @($matches).Count }
    } catch {}
  }
  if ($count -gt 0) {
    $rel = $file.FullName.Substring($rootPath.Length + 1)
    $hitRows += [PSCustomObject]@{ Path = $rel; Hits = $count }
  }
}

$topHits = $hitRows | Sort-Object Hits -Descending | Select-Object -First 80
$now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Phase 1 generated legacy audit")
$lines.Add("")
$lines.Add("Generated: $now")
$lines.Add("")
$lines.Add("## Bundle markers")
$lines.Add("")
$lines.Add("- index.android.bundle exists: $(Test-Path $bundlePath)")
$lines.Add("- HAS_APLUS_LOCK: $hasAplus")
$lines.Add("- HAS_BILLIARDS: $hasBilliards")
$lines.Add("")
$lines.Add("## Quarantine candidates found")
$lines.Add("")
foreach ($rel in $existingCandidates | Sort-Object) { $lines.Add("- $rel") }
$lines.Add("")
$lines.Add("## Top legacy keyword hits")
$lines.Add("")
$lines.Add("| Hits | File |")
$lines.Add("|---:|---|")
foreach ($row in $topHits) {
  $safePath = $row.Path.Replace("|", "\|")
  $lines.Add("| $($row.Hits) | $safePath |")
}
$lines.Add("")
$lines.Add("## Next step")
$lines.Add("")
$lines.Add("Run dry-run quarantine first:")
$lines.Add("")
$lines.Add("````powershell")
$lines.Add("powershell -ExecutionPolicy Bypass -File .\scripts\phase1-quarantine-legacy.ps1")
$lines.Add("````")

Set-Content -Path $reportPath -Value $lines -Encoding UTF8

Write-Host "Phase 1 audit done." -ForegroundColor Green
Write-Host "Report:" $reportPath
Write-Host "HAS_APLUS_LOCK =" $hasAplus
Write-Host "HAS_BILLIARDS =" $hasBilliards
Write-Host "Candidates found =" $existingCandidates.Count
Write-Host "Keyword-hit files =" $hitRows.Count
