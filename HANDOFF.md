# Paisa Mart PR #6 — AWS EC2 handoff

Updated November 4, 2026 (Asia/Calcutta). **Non-financial implementation completed and verified locally. Draft review candidate; no merge, upload, service restart on EC2, production migration or deployment.**

## Exact source and preserved checkouts

- PR: https://github.com/vibecoding2024-bot/paisa-mart/pull/6 — remains draft.
- Branch: `feature/loan-requirements-review-20261103`; isolated checkout: `.requirements-review`.
- Tested implementation commit: `7ed7f3f0cc6bcbc846de5447bdd0fda30854a18c`. This handoff is a subsequent documentation-only commit; use the PR head for the handoff and this exact commit for tested runtime source.
- Resumed from clean PR head `bd245a5f4f553679f6ccec16704482419dc5d09a`. The interrupted work had evidence scripts/logs but no partial source edits to overwrite.
- Fetched `origin/main` remains `17eac94b39b708ee9e0979de0bda4efd551e6d24`, matching the user-confirmed dashboard release `20261021-17eac94b-dashboard`.
- Original dirty main remains `facbc4c5b5014937f7b218f9f5eda0b78c908f92` (ahead 1 / behind 46). Its HEAD and hashes of every previously tracked dirty file are unchanged. No reset, clean, stash, forced checkout or dirty-main merge.
- The original sibling implementation `../paisa-mart-requirements-20261101`, branch `feature/loan-requirements-20261101` at `110bda741f3df72e9c59e3b755605a2852b64165`, and detached `.dash` baseline were preserved.
- Dependencies were reused and restored by the existing guarded try/finally build helper. Temporary investigations, browser harnesses, screenshots, synthetic databases and local preview exports stay outside the PR.
- GitHub metadata was checked before this update: PR open/draft/unmerged, exact expected prior head and main base, no returned main branch rules. No hosting check, hosting configuration or hosting deployment was investigated or changed in this resumed work. Netlify/Vercel preview results are excluded from AWS readiness.

## Requirements, deduplicated against both PDFs

Sources already extracted and visually inspected:

- **A**: `Admin portal.pdf`, 3 pages; SHA256 `ac1d180ab2b9539ae3d557d6b5a3f401078720fd8b7a23eb2ff03090d5bfb49a`.
- **C**: `Customer portal (1).pdf`, 3 pages; SHA256 `58e39b3f5adb1a833927a73c5afb4aa4c1f499571c7d8db174c21a84af479bc1`.
- Available conversation/WhatsApp instructions: preserve UI and deployed work, real backend saves/references, failure and duplicate protection, verification, no unconfirmed payout calculations, no merge/deploy. Repeated requirements appear once below. Any WhatsApp-only wording absent from the available conversation remains unverified; no financial policy was inferred from it.

