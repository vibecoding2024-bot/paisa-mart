# Release readiness — Google Play remediation (22 Nov 2026)

- **Branch:** `fix/play-store-remediation-20261122`, local only (not pushed). Base `595e521`.
- **Verdict:** **not ready to release.** The code changes below are complete and tested locally. Security blocker A-42, Android signing and Play Console inputs remain.

## 1. Completed and tested

| Area | Change | Validation (commit) |
|---|---|---|
| Fabricated money (A-07) | <ul><li>Earnings and Home show only the signed-in user's server-approved payouts, or an empty/"Unavailable" state.</li><li>Removed: hard-coded balances, mock transactions, seeded "incentive/transferred/KYC verified" notifications, generated admin payouts; the wallet and bank screens are disabled; device-stored bank numbers are deleted by migration.</li><li>KYC shows "verified" only when verified.</li></ul> | Device run on a DNS-blocked emulator: fresh account ₹0.00; synthetic account ₹1,500.00; admin stage change shown in the app (`e61fa03`) |
| Claims | Unsupported earning and promotional claims, the RBI/IRDAI claim and the fictional wallet FAQs removed. **Commission figures unchanged** (owner decision). | Screens checked (`e61fa03`) |
| Welcome page | Factual copy. Discover/Grow promo rows removed; form and links unchanged. | `tsc` 0 errors; web export at 1440/390/360 px, `evidence/WELCOME-*.png` (`48226fb`) |
| Android icons | Launcher, adaptive and monochrome icons generated from the approved store icon | Candidate build: icon in the drawer, launches to sign-in (`e61fa03`) |
| A-01 profile privacy | <ul><li>Profile read/write needs the customer token and is owner-only.</li><li>KYC status: staff only. Profile list: admin only.</li><li>KYC start and status: owner only.</li><li>Callbacks never verify KYC.</li></ul> | `users-auth.test.ts`; live local API returns 401 unauthenticated |
| A-02 / A-06 OTP | `reqId` is bound to its phone and single-use; access-token login only for the provider-verified phone; dev OTP only with `ALLOW_DEV_OTP=true`; CSPRNG codes | `review-account.test.ts` |
| A-03 callbacks | Untrusted callbacks no longer create or change payment records; bodies not logged; KYC callback routes reachable. **Authenticated payment reconciliation is not implemented.** | `gateway-callback.test.ts` drives the real app and fails on the old code |
| Reviewer access | <ul><li>One env-configured phone with an HMAC code, an expiry and a lockout.</li><li>No SMS and masked logs; tokens capped to the window and revocable.</li><li>Records labelled TEST.</li><li>Payout, KYC and payment actions refused.</li><li>Only its own records are visible.</li></ul> | Tests plus device run (`e61fa03`) |
| Test isolation | <ul><li>All clients use `lib/api-base.ts`; a test build refuses production.</li><li>The test network guard blocks outside hosts.</li><li>Regression check for production fallbacks.</li></ul> | `check-api-isolation.mjs` passes at HEAD |
| Incident | 4 synthetic test profiles written to production were deleted with the reviewed targeted cleanup (9 → 5 profiles; backups preserved) | Owner-confirmed result in the incident file |

**Totals:**
- `bun test`: **106 pass / 0 fail across 22 files** (`e1e362d`). Backend code is unchanged since.
- Mobile `tsc`: 0 errors.
- The backend `tsc` crash (stack overflow) is pre-existing (A-38).

## 2. Remaining security and compatibility blockers

**Security (fix before the web/backend release):**
1. **A-42 (Critical, open):** script injection on the app origin through the public `/api/payment/checkout` page.
   - The page writes `ref` and status fields with `innerHTML`, and the status API echoes unknown refs back.
   - A-03 closed the stored variant; the **reflected variant still works**. It could steal the customer and staff tokens held in localStorage.
