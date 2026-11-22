# Google Play rejection (version code 7, 21 Nov 2026) — remediation checklist

Final tested runtime code: backend `2616f1c`, mobile `28651cc`. Final APKs: candidate `1fac0b9d…c761` and test variant `97d9d5e3…6431`, both debug-signed and for local testing only. Rows below that cite earlier commits are historical evidence.

Branch `fix/play-store-remediation-20261122` (base `origin/main` `595e521`). Local commits only: nothing pushed,
uploaded, submitted, merged or deployed. No AWS or production access.

## Build identity

| Item | Value | Status |
|---|---|---|
| Rejected artifact | versionCode 7, `com.paisamart.app` | From Google email |
| Source of versionCode 7 | Unknown. Git's highest recorded versionCode is 5 (`9594380`). Builds use EAS (owner `paisamart`). Not reproduced. | **UNKNOWN** |
| Web release `20261121-595e5212-on-pr6-dashboard` | A separate artifact, not evidence of the Android contents | Distinct |
| Candidate APK (local test only) | `paisamart-vc8-CANDIDATE-prodapi-fcebb6b-debugsigned-LOCALTEST.apk`, SHA-256 `47a9e6d165cf231cf681d7a31bbd3e62dd6b644c2993645342464a177db17b2d`. Source `fcebb6b`. versionCode 8 / 1.0.0, minSdk 24, targetSdk 36. Production API, no cleartext, **debug-signed**. Installed; launches to the login screen (no production login). | NOT uploadable |
| Test-variant APK (screenshots 01, 06) | `…TESTVARIANT-localapi-fcebb6b…`, SHA-256 `28a53fbf0cce7c4611a6d919e0e22d79c4ae8425b8efa6a28ea9afabd75f6869`. Differs from the candidate only by `EXPO_PUBLIC_API_URL=http://127.0.0.1:3901` and cleartext. | Local only |
| Earlier test builds (evidence) | `d7c8a33` (`b9d1bd22…8cfa`): A-07, admin-stage and review-account device tests. `6d3a072` (`1cc7e31a…c051`). Later commits change only: the per-item amount format, the notifications empty-state copy, and the Home total kept on one line (it wrapped at ₹1,500.00). Device checks were re-run on `fcebb6b` for Home and Earnings. | Local only |
| Build host | WSL Ubuntu-22.04, user-space JDK 17 + SDK/NDK 27.1.12297006, clean clone, `pnpm install --frozen-lockfile`, `expo prebuild --clean`. Script: `wsl-build.sh`. | Reproducible |
| versionCode 8 | 7 is the highest code evidenced | **PROVISIONAL** |

## Signing — UNVERIFIED

