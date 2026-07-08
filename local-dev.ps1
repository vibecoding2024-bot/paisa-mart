# Local development setup for Paisa Mart Mobile (PowerShell)
# Usage: .\local-dev.ps1

$ErrorActionPreference = "Stop"

Write-Host "==> Pulling latest main" -ForegroundColor Green
git pull origin main

Write-Host "==> Installing mobile dependencies" -ForegroundColor Green
Set-Location mobile

# Refresh PATH to ensure npm is available
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

npm install --legacy-peer-deps

Write-Host "==> Starting Expo development server" -ForegroundColor Green
Write-Host ""
Write-Host "Web:     http://localhost:8081" -ForegroundColor Cyan
Write-Host "QR Code: Scan to open on mobile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commands:" -ForegroundColor Yellow
Write-Host "  'w' - open web preview"
Write-Host "  'a' - open Android"
Write-Host "  's' - switch to Expo Go"
Write-Host ""

npm start
