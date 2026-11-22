# Google Play remediation: honest financial UI, private profiles (A-01), OTP binding, callback hardening, guarded review account, test isolation, icons

> **Status: do not merge or deploy yet.** This PR is complete and tested locally, including the A-42 checkout-page fix, but release is still blocked. Blockers, rollout order, rollback and the Play Console inputs are in [`READINESS_REPORT.md`](READINESS_REPORT.md).
> - Open: A-04, A-05 (key rotation), A-09/A-52.
> - Android signing must be verified.
>
> A production incident (four synthetic test profiles written by local test builds) is **resolved**: those profiles were deleted with a reviewed, targeted cleanup, and backups are preserved. See [`INCIDENT_2026-11-22_test-profiles-in-production.md`](INCIDENT_2026-11-22_test-profiles-in-production.md).

Branch `fix/play-store-remediation-20261122` → `main` (base `595e521`). Merging releases nothing: web, backend and Android each need their own authorized release.

## Why
Google Play rejected versionCode 7 (21 Nov 2026) for four reasons:
- non-descriptive metadata;
- a launcher icon that didn't match the store icon;
- promotional banners used as screenshots;
- missing reviewer access.

The audit also found fabricated money shown to customers (A-07) and critical API flaws (A-01 to A-03).

## What changes
**App (all users)**
- **Icons:** launcher, adaptive and monochrome icons generated from the approved store icon. `versionCode` 8 is provisional.
- **Money:**
  - Earnings and Home show only the signed-in user's server-approved payouts, or an empty/"Unavailable" state.
  - Fabricated balances, transactions and notifications are removed.
  - The wallet and bank-details screens are disabled, and device-stored bank numbers are deleted by migration.
  - KYC shows "verified" only when it is verified.
- **Claims:** unsupported earning claims, the RBI/IRDAI compliance claim and the fictional wallet FAQs are removed. **Commission figures are not changed** (owner decision).
- **Welcome page:**
  - Left: "Explore products. Track your applications.", plus a "Find what you need" card.
  - Right: "Sign in to apply and track your applications."
  - The Discover/Grow promo rows are removed; the sign-in form and links are unchanged.
- **Profile and KYC clients** send the customer token. The phone field is locked to the verified number.
- **Every client** resolves its backend through `lib/api-base.ts`. Test builds refuse to start if they would use production.

**Backend**
- **A-01:**
  - Profile read and write require the customer token, owner only.
  - Setting KYC status is staff only; listing profiles is admin only.
  - KYC start and status are owner only. Callbacks never verify KYC.
- **A-02:**
  - The OTP `reqId` is bound to its phone and is single-use.
  - Access-token login only for the provider-verified phone.
- **A-06:** the dev OTP requires `ALLOW_DEV_OTP=true`. Without a provider, send fails closed. Codes come from a CSPRNG.
- **A-03:**
  - Untrusted gateway callbacks no longer create or change payment records, and their bodies are not logged.
  - The KYC callback routes are reachable again.
  - **Authenticated payment reconciliation is not implemented.** Nothing marks a payment successful, and end-to-end payment processing is not claimed as fixed.
- **A-42 (checkout page script injection):**
  - Every value the page shows (URL parameters, the stored last reference, status/create/state responses) is rendered as text; there is no HTML insertion.
  - The gateway link is used only if it is `https`, and the server allowlists its host (`vimopay.in`, the `VIMOPAY_BASE_URL` host, `VIMOPAY_PAYMENT_URL_HOSTS`).
  - A strict CSP pins the page's own script and style by SHA-256.
  - `/status` no longer echoes unknown references, and `/create` rejects non-identifier `merchantRefId` values.
- **Play review account:**
  - One env-configured phone with an HMAC'd code, an expiry and a lockout. No SMS, and logs show only a masked phone.
  - Tokens are capped to the window and revocable. Its records are labelled TEST.
  - Payout, KYC and payment actions are refused. It sees only its own records.

**Tests and tooling**
- A test network guard blocks outside hosts.
- `scripts/check-api-isolation.mjs` is the regression check for production fallbacks.
- New tests: `users-auth`, `gateway-callback`, `checkout-page` (unit and real-browser), `api-isolation`, plus `review-account` additions. `payout-guard` is fixed.

**Docs:** store listing, App access instructions, reviewer-access design, screenshots, evidence, the incident report and the readiness report.

## Unchanged on purpose
- Partner/client ownership (A-08).
- Commission rates.
- Payout maker-checker logic.
- Customer application isolation.

## Tests
- `bun test`, each file run separately: **117 pass / 0 fail / 0 skipped across 24 files** (`ede1a10`).
  - This includes the A-42 browser test: headless Chrome over DevTools, synthetic database, loopback only.
  - On the previous code its payloads executed and redirected to `evil.example`. With the fix they render as text, no token is sent, and legitimate checkout still renders.
- `node scripts/check-api-isolation.mjs` passes at HEAD.
- Mobile `tsc`: 0 errors.
- Android WSL release builds of `e61fa03`:
  - The test variant, on an emulator with production DNS blocked, ran:
    - fresh account and synthetic account (₹1,500.00);
    - review account sees only its own records;
    - an admin stage change shows in the app.
  - The candidate shows the new icon and launches to sign-in.
- Since then the only app change is welcome wording (`48226fb`), checked in a web export at 1440, 390 and 360 px.
- The backend `tsc` crashes with a stack overflow; this is pre-existing (A-38). None of the reported errors is in changed code.

## Release
Rollout order (web → backend → review account → Android), rollback and Play Console inputs: see [`READINESS_REPORT.md`](READINESS_REPORT.md).

**Compatibility:** after the backend enforces A-01, old Android installs and old web tabs get 401 on profile calls. New users on them cannot finish onboarding until they update.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
