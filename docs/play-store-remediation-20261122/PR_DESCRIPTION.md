# Google Play remediation: honest financial UI, guarded review account, OTP binding, launcher icon

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

- **Backend:** `bun test` on each of the 11 files separately: 65 pass, 0 fail at `2616f1c`. There are no type errors in changed files; the pre-existing tsc errors are elsewhere.
- **Mobile:** `tsc --noEmit` reports 0 errors.
- **Android (emulator, WSL release build, debug-signed, against an isolated local backend with synthetic data):**
  - a fresh account shows ₹0.00 and empty states;
  - a synthetic account with records shows its approved ₹1,500.00 and both applications;
  - an admin stage change appeared in the app;
  - the review account sees only its own TEST records; its payouts are refused (403); its code is refused for other phones (401).
- Final runtime code was tested:
  - backend `2616f1c`;
  - mobile `28651cc` (the WSL test variant on the emulator with production DNS blocked).
  - Results: profile saves went to the local backend; the fresh, synthetic and review accounts behaved as expected; an admin stage change showed in the app; the candidate launches to the login screen.
- Test builds had written synthetic profiles to production. The cause is fixed in `28651cc`. Details and the cleanup decision: HANDOFF "INCIDENT".

## Deployment requirements (each separately authorized)

1. **Backend release** via the guarded `deployment/requirements` workflow:
   - `backend-update.py verify`, then `update --execute`, which handles backup, migration rehearsal and the PM2 restart.
   - Before release, confirm (by name only) that the MSG91 variables exist in production. With A-06, a missing provider makes `send-otp` return 503.
   - Do not set `ALLOW_DEV_OTP` in production.
2. **Review account:** add the five `REVIEW_ACCOUNT_*` variables to the protected `.env` in the same authorized restart window. Seed 2–3 synthetic applications through the app (a production data change; needs approval). Verify, then enter the credentials in Play Console only. Steps: `REVIEWER_ACCESS_DESIGN.md`.
3. **Android:**
   - verify the upload certificate in Play Console → App integrity;
   - confirm the highest versionCode;
   - build a signed AAB with the matching key.
4. **Play Console:**
   - listing copy;
   - screenshots 01–06;
   - App access;
   - Financial features declaration;
   - privacy URL.
5. **Web:** no web release is needed for this PR's backend changes. Current clients don't call `verify-otp-token`.

## Open findings and owner decisions

- **A-01 (Critical, pre-existing):** `/api/users/*` has no authentication. It needs an app release that sends the token first, then backend enforcement, as a separate PR.
- A-08 ownership model.
- Commission and rate-card figures.
- About Us "Fully compliant with RBI and IRDAI guidelines" (regulatory claim; verify or remove).
- Lender list for the Financial features declaration.
- versionCode history.
- Upload certificate.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