- `release/paisa-mart-upload.keystore` exists; its certificate was not read (that needs the password, which wasn't used). Expo CLI is not logged in.
- Before any submission artifact, compare Play Console → App integrity → Upload key certificate with the EAS credentials or the local keystore,
  then build the AAB with that key. Don't create or replace keys.

## Rejection → fix

| # | Finding | Fix / evidence | Status |
|---|---|---|---|
| 1 | Metadata: title/short description "paisamart" | `STORE_LISTING_en-US.md`, rewritten after the audience review (customers and partners) | Done (copy). Pasting into Play Console is manual. |
| 2 | Launcher icon ≠ store icon | `app.json` icon, adaptive and monochrome icons from `icon-512.png` | **VERIFIED on device** |
| 3 | Promo banners as screenshots | `screenshots/01–06` (genuine Android, synthetic data, 1080×2160) | Done. Replacing them in Play Console is manual. |
| 4 | Login credentials missing | Review account **implemented and tested locally** (`REVIEWER_ACCESS_DESIGN.md`) + `APP_ACCESS_INSTRUCTIONS_en.md` | **NOT in production.** Needs the authorized release steps listed in that file. |

## A-07 fabricated financial information — FIXED IN CODE (all users), verified locally

| Before (595e521/4d0557e) | Now |
|---|---|
| Earnings: hard-coded ₹7,900 balance, ₹12,400 / ₹45,600 / ₹1,800, 5 fake transactions, withdraw flow | Server data only (`/api/customer-payouts`: own amounts approved by executive AND manager). States: total, list, "No approved payouts yet", or "Unavailable" plus the error. No balance, no withdrawal. Says an approved amount is not a payment. |
| Home: hard-coded "Your total earnings ₹0.00" | "Approved eligible payouts", same server total; "Unavailable" on error |
| Notifications seeded: "₹2,000 incentive approved", "₹5,000 transferred to HDFC", "KYC Verified" | No seeded notifications; neutral empty state |
| Cash on Credit Card wallet: local "₹X added", "sent to HDFC Bank", statement | Replaced by a "not available" screen; no balance or simulated transaction |
| Bank details stored only on the device, unencrypted, with "encrypted and secure" copy | Not collected; "not available" screen. Persisted local bank numbers and generated payouts are removed by the store migration (v1). |
| Admin Incentives/Payouts pages: random generated incentives and payouts | Empty; real payouts remain the server dual-approval flow |
| Profile shows "Verified" colouring when KYC is merely switched off | Verified only when the status is `verified`; otherwise "KYC not required yet" |
| "Invite friends, earn ₹500", "Earn up to ₹1 Lakh" (no referral or earnings backend) | Neutral invite copy |

Still in the app, for the **owner to confirm or remove** (configured business rates, not user balances): Products "Potential commission — Earn up to ₹2,000"; Profile → Payout Structure rate card.

## Runtime verification (emulator Pixel 6 / Android 15; isolated local backend from this branch, scratch SQLite, synthetic data)

| Check | Result |
|---|---|
| Upgrade install over the earlier build, then app-data clear for fresh state | Pass |
| Fresh account 9000000003: OTP (local dev OTP, `ALLOW_DEV_OTP=true` locally only) → profile → MPIN → Home | Pass; Home and Earnings show ₹0.00 and "No approved payouts yet"; notifications empty; Bank details and Cash on Credit Card show "not available" |
| Synthetic account 9000000002 with saved records (BL Disbursed with ₹1,500.00 entered by admin, approved by executive then manager; HL New) | Home and Earnings ₹1,500.00 with the BL reference; My applications lists both with their stages |
| Admin stage change reflected in Android | Pass: HL "New leads" → admin `documents_pending` → app "Documents pending" after Refresh |
| Review account 9000000099 (locally generated code) | send-otp gives no SMS and no dev OTP; verify gives 200; log shows a masked phone. Only its 2 synthetic records are visible (both labelled TEST in admin). Payouts ₹0.00 although its BL is Disbursed: payout save and approval return 403. |
| Review code with other phones (live) | 401 / 401 |
| Payout approvals and ownership | Existing dual-approval and isolation tests pass (`admin-payouts`, `customer-applications`, `admin-operations`) |
| Backend tests | 62 pass / 0 fail (11 files run separately); backend typecheck has no errors in changed files; mobile `tsc --noEmit` 0 errors |

Test-harness note: enter OTP digits one per box; wait for the OTP screen before typing.

## Backend exit 255 (previous session) — intentional, not a failure

Both "Start isolated local backend on 3901 … exit code 255" events came 4 s and 9 s after this agent's
own `Stop-Process -Force` on port 3901 (04:57:40Z → 04:57:44Z; 05:47:54Z → 05:48:03Z). The log ends with normal
`GET /api/customer-applications 200` lines and contains no error, exception or panic. 255 is the forced-termination code.

## Unresolved blockers

1. Reviewer access is not in production: it needs PR review, merge, a guarded backend release, `.env` values, synthetic seeding and Play Console entry, each separately authorized.
2. Upload certificate: unverified.
3. versionCode 8: provisional. Source of versionCode 7: unknown.
4. Ownership model (A-08): partners cannot track leads they file for clients. The listing doesn't claim it. Owner decision needed.
5. Commission and rate-card figures (Products, Payout Structure): owner must confirm.
6. A-02 is closed in code (`2616f1c`): `verify-otp-token` is bound to the MSG91-verified phone, with no fallback. It is not deployed.
8. A-01 (Critical, pre-existing): `/api/users/*` is unauthenticated; separate PR (app sends the token first, then the backend enforces).
9. INCIDENT: earlier test builds wrote 4 synthetic profiles to production (see HANDOFF). Fixed in `28651cc`; cleanup needs the owner's decision.
7. In-app logo (green/blue "p") differs from the orange "P" launcher icon: a brand consistency item.

## Manual Play Console actions (need owner access; all UNVERIFIED)
- Update the default listing and check every translated or custom listing.
- Replace the screenshots.
- Confirm the version code history and the upload certificate.
- Complete the Financial features declaration.
- Fill in App access, only after the review account is live.
- Set the privacy policy URL.
