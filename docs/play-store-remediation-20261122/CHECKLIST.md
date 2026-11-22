# Google Play rejection (version code 7, 21 Nov 2026) — remediation checklist

Branch `fix/play-store-remediation-20261122` (base `origin/main` `595e521`). Local only: nothing pushed,
uploaded, submitted, merged or deployed. No AWS or production access.

## Build identity

| Item | Value | Status |
|---|---|---|
| Rejected artifact | versionCode 7, `com.paisamart.app` | From Google email |
| Source of versionCode 7 | Unknown. Git's highest recorded versionCode is 5 (`9594380`). Builds use EAS (`eas.json`, owner `paisamart`). It was not reproduced. | **UNKNOWN** |
| Web release `20261121-595e5212-on-pr6-dashboard` | A separate artifact; it isn't evidence of the Android contents | Distinct |
| Candidate APK (local test only) | `paisamart-vc8-CANDIDATE-prodapi-debugsigned-LOCALTEST.apk`, SHA-256 `2668c1017c0b2b27dad026768055f8baca6c92ff726bb0bacbd5b7fc2e0ef418`. Source `4d0557e` (app code identical to later docs-only commits). `com.paisamart.app` versionCode 8 / 1.0.0, minSdk 24, targetSdk 36, ABIs arm64-v8a + x86_64. Production API. No cleartext. **Debug-signed** (SHA-1 `5e8f1606…f625`). | Built and installed. NOT uploadable. |
| Test-variant APK (screenshots) | SHA-256 `4ed126ce041958e1dcc1bc71b3a04553e6777f8ff792aee329d2047683170b94`. Same source. Differs only by `EXPO_PUBLIC_API_URL=http://127.0.0.1:3901` and cleartext allowed. | Local only |
| Build host | WSL Ubuntu-22.04, user-space JDK 17.0.21 + SDK/NDK 27.1.12297006, clean clone, `pnpm install --frozen-lockfile`, `expo prebuild --clean`. Script: `wsl-build.sh`. | Reproducible |
| versionCode 8 | 7 is the highest code evidenced | **PROVISIONAL**: check Play Console → App bundle explorer, all tracks |

## Signing — UNVERIFIED

- `release/Paisa-Mart-1.0.0-1-arm64-release.aab` (v1) is signed with the public Android Debug certificate, contrary to
  its README. `release/paisa-mart-upload.keystore` exists, but its certificate was not read (that needs the password, which wasn't used).
- Expo CLI is not logged in, so EAS credentials can't be seen.
- Before any submission artifact: compare Play Console → App integrity → Upload key certificate with the EAS credentials
  (`paisamart` owner) or the local keystore. Then build the AAB with that key. Don't create or replace keys.

## Rejection → fix

| # | Finding | Fix / evidence | Status |
|---|---|---|---|
| 1 | Metadata: title/short description "paisamart" | `STORE_LISTING_en-US.md`, rewritten for the verified partner/agent functionality | Done (copy). Pasting into Play Console is manual. |
| 2 | Launcher icon ≠ store icon | `app.json` icon + adaptive + monochrome, derived from `icon-512.png`. **On device:** `evidence/installed-launcher-icon-and-label.png` (test variant) plus the candidate check: orange P, label "Paisa Mart". | **VERIFIED on device** |
| 3 | Promo banners as screenshots | `screenshots/01–05` (genuine Android, synthetic data, 1080×2160) | Done. Replacing them in Play Console is manual. |
| 4 | Login credentials missing | `REVIEWER_ACCESS_DESIGN.md` + `APP_ACCESS_INSTRUCTIONS_en.md` (placeholders) | **DESIGN ONLY.** Needs backend work, tests and an authorized EC2 release. Not resolved. |

## Runtime verification (emulator Pixel 6 / Android 15 API 35; isolated local backend `595e521`, scratch SQLite)

| Check | Result | Evidence |
|---|---|---|
| Install (test and candidate) | Pass | `adb install` Success; dumpsys versionCode 8 |
| Launcher icon and label | Pass | evidence PNGs |
| OTP login (local dev OTP; test evidence only, not reviewer access) | Pass: `send-otp 200`, `verify-otp 200` | backend log |
| Onboarding: profile → MPIN → Home, KYC flag unchanged (disabled) | Pass | screenshots 01 |
| Product browsing | Pass | screenshot 02 |
| Application submission (Home Loan) | Pass: `POST /api/home-loans/leads 200`, confirmation `HL-c6098939-…` | screenshots 03, 04 |
| Status tracking | Pass: `GET /api/customer-applications 200`, stage "New leads" | screenshot 05 |
| Stage change reflected | Not re-run. Reused from the PR #7 browser check (same app code). | HANDOFF PR #7 section |
| Candidate launches against production URL | Pass (login screen only; no production login, no data written) | — |

Test-harness note: fast `adb input text` drops repeated digits in the per-digit OTP boxes, so enter one digit per box.

## Unresolved blockers

1. **A-07 fabricated money (confirmed on this Android build).** On a new account with Home ₹0.00, the Earnings tab shows ₹7,900 / ₹12,400 /
   ₹45,600 / ₹1,800. Notifications say "₹2,000 incentive approved", "₹5,000 transferred to your HDFC Bank account", "KYC Verified".
   Evidence: `evidence/A07-UNRESOLVED-*.png`. Not fixed, and must not be hidden only for reviewers. This is a high risk under Misleading Claims / Financial
   Services. It needs a real app fix (server data or empty states) before resubmission.
2. Reviewer access: design only.
3. Upload certificate: unverified.
4. versionCode 8: provisional.
5. Source of versionCode 7: unknown.
6. In-app logo (green/blue "p") differs from the orange "P" launcher/store icon. Google didn't flag this. It's a brand consistency item for the owner.
7. "Earn up to ₹2,000" commission figures on Products: the owner must confirm they're accurate.

## Manual Play Console actions (need owner access; all UNVERIFIED)
Update the default listing and check every translated/custom listing; replace the screenshots; confirm the version code history and upload certificate;
Financial features declaration; App access (only after the review account is live); privacy policy URL.
