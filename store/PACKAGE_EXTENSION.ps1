$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$releaseRoot = Join-Path $PSScriptRoot 'release'
$staging = Join-Path $releaseRoot 'Canvas-Content-Builder'
$manifest = Get-Content -LiteralPath (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$zip = Join-Path $releaseRoot ("Canvas-Content-Builder-{0}.zip" -f $manifest.version)

if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
New-Item -ItemType Directory -Path $staging -Force | Out-Null

$files = @(
  'manifest.json', 'background.js', 'panel.html', 'panel.css', 'panel.js',
  'canvas-engine.js', 'sources.js', 'templates.js',
  'page-editor.html', 'page-editor.css', 'page-editor.js'
)

foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $staging $file)
}
Copy-Item -LiteralPath (Join-Path $root 'assets') -Destination (Join-Path $staging 'assets') -Recurse

Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath $staging -Force | ForEach-Object FullName) -DestinationPath $zip
Write-Host "Created: $zip"
