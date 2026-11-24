#!/usr/bin/env bash
# Fresh backend for <commit> + <web dir>, then HTTP and browser verification. Usage: verify-all.sh <commit> <web> <tag>
SP="$(cd "$(dirname "$0")" && pwd)"; C=$1; W=$2; T=$3
( bash "$SP/restart.sh" "$C" "$W" "$SP/rt-$T" > "$SP/rt-$T.log" 2>&1 & )
sleep 5; for i in $(seq 1 40); do [ "$(curl -s -m 2 -o /dev/null -w '%{http_code}' http://127.0.0.1:3911/health)" = 200 ] && break; sleep 1; done
export LOCAL_ADMIN_PASSWORD="$(cat "$SP/rt-$T/admin-password.txt")" LOCAL_STAFF_PASSWORD="local-staff-$RANDOM$RANDOM$RANDOM"
cd "$SP"; node http-verify.mjs "$SP/http-$T.json" > "$SP/http-$T.log" 2>&1; echo "http exit $?"; grep -v "^PASS" "$SP/http-$T.log"
node browser-verify.cjs "$SP/evidence-$T" > "$SP/browser-$T.log" 2>&1; echo "browser exit $?"; grep -v "^PASS" "$SP/browser-$T.log"
echo "--- outbound blocked:"; cat "$SP/rt-$T/outbound-blocked.log"
