# Google Play reviewer access — implemented and tested LOCALLY; NOT in production

Status (22 Nov 2026): implemented on branch `fix/play-store-remediation-20261122` (commits `d7c8a33`, `2616f1c`),
tested with automated tests and on the Android test build against an isolated local backend.
**Not released, not enabled in production, no production data seeded.** Until the production steps below
are separately authorized and completed, Google's "Login credentials are missing" finding is **not resolved**.

## Problem

Paisa Mart login is SMS OTP only (`POST /api/auth/send-otp` → `POST /api/auth/verify-otp`).
A Google reviewer cannot receive an SMS sent to a Paisa Mart phone.

## Constraints

- No universal OTP, no arbitrary-phone login, no hidden alternate app behaviour.
- The review account sees only its own synthetic records; no access to customer data.
- No real financial transaction privileges (no payments, payouts, KYC provider calls).
- Credentials never in Git, logs, or ordinary reports.

## What was implemented

`backend/src/lib/review-account.ts`, wired into `routes/auth.ts`, `lib/admin-operations.ts`, `routes/kyc.ts`,
`routes/payment.ts`.

Configuration (server environment only, never committed):

| Variable | Purpose |
|---|---|
| `REVIEW_ACCOUNT_ENABLED` | `true` only while a review depends on it; anything else = off. |
| `REVIEW_ACCOUNT_PHONE` | One 10-digit number controlled by Paisa Mart, never issued to a customer. |
| `REVIEW_ACCOUNT_HMAC_KEY` | Random server secret, ≥32 characters. |
| `REVIEW_ACCOUNT_CODE_HASH` | Hex HMAC-SHA256(key, 6-digit code). The plain code exists only in Play Console and the password manager. |
| `REVIEW_ACCOUNT_EXPIRES_AT` | ISO timestamp; sign-in fails closed after it. |

Behaviour:

1. `send-otp` for the review phone while active: no SMS, response `{ "success": true }` (no `devOtp`, no hint).
2. `verify-otp` for the review phone: timing-safe compare of the HMAC; normal per-phone/IP rate limits apply;
   after 10 cumulative failures the review path locks until the backend restarts.
3. Any other phone, and the review phone when disabled/expired/misconfigured, uses the unchanged provider path.
   The code is never accepted for another number.
4. The token carries `review: true` and expires at the earlier of 7 days and `REVIEW_ACCOUNT_EXPIRES_AT`. Review tokens
   are rejected as soon as `REVIEW_ACCOUNT_ENABLED` is not `true` or the expiry has passed (`customer-token.ts`).
   Each sign-in is logged with a masked phone (`90******99`) and timestamp.
5. Restrictions are applied by phone whenever `REVIEW_ACCOUNT_PHONE` is set (even if sign-in is off):
   - admin rows: `testAccount: true` and name prefixed "TEST – Play review ·";
   - payout entry and approval refused (403), and the customer payout list is always empty;
   - KYC start and payment create refused (403, "Not available for the demo account");
   - customer endpoints are unchanged and scoped to the token phone, so only the review phone's own records show.

Hardening shipped in the same change (needed so the review path does not sit beside open doors):

- **A-02, all login paths** (`2616f1c`):
  - Widget `verify-otp`: the MSG91 `reqId` is bound to the phone it was sent to and is single-use.
  - Template `verify-otp`: MSG91 verifies the OTP against the submitted mobile number.
  - Dev OTP: keyed by phone and off unless `ALLOW_DEV_OTP=true`.
  - Review: bound to the configured phone.
  - `verify-otp-token` (web widget access token): the phone is now required; a token is issued only when the number MSG91 verified (`message: "91XXXXXXXXXX"` or a phone field) equals it. There is no fallback to the client phone, raw provider data is no longer returned, and the review phone is refused on this path.
  - Neither current client calls `verify-otp-token`: web and Android both use `send-otp` → `verify-otp`, so normal login is unchanged.
  - Residual risk: if MSG91 ever returns the number in an unrecognised field, token logins fail closed (401). They are never misattributed.
- **A-06:** the in-memory dev OTP is used only when `ALLOW_DEV_OTP=true`. Without a provider and without the flag,
  `send-otp` returns 503 (fail closed). OTPs use `crypto.getRandomValues`.

Known limitation (pre-existing A-08): intake forms are unauthenticated, so anyone could submit a lead with the
review phone number and it would appear in the review account's list. Such records are labelled TEST and can never
become payout-eligible. They do not expose customer data.

## Isolation review (22 Nov 2026)

| Control | Status | Evidence |
|---|---|---|
| Restrictions enforced by the server, not the app | Yes. Checks are by phone in `admin-operations` (payout save, approve, customer payout list), `kyc` (start) and `payment` (create). | `admin-payouts.test.ts`, `review-account.test.ts` |
| Expiry | Sign-in fails closed after `REVIEW_ACCOUNT_EXPIRES_AT`; issued tokens never outlive it and are revoked when it passes or the account is disabled | review-account tests |
| Rate limits | The normal per-IP and per-phone limits apply before the review branch (send 3 per phone and 8 per IP per 15 min; verify 8 per phone and 20 per IP per 15 min), plus a cumulative 10-failure lockout | `auth.ts` |
| No code or token in logs | Only the masked phone is logged. The request logger records method and path only. A test captures all console output during send, verify and a wrong code, and asserts that no code, token or full phone appears. | `review-account.test.ts` |
| No real provider actions | send-otp skips MSG91. The only other outbound calls (VimoPay payment and KYC) are refused for the review phone. KYC sessions can only start through the refused start route. | grep of `fetch(` callers; tests |
| No access to other customers through the review account | Customer endpoints take the phone only from the signed token (`customer-applications`, `customer-payouts`, home-loan status) | test: only its own records listed |
| Credentials out of Git | Tests generate a random code and key per run; local values live in the session scratchpad only | `git grep` found no review values |

