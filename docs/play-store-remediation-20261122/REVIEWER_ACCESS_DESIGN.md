# Google Play reviewer access — implemented and tested LOCALLY; NOT in production

Status (22 Nov 2026): implemented on branch `fix/play-store-remediation-20261122` (commit `d7c8a33`+),
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
4. The token carries `review: true`. Each sign-in is logged with a masked phone (`90******99`) and timestamp.
5. Restrictions are applied by phone whenever `REVIEW_ACCOUNT_PHONE` is set (even if sign-in is off):
   - admin rows: `testAccount: true` and name prefixed "TEST – Play review ·";
   - payout entry and approval refused (403), and the customer payout list is always empty;
   - KYC start and payment create refused (403, "Not available for the demo account");
   - customer endpoints are unchanged and scoped to the token phone, so only the review phone's own records show.

Hardening shipped in the same change (needed so the review path does not sit beside open doors):

- **A-02 (widget mode):** the MSG91 `reqId` is bound to the phone it was sent to and is single-use.
  `verify-otp-token` was **not** changed. It still falls back to the client phone, because changing it without
  seeing a real MSG91 token-verify response could break web login. That remains open.
- **A-06:** the in-memory dev OTP is used only when `ALLOW_DEV_OTP=true`. Without a provider and without the flag,
  `send-otp` returns 503 (fail closed). OTPs use `crypto.getRandomValues`.

Known limitation (pre-existing A-08): intake forms are unauthenticated, so anyone could submit a lead with the
review phone number and it would appear in the review account's list. Such records are labelled TEST and can never
become payout-eligible. They do not expose customer data.

## Tests (local, 22 Nov 2026)

- `bun test` across all 11 backend test files, run one file at a time (they share a SQLite path): 62 pass, 0 fail.
- `review-account.test.ts` (7 tests):
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
