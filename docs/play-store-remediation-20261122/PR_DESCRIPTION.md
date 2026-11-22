# [DRAFT] Google Play remediation: honest UI, private profiles, OTP binding, callback and checkout hardening, review account, secret cleanup, icons

> **Draft — not ready to release. Do not merge or deploy.** Release blockers remain:
> - **exposed keys not yet rotated** (A-05);
> - public payment API with no reconciliation (A-04; payments paused);
> - session hardening (A-09/A-52);
> - Android signing and identity (A-49);
> - owner decisions and Play Console inputs.
>
> Full detail: [`READINESS_REPORT.md`](READINESS_REPORT.md).
>
> The production incident (four synthetic test profiles written by local test builds) is resolved: a reviewed targeted cleanup was run by the owner, and the backups are preserved. See [`INCIDENT_2026-11-22_test-profiles-in-production.md`](INCIDENT_2026-11-22_test-profiles-in-production.md).

- **Branch:** `fix/play-store-remediation-20261122` → `main` (base `595e521`), HEAD `db05364`, local only.
- Merging releases nothing: web, backend and Android each need their own authorized release.

## Why
Google Play rejected versionCode 7 (21 Nov 2026) for four reasons:
- non-descriptive metadata;
- a launcher icon that didn't match the store icon;
- promotional banners used as screenshots;
- missing reviewer access.

The audit also found fabricated money shown to customers (A-07) and critical API flaws (A-01, A-02, A-03, A-42, A-05).

## Scope (exactly what changes)

| Area | Change |
|---|---|
| **Android icon and listing** | Launcher, adaptive and monochrome icons generated from the approved store icon (`mobile/app.json`, `mobile/assets/branding/`, `scripts/generate-android-launcher-icons.py`). `versionCode` 8 (provisional). Store listing text, App access instructions and genuine screenshots in `docs/play-store-remediation-20261122/`. |
| **Welcome page** | Factual copy ("Explore products. Track your applications."; "Find what you need"; "Sign in to apply and track your applications."). Promotional rows removed. **Phone input, +91, validation, button, OTP flow and links are unchanged.** |
| **Fabricated money (A-07)** | Earnings and Home show only server-approved payouts for the signed-in user, or an empty/"Unavailable" state. Removed: fabricated balances, transactions, notifications and generated admin payouts. Wallet and bank screens disabled; device-stored bank numbers deleted by migration. KYC shows "verified" only when verified. Unsupported earning claims, the RBI/IRDAI claim and fictional FAQs removed. **Commission figures unchanged** (owner decision). |
| **Profiles (A-01)** | Profile read and write need the customer token, owner only. KYC status is staff only; the profile list is admin only. KYC start and status are owner only; callbacks never verify KYC. The app sends the token, and the phone field is locked to the verified number. |
| **OTP (A-02, A-06)** | `reqId` bound to its phone and single-use; access-token login only for the provider-verified phone; dev OTP only with `ALLOW_DEV_OTP=true`; fails closed without a provider; CSPRNG codes. |
| **Review account** | One env-configured phone with an HMAC'd code, an expiry and a lockout. No SMS; masked logs. Tokens capped to the window and revocable. Records labelled TEST. Payout, KYC and payment actions refused; only its own records visible. Disabled unless configured. |
| **A-03 callbacks** | Untrusted gateway callbacks never create or change payment records, and bodies are not logged. The KYC callback routes are reachable. **Reconciliation not implemented.** |
| **A-42 checkout** | All values rendered as text. The payment link must be `https` on an allowlisted host. Strict hash-pinned CSP. `/status` no longer echoes unknown refs. `merchantRefId` validated. |
| **Secrets (A-05, local)** | `backend/paisa-mart-mvp.zip` and `backend/payments.db` removed from the branch (preserved outside Git); public `/download` route removed; README demo credentials redacted. Ignore rules, `.env.example` files, `scripts/secret-scan.py`. **History not rewritten; keys must be rotated.** |
| **Test isolation** | Every app client resolves its backend through `mobile/src/lib/api-base.ts`, and a test build refuses production. The `bun test` network guard blocks outside hosts. `scripts/check-api-isolation.mjs` regression check. |

**Unchanged on purpose:**
- partner/client ownership (A-08);
- commission rates;
- payout maker-checker logic;
- customer application isolation;
- payment configuration (VimoPay work paused);
- the standard debug keystore and signing setup.