**Not isolated (pre-existing, affects everyone, not just the review account): A-01.**
- `/api/users/*` (profiles and KYC status) has no authentication, so anyone can read or overwrite any profile by phone through the API.
- The app does not send a token on these calls today. Enforcing auth on the backend alone would break profile loading for the web build already in production.
- Required order:
  1. Release app and web builds that send `Authorization: Bearer <customer token>` on profile and KYC calls.
  2. Then enforce token-phone matching in `users.ts`, and restrict `GET /profiles` and `PATCH …/kyc` to staff or the VimoPay callback.
- This needs its own reviewed change and release.

## Keeping access valid for the whole Google review

- Set `REVIEW_ACCOUNT_EXPIRES_AT` well beyond the expected review (for example 90 days) and keep `REVIEW_ACCOUNT_ENABLED=true` for as long as the App access declaration depends on it. Google may re-review at any time, including for updates and policy checks.
- Review tokens last at most 7 days, but the reviewer can always sign in again with the same phone and code while the window is open.
- Before each submission or update, check end to end on a production-pointed build that sign-in works. Then confirm the expiry date covers at least the next 30 days.
- Lockout: after 10 wrong codes the review path stays locked until the backend restarts. If reviewers report failure, check the masked "locked" warning in the backend log, then restart in an authorized window.
- Rotation: change the code only between reviews. Update the hash in `.env` and in Play Console App access together, in one authorized window.
- Disabling: setting `REVIEW_ACCOUNT_ENABLED=false` (restart required) stops sign-in and revokes issued review tokens immediately. Do this only when no review or App access declaration depends on the account.

## Tests (local, 22 Nov 2026)

- `bun test` across all 11 backend test files, run one file at a time (they share a SQLite path): 65 pass, 0 fail at `2616f1c`.
- `review-account.test.ts` (10 tests). The three added in `2616f1c`:
  - `verify-otp-token` binding: match → 200 with no raw data; another phone → 401; no provider phone → 401; free-text digits → 401; phone missing → 400; provider error → 401; review phone → 401;
  - review token expiry and revocation;
  - no code, token or full phone in logs.

  The original seven:
  - correct code gives a `review:true` token, and send-otp leaks nothing;
  - a wrong code gives 401, and the account locks out;
  - any other phone plus the review code gives 401;
  - disabled, expired, short key or bad hash fails closed with no `devOtp`;
  - `ALLOW_DEV_OTP` gating;
  - A-02 reqId binding and single use;
  - KYC and payment return 403, and only the account's own applications are visible.
- `admin-payouts.test.ts`: the new test confirms the TEST label, that payout save and approve return 403, and that the customer payout list is empty. The existing dual-approval tests are unchanged and pass.
- Live local API: synthetic payout entry → executive → manager approval = 200; the same flow for a review record = 403.
- Android (test build, local backend): review phone sign-in with the configured code; see CHECKLIST.md.

## Exact production steps (NOT executed; each needs separate explicit authorization)

1. **Review and merge:** push the branch, open a PR, review it and check CI. Merge only with owner approval.
2. **Check production OTP mode, read-only:** on EC2, confirm the MSG91 variables are present in the backend environment.
   Print only the names, never the values. The A-06 change makes `send-otp` fail closed (503) if they are missing.
3. **Choose the values (owner):**
   - a Paisa Mart–controlled phone number that is never issued to a customer;
   - a random 6-digit code.

   Store the code in the company password manager.
4. **Compute the hash offline** with a fresh random key of at least 32 characters:

   ```
   python3 -c "import hmac,hashlib,getpass;k=getpass.getpass('key: ');c=getpass.getpass('code: ');print(hmac.new(k.encode(),c.encode(),hashlib.sha256).hexdigest())"
   ```

5. **Build the backend release** from the merged main using `deployment/requirements/prepare_release.py`, which follows the guarded process in `deployment/requirements/README.md`.
6. **Verify read-only first:** `python3 -B backend/backend-update.py verify`, then `python3 -B /home/ec2-user/paisa-mart-deployment/verify.py`. Stop on any FAILED result.
7. **Authorized update:** `python3 -B backend/backend-update.py update --execute`. It backs up the source, the `.env` and the SQLite database, rehearses migrations, and restarts the established Bun/PM2 process.
8. **Add the five `REVIEW_ACCOUNT_*` variables** to the protected backend `.env`, and do **not** set `ALLOW_DEV_OTP`. This needs a restart, so do it in the same authorized window as step 7, using the same backup.
9. **Seed synthetic records** (a production data change; needs separate approval). Submit 2–3 applications through the normal app forms, signed in as the review phone, using fictional names. Move one stage in admin. Records are automatically labelled TEST.
10. **Verify:**
    - `verify.py`;
    - on a production-pointed signed build, sign in with the review phone and code, then check that My applications shows only the synthetic records;
    - a wrong code returns 401;
    - another phone with the review code returns 401.
11. **Play Console → App content → App access:** enter the phone and code from `APP_ACCESS_INSTRUCTIONS_en.md`. Enter them only there.
12. **Rollback path:** `python3 -B backend/backend-update.py rollback --execute`. To disable the account without rolling back, set `REVIEW_ACCOUNT_ENABLED=false` and restart (this needs a separately authorized restart).

## Rotation

Rotate the code after each review cycle (new hash in `.env`, update Play Console). Keep the account enabled for as
long as App access depends on it, because Google may re-review at any time.
