# Google Play reviewer access — design (NOT IMPLEMENTED)

Status: **design only**. No backend code was changed on this branch, nothing is deployed, and no review
account exists in production. Until this is implemented and released through the guarded AWS workflow,
Google's "Login credentials are missing" finding (version code 7) is **not resolved**.

## Problem

Paisa Mart customer login is SMS OTP only (`POST /api/auth/send-otp` → `POST /api/auth/verify-otp`).
A Google reviewer cannot receive an SMS sent to a Paisa Mart phone, so OTP login cannot be completed.

## Constraints (from the remediation brief and the 21 Nov 2026 audit)

- No universal OTP, no arbitrary-phone login, no hidden alternate app behaviour.
- The review account sees only its own synthetic records; no access to customer data.
- No real financial transaction privileges (no payments, payouts, wallet, KYC provider calls).
- Credentials never in Git, logs, or ordinary reports.
- Must not widen audit findings A-02 (OTP not bound to phone), A-06 (dev OTP returned when MSG91 is
  unset) or A-09 (session not enforced). A-02 and A-06 should be fixed in the same backend release.

## Design: one designated, server-configured review identity

Configuration (EC2 backend environment only, never committed):

| Variable | Purpose |
|---|---|
| `REVIEW_ACCOUNT_ENABLED` | `true` only during a review window; default off. |
| `REVIEW_ACCOUNT_PHONE` | One 10-digit number controlled by Paisa Mart and never issued to a customer. |
| `REVIEW_ACCOUNT_CODE_HASH` | HMAC-SHA256 (keyed with a separate server secret) of a random 6-digit code. The plain code exists only in Play Console → App access and the company password manager. |
| `REVIEW_ACCOUNT_EXPIRES_AT` | ISO timestamp; the path fails closed after it. |

Behaviour (`backend/src/routes/auth.ts`):

1. `send-otp` for `REVIEW_ACCOUNT_PHONE` while enabled: do not call MSG91; return `{ success: true }`
   exactly like a normal send (no `devOtp`, no hint).
2. `verify-otp` for that phone: timing-safe compare of HMAC(code) with `REVIEW_ACCOUNT_CODE_HASH`;
   existing per-phone/IP rate limits apply; lock the path after 10 failures until re-enabled.
3. Every other phone, and the review phone when disabled/expired, follows the unchanged MSG91 path.
   The review code is never accepted for any other number (not universal).
4. Token carries an extra claim `review: true` so the server — not the app — can restrict actions.
5. Each review login is logged with a masked phone and timestamp.

Server-side restrictions for `review: true` tokens and records whose applicant phone equals
`REVIEW_ACCOUNT_PHONE`:

- Intake submissions are stored with `is_test = 1` and shown in admin as "TEST – Play review";
  excluded from partner forwarding, payout eligibility and reports.
- `POST /api/payment/*`, KYC start, payout creation/approval: refused with a clear message
  ("Not available for the demo account").
- Customer endpoints stay scoped to the token phone, so only the review account's own synthetic records
  are visible.

The app UI is unchanged: the reviewer uses the normal phone + OTP screens. The restrictions are disclosed
in the App access instructions, so nothing is hidden from review.

## Synthetic data

Seed, with separate authorization, 2–3 synthetic applications for the review phone (fictional name,
no real PAN/Aadhaar/bank data), e.g. one Home Loan "Submitted" and one Personal Loan "Under review",
so "My applications & status" is not empty. Seeding production is a production data change and needs
its own explicit approval.

## Required tests before release

- Review phone + correct code → token with `review: true`.
- Review phone + wrong code → 401; lockout after limit.
- Any other phone + review code → 401.
- Disabled or expired → normal MSG91 path; no `devOtp` in any response.
- Review token cannot create payments, start KYC, or read another phone's applications.

## Release dependency

Backend change → backend restart on EC2 → requires a separately authorized release through the guarded
`backend-update.py` workflow (backup, verify, rollback). Not done in this task.

## Rotation

Rotate the code after each review cycle (new hash in the environment, update Play Console), and set
`REVIEW_ACCOUNT_ENABLED=false` when no review is pending — but keep it enabled while a Play review or
the app's "App access" declaration depends on it, because Google may re-review at any time.