| ID | Deduplicated requirement | Source | Status and evidence |
|---|---|---|---|
| N01 | Business Loan calendar DOB | C1 | **Complete**: existing shared Home calendar; real-date validation; desktop/mobile selection and backend persistence tested. |
| N02 | Business Loan Submit saves full form; contact-shortly success | C1, conversation | **Complete**: actual API receipt, all form fields persisted, visible web/native confirmation; invalid receipt/failed write cannot display success. |
| N03 | Life Insurance Submit saves; contact-shortly success | C1 | **Complete**: insurer, policy and premium saved; numeric custom premium validation; actual reference and confirmed success dialog. |
| N04 | New/Used Vehicle before Vehicle Type | C2 | **Complete**: required selector precedes type; validated enum is retained in SQLite/PostgreSQL JSON payload and admin details. Existing rows without a condition remain readable. |
| N05 | Vehicle Loan calendar DOB | C2 | **Complete**: same picker and strict real-date checks as Business/Home. |
| N06 | Vehicle Loan Submit saves full form; contact-shortly success | C2 | **Complete**: saved reference, errors, duplicate-click guard and Home button tested at both viewports. This is Vehicle Loan, not Vehicle Insurance. |
| N07 | Personal, Business and Vehicle eight loan stages | A1, C1 | **Complete**: New leads, Contacted, Documents pending, Login/application submitted, Underwriting, Sanctioned, Disbursed, Rejected/dropped; stored stages, optimistic versions, history, permissions and refresh tested. Sanctioned requires recorded provider approval/evidence. |
| N08 | Separate Home Payout box after Rejected | A1 | **Complete for layout**: box follows the existing eight stages; clearly disabled awaiting financial confirmation. It is not a ninth application stage. |
| N09 | Credit Card Leads → Logins → Activation | A1 | **Complete (non-financial)**: persisted Credit Card intake and Leads → Logins → Credit Card Activation, with recorded provider approval/evidence, assignments and audit history. |
| N10 | Bank Account Leads → Logins → Activation | A3 | **Complete (non-financial)**: persisted Bank Account intake and Leads → Logins → Account Activation, with recorded provider approval/evidence. |
| N11 | Insta Loan Leads → Logins → Net Disbursement | A2 | **Complete (non-financial)**: persisted Insta Loan intake and Leads → Logins → Loan Net Disbursement. Final milestone requires recorded provider disbursement/evidence; approval alone is rejected. |
| N12 | Health Insurance Leads → Logins → Policy Issued | A2 | **Complete (non-financial)**: existing Health form submits all fields to the backend; Leads → Logins → Policy Issued, with recorded provider approval/evidence. |
| N13 | Motor Insurance Leads → Logins → Policy Issued | A2 | **Complete (non-financial)**: both existing Motor policy and Vehicle Insurance quote forms save to the backend; Leads → Logins → Policy Issued, with recorded provider approval/evidence. |
| N14 | Life Insurance Leads → Logins → Policy Issued | A2–3 | **Complete** for saved applications: new API source is connected to admin, milestones persist, issuance requires recorded provider evidence. Dedicated navigation opens the existing saved-leads UI instead of the previously blocked local-only demo. |
| N15 | All 15 customer modules reflected in admin | C3 | **Complete**: all 15 catalogue modules appear in admin. Ten now have connected application sources; the other five show unavailable processing, without fabricated counts or success. |
| N16 | Referral box wording | A3 | **Complete**: exact “Earn up to ₹1 Lakh and Reduce Your Expenses”; referral share text no longer promises ₹500. Existing layout/styles retained. |
| N17 | Prevent false success and repeated clicks | Conversation | **Complete** for implemented forms: server-receipt-only confirmations and immediate submit locks. The five new service APIs also enforce atomic idempotency keys; identical in-form retries return the original reference, conflicting payload/key returns 409. A new page/session can create a new intentional application; cross-session request-key persistence is not claimed. |
| N18 | Dashboard counts, assignments, Home refresh, history, persistence | Conversation | **Complete** in isolated SQLite preview: automated regressions and browser changes/sign-out/sign-in pass. Original Overview spacing remains intact. |
| F01 | Executive review then manager approval; customer payout visible only afterward | A1–3 | **Awaiting business decision**: financial workflow remains disabled; responsibilities/role mapping and payout policy require approval before implementing financial state transitions. |
| F02 | Manual revenue; manual/automatic TDS and revenue; authorization only on customer payout | A1–3 | **Awaiting business decision**: no revenue/TDS calculation or write path enabled. The ₹10,000 / 5% / ₹9,500 example is not treated as a universal rule or tax basis. |
| F03 | Credit Card example ₹1,800 minus ₹400 → customer ₹1,400; admin ₹400 | C1 | **Awaiting business decision**: deducted-share meaning not assumed; no calculation enabled. |
| F04 | Bank example ₹1,000 minus ₹250 → customer ₹750; admin ₹250 | C1 | **Awaiting business decision**: same unresolved deducted-share definition. |
| F05 | Home ₹1 lakh / ₹300 example | C1 | **Awaiting business decision**: fixed amount versus rate unconfirmed. |
| F06 | Personal ₹1 lakh / ₹1,500 example | C2 | **Awaiting business decision**: fixed amount versus rate unconfirmed. |
| F07 | Business ₹1 lakh / ₹1,500 example | C2 | **Awaiting business decision**: PDF body says “personal loan” under the Business heading; not silently interpreted. |
| F08 | Insta 2.00% minus 0.40% / customer 1.60% example | C2 | **Awaiting business decision**: deducted-share meaning/base and financial policy unconfirmed. |
| F09 | Vehicle new 0.4%, used 1% on disbursed amount | C2 | **Awaiting business decision for financial activation**: selection/data are implemented, calculation remains disabled under the user's explicit non-financial-only instruction. |
| F10 | Motor net premium excluding GST; tiered deductions 5/7/8/10 points | C2 | **Awaiting business decision**: thresholds retained in source PDF, not coded into payable amounts; deduction meaning/basis require confirmation. |
| F11 | Health net premium excluding GST; 15% minus 5% example | C2–3 | **Awaiting business decision**: no assumed universal rate or deduction meaning. |
| F12 | Life ₹1 lakh / 20% customer payout; separate admin payout | C3 | **Awaiting business decision**: admin share/basis and complete policy unconfirmed. |

