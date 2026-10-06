$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '../mobile')
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:4790'
$env:EXPO_PUBLIC_BACKEND_URL = 'http://127.0.0.1:4790'
$env:DARK_MODE = 'class'
node node_modules/expo/bin/cli export --platform web --output-dir ../.preview/export
if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
python ../scripts/prepare-preview.py
if ($LASTEXITCODE -ne 0) { throw 'Preview packaging failed' }
