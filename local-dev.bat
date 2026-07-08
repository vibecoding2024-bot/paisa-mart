@echo off
REM Local development setup for Paisa Mart Mobile (Windows)
REM Usage: local-dev.bat

setlocal enabledelayedexpansion

echo =^> Pulling latest main
git pull origin main

echo =^> Installing mobile dependencies
cd mobile
call npm install --legacy-peer-deps

echo =^> Starting Expo development server
echo.
echo Web:     http://localhost:8081
echo QR Code: Scan to open on mobile
echo.
echo Press 'w' to open web preview
echo Press 'a' to open Android
echo Press 's' to switch to Expo Go
echo.

call npm start
