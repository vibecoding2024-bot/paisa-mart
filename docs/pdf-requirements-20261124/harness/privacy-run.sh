#!/usr/bin/env bash
# Fresh backend for <commit> + <web dir>, then the customer privacy scenarios. Usage: privacy-run.sh <commit> <web> <tag>
SP="$(cd "$(dirname "$0")" && pwd)"; C=$1; W=$2; T=$3
( bash "$SP/restart.sh" "$C" "$W" "$SP/rt-$T" > "$SP/rt-$T.log" 2>&1 & )
sleep 5; for i in $(seq 1 40); do [ "$(curl -s -m 2 -o /dev/null -w '%{http_code}' http://127.0.0.1:3911/health)" = 200 ] && break; sleep 1; done
cd "$SP"; node privacy-verify.cjs "$SP/privacy-$T" > "$SP/privacy-$T.log" 2>&1; echo "privacy exit $?"; grep -E "^(PASS|FAIL)|Privacy verification|held|delayed" "$SP/privacy-$T.log"
echo "--- outbound blocked:"; cat "$SP/rt-$T/outbound-blocked.log"
