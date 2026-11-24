#!/usr/bin/env bash
# Stops any bun listening on 3911 (only our worktree bun), then starts run-local.sh in the foreground.
SP="$(cd "$(dirname "$0")" && pwd)"
powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort 3911 -State Listen -ErrorAction SilentlyContinue | % { \$p=Get-Process -Id \$_.OwningProcess; if (\$p.Path -like '*paisa-mart\.build-tools\bun-runtime*') { Stop-Process -Id \$p.Id -Confirm:\$false } }" ; sleep 1
exec bash "$SP/run-local.sh" "$@"
