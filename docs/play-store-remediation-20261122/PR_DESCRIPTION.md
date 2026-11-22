# Google Play remediation: honest financial UI, private profiles (A-01), guarded review account, OTP binding, test isolation, launcher icon

> **Status: submission and production rollout are paused.** Local test builds wrote four synthetic profiles to production (an incident).
> - The owner's read-only EC2 checks classify them as strongly supported incident-created records. Phone-number ownership is unknown.
> - A review-only targeted cleanup is prepared; nothing has been deleted.
> - See `docs/play-store-remediation-20261122/INCIDENT_2026-11-22_test-profiles-in-production.md`.

Branch `fix/play-store-remediation-20261122` → `main` (base `595e521`). **Do not merge or deploy without explicit owner approval.**
Merging does not release anything: the backend and the Android build each need their own authorized release.

## Why

Google Play rejected versionCode 7 (21 Nov 2026) for four reasons:
- non-descriptive metadata;
- a launcher icon that didn't match the store icon;
- promotional banners used as screenshots;
- missing reviewer login credentials.

Audit A-07 also found fabricated money and status shown to customers. A misleading-claims problem like that would also block approval.

## What changes

**Android app (all users, not reviewer-specific)**
- Launcher icon, adaptive and monochrome icons generated from the approved store icon (`mobile/app.json`, `mobile/assets/branding/`). `versionCode` is 8, provisional.
- Earnings and Home show only `/api/customer-payouts` amounts: the signed-in user's own amounts, approved by an executive and a manager.
  - With no approved amounts, the screens show an empty state; when the server can't be reached, they show "Unavailable".
  - The copy says an approved amount is not a payment confirmation.
- Removed:
  - the hard-coded ₹7,900 / ₹12,400 / ₹45,600 / ₹1,800 figures and mock transactions;
  - the seeded "₹2,000 incentive", "₹5,000 transferred" and "KYC Verified" notifications;
  - the generated admin incentives and payouts.
- The wallet (Cash on Credit Card) and bank details screens now show "not available". The app no longer collects bank numbers, and a store migration deletes device-only, unencrypted bank numbers and generated payouts.
- KYC shows "verified" only for a verified status.
- Unsupported promotional earning claims removed:
  - "earn ₹500";
  - "Earn up to ₹1 Lakh";
  - "earning journey";
  - "Explore & earn";
  - About Us "earn through product distribution" and "Instant Payouts";
  - Support FAQs describing wallet top-ups, withdrawals and refunds that don't exist.
- Welcome page: factual copy.
  - Left: "Explore products. Track your applications.", plus a "Find what you need" card (Bank accounts · Credit cards · Loans · Insurance).
  - Right: "Sign in to apply and track your applications."
  - The repeated discovery line and the Discover/Grow promotional rows are removed.
  - The sign-in form and links are unchanged.
- **Not changed:** commission figures and the rate card (Products "Earn up to ₹…", Payout Structure). Owner decision; see below.
- Profile and KYC clients now honour `EXPO_PUBLIC_API_URL` like the other modules. Production builds set none of these variables, so they behave the same.

**Backend**
- Play review account (`lib/review-account.ts`):
  - One env-configured phone, an HMAC'd 6-digit code, an expiry and a 10-failure lockout.
  - Normal rate limits apply. No SMS is sent, and logs show only a masked phone.
  - Review tokens carry `review:true` and never outlive the window; they are revoked when it's disabled or expires.
  - Records from the review phone are labelled "TEST – Play review" in admin.
  - Payout entry and approval, the customer payout list, KYC start and payment create are refused for that phone.
- **A-02 (OTP not bound to phone):**
  - The widget `reqId` is bound to the phone it was sent to and is single-use.
  - `verify-otp-token` requires the phone and issues a token only for the number MSG91 verified. There is no client-phone fallback, and raw provider data is not returned.
- **A-06:** the dev OTP requires `ALLOW_DEV_OTP=true`. Without a provider, `send-otp` fails closed (503). OTPs come from a CSPRNG.

**Private profile data (A-01, release blocker)**
- `/api/users/profile` GET/POST require the customer token, and the token phone must match. Other phones get 403. A client-sent `kycStatus` is ignored.
- `PATCH /api/users/profile/:phone/kyc` is admin/ops only. `GET /api/users/profiles` is admin only, with a bounded limit.
- KYC start and status require the owning customer.
- KYC callbacks never mark verified/rejected; only VimoPay's authenticated status API can. With A-03 fixed (below), the KYC callback routes are actually reached.
- **A-03: untrusted callbacks no longer change payment records.**
  - The unauthenticated `*callback*` catch-all that created or rewrote transactions (status, amount, ID, payload) from any request is removed.
  - Gateway callbacks are acknowledged only, and their bodies (which can carry a name or phone number) are not logged.
  - A side-effect-free fallback acknowledgement for other callback paths runs after the routers.
