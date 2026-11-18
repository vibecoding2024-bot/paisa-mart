# Admin payout handoff

Draft PR #7 · branch `feature/admin-payout-approvals` · base `18ae17869ba6f9deb7c987709a4c08641e3987db` (current main reverified November 18, 2026).
AWS EC2 / SQLite only. No merge, production access, infrastructure changes or deployment.

## Behavior and access

- Business Sanctioned saves independently of provider confirmation, retains accurate before/after stage history and audit, and survives reload/re-login.
- Manual Payout follows Rejected in loan Change Stage menus. It saves separate `payoutStatus` metadata and never replaces Disbursed or the provider decision. Home retains its existing pipeline.
- Customer Eligible Payout and Paisamart Eligible Payout are manually entered after Disbursed for Home/Business/Personal/Vehicle, and after Account Activation for Bank Accounts. Zero is valid; negative, malformed, overlarge or more-than-two-decimal amounts are rejected. No percentages or inferred amounts.
- Admin/ops enter and review both amounts. Separate **executive** and **manager** staff roles review and approve; both different identities are required. Neither the editor nor admin can bypass those approvals. Viewers receive no payout amounts from the API and have no payout controls.
- After both approvals, only the applicant (verified signed-in mobile number matching the application) sees their customer amount under Profile → My eligible payouts. Paisamart's amount stays internal. Referring partners and other customers have no access.
- Every amount save clears both approvals, including changes only to Paisamart's amount. Stage regression and staff-access changes invalidate visibility/signatures too. Home approvals bind to its independent workflow version.
- These access choices implement the user's delegated decision. No existing staff roles are automatically reassigned. An admin uses Settings → Staff access to assign separate Executive and Manager staff when the reviewed feature is later released.

## Persistence and safety

Reuses `admin_operations`, `admin_staff`, `admin_audit`, existing SQLite transactions, signed staff sessions and optimistic versions. Payout revision, amounts and signatures are stored in the existing operations JSON payload; no replacement tables, source-row rewrites or database migration are needed. Every edit/approval is audited atomically. Stale edits/reviews return 409. Customer responses are no-store and contain neither Paisamart amounts nor staff signatures/history. Existing payment/commission automation stays disabled. New payout endpoints explicitly require SQLite.

Gold Loans has a catalog entry but no persisted intake/source in current main. Its action list includes Payout; no synthetic applications or duplicate workflow was invented. The other five existing loan sources support manual selection; editable amounts are limited to the four requested loan products plus Bank Accounts.

## Validation

**34 automated tests / 770 assertions passed** (run suites separately because each initializes its own database):

- `bun test backend/src/routes/admin-operations.test.ts scripts/loan-stage-actions.test.ts` — 14 / 160.
- `bun test backend/src/routes/admin-payouts.test.ts` — 6 / 279; covers every product prerequisite, both approval orders, hidden/visible responses, unauthorized requests, invalid amounts, stale writes/reviews, reapproval, stage regression, access revocation, self-approval prevention, exact audits, rollback and SQLite process restart.
- `bun test backend/src/routes/service-applications.test.ts` — 11 / 248.
- `bun test backend/src/routes/home-loans.test.ts` — 3 / 83.

Mobile typecheck, focused strict backend typecheck, Expo web export, Bun backend bundle and `git diff --check` pass. Full backend typecheck still hits the pre-existing TypeScript stack-overflow crash documented in the earlier handoff; it is not reported as passing.

**10 local browser checks passed**, using only synthetic local SQLite data: staff amount entry, executive read-only amounts, one/both approvals, applicant reload visibility, company-amount exclusion, edit invalidation, viewer restrictions, mobile width and no runtime errors. Desktop/mobile screenshots were visually inspected. Local evidence: `.preview/payout-browser-results.json` and `.preview/payout-{admin-desktop,executive-mobile,customer-mobile}.png` (not production build artifacts).

Review flow: enter both amounts on an eligible application's details or Payouts tab → approve as Executive → customer sees no amount → approve as Manager → applicant sees only customer amount → edit either amount → customer amount disappears until both approve again. This does not execute a payment.

## Changed files

- `backend/src/index.ts`
- `backend/src/lib/admin-operations.ts`
- `backend/src/lib/auth-token.ts`
- `backend/src/routes/admin-operations.test.ts`
- `backend/src/routes/admin-operations.ts`
- `backend/src/routes/admin-payouts.test.ts`
- `backend/src/routes/customer-payouts.ts`
- `docs/admin-payout-handoff.md`
- `mobile/src/app/(tabs)/profile.tsx`
- `mobile/src/app/admin/(dashboard)/home-loans.tsx`
- `mobile/src/app/admin/(dashboard)/lead-details.tsx`
- `mobile/src/app/admin/(dashboard)/leads.tsx`
- `mobile/src/app/admin/(dashboard)/payouts.tsx`
- `mobile/src/app/admin/(dashboard)/settings.tsx`
- `mobile/src/app/customer-payouts.tsx`
- `mobile/src/components/AdminOperationsPanels.tsx`
- `mobile/src/lib/admin-store.ts`
- `mobile/src/lib/customer-payout-api.ts`
- `mobile/src/lib/loan-product-stages.ts`
- `scripts/loan-stage-actions.test.ts`