All five previously missing sources — **Credit Cards, Bank Accounts, Insta Loans, Health Insurance and Motor Insurance** — are required by the PDFs and now connected. None has been dismissed as out of scope. These are Paisa Mart intake records and staff-managed processing milestones, not automated bank/insurer issuance or disbursement integrations. Provider outcomes require staff to record the provider and supporting evidence; an application save does not assert provider acceptance.

Gold Loans, Real Estate, Cash on Credit Card, Recharge & Pay Bills, and Travel & Tickets remain in the 15-module catalogue. The PDFs require their visibility but do not specify their processing integrations in this PR. Unsupported processing remains explicitly unavailable.

## Changes completed in this continuation

- Added validated `POST /api/services/:product/applications` for the five required service types. Saved full existing Health/Motor form fields, contact details, selected provider/product and the separate Vehicle Insurance quote fields.
- Added five persistent source tables with UUID IDs, actual `CC-`, `BA-`, `IL-`, `HI-`, `MI-` references, timestamps, unique submission keys and request hashes. Same-key concurrent/retry requests return one original receipt; changed payload with an existing key returns conflict. Failed database writes return an error, never a receipt.
- Replaced Health/Motor/Vehicle Insurance local-store success paths with awaited server saves. Existing form design, choices and styles remain. Success dialogs show the actual saved reference. Motor's separate confirmation route re-verifies its server receipt, including after reload; fabricated/missing references cannot display success. Receipt responses contain no applicant/contact/health data.
- Connected Credit Card, Bank Account and Insta Loan application buttons to contact-detail intake in the existing visual style. Existing product pages remain; a provider URL is no longer treated as a saved Paisa Mart application. Removed the new route's duplicate default header after visual review.
- Connected all five sources to existing admin lists, real counts, filtering, assignments, permissions, optimistic versions, stage history and transactional audit writes. Replaced the three previously blocked local-only insurance admin pages with redirects to their saved application lists.
- Completed Leads → Logins → Activation/Policy Issued/Net Disbursement. Activation/issuance require recorded approval evidence. Insta Loan net disbursement requires recorded **disbursed** evidence, not just an approval. Viewer contact masking and sensitive-field/history restrictions are preserved.
- Existing customer/admin authentication contracts are unchanged. Admin page reload retains the existing requirement to sign in again; saved applications and processing history survive that sign-in. No silent-login behaviour was added.
- Unapproved payout/TDS/revenue calculations, incentive/payout mutations and customer withdrawal remain disabled. Provider processing milestones do not enable financial payouts.

## Verification results

All automated test files ran in separate Bun processes against isolated local SQLite databases.

| Check | Result |
|---|---|
| New service backend regressions | 9 passed / 203 assertions |
| New service API receipt regressions | 3 passed / 28 assertions |
| Existing Business/Life/Vehicle, Home, Personal, admin, dashboard refresh/count/history and payout-guard regressions | 47 passed / 410 assertions |
| **Total** | **59 passed, 0 failed; 641 assertions** |
| Mobile `tsc --noEmit` | Passed |
| Focused strict backend TypeScript check | Passed for all changed routes and dependencies, including the five new services |
| Expo web export | Passed; explicitly localhost-only API configuration |
| Bun backend bundle | Passed; 33 modules, dependencies external |
| Existing browser acceptance | 69 passed, 0 runtime errors |
| Five-service browser acceptance | 143 passed, 0 runtime errors |
| **Browser total** | **212 passed**; desktop 1440×1000 and mobile emulation 390×844; 56 screenshots |
| Source scope / whitespace / preservation | Passed |

Browser coverage: original calendars/forms, actual references, failed submissions, repeat clicks, Home refresh, existing dashboard counts/history, all 15 modules, disabled payouts; plus all five new intakes, both Motor entry points, errors/retry keys, Back to Home, forged confirmation rejection, Motor receipt after reload, saved lists/counts, assignment, Logins, provider evidence, final milestones, sign-out/sign-in persistence and insurance admin navigation. Screenshots were inspected for form/dialog/pipeline spacing. Test-harness locator corrections were rerun; only final passing runs are counted. Physical devices/native binaries and live EC2 UI are not claimed tested.

