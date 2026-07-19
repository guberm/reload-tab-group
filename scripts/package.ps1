$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content -LiteralPath (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$dist = Join-Path $root 'dist'
$archive = Join-Path $dist "reload-tab-group-v$($manifest.version).zip"

New-Item -ItemType Directory -Force -Path $dist | Out-Null
Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue

Push-Location $root
try {
  Compress-Archive -LiteralPath 'manifest.json', 'background.js', 'icons' -DestinationPath $archive
} finally {
  Pop-Location
}

Write-Output $archive