## Test evidence
- **Backend and scripts** (`e9ffd09`; no runtime change since): `bun test`, each file run separately, **120 pass / 0 fail / 0 skipped across 25 files**.
  - New tests: `users-auth`, `review-account`, `gateway-callback`, `checkout-page`, `checkout-page.browser`, `api-isolation`, `no-secret-files`.
  - The browser test uses headless Chrome over DevTools, a synthetic database and loopback only. On the previous code its payloads executed and redirected to `evil.example`. With the fix they render as text, no token is sent, and legitimate checkout still renders.
- **Other checks:**
  - `node scripts/check-api-isolation.mjs` passes.
  - `python scripts/secret-scan.py` finds 0 items needing action. It still detects all keys in the preserved archive.
  - Mobile `tsc`: 0 errors.
  - Backend `tsc` crashes with a stack overflow, which is pre-existing (A-38). With a larger stack it reports 119 pre-existing errors, none in changed code.
- **Android (WSL release builds of `e61fa03`):**
  - The test variant, on an emulator with production DNS blocked, ran:
    - fresh account and synthetic account (₹1,500.00);
    - review account sees only its own records;
    - an admin stage change shows in the app.
  - The candidate shows the new icon and launches to sign-in.
  - Later app changes are wording only: the welcome page, checked in a local web export at 1440, 390 and 360 px.
- **Final diff review** (107 files): no debug leftovers, no focused or skipped tests beyond the no-Chrome guard, no unmasked personal data in logs, no hard-coded hosts in runtime code.

## Remaining blockers (release stays blocked)
1. **A-05: exposed credentials not rotated.**
   - 5 AI provider keys (unused by the code) and 3 VimoPay keys remain valid and remain in the GitHub history.
   - Steps: `docs/security/KEY_ROTATION_2026-11-22.md`.
2. **A-04:** the payment API is public, on UAT, with no authenticated reconciliation. Payments stay paused and must not be enabled.
3. **A-09 / A-52:** session enforcement, MPIN brute-force limits, server-side revocation.
4. **A-49:**
   - upload certificate unverified;
   - versionCode provisional;
   - no signed build of the final commit;
   - the stale root `android/` project (`com.paisamartroot`, debug-signed) must not be used for release.
5. **Compatibility:** once the backend enforces A-01, old Android installs and old web tabs cannot complete onboarding until they update.
6. **Owner decisions:**
   - commission copy and rate card (misleading-claims risk);
   - lender list;
   - privacy-policy URL;
   - A-08;
   - "Pan India Reach" copy.
7. **Play Console inputs:** see the readiness report, section 4.

## Rollout plan (each step separately authorized; currently paused)
**Prerequisites:**
- blockers 1, 3 and 6 resolved;
- owner approval, then push, PR review and merge;
- a signed AAB and APK of the merge commit, built from `mobile/` with the verified upload key.

| Step | Action | Verify | Rollback |
|---|---|---|---|
| 1. Web | Package the merge commit into a uniquely named release (`deployment/requirements/prepare_release.py`), including the new APK for `/download-apk`. Run `verify.py`, then the guarded frontend deploy (confirm the deploy and rollback tools are installed first). | Sign-in, profile load and save in the real UI. This works on the current backend. | Guarded frontend rollback to the previous release (never `FINAL-GOOD-20261006` unless explicitly requested). |
| 2. Backend | `backend-update.py verify`, then `update --execute` (verified backup, migration rehearsal; no schema change). Check the MSG91 names. Never set `ALLOW_DEV_OTP`. | Profile returns 401 without a token; normal sign-in; profile save; callback acknowledgement; checkout CSP header present; admin pages; `/api/users` 401 counts. Do not create payments. | `backend-update.py rollback --execute` (code only, data kept). |
| 3. Review account | Owner-selected phone (not an incident number); set `REVIEW_ACCOUNT_*` in an authorized restart window. | Review sign-in; restrictions hold. | `REVIEW_ACCOUNT_ENABLED=false` (revokes its tokens). |
| 4. Android | Upload the signed AAB to internal testing, then production with App access instructions, as a staged rollout. | Install, sign-in, profile, applications. | Halt the staged rollout; fix in a higher versionCode. |

🤖 Generated with [Claude Code](https://claude.com/claude-code)