Local preview: `http://127.0.0.1:4796/__preview`, synthetic database `.preview/services-review-20261104.sqlite`. The prior preview database was preserved. Browser requests outside localhost were blocked. The local preview process was restarted to load source; production services were not touched.

Evidence: `.build-tools/pr6-services-20261104/` contains logs, browser results/screenshots, compiler comparison, preservation checks, runtime-file list and build manifest. Earlier PDF and preservation evidence remains in `.build-tools/requirements-audit-20261103/`; compiler root-cause evidence remains in `.build-tools/pr6-final-review-20261104/`.

## Backend compiler crash — baseline comparison

Using the **same Node v24.17.0, TypeScript 5.9.3 binary and existing dependency trees**, standard `tsc --noEmit` exits 1 with `RangeError: Maximum call stack size exceeded` on both unchanged `.dash` at main `17eac94b` and this PR. Compiler SHA256: `8d5fa5bd883fec0979fc2004f1fe1d99aef40570155d550eadc0b03b55513bf0`. Backend package declares TypeScript 5.8.3; the actual available compiler used for both comparisons was 5.9.3.

Cause isolated: backend tsconfig enables `allowJs` without excluding generated public files. The unchanged 5,000,926-byte `backend/public/_expo/static/js/web/index-7e06d781bdebf292c78e296aead591a3.js` alone reproduces the crash (SHA256 `4e4b185350b4eb5d0c2b49851f1a1686bd45a8ce89e0df5cf42c7c872475a699`). No baseline file was edited to obtain that result.

Checking runtime TypeScript source while excluding generated output/tests completes: baseline has seven diagnostics; PR has five, all inherited (`HeadersInit` in index; two nullable-config diagnostics in auth; two optional-value diagnostics in kyc). The two Business diagnostics are fixed by this PR. The focused strict check of changed code is green.

**Effect on readiness:** the crash is pre-existing and does not prevent validating these changes with focused types, SQLite regressions, builds and browser tests. The repository-wide backend typecheck is still not green and must not be represented as passing. Its baseline cleanup/acceptance remains a disclosed review limitation, not a newly introduced compiler regression.

## AWS EC2 production baseline and database

Production is **AWS EC2 only**. User-confirmed baseline:

- App: `/home/ec2-user/paisa-mart-new`
- Toolkit: `/home/ec2-user/paisa-mart-deployment`
- Database: `/home/ec2-user/paisa-mart-data/payments.db` (**SQLite**)
- Last dashboard release: `20261021-17eac94b-dashboard`
- Personal Loan already deployed October 18; do not repeat it or the dashboard deployment.
- Recovery master `FINAL-GOOD-20261006` is untouched and recovery-only.

Local deployment evidence agrees: `release/dash-final/HANDOFF.md`, `EC2-READONLY-VERIFY.txt`, and `deployment/dashboard/backend-update.py` guard the exact SQLite path and established Bun/PM2 process. This is a user-confirmed/recorded baseline, **not a fresh live process/environment inspection**.

The five new sources use the dashboard database configuration (`HOME_LOANS_DATABASE_URL ?? DATABASE_URL ?? POSTGRES_URL`, otherwise `LEADS_DB ?? TXN_DB ?? payments.db`). For the confirmed production configuration, they use the existing SQLite file. **Unverified PostgreSQL does not block this SQLite release scope.** PostgreSQL paths are typechecked but not integration-tested. Any live PostgreSQL override or separate-service database discovered later must stop release preparation for investigation/testing, not silently switch production.

## Backend scope, schema and preservation

There are exactly **11 backend runtime files changed versus the deployed dashboard main**, not an old three-file/seven-file dashboard bundle:

- `backend/src/index.ts`
- `backend/src/lib/admin-operations.ts`
- `backend/src/lib/business-loan-lead-store.ts`
- `backend/src/lib/insurance-lead-store.ts`
- `backend/src/lib/service-application-store.ts`
- `backend/src/lib/vehicle-loan-lead-store.ts`
- `backend/src/routes/admin-operations.ts`
- `backend/src/routes/business-loans.ts`
- `backend/src/routes/life-insurance.ts`
- `backend/src/routes/service-applications.ts`
- `backend/src/routes/vehicle-loans.ts`

The continuation adds only the shared service store/router to the prior nine-file November feature scope; index and admin aggregation connect them. No dependency or authentication implementation was changed.

