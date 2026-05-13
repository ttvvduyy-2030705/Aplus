param(
  [string]$Root = ".",
  [string]$QuarantineDir = ""
)

$ErrorActionPreference = "Stop"
$rootPath = (Resolve-Path $Root).Path

if ([string]::IsNullOrWhiteSpace($QuarantineDir)) {
  $qRoot = Join-Path $rootPath "_legacy_quarantine"
  if (-not (Test-Path $qRoot)) { throw "No _legacy_quarantine folder found." }
  $latest = Get-ChildItem -Path $qRoot -Directory -Filter "phase1_*" | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $latest) { throw "No phase1 quarantine directory found." }
  $QuarantineDir = $latest.FullName
} else {
  $QuarantineDir = (Resolve-Path $QuarantineDir).Path
}

$manifestPath = Join-Path $QuarantineDir "manifest.json"
if (-not (Test-Path $manifestPath)) { throw "Manifest not found: $manifestPath" }
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

foreach ($item in $manifest.moved) {
  $source = Join-Path $rootPath $item.quarantinedRelativePath
  $target = Join-Path $rootPath $item.originalRelativePath
  if (-not (Test-Path $source)) {
    Write-Host "Skip missing quarantined path:" $item.quarantinedRelativePath -ForegroundColor Yellow
    continue
  }
  $parent = Split-Path $target -Parent
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Move-Item -Path $source -Destination $target -Force
  Write-Host "Restored:" $item.originalRelativePath
}

Write-Host "Restore complete." -ForegroundColor Green