2. **A-04 (High):** the payment API is public and wired to UAT. `/api/payment/create`, `/auth` and `/config` are open. Payment reconciliation is not implemented, so no payment may be shown or treated as successful.
3. **A-05 (High, owner action):** secrets and signing material are committed to Git (`backend/paisa-mart-mvp.zip` with provider keys, a tracked `payments.db`, the debug keystore). The keys must be rotated and the files removed from the repo.
4. **A-09 / A-52 (High):** customer session enforcement, logout and MPIN brute-force limits; there is no server-side session revocation.

**Compatibility:**
5. **Old clients after the backend enforces A-01:**
   - Old Android installs (including the APK served at `/download-apk`) and old web tabs get 401 on profile calls.
   - Signed-in users fall back to their local profile.
   - **New users cannot finish onboarding until they update.**
6. **A-49 / signing:** the upload certificate is unverified; versionCode 8 is provisional; the final signed build is not yet made.

**Owner decisions:**
7. Commission figures and rate card, lender list, privacy-policy URL, A-08 lead ownership, "Pan India Reach" copy.

## 3. Rollout order and rollback (each step separately authorized; currently paused)

**Before the rollout:**
1. Fix A-42 and review it.
2. Owner approval, then push, PR, CI review, merge.
3. Build a **signed** AAB and APK of the merge commit, with the upload key verified (step 4 in section 4).

**Rollout (the order matters because of A-01):**

1. **Web.**
   - Package the merge commit with `deployment/requirements/prepare_release.py` into a uniquely named release, and include the new signed APK as `paisa-mart.apk` for `/download-apk`.
   - On EC2: `verify.py`, then the guarded frontend deploy. First confirm the deploy and rollback tools are actually installed (as of the October handoff, `deploy.py` and `rollback.py` were not).
   - Check sign-in, profile load and profile save in the real UI.
   - This works on the current backend, which ignores the token header.
   - **Rollback:** the guarded frontend rollback to the previous release in `.frontend-backups`. Never use `FINAL-GOOD-20261006` unless it is explicitly requested for emergency recovery.
2. **Backend.**
   - `backend-update.py verify`, then `update --execute`. This takes a verified backup and rehearses migrations; no schema migration is needed.
   - Confirm the MSG91 variable names first. **Never set `ALLOW_DEV_OTP`.**
   - Check: profile 401 without a token, normal sign-in, profile save, a callback acknowledgement, admin pages. Watch `/api/users` 401 counts.
   - **Rollback:** `backend-update.py rollback --execute`. It restores code and keeps data; the new web client still works.
3. **Review account.**
   - Use an owner-selected phone that is **not an incident number**.
   - Set the `REVIEW_ACCOUNT_*` values in `.env` in an authorized restart window (see `REVIEWER_ACCESS_DESIGN.md`), and test sign-in.
   - **Rollback:** `REVIEW_ACCOUNT_ENABLED=false`, which revokes review tokens.
4. **Android.**
   - Upload the signed AAB (versionCode above every uploaded version). Use internal testing first, then production with App access instructions, with a staged rollout.
   - **Rollback:** halt the staged rollout. Ship any fix as a higher versionCode.

## 4. What the owner must provide from Play Console

1. **App integrity:**
   - whether Play App Signing is enabled;
   - the **upload certificate SHA-256 fingerprint**, so the local upload key can be verified.
   - Keep keystore passwords private; they are entered only at signing time.
2. **Version history:** the highest versionCode uploaded on any track. This sets the new versionCode (currently a provisional 8).
3. **Live installs:** whether any version is live on a track, and its install counts. This sizes the old-install impact of A-01.
4. **App access:**
   - choose the reviewer phone (owner-controlled; not an incident number);
   - after the backend is configured, paste the instructions from `APP_ACCESS_INSTRUCTIONS_en.md`. The code is shared only in Play Console.
5. **Financial features declaration:** the partner lender/insurer list and the licence details.
6. **Privacy policy URL**, plus confirmation of the **Data safety** answers (phone, name, email, date of birth, income band, pincode, optional PAN).
7. **Store listing approval:** the descriptions in `STORE_LISTING_en-US.md` and the screenshots in `screenshots/`.