Additive schema effects: nullable Business form columns; Life and Vehicle Loan tables from the earlier implementation; and five new service tables: `credit_card_applications`, `bank_account_applications`, `insta_loan_applications`, `health_insurance_applications`, `motor_insurance_applications`. New tables are initialized with `CREATE TABLE IF NOT EXISTS` by the corresponding stores; admin stage/assignment/history continues in existing `admin_operations`/`admin_audit`. No existing rows/tables are dropped or converted. No live migration ran.

All four deployed Personal Loan files remain unchanged versus current main and recorded October Personal source/archive:

- `backend/src/routes/personal-loans.ts`
- `backend/src/routes/personal-loan-applications.ts`
- `backend/src/lib/personal-loan-application-store.ts`
- `backend/src/lib/personal-loan-lead-store.ts`

Personal archive SHA256 remains `66435ab4231afe50e44e31905511f0c55181b7619756a506faa7715da8dc9e5b`; dashboard archive remains `5f149daae3a0a7afa0d4e252e3b5cf80860987b3a93221caa24cae4a0a11bb8a`. No old artifacts were overwritten. Windows line-ending differences are distinguished from normalized source equivalence; future live byte mismatches must stop for review.

Rollback must restore only the affected code from a separately verified backup, preserving existing and newly collected application rows, audit history and additive schema. Do not roll back this feature by restoring an older database or deleting new application tables.

## Review build checksums — DO NOT UPLOAD

Source `7ed7f3f0cc6bcbc846de5447bdd0fda30854a18c`. These are local review builds using `http://127.0.0.1:4796`, **not production release artifacts**.

| Local review file | SHA256 |
|---|---|
| `.requirements-review/.preview/export/index.html` | `3919c34007517dda3ef8bbecc7dcb426c2d381253783ee3311d53a60f6dd3044` |
| `.requirements-review/.preview/export/_expo/static/js/web/index-53196a0eb7a4a51217349e28a80d9106.js` | `e26e1665ddb694a14328b04cfaf8c9a84e427c4e9bf097b161ea39f3995e6248` |
| `.requirements-review/.preview/backend-build/index.js` | `387f56eb5275a5ce8033708f0822367a134b4a9f68838210f61ca150f514189c` |
| `.build-tools/pr6-services-20261104/review-build-manifest.json` | `30b73cd94360c6a21aefd2af7fe3dbf7bb849f32b1ef35c73b0737bd9f085437` |

## Guarded FileZilla → EC2 release preparation

No final release bundle or upload directory has been prepared for this feature. Final packaging must follow separately approved merge and build from clean merged main. The existing maintained scripts were inspected:

- `deployment/dashboard/build_production_release.py`: clean source, explicit production API, fresh Expo export, source/hash checks.
- `deployment/dashboard/prepare_home_loan_release.py` and `verify_home_loan_release.py`: frontend packaging/verification.
- `deployment/dashboard/package_backend.py` and `release_validation.py`: **currently restricted to the old three-file dashboard delta against the October Personal baseline**. They correctly reject this new scope; do not bypass or reuse them as a November installer.
- `deployment/dashboard/backend-update.py`: staged source/PM2/health verification, locked backup/update flow and code rollback. Its candidate manifest/migration path must be reviewed for the new 11-file scope and October 21 baseline before packaging.
- `stage-frontend.py` writes a release directory; it is not a read-only verification command.

After merge approval, release preparation must adapt/test the guarded packaging for exactly these 11 runtime files, compare the complete deployed baseline, explicitly preserve the four Personal files, verify additive migrations on a local database copy, and create a **new unique release folder** with manifest, archives and SHA256SUMS. No current production checksum or release name can be supplied before that build exists.

After separate upload approval, use the established FileZilla SFTP workflow: verify the current EC2 host/instance/Region and host key; port 22, `ec2-user`, existing authorized key; Binary transfer mode. Upload only the new verified release folder beneath `/home/ec2-user/paisa-mart-deployment/incoming/`; stop if its destination exists. Never upload the raw preview, source checkout, database or secrets, or directly into `backend/public`, `backend/src`, `.frontend-releases` or `FINAL-GOOD-20261006`. Do not upload the old October folders again.

The only currently documented installed toolkit check is read-only:

```bash
cd /home/ec2-user/paisa-mart-deployment
python3 verify.py
```