- **Authenticated payment reconciliation is still incomplete.** This PR does **not** fix or verify end-to-end payment processing.
  - A transaction stays at the status recorded when it was created (normally Pending). Nothing marks a payment successful, from a callback or from a browser redirect.
  - Reconciliation needs VimoPay's server-to-server status API or a verifiable callback signature. The integration uses VimoPay UAT endpoints.
- The app sends the customer token on profile and KYC calls, and the phone field is locked to the verified number.

**Test isolation**
- Every app client resolves its backend through `mobile/src/lib/api-base.ts`. A build with `EXPO_PUBLIC_TEST_ENV=1` refuses to start if it would use production.
- A `bun test` preload blocks non-loopback network access unless `ALLOW_TEST_NETWORK=1`.
- `scripts/check-api-isolation.mjs` (plus `api-isolation.test.ts`) fails on production fallbacks, absolute fetch URLs and WebView URLs. The build script verifies the APK bundle.
- About Us: the unsupported "Fully compliant with RBI and IRDAI guidelines" claim is removed.

**Docs:** `docs/play-store-remediation-20261122/`:
- store listing (audience: customers and partners);
- App access template;
- reviewer access design, including production steps;
- checklist;
- genuine screenshots;
- before/after evidence.

## Unchanged on purpose

- Partner/client ownership rules (A-08). Tracking and payouts stay tied to the applicant's mobile number.
- Commission rates.
- The payout maker-checker logic.
- Customer application isolation.

## Tests

- `bun test`, every file run separately: **106 pass / 0 fail across 22 files** (13 backend, 9 repo-root), at `e1e362d`.
  - This includes `gateway-callback.test.ts` (A-03), which drives the real app and fails on the previous code.
  - The Android builds below are of `e61fa03`. A-03 is backend-only, so no app rebuild is needed for it.
  - New tests: `users-auth.test.ts`, `api-isolation.test.ts`, plus `review-account.test.ts` additions.
  - `payout-guard.test.ts` was fixed: it had been failing since `d7c8a33` because it relied on the removed mock data.
- No type errors in changed backend files; mobile `tsc --noEmit` reports 0 errors.
- Welcome copy (`48226fb`, wording only) was checked in a local web export at 1440, 390 and 360 px (`evidence/WELCOME-*.png`). No Android rebuild was made for wording alone.
- `node scripts/check-api-isolation.mjs` passes.
- Android, on WSL release builds of `e61fa03`:
  - Test variant: emulator with production DNS blocked, against a local backend. Authenticated profile GET 404 → POST 200 → GET 200; synthetic account ₹1,500.00 with both applications; review account sees only its own records; an admin stage change showed in the app.
  - Candidate: launches to the login screen.
- Live local API: unauthenticated profile read, write, list and KYC-PATCH all return 401.

## Deployment requirements (PAUSED; each step separately authorized)

Order matters. A-01 changes the API contract: the new backend returns 401 to any profile call without the customer token. Ship the **web release first, then the backend**, with the new Android build ready by the backend step. See HANDOFF "Release dependency".
1. **Web:** build and deploy a new web release from merged main via the guarded frontend workflow. It sends the token and works with the current backend. Browser tabs still on the old bundle behave like old clients until they reload.
2. **Backend:** `backend-update.py verify`, then `update --execute`.
   - Confirm the MSG91 variable names first.
   - Never set `ALLOW_DEV_OTP`.
   - No schema migration.
3. **Review account:** only after the incident is resolved and an owner-selected phone (not an incident number) is chosen. Add the `REVIEW_ACCOUNT_*` values to `.env` in an authorized restart window. Steps: `REVIEWER_ACCESS_DESIGN.md`.
4. **Android:**
   - verify the upload certificate;
   - confirm the versionCode;
   - build a signed AAB.

   **Impact on older installs** (the current app, including any APK served at `/download-apk`) once the backend enforces A-01:
   - Signed-in users with a saved profile: the profile GET returns 401, and the old app falls back to its local copy, so they can continue without syncing.
   - New sign-ins, or users still completing their profile: the profile save returns 401, and they **cannot finish onboarding** until they update.
   - Mitigation: release the new build by the backend step, replace the `/download-apk` APK, and monitor `/api/users` 401s.
5. **Play Console:** listing, screenshots, App access, Financial features declaration, privacy URL.

## Open findings and owner decisions

- **Incident:** the four profiles are classified incident-created (owner's EC2 summary).
  - The targeted cleanup (`incident_cleanup.py`) is review-only. Its read-only `plan` comes first; `apply` needs the owner's approval of the reviewed fingerprints.
  - Preserve backup `LIVE-BEFORE-REMEDIATION-20261122T145011Z`.
- **Payments:** authenticated reconciliation (VimoPay status API or a verifiable signature) is still to be built (A-03 follow-up).
- **Unresolved:**
  - commission and rate-card figures;
  - lender list;
  - privacy-policy URL;
  - A-08 ownership model (unchanged).
- **Signing and versioning:** upload certificate, versionCode history.
- **Reviewer phone:** not selected yet.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