Before any deployment, inspect installed toolkit versions, active release/index hash, live source hashes, effective database path/override absence and exact PM2 process identity using the read-only guards from the actual final release. The October guard must additionally check Life/Vehicle database overrides. Do not print environment secrets. Local copies of deploy.py/rollback.py do not prove they are installed on EC2. No upload, update, migration, restart, rollback or deploy command is authorized by this handoff, and none was run.

## Remaining blockers and business decisions

**Implementation:** all confirmed non-financial requirements represented above are complete in the tested SQLite preview. External provider automation was not specified and is not fabricated. No payout calculation is enabled.

**Review/release gates:** PR #6 remains draft for final review; separate merge approval; acknowledged pre-existing full-backend typecheck limitation; final guarded packaging from merged main for the 11-file delta; fresh read-only EC2 baseline verification; then separate upload/deployment authorization. No production readiness claim is based on a hosting preview check.

**Business confirmation only:** meaning of deducted share; whether Home/Personal/Business examples are fixed payouts or rates; the Business example's Personal wording; revenue/TDS basis and manual/automatic rules; insurance percentage bases/tiers and Life admin share; executive/manager role mapping and authorization policy. F01–F12 remain disabled pending that confirmation.

## Exact PR file changes versus origin/main

- `HANDOFF.md`
- `backend/.gitignore`
- `backend/src/index.ts`
- `backend/src/lib/admin-operations.ts`
- `backend/src/lib/business-loan-lead-store.ts`
- `backend/src/lib/insurance-lead-store.ts`
- `backend/src/lib/service-application-store.ts`
- `backend/src/lib/vehicle-loan-lead-store.ts`
- `backend/src/routes/admin-operations.ts`
- `backend/src/routes/application-receipts.test.ts`
- `backend/src/routes/business-loans.ts`
- `backend/src/routes/life-insurance.ts`
- `backend/src/routes/loan-insurance-regression.test.ts`
- `backend/src/routes/service-applications.test.ts`
- `backend/src/routes/service-applications.ts`
- `backend/src/routes/vehicle-loans.ts`
- `mobile/src/app/(tabs)/earnings.tsx`
- `mobile/src/app/(tabs)/index.tsx`
- `mobile/src/app/(tabs)/products.tsx`
- `mobile/src/app/(tabs)/profile.tsx`
- `mobile/src/app/_layout.tsx`
- `mobile/src/app/admin/(dashboard)/_layout.tsx`
- `mobile/src/app/admin/(dashboard)/dashboard.tsx`
- `mobile/src/app/admin/(dashboard)/health-insurance.tsx`
- `mobile/src/app/admin/(dashboard)/home-loans.tsx`
- `mobile/src/app/admin/(dashboard)/lead-details.tsx`
- `mobile/src/app/admin/(dashboard)/leads.tsx`
- `mobile/src/app/admin/(dashboard)/life-insurance.tsx`
- `mobile/src/app/admin/(dashboard)/motor-insurance.tsx`
- `mobile/src/app/admin/(dashboard)/pipeline.tsx`
- `mobile/src/app/admin/(dashboard)/products.tsx`
- `mobile/src/app/admin/(dashboard)/vehicle-insurance-leads.tsx`
- `mobile/src/app/business-loans-details.tsx`
- `mobile/src/app/health-insurance-details.tsx`
- `mobile/src/app/life-insurance-details.tsx`
- `mobile/src/app/motor-insurance-details.tsx`
- `mobile/src/app/service-application.tsx`
- `mobile/src/app/share-card.tsx`
- `mobile/src/app/vehicle-insurance/details.tsx`
- `mobile/src/app/vehicle-insurance/success.tsx`
- `mobile/src/app/vehicle-loans-details.tsx`
- `mobile/src/components/AdminDataBoundary.tsx`
- `mobile/src/components/AdminProductModules.tsx`
- `mobile/src/components/ApplicationSaved.tsx`
- `mobile/src/lib/admin-store.ts`
- `mobile/src/lib/business-loan-api.ts`
- `mobile/src/lib/incentive-store.ts`
- `mobile/src/lib/life-insurance-api.ts`
- `mobile/src/lib/loan-product-stages.ts`
- `mobile/src/lib/product-catalog.ts`
- `mobile/src/lib/service-application-api.ts`
- `mobile/src/lib/use-service-submission.ts`
- `mobile/src/lib/vehicle-loan-api.ts`
- `scripts/payout-guard.test.ts`
- `scripts/service-application-api.test.ts`
